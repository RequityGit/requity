// Supabase Edge Function: generate-document
// Generates a document from a template by merging fields from source records.
// Downloads a .docx template from Google Drive, merges data via docxtemplater,
// uploads the result back to Drive, and records it in generated_documents.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------- Google Drive helpers ----------

async function getGoogleAccessToken(serviceAccountKey: string): Promise<string> {
  const key = JSON.parse(serviceAccountKey);
  const now = Math.floor(Date.now() / 1000);

  // Build JWT header + claim set
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claimSet = btoa(
    JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/drive",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  );

  const unsignedToken = `${header}.${claimSet}`;

  // Sign with RSA private key
  const pemContents = key.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${unsignedToken}.${sig}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    throw new Error(`Google token exchange failed: ${tokenRes.status}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

async function downloadFromDrive(
  fileId: string,
  accessToken: string
): Promise<Uint8Array> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    throw new Error(`Google Drive download failed: ${res.status} ${res.statusText}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

async function uploadToDrive(
  fileName: string,
  fileBytes: Uint8Array,
  mimeType: string,
  folderId: string | null,
  accessToken: string
): Promise<string> {
  const metadata: Record<string, unknown> = { name: fileName };
  if (folderId) metadata.parents = [folderId];

  const boundary = "doc_gen_boundary";
  const metaJson = JSON.stringify(metadata);

  const parts = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metaJson}\r\n`,
    `--${boundary}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`,
  ];

  // base64-encode file bytes
  let base64 = "";
  const chunk = 32768;
  for (let i = 0; i < fileBytes.length; i += chunk) {
    base64 += String.fromCharCode(
      ...fileBytes.subarray(i, Math.min(i + chunk, fileBytes.length))
    );
  }
  base64 = btoa(base64);

  const body = parts[0] + parts[1] + base64 + `\r\n--${boundary}--`;

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
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
    throw new Error(`Google Drive upload failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.id;
}

// ---------- Merge field formatting ----------

function formatValue(
  value: unknown,
  format: string | null | undefined
): string {
  if (value === null || value === undefined) return "";

  const str = String(value);

  switch (format) {
    case "currency": {
      const num = Number(value);
      if (isNaN(num)) return str;
      return `$${num.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    }
    case "currency_cents": {
      const num = Number(value);
      if (isNaN(num)) return str;
      return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    case "percentage": {
      const num = Number(value);
      if (isNaN(num)) return str;
      return `${num.toFixed(2)}%`;
    }
    case "date": {
      const d = new Date(str);
      if (isNaN(d.getTime())) return str;
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    case "date_short": {
      const d = new Date(str);
      if (isNaN(d.getTime())) return str;
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    }
    case "phone": {
      const digits = str.replace(/\D/g, "");
      if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      return str;
    }
    default:
      return str;
  }
}

// ---------- System field resolution ----------

function resolveSystemField(column: string): string {
  const now = new Date();
  switch (column) {
    case "today":
      return now.toISOString();
    case "expiration_date": {
      const exp = new Date(now);
      exp.setDate(exp.getDate() + 7);
      return exp.toISOString();
    }
    case "requity_entity":
      return "Requity Lending LLC";
    case "requity_signer":
    case "dylan_name":
      return "Dylan Marma";
    case "requity_title":
      return "CEO";
    case "dylan_email":
      return "dylan@requitygroup.com";
    default:
      return "";
  }
}

// ---------- Main handler ----------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth client uses the user's JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client for data queries
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .in("role", ["super_admin", "admin"])
      .limit(1);

    if (!roleData || roleData.length === 0) {
      return new Response(
        JSON.stringify({ error: "Forbidden: admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { template_id, record_id, format = "docx", page_record_type } = await req.json();

    if (!template_id || !record_id) {
      return new Response(
        JSON.stringify({ error: "template_id and record_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch template
    const { data: template, error: templateError } = await supabaseAdmin
      .from("document_templates")
      .select("*")
      .eq("id", template_id)
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      return new Response(
        JSON.stringify({ error: "Template not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch source record data based on the page context (what entity the user is viewing),
    // falling back to the template's record_type for backward compatibility.
    const resolveType = page_record_type ?? template.record_type;
    const sourceData: Record<string, Record<string, unknown>> = {};

    if (resolveType === "loan") {
      const { data: loan } = await supabaseAdmin
        .from("loans")
        .select("*")
        .eq("id", record_id)
        .single();

      if (loan) {
        sourceData["loans"] = loan;
        // Resolve related contact
        if (loan.borrower_contact_id) {
          const { data: contact } = await supabaseAdmin
            .from("crm_contacts")
            .select("*")
            .eq("id", loan.borrower_contact_id)
            .single();
          if (contact) {
            sourceData["crm_contacts"] = contact;
            if (contact.company_id) {
              const { data: company } = await supabaseAdmin
                .from("companies")
                .select("*")
                .eq("id", contact.company_id)
                .single();
              if (company) sourceData["companies"] = company;
            }
          }
        }
      } else {
        // Fallback: record may be a unified_deals ID (loan template used from deal page)
        const { data: deal } = await supabaseAdmin
          .from("unified_deals")
          .select("*")
          .eq("id", record_id)
          .single();
        if (!deal) {
          return new Response(
            JSON.stringify({ error: "Loan or deal record not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const dealRecord = deal as Record<string, unknown>;
        sourceData["unified_deals"] = dealRecord;
        const uwData = (dealRecord.uw_data ?? {}) as Record<string, unknown>;
        const propertyData = (dealRecord.property_data ?? {}) as Record<string, unknown>;
        sourceData["loans"] = { ...dealRecord, ...uwData, ...propertyData };
        // Resolve related contact
        if (dealRecord.primary_contact_id) {
          const { data: contact } = await supabaseAdmin
            .from("crm_contacts")
            .select("*")
            .eq("id", dealRecord.primary_contact_id as string)
            .single();
          if (contact) {
            sourceData["crm_contacts"] = contact as Record<string, unknown>;
            if ((contact as Record<string, unknown>).company_id) {
              const { data: company } = await supabaseAdmin
                .from("companies")
                .select("*")
                .eq("id", (contact as Record<string, unknown>).company_id as string)
                .single();
              if (company) sourceData["companies"] = company as Record<string, unknown>;
            }
          }
        }
        if (dealRecord.company_id && !sourceData["companies"]) {
          const { data: company } = await supabaseAdmin
            .from("companies")
            .select("*")
            .eq("id", dealRecord.company_id as string)
            .single();
          if (company) sourceData["companies"] = company as Record<string, unknown>;
        }
      }
    } else if (resolveType === "contact") {
      const { data: contact } = await supabaseAdmin
        .from("crm_contacts")
        .select("*")
        .eq("id", record_id)
        .single();
      if (!contact) {
        return new Response(
          JSON.stringify({ error: "Contact record not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      sourceData["crm_contacts"] = contact;
      if (contact.company_id) {
        const { data: company } = await supabaseAdmin
          .from("companies")
          .select("*")
          .eq("id", contact.company_id)
          .single();
        if (company) sourceData["companies"] = company;
      }
    } else if (resolveType === "deal") {
      const { data: deal } = await supabaseAdmin
        .from("unified_deals")
        .select("*")
        .eq("id", record_id)
        .single();
      if (!deal) {
        return new Response(
          JSON.stringify({ error: "Deal record not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const dealRecord = deal as Record<string, unknown>;
      sourceData["unified_deals"] = dealRecord;
      // Flatten uw_data and property_data so merge fields can access nested values
      const uwData = (dealRecord.uw_data ?? {}) as Record<string, unknown>;
      const propertyData = (dealRecord.property_data ?? {}) as Record<string, unknown>;
      const flatDeal = { ...dealRecord, ...uwData, ...propertyData };
      // Also store under "loans" alias for backwards compat with loan templates
      sourceData["loans"] = flatDeal;
      // Resolve related contact
      if (dealRecord.primary_contact_id) {
        const { data: contact } = await supabaseAdmin
          .from("crm_contacts")
          .select("*")
          .eq("id", dealRecord.primary_contact_id as string)
          .single();
        if (contact) {
          sourceData["crm_contacts"] = contact as Record<string, unknown>;
          if ((contact as Record<string, unknown>).company_id) {
            const { data: company } = await supabaseAdmin
              .from("companies")
              .select("*")
              .eq("id", (contact as Record<string, unknown>).company_id as string)
              .single();
            if (company) sourceData["companies"] = company as Record<string, unknown>;
          }
        }
      }
      // Also resolve company directly from deal
      if (dealRecord.company_id && !sourceData["companies"]) {
        const { data: company } = await supabaseAdmin
          .from("companies")
          .select("*")
          .eq("id", dealRecord.company_id as string)
          .single();
        if (company) sourceData["companies"] = company as Record<string, unknown>;
      }
    } else if (resolveType === "company") {
      const { data: company } = await supabaseAdmin
        .from("companies")
        .select("*")
        .eq("id", record_id)
        .single();
      if (!company) {
        return new Response(
          JSON.stringify({ error: "Company record not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      sourceData["companies"] = company;
    }

    // Build merge data
    const mergeFields = (template.merge_fields as Array<{
      key: string;
      source: string;
      column: string;
      format?: string;
    }>) ?? [];

    const mergeData: Record<string, string> = {};
    const missingFields: string[] = [];

    for (const field of mergeFields) {
      if (field.source === "_system") {
        const raw = resolveSystemField(field.column);
        mergeData[field.key] = formatValue(raw, field.format);
      } else if (field.source === "template_config") {
        // Template config fields can have defaults set by the user at generation time
        // For now, use empty string as placeholder
        mergeData[field.key] = "";
      } else {
        // Look up from source data — handle table name variations
        const tableAliases: Record<string, string[]> = {
          crm_contacts: ["crm_contacts"],
          crm_companies: ["companies", "crm_companies"],
          companies: ["companies", "crm_companies"],
          loans: ["loans", "unified_deals"],
          equity_deals: ["unified_deals", "equity_deals"],
          unified_deals: ["unified_deals", "loans"],
        };

        const tables = tableAliases[field.source] ?? [field.source];
        let value: unknown = null;

        for (const table of tables) {
          if (sourceData[table] && sourceData[table][field.column] !== undefined) {
            value = sourceData[table][field.column];
            break;
          }
        }

        if (value === null || value === undefined) {
          missingFields.push(field.key);
        }

        mergeData[field.key] = formatValue(value, field.format);
      }
    }

    // Get Google service account key
    const serviceAccountKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    if (!serviceAccountKey) {
      return new Response(
        JSON.stringify({ error: "Google service account not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getGoogleAccessToken(serviceAccountKey);

    // Download template from Google Drive
    let templateBytes: Uint8Array;
    try {
      templateBytes = await downloadFromDrive(template.gdrive_file_id, accessToken);
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "Failed to download template from Google Drive",
          details: err instanceof Error ? err.message : String(err),
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Merge data into template using docxtemplater
    let outputBytes: Uint8Array;
    try {
      const PizZip = (await import("https://esm.sh/pizzip@3.1.7")).default;
      const Docxtemplater = (await import("https://esm.sh/docxtemplater@3.48.0"))
        .default;

      const zip = new PizZip(templateBytes);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "{", end: "}" },
      });
      doc.setData(mergeData);
      doc.render();
      outputBytes = doc.getZip().generate({ type: "uint8array" });
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "Document merge failed",
          details: err instanceof Error ? err.message : String(err),
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // TODO: PDF conversion when format === "pdf"
    const fileFormat = "docx";
    const mimeType =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    // Build file name
    const contactName =
      (sourceData["crm_contacts"]?.last_name as string) ??
      (sourceData["crm_contacts"]?.full_name as string) ??
      "document";
    const loanNumber =
      (sourceData["loans"]?.loan_number as string) ??
      (sourceData["unified_deals"]?.deal_number as string) ??
      new Date().toISOString().split("T")[0];
    const fileName = `${template.template_type}_${contactName}_${loanNumber}.${fileFormat}`;

    // Upload to Google Drive
    const uploadFolderId = template.gdrive_folder_id ?? null;
    let uploadedFileId: string;
    try {
      uploadedFileId = await uploadToDrive(
        fileName,
        outputBytes,
        mimeType,
        uploadFolderId,
        accessToken
      );
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "Failed to upload to Google Drive",
          details: err instanceof Error ? err.message : String(err),
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert generated_documents record
    const { data: genDoc, error: insertError } = await supabaseAdmin
      .from("generated_documents")
      .insert({
        template_id: template.id,
        template_version: template.version,
        record_type: template.record_type,
        record_id,
        file_name: fileName,
        file_format: fileFormat,
        gdrive_file_id: uploadedFileId,
        merge_data_snapshot: mergeData,
        status: "draft",
        generated_by: user.id,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to insert generated_documents:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save document record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the generated file
    return new Response(outputBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "X-Document-Id": genDoc.id,
        "X-Missing-Fields": missingFields.join(","),
      },
    });
  } catch (err) {
    console.error("generate-document error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
