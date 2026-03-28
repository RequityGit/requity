import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PipelineView } from "@/components/pipeline/PipelineView";
import { PipelineProvider } from "@/components/pipeline/PipelineProvider";
import { PipelineHeader } from "./PipelineHeader";
import {
  daysInStage,
  getAlertLevel,
  type UnifiedDeal,
  type StageConfig,
  type DealActivity,
} from "@/components/pipeline/pipeline-types";
import {
  mergeUwData,
  getPropertySelectColumns,
  getBorrowerSelectColumns,
} from "@/lib/pipeline/resolve-uw-data";
import { getSessionData } from "@/lib/auth/session-cache";
import type { IntakeItem } from "@/lib/intake/types";

export const dynamic = "force-dynamic";

interface PipelinePageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function PipelinePage({ searchParams }: PipelinePageProps) {
  const session = await getSessionData();
  if (!session) redirect("/login");

  const params = await searchParams;
  const showingLostDeals = params.status === "lost";

  const supabase = await createClient();
  const admin = createAdminClient();

  const [
    dealsResult,
    stageConfigsResult,
    relationshipsResult,
    activitiesResult,
    teamResult,
    intakeResult,
    conditionsResult,
    fundedDrawsResult,
    activeBudgetsResult,
    pendingDrawsResult,
  ] = await Promise.all([
    admin
      .from("unified_deals" as never)
      .select(
        `*, primary_contact:crm_contacts!primary_contact_id(id, first_name, last_name, email, phone), company:companies(id, name)`
      )
      .in("status" as never, (showingLostDeals ? ["lost"] : ["active", "on_hold"]) as never)
      .order(showingLostDeals ? ("updated_at" as never) : ("created_at" as never), { ascending: false }),
    admin
      .from("unified_stage_configs" as never)
      .select("id, stage, warn_days, alert_days, description, sort_order")
      .order("sort_order" as never),
    admin
      .from("unified_deal_relationships" as never)
      .select("deal_a_id, deal_b_id"),
    admin
      .from("unified_deal_activity" as never)
      .select("id, deal_id, activity_type, title, description, metadata, created_by, created_at")
      .order("created_at" as never, { ascending: false })
      .limit(500),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "admin")
      .order("full_name"),
    admin
      .from("intake_items" as never)
      .select("id, email_intake_queue_id, received_at, from_email, from_name, subject, raw_body, parsed_data, auto_matches, status, processed_at, processed_by, decisions, created_deal_id, created_contact_id, created_company_id, created_property_id, created_at, updated_at")
      .in("status" as never, ["pending", "auto_matched"] as never)
      .order("received_at" as never, { ascending: false }),
    admin
      .from("deal_conditions" as never)
      .select("deal_id, status" as never),
    // Funded draw totals per deal (for UPB calculation)
    admin
      .from("deal_draw_requests" as never)
      .select("deal_id, wire_amount" as never)
      .eq("status" as never, "funded" as never),
    // Active construction budgets per deal (for Remaining Draw calculation)
    admin
      .from("deal_construction_budgets" as never)
      .select("deal_id, total_budget, total_funded" as never)
      .eq("status" as never, "active" as never),
    // Pending draw requests per deal (for flag badges)
    admin
      .from("deal_draw_requests" as never)
      .select("deal_id, status" as never)
      .in("status" as never, ["submitted", "under_review", "approved"] as never),
  ]);

  const stageConfigs = (stageConfigsResult.data ?? []) as unknown as StageConfig[];
  const activities = (activitiesResult.data ?? []) as unknown as DealActivity[];

  // Build relationship set
  const relationshipDealIds = new Set<string>();
  for (const rel of (relationshipsResult.data ?? []) as { deal_a_id: string; deal_b_id: string }[]) {
    relationshipDealIds.add(rel.deal_a_id);
    relationshipDealIds.add(rel.deal_b_id);
  }

  // Compute stage config map for alert levels
  const stageConfigMap = new Map(stageConfigs.map((sc) => [sc.stage, sc]));

  // Resolve UW data from real tables (properties, borrowers) and merge with JSONB
  const rawDeals = (dealsResult.data ?? []) as unknown as UnifiedDeal[];

  // Collect unique property/contact/broker IDs for bulk fetch
  const propertyIdSet = new Set<string>();
  const contactIdSet = new Set<string>();
  const brokerIdSet = new Set<string>();
  for (const d of rawDeals) {
    if (d.property_id) propertyIdSet.add(d.property_id);
    if (d.primary_contact_id) contactIdSet.add(d.primary_contact_id);
    const brokerId = (d as unknown as Record<string, unknown>).broker_contact_id as string | null;
    if (brokerId) brokerIdSet.add(brokerId);
  }
  const propertyIds = Array.from(propertyIdSet);
  const contactIds = Array.from(contactIdSet);
  const brokerIds = Array.from(brokerIdSet);

  type Row = Record<string, unknown>;

  // Bulk fetch linked properties, borrowers, and broker contacts
  const [propertiesRes, borrowersRes, brokersRes] = await Promise.all([
    propertyIds.length > 0
      ? admin
          .from("properties" as never)
          .select(getPropertySelectColumns() as never)
          .in("id" as never, propertyIds as never)
      : Promise.resolve({ data: [] }),
    contactIds.length > 0
      ? admin
          .from("borrowers" as never)
          .select(getBorrowerSelectColumns() as never)
          .in("crm_contact_id" as never, contactIds as never)
      : Promise.resolve({ data: [] }),
    brokerIds.length > 0
      ? admin
          .from("crm_contacts" as never)
          .select("id, first_name, last_name, email, phone, broker_company:companies!crm_contacts_company_id_fkey(name)" as never)
          .in("id" as never, brokerIds as never)
      : Promise.resolve({ data: [] }),
  ]);

  const propertyMap = new Map<string, Row>();
  for (const p of ((propertiesRes.data ?? []) as unknown as Row[])) {
    propertyMap.set(p.id as string, p);
  }

  const borrowerMap = new Map<string, Row>();
  for (const b of ((borrowersRes.data ?? []) as unknown as Row[])) {
    borrowerMap.set(b.crm_contact_id as string, b);
  }

  const brokerMap = new Map<string, Row>();
  for (const br of ((brokersRes.data ?? []) as unknown as Row[])) {
    brokerMap.set(br.id as string, br);
  }

  // Build servicing enrichment maps
  const drawsByDeal = new Map<string, number>();
  for (const d of (fundedDrawsResult.data ?? []) as { deal_id: string; wire_amount: number | null }[]) {
    drawsByDeal.set(d.deal_id, (drawsByDeal.get(d.deal_id) ?? 0) + (d.wire_amount ?? 0));
  }

  const budgetByDeal = new Map<string, { total_budget: number; total_funded: number }>();
  for (const b of (activeBudgetsResult.data ?? []) as { deal_id: string; total_budget: number | null; total_funded: number | null }[]) {
    const existing = budgetByDeal.get(b.deal_id);
    if (existing) {
      existing.total_budget += b.total_budget ?? 0;
      existing.total_funded += b.total_funded ?? 0;
    } else {
      budgetByDeal.set(b.deal_id, { total_budget: b.total_budget ?? 0, total_funded: b.total_funded ?? 0 });
    }
  }

  const pendingDrawDeals = new Set<string>();
  for (const d of (pendingDrawsResult.data ?? []) as { deal_id: string; status: string }[]) {
    pendingDrawDeals.add(d.deal_id);
  }

  // Enrich deals with computed fields + resolved UW data
  const deals: UnifiedDeal[] = rawDeals.map((deal) => {
    const days = daysInStage(deal.stage_entered_at);
    const config = stageConfigMap.get(deal.stage);
    const property = deal.property_id ? propertyMap.get(deal.property_id) ?? null : null;
    const borrower = deal.primary_contact_id ? borrowerMap.get(deal.primary_contact_id) ?? null : null;
    const brokerId = (deal as unknown as Record<string, unknown>).broker_contact_id as string | null;
    const broker = brokerId ? brokerMap.get(brokerId) ?? null : null;

    // Compute servicing enrichment
    const loanAmt = (deal as unknown as Record<string, unknown>).loan_amount as number | null;
    const fundedDraws = drawsByDeal.get(deal.id) ?? 0;
    const budget = budgetByDeal.get(deal.id);

    return {
      ...deal,
      uw_data: mergeUwData(deal.uw_data, property, borrower),
      broker_contact: broker as UnifiedDeal["broker_contact"],
      days_in_stage: days,
      alert_level: getAlertLevel(days, config),
      _upb: (loanAmt ?? deal.amount ?? 0) + fundedDraws,
      _remaining_draw: budget ? budget.total_budget - budget.total_funded : null,
      _has_pending_draw: pendingDrawDeals.has(deal.id),
    };
  });

  const teamMembers = (teamResult.data ?? []).map(
    (t: { id: string; full_name: string | null }) => ({
      id: t.id,
      full_name: t.full_name ?? "Unknown",
    })
  );

  const intakeItems = (intakeResult.data ?? []) as unknown as IntakeItem[];

  // Build conditions progress map: deal_id -> {completed, total}
  const conditionsMap = new Map<string, { completed: number; total: number }>();
  for (const cond of (conditionsResult.data ?? []) as { deal_id: string; status: string }[]) {
    const entry = conditionsMap.get(cond.deal_id) ?? { completed: 0, total: 0 };
    entry.total++;
    if (cond.status === "satisfied" || cond.status === "waived") {
      entry.completed++;
    }
    conditionsMap.set(cond.deal_id, entry);
  }

  return (
    <div className="space-y-6">
      <PipelineHeader
        intakeCount={intakeItems.length}
        approvalCount={deals.filter((d: UnifiedDeal) => d.approval_status === "pending").length}
      />
      <PipelineProvider
        deals={deals}
        stageConfigs={stageConfigs}
        activities={activities}
        relationshipDealIds={relationshipDealIds}
        teamMembers={teamMembers}
        intakeItems={intakeItems}
        currentUserId={session.user.id}
        conditionsMap={conditionsMap}
      >
        <PipelineView showingLostDeals={showingLostDeals} />
      </PipelineProvider>
    </div>
  );
}
