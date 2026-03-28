// Supabase Edge Function: create-borrower-drive-folder
//
// Manages Google Drive folders for borrowers and entities, plus shortcuts in deal folders.
//
// Actions:
//   create_borrower_folder - Creates a GDrive folder for a crm_contact under Borrowers/
//   create_entity_folder   - Creates a GDrive folder for a deal_borrowing_entity under Entities/
//   sync_deal_shortcuts    - Creates/removes shortcuts in a deal folder for all its borrowers/entities
//   ensure_containers      - Lazily creates Borrowers/ and Entities/ container folders
//
// Required Supabase secrets:
//   GDRIVE_SERVICE_ACCOUNT_EMAIL
//   GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY
//   GDRIVE_PARENT_FOLDER_ID
//   GDRIVE_BORROWERS_FOLDER_ID (optional, created lazily)
//   GDRIVE_ENTITIES_FOLDER_ID  (optional, created lazily)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// JWT / Google Auth helpers (same as create-deal-drive-folder)
// ---------------------------------------------------------------------------

function base64url(data: Uint8Array): string {
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createServiceAccountToken(
  email: string,
  privateKeyPem: string,
  scopes: string[]
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: email,
    scope: scopes.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const enc = new TextEncoder();
  const headerB64 = base64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const pemBody = privateKeyPem
    .replace(/-----BEGIN (RSA )?PRIVATE KEY-----/g, "")
    .replace(/-----END (RSA )?PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  const keyData = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    enc.encode(signingInput)
  );

  const jwt = `${signingInput}.${base64url(new Uint8Array(signature))}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Service account token exchange failed: ${err}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token as string;
}

// ---------------------------------------------------------------------------
// Google Drive helpers
// ---------------------------------------------------------------------------

async function createDriveFolder(
  accessToken: string,
  name: string,
  parentFolderId: string
): Promise<{ id: string; webViewLink: string }> {
  const res = await fetch(
    "https://www.googleapis.com/drive/v3/files?fields=id,webViewLink&supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentFolderId],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive folder creation failed: ${err}`);
  }

  return res.json();
}

async function createDriveShortcut(
  accessToken: string,
  name: string,
  parentFolderId: string,
  targetFolderId: string
): Promise<string> {
  const res = await fetch(
    "https://www.googleapis.com/drive/v3/files?fields=id&supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        mimeType: "application/vnd.google-apps.shortcut",
        parents: [parentFolderId],
        shortcutDetails: {
          targetId: targetFolderId,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create shortcut: ${err}`);
  }

  const data = await res.json();
  return data.id;
}

async function deleteDriveFile(
  accessToken: string,
  fileId: string
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Failed to delete Drive file: ${err}`);
  }
}

async function findFolderByName(
  accessToken: string,
  name: string,
  parentFolderId: string
): Promise<string | null> {
  const q = `name='${name}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const params = new URLSearchParams({
    q,
    fields: "files(id)",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) return null;

  const data = await res.json();
  return data.files?.[0]?.id ?? null;
}

function sanitizeFolderName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, "").trim() || "Unnamed";
}

// ---------------------------------------------------------------------------
// Container folder management
// ---------------------------------------------------------------------------

// In-memory cache for container folder IDs (per invocation)
let borrowersContainerId: string | null = null;
let entitiesContainerId: string | null = null;

async function ensureContainerFolders(
  accessToken: string,
  parentFolderId: string
): Promise<{ borrowersFolderId: string; entitiesFolderId: string }> {
  // Check env vars first
  const envBorrowers = Deno.env.get("GDRIVE_BORROWERS_FOLDER_ID");
  const envEntities = Deno.env.get("GDRIVE_ENTITIES_FOLDER_ID");

  if (envBorrowers && envEntities) {
    borrowersContainerId = envBorrowers;
    entitiesContainerId = envEntities;
    return { borrowersFolderId: envBorrowers, entitiesFolderId: envEntities };
  }

  // Use cached values if available
  if (borrowersContainerId && entitiesContainerId) {
    return { borrowersFolderId: borrowersContainerId, entitiesFolderId: entitiesContainerId };
  }

  // Search for existing folders
  let bId = envBorrowers || await findFolderByName(accessToken, "Borrowers", parentFolderId);
  let eId = envEntities || await findFolderByName(accessToken, "Entities", parentFolderId);

  // Create if missing
  if (!bId) {
    const folder = await createDriveFolder(accessToken, "Borrowers", parentFolderId);
    bId = folder.id;
    console.log(`[create-borrower-drive-folder] Created Borrowers container folder: ${bId}`);
  }

  if (!eId) {
    const folder = await createDriveFolder(accessToken, "Entities", parentFolderId);
    eId = folder.id;
    console.log(`[create-borrower-drive-folder] Created Entities container folder: ${eId}`);
  }

  borrowersContainerId = bId;
  entitiesContainerId = eId;

  return { borrowersFolderId: bId, entitiesFolderId: eId };
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

interface ActionResult {
  success: boolean;
  [key: string]: unknown;
}

async function handleCreateBorrowerFolder(
  admin: ReturnType<typeof createClient>,
  accessToken: string,
  parentFolderId: string,
  contactId: string,
  dealId?: string
): Promise<ActionResult> {
  // Check if folder already exists
  const { data: contact, error: contactErr } = await admin
    .from("crm_contacts")
    .select("id, first_name, last_name, google_drive_folder_id, google_drive_folder_url")
    .eq("id", contactId)
    .single();

  if (contactErr || !contact) {
    throw new Error(`Contact not found: ${contactId}`);
  }

  if (contact.google_drive_folder_id) {
    // Folder already exists; just create shortcut if dealId provided
    if (dealId) {
      await maybeCreateShortcut(admin, accessToken, dealId, "borrower", contactId, contact.google_drive_folder_id, `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim());
    }
    return {
      success: true,
      already_exists: true,
      folder_id: contact.google_drive_folder_id,
      folder_url: contact.google_drive_folder_url,
    };
  }

  const containers = await ensureContainerFolders(accessToken, parentFolderId);
  const name = sanitizeFolderName(`${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim());
  const folder = await createDriveFolder(accessToken, name, containers.borrowersFolderId);

  await admin
    .from("crm_contacts")
    .update({
      google_drive_folder_id: folder.id,
      google_drive_folder_url: folder.webViewLink,
    })
    .eq("id", contactId);

  // Create shortcut in deal folder if dealId provided
  if (dealId) {
    await maybeCreateShortcut(admin, accessToken, dealId, "borrower", contactId, folder.id, name);
  }

  return {
    success: true,
    action: "created",
    folder_id: folder.id,
    folder_url: folder.webViewLink,
    folder_name: name,
  };
}

async function handleCreateEntityFolder(
  admin: ReturnType<typeof createClient>,
  accessToken: string,
  parentFolderId: string,
  entityId: string,
  dealId?: string
): Promise<ActionResult> {
  const { data: entity, error: entityErr } = await admin
    .from("deal_borrowing_entities")
    .select("id, entity_name, deal_id, google_drive_folder_id, google_drive_folder_url")
    .eq("id", entityId)
    .single();

  if (entityErr || !entity) {
    throw new Error(`Entity not found: ${entityId}`);
  }

  if (entity.google_drive_folder_id) {
    const effectiveDealId = dealId || entity.deal_id;
    if (effectiveDealId) {
      await maybeCreateShortcut(admin, accessToken, effectiveDealId, "entity", entityId, entity.google_drive_folder_id, entity.entity_name);
    }
    return {
      success: true,
      already_exists: true,
      folder_id: entity.google_drive_folder_id,
      folder_url: entity.google_drive_folder_url,
    };
  }

  const containers = await ensureContainerFolders(accessToken, parentFolderId);
  const name = sanitizeFolderName(entity.entity_name || "Unnamed Entity");
  const folder = await createDriveFolder(accessToken, name, containers.entitiesFolderId);

  await admin
    .from("deal_borrowing_entities")
    .update({
      google_drive_folder_id: folder.id,
      google_drive_folder_url: folder.webViewLink,
    })
    .eq("id", entityId);

  const effectiveDealId = dealId || entity.deal_id;
  if (effectiveDealId) {
    await maybeCreateShortcut(admin, accessToken, effectiveDealId, "entity", entityId, folder.id, name);
  }

  return {
    success: true,
    action: "created",
    folder_id: folder.id,
    folder_url: folder.webViewLink,
    folder_name: name,
  };
}

async function maybeCreateShortcut(
  admin: ReturnType<typeof createClient>,
  accessToken: string,
  dealId: string,
  targetType: "borrower" | "entity",
  targetId: string,
  targetFolderId: string,
  name: string
): Promise<void> {
  // Get deal's GDrive folder
  const { data: deal } = await admin
    .from("unified_deals")
    .select("google_drive_folder_id")
    .eq("id", dealId)
    .single();

  if (!deal?.google_drive_folder_id) return;

  // Check if shortcut already exists
  const { data: existing } = await admin
    .from("google_drive_shortcuts")
    .select("id")
    .eq("deal_id", dealId)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing) return;

  // Create shortcut in deal folder
  const shortcutId = await createDriveShortcut(
    accessToken,
    sanitizeFolderName(name),
    deal.google_drive_folder_id,
    targetFolderId
  );

  // Record in DB
  await admin.from("google_drive_shortcuts").insert({
    deal_id: dealId,
    target_type: targetType,
    target_id: targetId,
    shortcut_drive_id: shortcutId,
    target_folder_id: targetFolderId,
  });
}

async function handleSyncDealShortcuts(
  admin: ReturnType<typeof createClient>,
  accessToken: string,
  dealId: string
): Promise<ActionResult> {
  // Get deal's GDrive folder
  const { data: deal } = await admin
    .from("unified_deals")
    .select("id, google_drive_folder_id, primary_contact_id")
    .eq("id", dealId)
    .single();

  if (!deal?.google_drive_folder_id) {
    return { success: true, skipped: true, reason: "Deal has no GDrive folder" };
  }

  const created: string[] = [];
  const removed: string[] = [];
  const errors: string[] = [];

  // Gather all borrower contacts on this deal
  const contactIds: Set<string> = new Set();

  // Primary contact
  if (deal.primary_contact_id) {
    contactIds.add(deal.primary_contact_id);
  }

  // Borrower members (via deal_borrower_members -> contact_id)
  const { data: members } = await admin
    .from("deal_borrower_members")
    .select("contact_id")
    .eq("deal_id", dealId)
    .not("contact_id", "is", null);

  if (members) {
    for (const m of members) {
      if (m.contact_id) contactIds.add(m.contact_id);
    }
  }

  // Get contacts with GDrive folders
  if (contactIds.size > 0) {
    const { data: contacts } = await admin
      .from("crm_contacts")
      .select("id, first_name, last_name, google_drive_folder_id")
      .in("id", Array.from(contactIds))
      .not("google_drive_folder_id", "is", null);

    if (contacts) {
      for (const c of contacts) {
        try {
          const name = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim();
          await maybeCreateShortcut(admin, accessToken, dealId, "borrower", c.id, c.google_drive_folder_id!, name);
          created.push(name);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Borrower ${c.id}: ${msg}`);
        }
      }
    }
  }

  // Get entities with GDrive folders
  const { data: entities } = await admin
    .from("deal_borrowing_entities")
    .select("id, entity_name, google_drive_folder_id")
    .eq("deal_id", dealId)
    .not("google_drive_folder_id", "is", null);

  if (entities) {
    for (const e of entities) {
      try {
        await maybeCreateShortcut(admin, accessToken, dealId, "entity", e.id, e.google_drive_folder_id!, e.entity_name);
        created.push(e.entity_name);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Entity ${e.id}: ${msg}`);
      }
    }
  }

  // Clean up stale shortcuts (target no longer on deal)
  const { data: existingShortcuts } = await admin
    .from("google_drive_shortcuts")
    .select("*")
    .eq("deal_id", dealId);

  if (existingShortcuts) {
    for (const sc of existingShortcuts) {
      let isStale = false;

      if (sc.target_type === "borrower") {
        isStale = !contactIds.has(sc.target_id);
      } else if (sc.target_type === "entity") {
        const entityStillOnDeal = entities?.some((e) => e.id === sc.target_id);
        isStale = !entityStillOnDeal;
      }

      if (isStale) {
        try {
          await deleteDriveFile(accessToken, sc.shortcut_drive_id);
          await admin.from("google_drive_shortcuts").delete().eq("id", sc.id);
          removed.push(`${sc.target_type}:${sc.target_id}`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Remove shortcut ${sc.id}: ${msg}`);
        }
      }
    }
  }

  return {
    success: true,
    action: "synced",
    shortcuts_created: created.length,
    shortcuts_removed: removed.length,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing authorization header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ error: "action is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const saEmail = Deno.env.get("GDRIVE_SERVICE_ACCOUNT_EMAIL");
    const saPrivateKey = Deno.env.get("GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY");
    const parentFolderId = Deno.env.get("GDRIVE_PARENT_FOLDER_ID");

    if (!saEmail || !saPrivateKey || !parentFolderId) {
      return new Response(
        JSON.stringify({ error: "Google Drive service account not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    if (!supabaseUrl || !token) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase URL or authorization token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(supabaseUrl, token);

    const accessToken = await createServiceAccountToken(
      saEmail,
      saPrivateKey,
      ["https://www.googleapis.com/auth/drive"]
    );

    let result: ActionResult;

    switch (action) {
      case "create_borrower_folder":
        if (!body.contactId) throw new Error("contactId is required");
        result = await handleCreateBorrowerFolder(admin, accessToken, parentFolderId, body.contactId, body.dealId);
        break;

      case "create_entity_folder":
        if (!body.entityId) throw new Error("entityId is required");
        result = await handleCreateEntityFolder(admin, accessToken, parentFolderId, body.entityId, body.dealId);
        break;

      case "sync_deal_shortcuts":
        if (!body.dealId) throw new Error("dealId is required");
        result = await handleSyncDealShortcuts(admin, accessToken, body.dealId);
        break;

      case "ensure_containers": {
        const containers = await ensureContainerFolders(accessToken, parentFolderId);
        result = { success: true, ...containers };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-borrower-drive-folder error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
