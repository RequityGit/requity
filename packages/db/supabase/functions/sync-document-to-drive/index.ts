// Supabase Edge Function: sync-document-to-drive
//
// Uploads a document from Supabase Storage to the deal's Google Drive folder.
// Called fire-and-forget after a document is uploaded (borrower or admin).
//
// Required Supabase secrets:
//   GDRIVE_SERVICE_ACCOUNT_EMAIL
//   GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY
//
// Body params:
//   document_id: string (required) - unified_deal_documents.id
//   deal_id: string (required)
//   storage_path: string (required) - path in loan-documents bucket
//   file_name: string (required) - display name for the file in Drive
//   mime_type: string (optional) - defaults to application/octet-stream

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// JWT / Google Auth helpers (shared with create-deal-drive-folder)
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
// Google Drive upload (multipart)
// ---------------------------------------------------------------------------

async function uploadFileToDrive(
  accessToken: string,
  fileBytes: Uint8Array,
  fileName: string,
  mimeType: string,
  parentFolderId: string
): Promise<{ id: string }> {
  const boundary = "---supabase-drive-sync-boundary";

  const metadata = JSON.stringify({
    name: fileName,
    parents: [parentFolderId],
  });

  const body = new Uint8Array(
    await new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
      metadata,
      `\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
      fileBytes,
      `\r\n--${boundary}--`,
    ]).arrayBuffer()
  );

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id&supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive upload failed: ${err}`);
  }

  return res.json();
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
    const { document_id, deal_id, storage_path, file_name, mime_type } = await req.json();

    if (!document_id || !deal_id || !storage_path || !file_name) {
      return new Response(
        JSON.stringify({ error: "document_id, deal_id, storage_path, and file_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const saEmail = Deno.env.get("GDRIVE_SERVICE_ACCOUNT_EMAIL");
    const saPrivateKey = Deno.env.get("GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY");

    if (!saEmail || !saPrivateKey) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "gdrive_not_configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Fetch deal's Drive folder IDs
    const { data: deal, error: dealErr } = await admin
      .from("unified_deals")
      .select("google_drive_folder_id, google_drive_shared_folder_id")
      .eq("id", deal_id)
      .single();

    if (dealErr || !deal) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "deal_not_found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine target folder: shared folder for external docs, main folder for internal
    const { data: docRow } = await admin
      .from("unified_deal_documents")
      .select("visibility")
      .eq("id", document_id)
      .single();

    const isExternal = docRow?.visibility === "external";
    const targetFolderId = isExternal
      ? (deal.google_drive_shared_folder_id || deal.google_drive_folder_id)
      : deal.google_drive_folder_id;

    if (!targetFolderId) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "no_drive_folder" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadErr } = await admin.storage
      .from("loan-documents")
      .download(storage_path);

    if (downloadErr || !fileData) {
      return new Response(
        JSON.stringify({ error: `Failed to download from storage: ${downloadErr?.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileBytes = new Uint8Array(await fileData.arrayBuffer());

    // Get GDrive access token
    const accessToken = await createServiceAccountToken(
      saEmail,
      saPrivateKey,
      ["https://www.googleapis.com/auth/drive.file"]
    );

    // Upload to Google Drive
    const driveFile = await uploadFileToDrive(
      accessToken,
      fileBytes,
      file_name,
      mime_type || "application/octet-stream",
      targetFolderId
    );

    // Update document record with Drive file ID
    await admin
      .from("unified_deal_documents")
      .update({ google_drive_file_id: driveFile.id })
      .eq("id", document_id);

    return new Response(
      JSON.stringify({ success: true, google_drive_file_id: driveFile.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("sync-document-to-drive error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
