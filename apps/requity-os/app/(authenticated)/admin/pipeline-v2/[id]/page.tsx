import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { DealDetailPage } from "./DealDetailPage";
import { ensureCommercialUW } from "./commercial-uw-actions";
import {
  daysInStage,
  getAlertLevel,
  type UnifiedDeal,
  type UnifiedCardType,
  type StageConfig,
  type ChecklistItem,
  type DealActivity,
} from "@/components/pipeline-v2/pipeline-types";
import type { OpsTask, Profile } from "@/lib/tasks";

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
    documentsRaw,
    tasksRaw,
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
      .select("id, full_name, avatar_url")
      .eq("role", "admin")
      .order("full_name"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", user.id)
      .single(),
    admin
      .from("unified_deal_documents" as never)
      .select("*")
      .eq("deal_id" as never, id as never)
      .order("created_at" as never, { ascending: false }),
    supabase
      .from("ops_tasks")
      .select("*")
      .eq("linked_entity_id", id)
      .order("created_at", { ascending: false }),
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
  const documents = ((documentsRaw as unknown as { data: Record<string, unknown>[] | null }).data ?? []);
  const tasks = ((tasksRaw as unknown as { data: OpsTask[] | null }).data ?? []);

  // ─── Fetch commercial UW data (for commercial deals) ───
  let commercialUWData: {
    uw: Record<string, unknown>;
    income: Record<string, unknown>[];
    expenses: Record<string, unknown>[];
    rentRoll: Record<string, unknown>[];
    scopeOfWork: Record<string, unknown>[];
    sourcesUses: Record<string, unknown>[];
    debt: Record<string, unknown>[];
    waterfall: Record<string, unknown>[];
    allVersions: Record<string, unknown>[];
  } | null = null;

  const isCommercial = cardType.slug === "comm_debt";
  if (isCommercial) {
    const uwRaw = await admin
      .from("deal_commercial_uw" as never)
      .select("*")
      .eq("opportunity_id" as never, id as never)
      .order("version" as never, { ascending: false })
      .limit(1)
      .maybeSingle();

    const uwRawTyped = uwRaw as unknown as { data: Record<string, unknown> | null; error: { message: string } | null };
    if (uwRawTyped.error) {
      console.error("[CommercialUW] Failed to fetch UW record:", uwRawTyped.error.message);
    }
    let uwRecord = uwRawTyped.data;

    // Auto-initialize UW record for commercial deals that don't have one yet
    if (!uwRecord) {
      const ensureResult = await ensureCommercialUW(id);
      if (ensureResult.error) {
        console.error("[CommercialUW] Failed to auto-init UW:", ensureResult.error);
      }
      const retryRaw = await admin
        .from("deal_commercial_uw" as never)
        .select("*")
        .eq("opportunity_id" as never, id as never)
        .order("version" as never, { ascending: false })
        .limit(1)
        .maybeSingle();
      uwRecord = (retryRaw as unknown as { data: Record<string, unknown> | null }).data;
    }

    if (uwRecord) {
      const uwId = uwRecord.id as string;
      const [incomeRes, expensesRes, rentRollRes, scopeRes, suRes, debtRes, waterfallRes, versionsRes] =
        await Promise.all([
          admin.from("deal_commercial_income" as never).select("*").eq("uw_id" as never, uwId as never).order("sort_order" as never),
          admin.from("deal_commercial_expenses" as never).select("*").eq("uw_id" as never, uwId as never).order("sort_order" as never),
          admin.from("deal_commercial_rent_roll" as never).select("*").eq("uw_id" as never, uwId as never).order("sort_order" as never),
          admin.from("deal_commercial_scope_of_work" as never).select("*").eq("uw_id" as never, uwId as never).order("sort_order" as never),
          admin.from("deal_commercial_sources_uses" as never).select("*").eq("uw_id" as never, uwId as never).order("sort_order" as never),
          admin.from("deal_commercial_debt" as never).select("*").eq("uw_id" as never, uwId as never).order("sort_order" as never),
          admin.from("deal_commercial_waterfall" as never).select("*").eq("uw_id" as never, uwId as never).order("tier_order" as never),
          admin.from("deal_commercial_uw" as never).select("id, version, status, created_at, created_by" as never).eq("opportunity_id" as never, id as never).order("version" as never, { ascending: false }),
        ]);

      commercialUWData = {
        uw: uwRecord,
        income: ((incomeRes as unknown as { data: Record<string, unknown>[] | null }).data ?? []),
        expenses: ((expensesRes as unknown as { data: Record<string, unknown>[] | null }).data ?? []),
        rentRoll: ((rentRollRes as unknown as { data: Record<string, unknown>[] | null }).data ?? []),
        scopeOfWork: ((scopeRes as unknown as { data: Record<string, unknown>[] | null }).data ?? []),
        sourcesUses: ((suRes as unknown as { data: Record<string, unknown>[] | null }).data ?? []),
        debt: ((debtRes as unknown as { data: Record<string, unknown>[] | null }).data ?? []),
        waterfall: ((waterfallRes as unknown as { data: Record<string, unknown>[] | null }).data ?? []),
        allVersions: ((versionsRes as unknown as { data: Record<string, unknown>[] | null }).data ?? []),
      };
    }
  }

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

  const teamMembers: Profile[] = (teamResult.data ?? []).map(
    (t: { id: string; full_name: string | null; avatar_url: string | null }) => ({
      id: t.id,
      full_name: t.full_name ?? "Unknown",
      avatar_url: t.avatar_url ?? null,
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
      documents={documents}
      tasks={tasks}
      commercialUWData={commercialUWData}
    />
  );
}
