import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { UnifiedPipeline } from "@/components/admin/pipeline/unified-pipeline";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function PipelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [
    stageConfigResult,
    opportunitiesResult,
    loansResult,
    equityResult,
    teamResult,
    commentsResult,
  ] = await Promise.all([
    admin
      .from("pipeline_stage_config")
      .select("*")
      .order("sort_order"),
    admin
      .from("opportunity_pipeline")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("loan_pipeline")
      .select("*")
      .order("created_at", { ascending: false }),
    admin.from("equity_pipeline").select("*"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "admin")
      .order("full_name"),
    admin
      .from("notes")
      .select("loan_id")
      .not("loan_id", "is", null),
  ]);

  const profiles: Record<string, string> = {};
  (teamResult.data ?? []).forEach(
    (t: { id: string; full_name: string | null }) => {
      profiles[t.id] = t.full_name ?? "Unknown";
    }
  );

  const commentCounts: Record<string, number> = {};
  (commentsResult.data ?? []).forEach(
    (c: { loan_id: string | null }) => {
      if (c.loan_id) {
        commentCounts[c.loan_id] = (commentCounts[c.loan_id] ?? 0) + 1;
      }
    }
  );

  const teamMembers = (teamResult.data ?? []).map(
    (t: { id: string; full_name: string | null }) => ({
      id: t.id,
      full_name: t.full_name ?? "Unknown",
    })
  );

  const stageConfigs = (stageConfigResult.data ?? []).map((s: any) => ({
    id: s.id,
    pipeline_type: s.pipeline_type,
    stage_key: s.stage_key,
    label: s.label,
    color: s.color,
    sort_order: s.sort_order,
    is_terminal: s.is_terminal,
    sla_days: s.sla_days,
  }));

  const opportunities = (opportunitiesResult.data ?? []).map((o: any) => ({
    id: o.id,
    deal_name: o.deal_name,
    stage: o.stage,
    loan_type: o.loan_type,
    loan_purpose: o.loan_purpose,
    funding_channel: o.funding_channel,
    proposed_loan_amount: o.proposed_loan_amount,
    proposed_ltv: o.proposed_ltv,
    approval_status: o.approval_status,
    stage_changed_at: o.stage_changed_at,
    created_at: o.created_at,
    property_address: o.property_address,
    property_city: o.property_city,
    property_state: o.property_state,
    property_type: o.property_type,
    number_of_units: o.number_of_units,
    entity_name: o.entity_name,
    borrower_name: o.borrower_name,
    borrower_count: o.borrower_count,
    originator_name: o.originator ? profiles[o.originator] ?? null : null,
    processor_name: o.processor ? profiles[o.processor] ?? null : null,
  }));

  const loans = (loansResult.data ?? []).map((l: any) => ({
    id: l.id,
    loan_number: l.loan_number,
    borrower_name: l.borrower_name ?? "—",
    borrower_id: null as string | null,
    property_address: l.property_address,
    property_city: null as string | null,
    property_state: null as string | null,
    loan_type: l.loan_type,
    loan_amount: l.loan_amount,
    stage: l.loan_stage,
    stage_updated_at: l.stage_updated_at,
    created_at: l.created_at,
    priority: l.priority ?? "normal",
    originator_name: l.originator ?? null,
    comment_count: commentCounts[l.id] ?? 0,
  }));

  const equityDeals = ((equityResult.data ?? []) as any[]).map((d: any) => ({
    id: d.id,
    deal_name: d.deal_name,
    deal_number: d.deal_number,
    stage: d.stage,
    stage_changed_at: d.stage_changed_at,
    source: d.source,
    asking_price: d.asking_price,
    offer_price: d.offer_price,
    purchase_price: d.purchase_price,
    expected_close_date: d.expected_close_date,
    actual_close_date: d.actual_close_date,
    assigned_to: d.assigned_to,
    value_add_strategy: d.value_add_strategy,
    target_irr: d.target_irr,
    investment_thesis: d.investment_thesis,
    loss_reason: d.loss_reason,
    created_at: d.created_at,
    property_address: d.property_address,
    property_city: d.property_city,
    property_state: d.property_state,
    property_zip: d.property_zip,
    asset_type: d.asset_type,
    property_type: d.property_type,
    number_of_units: d.number_of_units,
    lot_size_acres: d.lot_size_acres,
    assigned_to_profile_id: d.assigned_to_profile_id,
    completed_tasks: d.completed_tasks,
    total_tasks: d.total_tasks,
    days_in_stage: d.days_in_stage,
    underwriting_status: d.underwriting_status,
    going_in_cap_rate: d.going_in_cap_rate,
    stabilized_cap_rate: d.stabilized_cap_rate,
    levered_irr: d.levered_irr,
    equity_multiple: d.equity_multiple,
    assigned_to_name: d.assigned_to ? profiles[d.assigned_to] ?? null : null,
  }));

  return (
    <UnifiedPipeline
      stageConfigs={stageConfigs}
      opportunities={opportunities}
      loans={loans}
      equityDeals={equityDeals}
      teamMembers={teamMembers}
    />
  );
}
