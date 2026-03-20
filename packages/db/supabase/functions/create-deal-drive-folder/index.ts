// Supabase Edge Function: create-deal-drive-folder
//
// Creates or renames a Google Drive folder for a deal.
// Folder naming convention: {deal_number} - {company|last_name} - {address, City ST}
//
// Required Supabase secrets:
//   GDRIVE_SERVICE_ACCOUNT_EMAIL
//   GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY
//   GDRIVE_PARENT_FOLDER_ID
//
// Body params:
//   deal_id: string (required)
//   rename: boolean (optional) - if true, renames existing folder instead of creating

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// JWT / Google Auth helpers
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

async function renameDriveFolder(
  accessToken: string,
  folderId: string,
  newName: string
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}?supportsAllDrives=true`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newName }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive folder rename failed: ${err}`);
  }
}

async function verifyFolderAccess(
  accessToken: string,
  folderId: string
): Promise<{ accessible: boolean; error?: string }> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name&supportsAllDrives=true`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const err = await res.text();
    return { accessible: false, error: err };
  }
  return { accessible: true };
}

// ---------------------------------------------------------------------------
// Folder naming convention
// ---------------------------------------------------------------------------

const US_STATE_ABBREVS: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY", "district of columbia": "DC",
};

function abbreviateState(state: string): string {
  const lower = state.trim().toLowerCase();
  if (lower.length === 2) return lower.toUpperCase();
  return US_STATE_ABBREVS[lower] || state.trim();
}

function formatAddress(raw: string | null): string | null {
  if (!raw || raw.trim().length < 5) return null;

  // Try to parse: "123 Main St, City, ST 12345" or "123 Main St, City, State"
  const parts = raw.split(",").map((p) => p.trim());
  if (parts.length < 2) return raw.trim();

  const street = parts[0];

  // Last part might be "ST 12345" or "State 12345" or just "ST"
  const lastPart = parts[parts.length - 1];
  const cityPart = parts.length >= 3 ? parts[1] : null;

  // Extract state from the last segment (strip zip)
  const stateZipMatch = lastPart.match(/^([A-Za-z\s]+?)(?:\s+\d{5}(?:-\d{4})?)?$/);
  const stateStr = stateZipMatch ? abbreviateState(stateZipMatch[1]) : null;

  if (cityPart && stateStr) {
    return `${street}, ${cityPart} ${stateStr}`;
  }
  if (stateStr && !cityPart) {
    return `${street}, ${stateStr}`;
  }
  // Fallback: return street + city if parseable
  if (cityPart) {
    return `${street}, ${cityPart}`;
  }
  return street;
}

interface DealFolderData {
  deal_number: string | null;
  company_name: string | null;
  contact_company_name: string | null;
  contact_last_name: string | null;
  property_address: string | null;
}

function buildFolderName(deal: DealFolderData): string {
  const id = deal.deal_number || "Deal";

  const borrower =
    deal.company_name ||
    deal.contact_company_name ||
    deal.contact_last_name ||
    null;

  const address = formatAddress(deal.property_address);

  return [id, borrower, address].filter(Boolean).join(" - ");
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
    const { deal_id, rename, create_shared } = body;

    if (!deal_id) {
      return new Response(
        JSON.stringify({ error: "deal_id is required" }),
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

    // Fetch deal with contact and company data for folder naming
    const { data: dealRows, error: dealErr } = await admin.rpc("get_deal_folder_data", {
      p_deal_id: deal_id,
    });

    let deal: DealFolderData & {
      id: string;
      google_drive_folder_id: string | null;
      google_drive_shared_folder_id: string | null;
    };

    if (dealErr || !dealRows || dealRows.length === 0) {
      const { data: rawDeal, error: rawErr } = await admin
        .from("unified_deals")
        .select("id, deal_number, name, google_drive_folder_id, google_drive_shared_folder_id, primary_contact_id, uw_data")
        .eq("id", deal_id)
        .single();

      if (rawErr || !rawDeal) {
        return new Response(
          JSON.stringify({ error: "Deal not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let contactLastName: string | null = null;
      let contactCompanyName: string | null = null;
      let companyName: string | null = null;

      if (rawDeal.primary_contact_id) {
        const { data: contact } = await admin
          .from("crm_contacts")
          .select("last_name, company_name, company_id")
          .eq("id", rawDeal.primary_contact_id)
          .single();

        if (contact) {
          contactLastName = contact.last_name;
          contactCompanyName = contact.company_name;

          if (contact.company_id) {
            const { data: company } = await admin
              .from("companies")
              .select("name")
              .eq("id", contact.company_id)
              .single();

            if (company) companyName = company.name;
          }
        }
      }

      const uwData = (rawDeal.uw_data || {}) as Record<string, unknown>;

      deal = {
        id: rawDeal.id,
        deal_number: rawDeal.deal_number,
        google_drive_folder_id: rawDeal.google_drive_folder_id,
        google_drive_shared_folder_id: rawDeal.google_drive_shared_folder_id ?? null,
        company_name: companyName,
        contact_company_name: contactCompanyName,
        contact_last_name: contactLastName,
        property_address: (uwData.property_address as string) || null,
      };
    } else {
      deal = dealRows[0];
    }

    const accessToken = await createServiceAccountToken(
      saEmail,
      saPrivateKey,
      ["https://www.googleapis.com/auth/drive"]
    );

    const folderName = buildFolderName(deal);

    // ── Rename mode ──
    if (rename) {
      if (!deal.google_drive_folder_id) {
        return new Response(
          JSON.stringify({ error: "Deal has no Drive folder to rename" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await renameDriveFolder(accessToken, deal.google_drive_folder_id, folderName);

      return new Response(
        JSON.stringify({
          success: true,
          action: "renamed",
          folder_id: deal.google_drive_folder_id,
          new_name: folderName,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Create Shared subfolder only ──
    if (create_shared) {
      if (!deal.google_drive_folder_id) {
        return new Response(
          JSON.stringify({ error: "Deal has no Drive folder" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (deal.google_drive_shared_folder_id) {
        return new Response(
          JSON.stringify({ success: true, already_exists: true, shared_folder_id: deal.google_drive_shared_folder_id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const sharedFolder = await createDriveFolder(accessToken, "Shared", deal.google_drive_folder_id);
      await admin
        .from("unified_deals")
        .update({ google_drive_shared_folder_id: sharedFolder.id })
        .eq("id", deal_id);

      return new Response(
        JSON.stringify({ success: true, action: "shared_folder_created", shared_folder_id: sharedFolder.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Create mode ──
    if (deal.google_drive_folder_id) {
      return new Response(
        JSON.stringify({
          success: true,
          already_exists: true,
          folder_id: deal.google_drive_folder_id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const folderCheck = await verifyFolderAccess(accessToken, parentFolderId);
    if (!folderCheck.accessible) {
      return new Response(
        JSON.stringify({
          error: "Cannot access parent folder",
          detail: folderCheck.error,
          hint: "Ensure the folder is shared with the service account email as Editor, and Google Drive API is enabled in the GCP project.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const folder = await createDriveFolder(accessToken, folderName, parentFolderId);

    // Auto-create "Shared" subfolder inside the deal folder
    const sharedFolder = await createDriveFolder(accessToken, "Shared", folder.id);

    await admin
      .from("unified_deals")
      .update({
        google_drive_folder_id: folder.id,
        google_drive_folder_url: folder.webViewLink,
        google_drive_shared_folder_id: sharedFolder.id,
      })
      .eq("id", deal_id);

    // ── Backfill: sync any existing documents to the new Drive folder ──
    // Documents uploaded before the Drive folder existed (e.g. from email intake)
    // will not have been synced. Fire-and-forget sync for each one.
    try {
      const { data: unsyncedDocs } = await admin
        .from("unified_deal_documents")
        .select("id, storage_path, document_name, mime_type")
        .eq("deal_id", deal_id)
        .is("google_drive_file_id", null)
        .not("storage_path", "is", null);

      if (unsyncedDocs && unsyncedDocs.length > 0) {
        const syncUrl = `${supabaseUrl}/functions/v1/sync-document-to-drive`;
        for (const doc of unsyncedDocs) {
          // Fire-and-forget: don't await, don't block folder creation response
          fetch(syncUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              document_id: doc.id,
              deal_id: deal_id,
              storage_path: doc.storage_path,
              file_name: doc.document_name,
              mime_type: doc.mime_type || "application/octet-stream",
            }),
          }).catch((syncErr) => {
            console.error(`Backfill sync failed for doc ${doc.id}:`, syncErr);
          });
        }
        console.log(`Triggered backfill sync for ${unsyncedDocs.length} documents`);
      }
    } catch (backfillErr) {
      // Non-fatal: folder was created successfully, backfill is best-effort
      console.error("Document backfill error (non-fatal):", backfillErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        action: "created",
        folder_id: folder.id,
        folder_url: folder.webViewLink,
        folder_name: folderName,
        shared_folder_id: sharedFolder.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-deal-drive-folder error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
