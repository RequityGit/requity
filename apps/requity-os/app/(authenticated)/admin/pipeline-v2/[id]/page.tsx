import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { DealDetailPage } from "./DealDetailPage";
import {
  daysInStage,
  getAlertLevel,
  type UnifiedDeal,
  type UnifiedCardType,
  type StageConfig,
  type ChecklistItem,
  type DealActivity,
} from "@/components/pipeline-v2/pipeline-types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DealDetailRoute({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch deal
  const dealRaw = await admin
    .from("unified_deals" as never)
    .select(
      `*, primary_contact:crm_contacts(id, first_name, last_name), company:companies(id, name)`
    )
    .eq("id" as never, id as never)
    .single();

  const dealResult = dealRaw as unknown as {
    data: UnifiedDeal | null;
    error: { message: string } | null;
  };

  if (dealResult.error || !dealResult.data) notFound();
  const deal = dealResult.data;

  // Fetch remaining data in parallel
  const [
    cardTypeRaw,
    stageConfigsRaw,
    checklistRaw,
    activitiesRaw,
    teamResult,
    profileResult,
  ] = await Promise.all([
    admin
      .from("unified_card_types" as never)
      .select("*")
      .eq("id" as never, deal.card_type_id as never)
      .single(),
    admin
      .from("unified_stage_configs" as never)
      .select("*")
      .order("sort_order" as never),
    admin
      .from("unified_deal_checklist" as never)
      .select("*")
      .eq("deal_id" as never, id as never)
      .order("sort_order" as never),
    admin
      .from("unified_deal_activity" as never)
      .select("*")
      .eq("deal_id" as never, id as never)
      .order("created_at" as never, { ascending: false })
      .limit(200),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "admin")
      .order("full_name"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", user.id)
      .single(),
  ]);

  const cardTypeResult = cardTypeRaw as unknown as {
    data: UnifiedCardType | null;
    error: { message: string } | null;
  };
  if (cardTypeResult.error || !cardTypeResult.data) notFound();

  const cardType = cardTypeResult.data;
  const stageConfigs = ((stageConfigsRaw as unknown as { data: StageConfig[] | null }).data ?? []);
  const checklistItems = ((checklistRaw as unknown as { data: ChecklistItem[] | null }).data ?? []);
  const activities = ((activitiesRaw as unknown as { data: DealActivity[] | null }).data ?? []);

  // Compute stage metrics
  const days = daysInStage(deal.stage_entered_at);
  const stageConfigMap = new Map(stageConfigs.map((sc) => [sc.stage, sc]));
  const enrichedDeal: UnifiedDeal = {
    ...deal,
    days_in_stage: days,
    alert_level: getAlertLevel(days, stageConfigMap.get(deal.stage)),
    checklist_total: checklistItems.length,
    checklist_completed: checklistItems.filter((c) => c.completed).length,
  };

  const teamMembers = (teamResult.data ?? []).map(
    (t: { id: string; full_name: string | null }) => ({
      id: t.id,
      full_name: t.full_name ?? "Unknown",
    })
  );

  const currentProfile = profileResult.data as {
    id: string;
    full_name: string | null;
  } | null;

  return (
    <DealDetailPage
      deal={enrichedDeal}
      cardType={cardType}
      stageConfigs={stageConfigs}
      checklist={checklistItems}
      activities={activities}
      teamMembers={teamMembers}
      currentUserId={user.id}
      currentUserName={currentProfile?.full_name ?? "Unknown"}
    />
  );
}
