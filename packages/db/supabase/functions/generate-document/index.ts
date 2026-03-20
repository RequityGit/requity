// Supabase Edge Function: generate-document
// Generates a document from a template by merging fields from source records.
// Reads HTML content from document_templates, merges data, and saves the
// result to generated_documents for in-portal editing.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers":
    "X-Document-Id, X-Missing-Fields",
};

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

// ---------- Computed field helpers ----------

// crm_contacts has first_name + last_name but templates reference full_name
function enrichContact(contact: Record<string, unknown>): Record<string, unknown> {
  if (!contact.full_name && (contact.first_name || contact.last_name)) {
    contact.full_name = [contact.first_name, contact.last_name].filter(Boolean).join(" ");
  }
  return contact;
}

// loans table uses loan_amount but templates may reference amount
function enrichLoan(loan: Record<string, unknown>): Record<string, unknown> {
  if (loan.loan_amount !== undefined && loan.amount === undefined) {
    loan.amount = loan.loan_amount;
  }
  return loan;
}

// ---------- HTML merge helpers ----------

function mergeHtmlContent(
  html: string,
  mergeData: Record<string, string>
): string {
  let result = html;

  // Replace <span data-merge-field="key">...</span> with the resolved value.
  // The spans may have additional attributes (fieldkey, sourcetable, sourcecolumn, class).
  result = result.replace(
    /<span\s[^>]*?data-merge-field="([^"]+)"[^>]*>.*?<\/span>/gi,
    (_match, fieldKey: string) => {
      const value = mergeData[fieldKey];
      if (value !== undefined && value !== "") {
        return value;
      }
      // Keep placeholder visible if no value resolved
      return `<span data-merge-field="${fieldKey}" class="merge-field-node merge-field-missing">{${fieldKey}}</span>`;
    }
  );

  // Also replace plain {key} text placeholders that aren't inside merge-field spans
  for (const [key, value] of Object.entries(mergeData)) {
    if (value !== "") {
      // Replace {key} but not ones already inside data-merge-field spans
      const placeholder = `{${key}}`;
      result = result.split(placeholder).join(value);
    }
  }

  return result;
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

    // Auth client uses the user's JWT via the globally-set Authorization header.
    // IMPORTANT: call getUser() WITHOUT a token argument so the client uses the
    // global header.  Passing the token explicitly can cause "Invalid JWT" errors
    // in certain @supabase/supabase-js versions shipped via esm.sh.
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
      console.error("generate-document auth failed:", {
        error: authError?.message,
        code: authError?.status,
        hasAuthHeader: !!authHeader,
      });
      return new Response(
        JSON.stringify({ error: authError?.message || "User validation failed" }),
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
    const { template_id, record_id, page_record_type, field_overrides } = await req.json();

    if (!template_id || !record_id) {
      return new Response(
        JSON.stringify({ error: "template_id and record_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch template (including HTML content)
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

    // Verify template has HTML content
    if (!template.content) {
      return new Response(
        JSON.stringify({ error: "Template has no content. Please edit the template in the document editor first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        sourceData["loans"] = enrichLoan(loan);
        if (loan.borrower_contact_id) {
          const { data: contact } = await supabaseAdmin
            .from("crm_contacts")
            .select("*")
            .eq("id", loan.borrower_contact_id)
            .single();
          if (contact) {
            sourceData["crm_contacts"] = enrichContact(contact);
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
        sourceData["loans"] = enrichLoan({ ...dealRecord, ...uwData, ...propertyData });
        if (dealRecord.primary_contact_id) {
          const { data: contact } = await supabaseAdmin
            .from("crm_contacts")
            .select("*")
            .eq("id", dealRecord.primary_contact_id as string)
            .single();
          if (contact) {
            sourceData["crm_contacts"] = enrichContact(contact as Record<string, unknown>);
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
      sourceData["crm_contacts"] = enrichContact(contact);
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
      const uwData = (dealRecord.uw_data ?? {}) as Record<string, unknown>;
      const propertyData = (dealRecord.property_data ?? {}) as Record<string, unknown>;
      const flatDeal = { ...dealRecord, ...uwData, ...propertyData };
      sourceData["loans"] = enrichLoan(flatDeal);
      if (dealRecord.primary_contact_id) {
        const { data: contact } = await supabaseAdmin
          .from("crm_contacts")
          .select("*")
          .eq("id", dealRecord.primary_contact_id as string)
          .single();
        if (contact) {
          sourceData["crm_contacts"] = enrichContact(contact as Record<string, unknown>);
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
        mergeData[field.key] = "";
      } else {
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

    // Apply user-supplied field overrides (from editable inputs in the modal).
    // Only override fields that are still empty (missing) to avoid clobbering
    // resolved data.
    if (field_overrides && typeof field_overrides === "object") {
      for (const [key, value] of Object.entries(field_overrides)) {
        if (typeof value === "string" && value.trim() !== "") {
          if (!mergeData[key] || mergeData[key] === "") {
            mergeData[key] = value.trim();
            // Remove from missingFields since user supplied the value
            const idx = missingFields.indexOf(key);
            if (idx !== -1) missingFields.splice(idx, 1);
          }
        }
      }
    }

    // Merge fields into HTML content
    const mergedContent = mergeHtmlContent(template.content, mergeData);

    // Build file name
    const contactName =
      (sourceData["crm_contacts"]?.last_name as string) ??
      (sourceData["crm_contacts"]?.full_name as string) ??
      "document";
    const loanNumber =
      (sourceData["loans"]?.loan_number as string) ??
      (sourceData["unified_deals"]?.deal_number as string) ??
      new Date().toISOString().split("T")[0];
    const fileName = `${template.template_type}_${contactName}_${loanNumber}`;

    // Insert generated_documents record with merged HTML content
    const { data: genDoc, error: insertError } = await supabaseAdmin
      .from("generated_documents")
      .insert({
        template_id: template.id,
        template_version: template.version,
        record_type: template.record_type,
        record_id,
        file_name: fileName,
        file_format: "docx",
        content: mergedContent,
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

    // Return JSON response with document ID
    return new Response(
      JSON.stringify({
        document_id: genDoc.id,
        file_name: fileName,
        missing_fields: missingFields,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-Document-Id": genDoc.id,
          "X-Missing-Fields": missingFields.join(","),
        },
      }
    );
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
