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

export async function fetchTemplatesForRecord(recordType: "loan" | "contact" | "deal" | "company") {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("document_templates")
    .select("id, name, template_type, record_type, description, merge_fields, version, requires_signature")
    .eq("record_type", recordType)
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Failed to fetch templates:", error);
    return { error: error.message, templates: [] };
  }

  return { templates: data ?? [] };
}

export async function resolveTemplateData(
  templateId: string,
  recordId: string
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

  // Fetch source records
  const sourceData: Record<string, Record<string, unknown>> = {};

  if (template.record_type === "loan") {
    const { data: loan } = await supabase.from("loans").select("*").eq("id", recordId).single();
    if (loan) {
      sourceData["loans"] = loan;
      if ((loan as Record<string, unknown>).borrower_contact_id) {
        const { data: contact } = await supabase.from("crm_contacts").select("*").eq("id", (loan as Record<string, unknown>).borrower_contact_id as string).single();
        if (contact) {
          sourceData["crm_contacts"] = contact;
          if ((contact as Record<string, unknown>).company_id) {
            const { data: company } = await supabase.from("companies").select("*").eq("id", (contact as Record<string, unknown>).company_id as string).single();
            if (company) sourceData["companies"] = company;
          }
        }
      }
    }
  } else if (template.record_type === "contact") {
    const { data: contact } = await supabase.from("crm_contacts").select("*").eq("id", recordId).single();
    if (contact) {
      sourceData["crm_contacts"] = contact;
      if ((contact as Record<string, unknown>).company_id) {
        const { data: company } = await supabase.from("companies").select("*").eq("id", (contact as Record<string, unknown>).company_id as string).single();
        if (company) sourceData["companies"] = company;
      }
    }
  } else if (template.record_type === "deal") {
    const { data: deal } = await supabase.from("equity_deals").select("*").eq("id", recordId).single();
    if (deal) sourceData["equity_deals"] = deal;
  } else if (template.record_type === "company") {
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
      loans: ["loans"],
      equity_deals: ["equity_deals"],
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
      .from("equity_deals")
      .select("id, deal_name")
      .or(
        q
          ? `deal_name.ilike.%${q}%`
          : "id.neq.00000000-0000-0000-0000-000000000000"
      )
      .order("created_at", { ascending: false })
      .limit(20);

    return {
      records: (data ?? []).map((r) => ({
        id: r.id,
        label: r.deal_name || r.id,
      })),
    };
  }

  return { records: [] };
}
