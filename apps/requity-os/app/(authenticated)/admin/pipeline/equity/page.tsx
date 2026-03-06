import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EquityPipelineView } from "@/components/admin/pipeline/equity-pipeline-view";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function EquityPipelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [
    stageConfigResult,
    equityResult,
    teamResult,
  ] = await Promise.all([
    admin
      .from("pipeline_stage_config")
      .select("*")
      .order("sort_order"),
    admin.from("equity_pipeline").select("*"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "admin")
      .order("full_name"),
  ]);

  const profiles: Record<string, string> = {};
  (teamResult.data ?? []).forEach(
    (t: { id: string; full_name: string | null }) => {
      profiles[t.id] = t.full_name ?? "Unknown";
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
    <div className="space-y-6">
      <PageHeader
        title="Equity Pipeline"
        description="Track and manage equity investment deals from new deals through close."
      />
      <EquityPipelineView
        stageConfigs={stageConfigs}
        equityDeals={equityDeals}
        teamMembers={teamMembers}
      />
    </div>
  );
}
