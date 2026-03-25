import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OpsTask, Profile } from "@/lib/tasks";

const ALLOWED_SCOPES = new Set([
  "timeline",
  "tasks",
  "pipeline",
  "borrower",
  "investor",
]);

async function assertCrmAccess(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null as null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  // Single query instead of two separate role checks
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const r = roleRow?.role;
  if (r !== "admin" && r !== "super_admin") {
    return { user: null as null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, error: null as null };
}

/**
 * GET /api/crm/contacts/[contactId]/tab-data?scope=timeline|tasks|pipeline|borrower|investor
 * contactId is crm_contacts.id (uuid)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const supabase = await createClient();
  const { user, error } = await assertCrmAccess(supabase);
  if (error) return error;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId } = await params;
  const scope = request.nextUrl.searchParams.get("scope") ?? "timeline";
  if (!ALLOWED_SCOPES.has(scope)) {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: contact } = await supabase
    .from("crm_contacts")
    .select("id")
    .eq("id", contactId)
    .single();

  if (!contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: teamResult } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .order("full_name");

  const profileLookup: Record<string, string> = {};
  (teamResult ?? []).forEach((t) => {
    profileLookup[t.id] = t.full_name || t.email || "Unknown";
  });

  try {
    if (scope === "timeline") {
      const [activitiesResult, emailsResult] = await Promise.all([
        supabase
          .from("crm_activities")
          .select(
            "id, activity_type, subject, description, call_disposition, direction, call_duration_seconds, performed_by, performed_by_name, created_at"
          )
          .eq("contact_id", contactId)
          .order("created_at", { ascending: false })
          .limit(200),
        admin
          .from("crm_emails")
          .select(
            "id, created_at, from_email, to_email, to_name, subject, body_text, body_html, cc_emails, bcc_emails, sent_by_name, postmark_status, delivered_at, opened_at, attachments"
          )
          .eq("linked_contact_id", contactId)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      const activities = (activitiesResult.data ?? []).map((a) => ({
        id: a.id as string,
        activity_type: a.activity_type as string,
        subject: a.subject as string | null,
        description: a.description as string | null,
        outcome: (a.call_disposition as string | null) ?? null,
        direction: (a.direction as string | null) ?? null,
        call_duration_seconds: (a.call_duration_seconds as number | null) ?? null,
        created_by_name: a.performed_by
          ? ((a.performed_by_name as string | null) ||
              profileLookup[a.performed_by as string] ||
              null)
          : null,
        created_at: a.created_at as string,
      }));

      const emails = (emailsResult.data ?? []).map((e) => ({
        id: e.id as string,
        created_at: e.created_at as string,
        from_email: e.from_email as string,
        to_email: e.to_email as string,
        to_name: e.to_name as string | null,
        subject: e.subject as string,
        body_text: e.body_text as string | null,
        body_html: e.body_html as string | null,
        cc_emails: e.cc_emails as string[] | null,
        bcc_emails: e.bcc_emails as string[] | null,
        sent_by_name: e.sent_by_name as string | null,
        postmark_status: e.postmark_status as string | null,
        delivered_at: e.delivered_at as string | null,
        opened_at: e.opened_at as string | null,
        attachments: e.attachments,
      }));

      return NextResponse.json({ activities, emails });
    }

    if (scope === "tasks") {
      const { data: raw } = await admin
        .from("ops_tasks")
        .select("id, title, description, status, priority, assigned_to, assigned_to_name, project_id, due_date, completed_at, category, linked_entity_type, linked_entity_id, linked_entity_label, is_recurring, is_active_recurrence, recurrence_pattern, recurrence_repeat_interval, recurrence_days_of_week, recurrence_day_of_month, recurrence_monthly_when, recurrence_start_date, recurrence_end_date, next_recurrence_date, recurring_template_id, recurrence_period, previous_incomplete, recurring_series_id, source_task_id, parent_task_id, created_by, sort_order, updated_at, created_at, type, approval_status, active_party, requestor_user_id, requestor_name, amount, decision_note, approved_at, rejected_at, resubmitted_at, revision_count, requires_approval, approver_id, approval_instructions")
        .eq("linked_entity_type", "contact")
        .eq("linked_entity_id", contactId)
        .order("created_at", { ascending: false })
        .limit(100);

      const tasks: OpsTask[] = (raw ?? []).map((t: Record<string, unknown>) => ({
        id: t.id as string,
        title: t.title as string,
        description: t.description as string | null,
        status: t.status as string,
        priority: t.priority as string,
        assigned_to: t.assigned_to as string | null,
        assigned_to_name: t.assigned_to_name as string | null,
        project_id: t.project_id as string | null,
        due_date: t.due_date as string | null,
        completed_at: t.completed_at as string | null,
        category: t.category as string | null,
        linked_entity_type: t.linked_entity_type as string | null,
        linked_entity_id: t.linked_entity_id as string | null,
        linked_entity_label: t.linked_entity_label as string | null,
        is_recurring: t.is_recurring as boolean | null,
        is_active_recurrence: t.is_active_recurrence as boolean | null,
        recurrence_pattern: t.recurrence_pattern as string | null,
        recurrence_repeat_interval: t.recurrence_repeat_interval as number | null,
        recurrence_days_of_week: t.recurrence_days_of_week as number[] | null,
        recurrence_day_of_month: t.recurrence_day_of_month as number | null,
        recurrence_monthly_when: t.recurrence_monthly_when as string | null,
        recurrence_start_date: t.recurrence_start_date as string | null,
        recurrence_end_date: t.recurrence_end_date as string | null,
        next_recurrence_date: t.next_recurrence_date as string | null,
        recurring_template_id: t.recurring_template_id as string | null,
        recurrence_period: t.recurrence_period as string | null,
        previous_incomplete: t.previous_incomplete as boolean | null,
        recurring_series_id: t.recurring_series_id as string | null,
        source_task_id: t.source_task_id as string | null,
        parent_task_id: t.parent_task_id as string | null,
        created_by: t.created_by as string | null,
        sort_order: (t.sort_order as number) ?? 0,
        updated_at: t.updated_at as string | null,
        created_at: t.created_at as string | null,
        type: ((t.type as string) ?? "task") as "task" | "approval",
        approval_status: t.approval_status as string | null,
        active_party: t.active_party as string | null,
        requestor_user_id: t.requestor_user_id as string | null,
        requestor_name: t.requestor_name as string | null,
        amount: t.amount as number | null,
        decision_note: t.decision_note as string | null,
        approved_at: t.approved_at as string | null,
        rejected_at: t.rejected_at as string | null,
        resubmitted_at: t.resubmitted_at as string | null,
        revision_count: t.revision_count as number | null,
        requires_approval: (t.requires_approval as boolean) ?? false,
        approver_id: t.approver_id as string | null,
        approval_instructions: t.approval_instructions as string | null,
      }));

      const profiles: Profile[] = (teamResult ?? []).map((t) => ({
        id: t.id,
        full_name: t.full_name || t.email || "Unknown",
        avatar_url: null,
      }));

      return NextResponse.json({ tasks, profiles });
    }

    if (scope === "pipeline") {
      const { data: dealContactsResult } = await admin
        .from("deal_contacts")
        .select(
          "role, unified_deals(id, deal_number, name, stage, amount, loan_type, asset_class, source, capital_side, created_at)"
        )
        .eq("contact_id", contactId);

      const pipelineDeals = (dealContactsResult ?? [])
        .filter((dc: Record<string, unknown>) => dc.unified_deals)
        .map((dc: Record<string, unknown>) => {
          const d = dc.unified_deals as Record<string, unknown>;
          return {
            id: d.id as string,
            deal_number: d.deal_number as string | null,
            name: d.name as string,
            stage: d.stage as string,
            amount: d.amount as number | null,
            loan_type: d.loan_type as string | null,
            asset_class: d.asset_class as string | null,
            source: d.source as string | null,
            capital_side: d.capital_side as string,
            role: dc.role as string | null,
            created_at: d.created_at as string,
          };
        });

      return NextResponse.json({ pipelineDeals });
    }

    if (scope === "borrower") {
      const { data: c } = await supabase
        .from("crm_contacts")
        .select("borrower_id")
        .eq("id", contactId)
        .single();

      if (!c?.borrower_id) {
        return NextResponse.json({ loans: [], entities: [], primaryBorrowerEntity: null });
      }

      const [borrowerLoansResult, borrowerEntitiesResult] = await Promise.all([
        admin
          .from("loans")
          .select(
            "id, loan_number, property_address, type, loan_amount, interest_rate, ltv, loan_term_months, stage, stage_updated_at, created_at"
          )
          .eq("borrower_id", c.borrower_id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
        admin
          .from("borrower_entities")
          .select(
            "id, entity_name, entity_type, ein, state_of_formation, formation_date, operating_agreement_url, articles_of_org_url, certificate_good_standing_url, ein_letter_url"
          )
          .eq("borrower_id", c.borrower_id),
      ]);

      const loans = (borrowerLoansResult.data ?? []).map((l: Record<string, unknown>) => ({
        id: l.id as string,
        loan_number: l.loan_number as string | null,
        property_address: l.property_address as string | null,
        type: l.type as string | null,
        loan_amount: l.loan_amount as number | null,
        interest_rate: l.interest_rate as number | null,
        ltv: l.ltv as number | null,
        loan_term_months: l.loan_term_months as number | null,
        stage: l.stage as string | null,
        stage_updated_at: l.stage_updated_at as string | null,
        created_at: l.created_at as string,
      }));

      const entities = (borrowerEntitiesResult.data ?? []).map((e: Record<string, unknown>) => ({
        id: e.id as string,
        entity_name: e.entity_name as string,
        entity_type: e.entity_type as string,
        ein: e.ein as string | null,
        state_of_formation: e.state_of_formation as string | null,
        formation_date: e.formation_date as string | null,
        kind: "borrower" as const,
        operating_agreement_url: e.operating_agreement_url as string | null,
        articles_of_org_url: e.articles_of_org_url as string | null,
        certificate_good_standing_url: e.certificate_good_standing_url as string | null,
        ein_letter_url: e.ein_letter_url as string | null,
        formation_doc_url: null,
      }));

      const primaryBorrowerEntity =
        entities.length > 0 ? { ...entities[0] } : null;

      return NextResponse.json({ loans, entities, primaryBorrowerEntity });
    }

    if (scope === "investor") {
      const { data: c } = await supabase
        .from("crm_contacts")
        .select("linked_investor_id")
        .eq("id", contactId)
        .single();

      if (!c?.linked_investor_id) {
        return NextResponse.json({
          investorCommitments: [],
          investingEntities: [],
        });
      }

      const [investorCommitmentsResult, investingEntitiesResult] = await Promise.all([
        admin
          .from("investor_commitments")
          .select(
            "id, commitment_amount, funded_amount, unfunded_amount, status, commitment_date, funds(name), investing_entities(entity_name)"
          )
          .eq("investor_id", c.linked_investor_id),
        admin
          .from("investing_entities")
          .select(
            "id, entity_name, entity_type, ein, state_of_formation, operating_agreement_url, formation_doc_url, other_doc_urls"
          )
          .eq("investor_id", c.linked_investor_id),
      ]);

      const investorCommitments = (investorCommitmentsResult.data ?? []).map(
        (row: Record<string, unknown>) => ({
          id: row.id as string,
          fund_name:
            (row.funds as Record<string, unknown> | null)?.name as string | null ?? null,
          commitment_amount: row.commitment_amount as number | null,
          funded_amount: row.funded_amount as number | null,
          unfunded_amount: row.unfunded_amount as number | null,
          status: row.status as string | null,
          commitment_date: row.commitment_date as string | null,
          entity_name:
            (row.investing_entities as Record<string, unknown> | null)?.entity_name as string | null ??
            null,
        })
      );

      const investingEntities = (investingEntitiesResult.data ?? []).map(
        (e: Record<string, unknown>) => ({
          id: e.id as string,
          entity_name: e.entity_name as string,
          entity_type: e.entity_type as string,
          ein: e.ein as string | null,
          state_of_formation: e.state_of_formation as string | null,
          formation_date: null,
          kind: "investing" as const,
          operating_agreement_url: e.operating_agreement_url as string | null,
          articles_of_org_url: null,
          certificate_good_standing_url: null,
          ein_letter_url: null,
          formation_doc_url: e.formation_doc_url as string | null,
        })
      );

      return NextResponse.json({ investorCommitments, investingEntities });
    }

    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  } catch (e) {
    console.error("contact tab-data:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
