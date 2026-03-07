import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DebtPipelineView } from "@/components/admin/pipeline/debt-pipeline-view";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function DebtPipelinePage() {
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
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "admin")
      .order("full_name"),
    admin
      .from("loan_comments")
      .select("loan_id"),
  ]);

  const profiles: Record<string, string> = {};
  (teamResult.data ?? []).forEach(
    (t: { id: string; full_name: string | null }) => {
      profiles[t.id] = t.full_name ?? "Unknown";
    }
  );

  // Build comment count per loan
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Debt Pipeline"
        description="Track and manage debt deals from sourcing through close."
      />
      <DebtPipelineView
        stageConfigs={stageConfigs}
        opportunities={opportunities}
        loans={loans}
        teamMembers={teamMembers}
      />
    </div>
  );
}
