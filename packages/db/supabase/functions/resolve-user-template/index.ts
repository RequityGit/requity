import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  template_slug: string;
  loan_id?: string;
  contact_id?: string;
  override_variables?: Record<string, string>;
}

interface ConditionRow {
  id: string;
  condition_name: string;
  category: string;
  status: string;
  borrower_description: string | null;
  due_date: string | null;
  is_required: boolean;
  critical_path_item: boolean;
  sort_order: number | null;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Create a client authenticated as the user (for RLS)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the JWT and get user
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client for unrestricted queries
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Parse request body
    const body: RequestBody = await req.json();
    const { template_slug, loan_id, contact_id, override_variables } = body;

    if (!template_slug) {
      return new Response(
        JSON.stringify({ error: "template_slug is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 1. Fetch template
    const { data: template, error: templateError } = await adminClient
      .from("user_email_templates")
      .select("*")
      .eq("slug", template_slug)
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      return new Response(
        JSON.stringify({ error: "Template not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const mergeData: Record<string, string> = {};

    // 2. Resolve deal data (loan_id now refers to a unified_deals record)
    if (loan_id) {
      const { data: deal, error: dealError } = await adminClient
        .from("unified_deals")
        .select("*")
        .eq("id", loan_id)
        .single();

      if (dealError || !deal) {
        return new Response(
          JSON.stringify({ error: "Deal not found" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const dealRecord = deal as Record<string, unknown>;
      const uwData = (dealRecord.uw_data ?? {}) as Record<string, unknown>;
      const propertyData = (dealRecord.property_data ?? {}) as Record<string, unknown>;

      // Deal/loan fields
      mergeData.loan_number = (dealRecord.deal_number as string) ?? "";
      mergeData.property_address = (dealRecord.name as string) ?? "";
      mergeData.property_address_short = (propertyData.address as string) ?? (dealRecord.name as string) ?? "";
      mergeData.property_city = (propertyData.city as string) ?? "";
      mergeData.property_state = (propertyData.state as string) ?? "";
      mergeData.loan_amount = formatCurrency(dealRecord.amount as number | null);
      mergeData.total_loan_amount = formatCurrency(
        (uwData.total_loan_amount as number | null) ?? (dealRecord.amount as number | null)
      );
      mergeData.interest_rate = uwData.interest_rate
        ? `${Number(uwData.interest_rate).toFixed(2)}%`
        : "";
      mergeData.loan_term_months = (uwData.loan_term_months as number)?.toString() ?? "";
      mergeData.loan_type = toTitleCase((dealRecord.loan_type as string) ?? "");
      mergeData.loan_purpose = toTitleCase((uwData.purpose as string) ?? "");
      mergeData.loan_status = toTitleCase((dealRecord.stage as string) ?? "");
      mergeData.ltv = uwData.ltv ? `${Number(uwData.ltv).toFixed(0)}%` : "";
      mergeData.purchase_price = formatCurrency(uwData.purchase_price as number | null);
      mergeData.as_is_value = formatCurrency(uwData.as_is_value as number | null);
      mergeData.after_repair_value = formatCurrency(uwData.after_repair_value as number | null);

      // Derive borrower info from deal's primary contact if no contact_id
      if (!contact_id && dealRecord.primary_contact_id) {
        const { data: borrowerContact } = await adminClient
          .from("crm_contacts")
          .select("first_name, last_name, email, phone")
          .eq("id", dealRecord.primary_contact_id as string)
          .single();
        if (borrowerContact) {
          mergeData.borrower_first_name = borrowerContact.first_name ?? "";
          mergeData.borrower_last_name = borrowerContact.last_name ?? "";
          mergeData.borrower_full_name =
            `${borrowerContact.first_name ?? ""} ${borrowerContact.last_name ?? ""}`.trim();
          mergeData.borrower_email = borrowerContact.email ?? "";
          mergeData.borrower_phone = borrowerContact.phone ?? "";
        }
      }
    }

    // 3. Resolve contact data
    if (contact_id) {
      const { data: contact } = await adminClient
        .from("crm_contacts")
        .select("*")
        .eq("id", contact_id)
        .single();

      if (contact) {
        mergeData.borrower_first_name = contact.first_name ?? "";
        mergeData.borrower_last_name = contact.last_name ?? "";
        mergeData.borrower_full_name =
          `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim();
        mergeData.borrower_email = contact.email ?? "";
        mergeData.borrower_phone = contact.phone ?? "";
        mergeData.borrower_company = contact.company_name ?? "";
      }
    }

    // 4. Resolve computed fields: outstanding conditions (from unified_deal_conditions)
    const outstandingConditions: ConditionRow[] = [];
    if (loan_id) {
      const { data: conditions } = await adminClient
        .from("unified_deal_conditions")
        .select(
          "id, name, category, status, borrower_description, due_date, is_required, critical_path_item, sort_order"
        )
        .eq("deal_id", loan_id)
        .in("status", [
          "pending",
          "requested",
          "rejected",
          "submitted",
          "under_review",
        ])
        .order("sort_order", { ascending: true, nullsFirst: false });

      for (const c of conditions ?? []) {
        outstandingConditions.push({
          id: (c as Record<string, unknown>).id as string,
          condition_name: ((c as Record<string, unknown>).name as string) ?? "",
          category: ((c as Record<string, unknown>).category as string) ?? "",
          status: ((c as Record<string, unknown>).status as string) ?? "",
          borrower_description: (c as Record<string, unknown>).borrower_description as string | null,
          due_date: (c as Record<string, unknown>).due_date as string | null,
          is_required: ((c as Record<string, unknown>).is_required as boolean) ?? false,
          critical_path_item: ((c as Record<string, unknown>).critical_path_item as boolean) ?? false,
          sort_order: (c as Record<string, unknown>).sort_order as number | null,
        });
      }

      // Sort by status priority, then sort_order, then name
      const statusOrder: Record<string, number> = {
        rejected: 1,
        pending: 2,
        requested: 3,
        under_review: 4,
        submitted: 5,
      };

      outstandingConditions.sort((a, b) => {
        const aOrder = statusOrder[a.status] ?? 99;
        const bOrder = statusOrder[b.status] ?? 99;
        if (aOrder !== bOrder) return aOrder - bOrder;
        const aSortOrder = a.sort_order ?? 99999;
        const bSortOrder = b.sort_order ?? 99999;
        if (aSortOrder !== bSortOrder) return aSortOrder - bSortOrder;
        return a.condition_name.localeCompare(b.condition_name);
      });

      mergeData.outstanding_conditions_html =
        buildConditionsHtml(outstandingConditions);
      mergeData.outstanding_conditions_count =
        outstandingConditions.length.toString();
      mergeData.outstanding_conditions_list =
        buildConditionsPlainText(outstandingConditions);
    }

    // 5. Resolve static fields
    mergeData.portal_login_url = "https://portal.requitygroup.com";
    mergeData.company_name = "Requity Lending";
    mergeData.company_phone = "(813) 535-9925";
    mergeData.company_website = "https://www.requitylending.com";
    mergeData.today_date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // 6. Resolve sender fields from authenticated user's profile
    const { data: senderProfile } = await adminClient
      .from("profiles")
      .select("full_name, email, role, phone")
      .eq("id", user.id)
      .single();

    if (senderProfile) {
      mergeData.sender_name = senderProfile.full_name ?? "";
      mergeData.sender_first_name =
        senderProfile.full_name?.split(" ")[0] ?? "";
      mergeData.sender_email = senderProfile.email ?? user.email ?? "";
      mergeData.sender_title = toTitleCase(senderProfile.role ?? "");
      mergeData.sender_phone = senderProfile.phone ?? "";
    }

    // 7. Apply overrides
    if (override_variables) {
      for (const [key, value] of Object.entries(override_variables)) {
        mergeData[key] = value;
      }
    }

    // 8. Perform template substitution
    const subject = resolveTemplateString(
      template.subject_template,
      mergeData
    );
    const bodyHtml = resolveTemplateString(
      template.body_template,
      mergeData
    );

    return new Response(
      JSON.stringify({
        subject,
        body_html: bodyHtml,
        merge_data: mergeData,
        outstanding_conditions: outstandingConditions,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("resolve-user-template error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function resolveTemplateString(
  template: string,
  data: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    return data[key] ?? "";
  });
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function toTitleCase(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function buildConditionsHtml(conditions: ConditionRow[]): string {
  if (conditions.length === 0) {
    return '<div style="text-align:center;padding:24px;background:#D4EDDA;border-radius:8px;color:#155724;font-size:15px;font-weight:600;">All conditions have been satisfied. &#10003;</div>';
  }

  const statusBadge = (status: string): string => {
    const configs: Record<string, { bg: string; color: string; label: string }> =
      {
        rejected: { bg: "#F8D7DA", color: "#842029", label: "Rejected" },
        pending: { bg: "#FFF3CD", color: "#856404", label: "Pending" },
        requested: { bg: "#FFF3CD", color: "#856404", label: "Requested" },
        submitted: { bg: "#D1ECF1", color: "#0C5460", label: "Submitted" },
        under_review: {
          bg: "#D1ECF1",
          color: "#0C5460",
          label: "Under Review",
        },
      };
    const config = configs[status] ?? {
      bg: "#E2E3E5",
      color: "#41464B",
      label: toTitleCase(status),
    };
    return `<span style="background:${config.bg};color:${config.color};padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">${config.label}</span>`;
  };

  const hasDueDates = conditions.some((c) => c.due_date);

  let html =
    '<table style="width:100%;border-collapse:collapse;font-family:\'Source Sans 3\',\'Segoe UI\',Arial,sans-serif;">';
  html += '<tr style="background:#f8f8f8;">';
  html +=
    '<th style="text-align:left;padding:10px;border-bottom:2px solid #0F2140;font-size:13px;font-weight:600;">Condition</th>';
  html +=
    '<th style="text-align:left;padding:10px;border-bottom:2px solid #0F2140;font-size:13px;font-weight:600;">Category</th>';
  html +=
    '<th style="text-align:center;padding:10px;border-bottom:2px solid #0F2140;font-size:13px;font-weight:600;">Status</th>';
  if (hasDueDates) {
    html +=
      '<th style="text-align:left;padding:10px;border-bottom:2px solid #0F2140;font-size:13px;font-weight:600;">Due Date</th>';
  }
  html += "</tr>";

  for (const condition of conditions) {
    const criticalIcon = condition.critical_path_item ? "&#9889; " : "";
    const category = toTitleCase(condition.category ?? "");
    const dueDateStr = condition.due_date
      ? new Date(condition.due_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "";

    html += "<tr>";
    html += `<td style="padding:10px;border-bottom:1px solid #eee;font-size:14px;">${criticalIcon}${escapeHtml(condition.condition_name)}`;
    if (condition.borrower_description) {
      html += `<br/><span style="font-size:12px;color:#888;">${escapeHtml(condition.borrower_description)}</span>`;
    }
    html += "</td>";
    html += `<td style="padding:10px;border-bottom:1px solid #eee;font-size:13px;color:#666;">${escapeHtml(category)}</td>`;
    html += `<td style="text-align:center;padding:10px;border-bottom:1px solid #eee;">${statusBadge(condition.status)}</td>`;
    if (hasDueDates) {
      html += `<td style="padding:10px;border-bottom:1px solid #eee;font-size:13px;color:#666;">${escapeHtml(dueDateStr)}</td>`;
    }
    html += "</tr>";
  }

  html += "</table>";
  return html;
}

function buildConditionsPlainText(conditions: ConditionRow[]): string {
  if (conditions.length === 0) {
    return "All conditions have been satisfied.";
  }
  return conditions
    .map((c) => {
      const critical = c.critical_path_item ? "[CRITICAL] " : "";
      return `- ${critical}${c.condition_name} (${toTitleCase(c.status)})`;
    })
    .join("\n");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
