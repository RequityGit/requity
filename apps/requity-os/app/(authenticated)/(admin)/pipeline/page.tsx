import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PipelineView } from "@/components/pipeline/PipelineView";
import { PipelineHeader } from "./PipelineHeader";
import {
  daysInStage,
  getAlertLevel,
  type UnifiedDeal,
  type UnifiedCardType,
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

export default async function PipelinePage() {
  const session = await getSessionData();
  if (!session) redirect("/login");

  const supabase = createClient();
  const admin = createAdminClient();

  const [
    cardTypesResult,
    dealsResult,
    stageConfigsResult,
    relationshipsResult,
    activitiesResult,
    teamResult,
    intakeResult,
  ] = await Promise.all([
    admin
      .from("unified_card_types" as never)
      .select("*")
      .eq("status" as never, "active" as never)
      .order("sort_order" as never),
    admin
      .from("unified_deals" as never)
      .select(
        `*, primary_contact:crm_contacts(id, first_name, last_name), company:companies(id, name)`
      )
      .in("status" as never, ["active", "on_hold"] as never)
      .order("created_at" as never, { ascending: false }),
    admin
      .from("unified_stage_configs" as never)
      .select("*")
      .order("sort_order" as never),
    admin
      .from("unified_deal_relationships" as never)
      .select("deal_a_id, deal_b_id"),
    admin
      .from("unified_deal_activity" as never)
      .select("*")
      .order("created_at" as never, { ascending: false })
      .limit(500),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "admin")
      .order("full_name"),
    admin
      .from("intake_items" as never)
      .select("*")
      .eq("status" as never, "pending" as never)
      .order("received_at" as never, { ascending: false }),
  ]);

  const cardTypes = (cardTypesResult.data ?? []) as unknown as UnifiedCardType[];
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

  // Collect unique property/contact IDs for bulk fetch
  const propertyIdSet = new Set<string>();
  const contactIdSet = new Set<string>();
  for (const d of rawDeals) {
    if (d.property_id) propertyIdSet.add(d.property_id);
    if (d.primary_contact_id) contactIdSet.add(d.primary_contact_id);
  }
  const propertyIds = Array.from(propertyIdSet);
  const contactIds = Array.from(contactIdSet);

  type Row = Record<string, unknown>;

  // Bulk fetch linked properties and borrowers
  const [propertiesRes, borrowersRes] = await Promise.all([
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
  ]);

  const propertyMap = new Map<string, Row>();
  for (const p of ((propertiesRes.data ?? []) as unknown as Row[])) {
    propertyMap.set(p.id as string, p);
  }

  const borrowerMap = new Map<string, Row>();
  for (const b of ((borrowersRes.data ?? []) as unknown as Row[])) {
    borrowerMap.set(b.crm_contact_id as string, b);
  }

  // Enrich deals with computed fields + resolved UW data
  const deals: UnifiedDeal[] = rawDeals.map((deal) => {
    const days = daysInStage(deal.stage_entered_at);
    const config = stageConfigMap.get(deal.stage);
    const property = deal.property_id ? propertyMap.get(deal.property_id) ?? null : null;
    const borrower = deal.primary_contact_id ? borrowerMap.get(deal.primary_contact_id) ?? null : null;

    return {
      ...deal,
      uw_data: mergeUwData(deal.uw_data, property, borrower),
      days_in_stage: days,
      alert_level: getAlertLevel(days, config),
    };
  });

  const teamMembers = (teamResult.data ?? []).map(
    (t: { id: string; full_name: string | null }) => ({
      id: t.id,
      full_name: t.full_name ?? "Unknown",
    })
  );

  const intakeItems = (intakeResult.data ?? []) as unknown as IntakeItem[];

  return (
    <div className="space-y-6">
      <PipelineHeader intakeCount={intakeItems.length} />
      <PipelineView
        deals={deals}
        cardTypes={cardTypes}
        stageConfigs={stageConfigs}
        activities={activities}
        relationshipDealIds={relationshipDealIds}
        teamMembers={teamMembers}
        intakeItems={intakeItems}
        currentUserId={session.user.id}
      />
    </div>
  );
}
