"use server";

import { createClient } from "@/lib/supabase/server";

export type ResolvedField = {
  key: string;
  label: string;
  value: string | null;
  format?: string | null;
};

function formatValue(value: unknown, format: string | null | undefined): string {
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
      return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    }
    case "date_short": {
      const d = new Date(str);
      if (isNaN(d.getTime())) return str;
      return d.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
    }
    case "phone": {
      const digits = str.replace(/\D/g, "");
      if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      return str;
    }
    default:
      return str;
  }
}

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
      return process.env.INVESTOR_CONTACT_EMAIL || "";
    default:
      return "";
  }
}

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

export async function fetchTemplatesForRecord(recordType: "loan" | "contact" | "deal" | "company") {
  const supabase = await createClient();

  // Deals can use both deal-specific and loan templates since unified_deals
  // contains lending data (uw_data) that maps to loan template fields.
  const query = supabase
    .from("document_templates")
    .select("id, name, template_type, record_type, description, merge_fields, version, requires_signature")
    .eq("is_active", true)
    .order("name");

  if (recordType === "deal") {
    query.in("record_type", ["deal", "loan"]);
  } else if (recordType === "contact" || recordType === "company") {
    // All templates apply to contacts and companies — no record_type filter
  } else {
    query.eq("record_type", recordType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch templates:", error);
    return { error: error.message, templates: [] };
  }

  return { templates: data ?? [] };
}

export async function resolveTemplateData(
  templateId: string,
  recordId: string,
  pageRecordType?: "loan" | "contact" | "deal" | "company"
): Promise<{ fields: ResolvedField[]; error?: string }> {
  const supabase = await createClient();

  // Fetch template
  const { data: template, error: tErr } = await supabase
    .from("document_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (tErr || !template) return { fields: [], error: "Template not found" };

  const mergeFields = (template.merge_fields as Array<{
    key: string;
    label: string;
    source: string;
    column: string;
    format?: string | null;
  }>) ?? [];

  // Fetch source records based on the page context (what entity the user is viewing),
  // falling back to the template's record_type for backward compatibility.
  const resolveType = pageRecordType ?? template.record_type;
  const sourceData: Record<string, Record<string, unknown>> = {};

  if (resolveType === "loan") {
    const { data: loan } = await supabase.from("loans").select("*").eq("id", recordId).single();
    if (loan) {
      sourceData["loans"] = enrichLoan(loan as Record<string, unknown>);
      if ((loan as Record<string, unknown>).borrower_contact_id) {
        const { data: contact } = await supabase.from("crm_contacts").select("*").eq("id", (loan as Record<string, unknown>).borrower_contact_id as string).single();
        if (contact) {
          sourceData["crm_contacts"] = enrichContact(contact as Record<string, unknown>);
          if ((contact as Record<string, unknown>).company_id) {
            const { data: company } = await supabase.from("companies").select("*").eq("id", (contact as Record<string, unknown>).company_id as string).single();
            if (company) sourceData["companies"] = company as Record<string, unknown>;
          }
        }
      }
    } else {
      // Fallback: record may be a unified_deals ID (loan template used from deal page)
      const { data: deal } = await supabase.from("unified_deals" as never).select("*").eq("id" as never, recordId as never).single();
      if (deal) {
        const dealRecord = deal as Record<string, unknown>;
        sourceData["unified_deals"] = dealRecord;
        const uwData = (dealRecord.uw_data ?? {}) as Record<string, unknown>;
        const propertyData = (dealRecord.property_data ?? {}) as Record<string, unknown>;
        sourceData["loans"] = enrichLoan({ ...dealRecord, ...uwData, ...propertyData });
        if (dealRecord.primary_contact_id) {
          const { data: contact } = await supabase.from("crm_contacts").select("*").eq("id", dealRecord.primary_contact_id as string).single();
          if (contact) {
            sourceData["crm_contacts"] = enrichContact(contact as Record<string, unknown>);
            if ((contact as Record<string, unknown>).company_id) {
              const { data: company } = await supabase.from("companies").select("*").eq("id", (contact as Record<string, unknown>).company_id as string).single();
              if (company) sourceData["companies"] = company as Record<string, unknown>;
            }
          }
        }
        if (dealRecord.company_id && !sourceData["companies"]) {
          const { data: company } = await supabase.from("companies").select("*").eq("id", dealRecord.company_id as string).single();
          if (company) sourceData["companies"] = company as Record<string, unknown>;
        }
      }
    }
  } else if (resolveType === "contact") {
    const { data: contact } = await supabase.from("crm_contacts").select("*").eq("id", recordId).single();
    if (contact) {
      sourceData["crm_contacts"] = enrichContact(contact as Record<string, unknown>);
      if ((contact as Record<string, unknown>).company_id) {
        const { data: company } = await supabase.from("companies").select("*").eq("id", (contact as Record<string, unknown>).company_id as string).single();
        if (company) sourceData["companies"] = company;
      }
    }
  } else if (resolveType === "deal") {
    const { data: deal } = await supabase.from("unified_deals" as never).select("*").eq("id" as never, recordId as never).single();
    if (deal) {
      const dealRecord = deal as Record<string, unknown>;
      sourceData["unified_deals"] = dealRecord;
      // Flatten uw_data and property_data so merge fields can access nested values
      const uwData = (dealRecord.uw_data ?? {}) as Record<string, unknown>;
      const propertyData = (dealRecord.property_data ?? {}) as Record<string, unknown>;
      const flatDeal = { ...dealRecord, ...uwData, ...propertyData };
      // Also store under "loans" alias for backwards compat with loan templates
      sourceData["loans"] = enrichLoan(flatDeal);
      // Resolve related contact
      if (dealRecord.primary_contact_id) {
        const { data: contact } = await supabase.from("crm_contacts").select("*").eq("id", dealRecord.primary_contact_id as string).single();
        if (contact) {
          sourceData["crm_contacts"] = enrichContact(contact as Record<string, unknown>);
          if ((contact as Record<string, unknown>).company_id) {
            const { data: company } = await supabase.from("companies").select("*").eq("id", (contact as Record<string, unknown>).company_id as string).single();
            if (company) sourceData["companies"] = company as Record<string, unknown>;
          }
        }
      }
      // Also resolve company directly from deal
      if (dealRecord.company_id && !sourceData["companies"]) {
        const { data: company } = await supabase.from("companies").select("*").eq("id", dealRecord.company_id as string).single();
        if (company) sourceData["companies"] = company as Record<string, unknown>;
      }
    }
  } else if (resolveType === "company") {
    const { data: company } = await supabase.from("companies").select("*").eq("id", recordId).single();
    if (company) sourceData["companies"] = company;
  }

  const resolved: ResolvedField[] = mergeFields.map((field) => {
    if (field.source === "_system") {
      const raw = resolveSystemField(field.column);
      return { key: field.key, label: field.label, value: formatValue(raw, field.format), format: field.format };
    }
    if (field.source === "template_config") {
      return { key: field.key, label: field.label, value: null, format: field.format };
    }

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

    return {
      key: field.key,
      label: field.label,
      value: value !== null && value !== undefined ? formatValue(value, field.format) : null,
      format: field.format,
    };
  });

  return { fields: resolved };
}

export type RecordOption = { id: string; label: string };

export async function searchRecords(
  recordType: "loan" | "contact" | "deal" | "company",
  query: string
): Promise<{ records: RecordOption[] }> {
  const supabase = await createClient();
  const q = query.trim();

  if (recordType === "loan") {
    const { data } = await supabase
      .from("loans")
      .select("id, property_address")
      .or(
        q
          ? `property_address.ilike.%${q}%`
          : "id.neq.00000000-0000-0000-0000-000000000000"
      )
      .order("created_at", { ascending: false })
      .limit(20);

    return {
      records: (data ?? []).map((r) => ({
        id: r.id,
        label: r.property_address || r.id,
      })),
    };
  }

  if (recordType === "contact") {
    const { data } = await supabase
      .from("crm_contacts")
      .select("id, first_name, last_name, email")
      .or(
        q
          ? `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`
          : "id.neq.00000000-0000-0000-0000-000000000000"
      )
      .order("created_at", { ascending: false })
      .limit(20);

    return {
      records: (data ?? []).map((r) => ({
        id: r.id,
        label: [r.first_name, r.last_name].filter(Boolean).join(" ") || r.email || r.id,
      })),
    };
  }

  if (recordType === "company") {
    const { data } = await supabase
      .from("companies")
      .select("id, name")
      .or(
        q
          ? `name.ilike.%${q}%`
          : "id.neq.00000000-0000-0000-0000-000000000000"
      )
      .order("name")
      .limit(20);

    return {
      records: (data ?? []).map((r) => ({
        id: r.id,
        label: r.name || r.id,
      })),
    };
  }

  if (recordType === "deal") {
    const { data } = await supabase
      .from("unified_deals" as never)
      .select("id, name" as never)
      .or(
        q
          ? `name.ilike.%${q}%`
          : "id.neq.00000000-0000-0000-0000-000000000000"
      )
      .order("created_at" as never, { ascending: false })
      .limit(20);

    return {
      records: ((data ?? []) as Array<{ id: string; name: string }>).map((r) => ({
        id: r.id,
        label: r.name || r.id,
      })),
    };
  }

  return { records: [] };
}

export type RecipientInfo = {
  email: string | null;
  name: string | null;
  contactId: string | null;
};

/**
 * Resolve the primary recipient email for a given record.
 * Used by the "Send via Email" flow to pre-fill the To field.
 */
export async function resolveRecipientForRecord(
  recordType: string,
  recordId: string
): Promise<RecipientInfo> {
  const supabase = await createClient();
  const empty: RecipientInfo = { email: null, name: null, contactId: null };

  if (recordType === "loan") {
    const { data: loan } = await supabase
      .from("loans")
      .select("borrower_contact_id" as never)
      .eq("id", recordId)
      .single();
    const loanRecord = loan as Record<string, unknown> | null;
    if (!loanRecord?.borrower_contact_id) return empty;

    const { data: contact } = await supabase
      .from("crm_contacts")
      .select("id, first_name, last_name, email")
      .eq("id", loanRecord.borrower_contact_id as string)
      .single();
    if (!contact) return empty;

    return {
      email: contact.email ?? null,
      name: [contact.first_name, contact.last_name].filter(Boolean).join(" ") || null,
      contactId: contact.id,
    };
  }

  if (recordType === "contact") {
    const { data: contact } = await supabase
      .from("crm_contacts")
      .select("id, first_name, last_name, email")
      .eq("id", recordId)
      .single();
    if (!contact) return empty;

    return {
      email: contact.email ?? null,
      name: [contact.first_name, contact.last_name].filter(Boolean).join(" ") || null,
      contactId: contact.id,
    };
  }

  if (recordType === "deal") {
    const { data: deal } = await supabase
      .from("unified_deals" as never)
      .select("primary_contact_id" as never)
      .eq("id" as never, recordId as never)
      .single();
    const dealRecord = deal as Record<string, unknown> | null;
    if (!dealRecord?.primary_contact_id) return empty;

    const { data: contact } = await supabase
      .from("crm_contacts")
      .select("id, first_name, last_name, email")
      .eq("id", dealRecord.primary_contact_id as string)
      .single();
    if (!contact) return empty;

    return {
      email: contact.email ?? null,
      name: [contact.first_name, contact.last_name].filter(Boolean).join(" ") || null,
      contactId: contact.id,
    };
  }

  if (recordType === "company") {
    // Get the first contact associated with this company
    const { data: contact } = await supabase
      .from("crm_contacts")
      .select("id, first_name, last_name, email")
      .eq("company_id", recordId)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();
    if (!contact) return empty;

    return {
      email: contact.email ?? null,
      name: [contact.first_name, contact.last_name].filter(Boolean).join(" ") || null,
      contactId: contact.id,
    };
  }

  return empty;
}

/**
 * Fetch the default email template ID linked to a document template.
 */
export async function fetchLinkedEmailTemplateId(
  documentTemplateId: string
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("document_templates")
    .select("default_email_template_id")
    .eq("id", documentTemplateId)
    .single();

  return (data as Record<string, unknown> | null)?.default_email_template_id as string | null;
}
