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
  type DealCondition,
} from "@/components/pipeline/pipeline-types";
import type { OpsTask, Profile } from "@/lib/tasks";
import {
  mergeUwData,
  getPropertySelectColumns,
  getBorrowerSelectColumns,
} from "@/lib/pipeline/resolve-uw-data";
import { getSessionData } from "@/lib/auth/session-cache";
import { isCommercialDeal } from "@/lib/visibility-engine";
import { getDealTeamContacts } from "@/app/services/deal-team.server";
import { getPinnedNote, getMostRecentNote } from "@/app/services/deal-notes.server";
import type { DealTeamContact } from "@/app/types/deal-team";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DealTeamMemberRow = {
  id: string;
  deal_id: string;
  profile_id: string;
  role: string;
  created_at: string;
};

type Row = Record<string, unknown>;

export default async function DealDetailRoute({ params }: PageProps) {
  const { id } = await params;

  const session = await getSessionData();
  if (!session) redirect("/login");

  const admin = createAdminClient();

  const isUUID = UUID_RE.test(id);
  const lookupColumn = isUUID ? "id" : "deal_number";

  // Step 1: Fetch deal (required before everything else)
  const dealRaw = await admin
    .from("unified_deals" as never)
    .select(
      `*, primary_contact:crm_contacts(id, first_name, last_name), company:companies(id, name)`
    )
    .eq(lookupColumn as never, id as never)
    .single();

  const dealResult = dealRaw as unknown as {
    data: UnifiedDeal | null;
    error: { message: string } | null;
  };

  if (dealResult.error || !dealResult.data) notFound();
  const deal = dealResult.data;
  const dealId = deal.id;

  // Step 2: Single parallel batch -- all queries that depend only on deal fields
  const [
    cardTypeRaw,
    stageConfigsRaw,
    teamResult,
    conditionsRaw,
    documentsRaw,
    tasksRaw,
    dealTeamMembersRaw,
    dealTeamContactsRaw,
    commercialUwRaw,
    propRes,
    borrowerRes,
    pinnedNote,
    recentNote,
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
      .from("profiles" as never)
      .select("id, full_name, avatar_url" as never)
      .eq("role" as never, "admin" as never)
      .order("full_name" as never),
    admin
      .from("unified_deal_conditions" as never)
      .select("*, loan_condition_templates:template_id(internal_description, borrower_description)" as never)
      .eq("deal_id" as never, dealId as never)
      .order("sort_order" as never),
    admin
      .from("unified_deal_documents" as never)
      .select("*")
      .eq("deal_id" as never, dealId as never)
      .order("created_at" as never, { ascending: false }),
    admin
      .from("ops_tasks" as never)
      .select("*" as never)
      .eq("linked_entity_id" as never, dealId as never)
      .order("created_at" as never, { ascending: false }),
    admin
      .from("deal_team_members" as never)
      .select("id, deal_id, profile_id, role, created_at" as never)
      .eq("deal_id" as never, dealId as never)
      .order("created_at" as never),
    getDealTeamContacts(admin, dealId),
    admin
      .from("deal_commercial_uw" as never)
      .select("*")
      .eq("opportunity_id" as never, dealId as never)
      .order("version" as never, { ascending: false })
      .limit(1)
      .maybeSingle(),
    deal.property_id
      ? admin
          .from("properties" as never)
          .select(getPropertySelectColumns() as never)
          .eq("id" as never, deal.property_id as never)
          .single()
      : Promise.resolve({ data: null }),
    deal.primary_contact_id
      ? admin
          .from("borrowers" as never)
          .select(getBorrowerSelectColumns() as never)
          .eq("crm_contact_id" as never, deal.primary_contact_id as never)
          .limit(1)
          .single()
      : Promise.resolve({ data: null }),
    getPinnedNote(admin, dealId),
    getMostRecentNote(admin, dealId),
  ]);

  const cardTypeResult = cardTypeRaw as unknown as {
    data: UnifiedCardType | null;
    error: { message: string } | null;
  };
  if (cardTypeResult.error || !cardTypeResult.data) notFound();

  const cardType = cardTypeResult.data;
  const stageConfigs = ((stageConfigsRaw as unknown as { data: StageConfig[] | null }).data ?? []);
  const conditionsWithJoin = ((conditionsRaw as unknown as { data: (DealCondition & { loan_condition_templates?: { internal_description: string | null; borrower_description: string | null } | null })[] | null }).data ?? []);
  const conditions: DealCondition[] = conditionsWithJoin.map((c) => {
    const template = c.loan_condition_templates;
    return {
      ...c,
      template_guidance: template?.internal_description ?? null,
      template_borrower_description: template?.borrower_description ?? null,
      loan_condition_templates: undefined,
    };
  }) as unknown as DealCondition[];
  const documents = ((documentsRaw as unknown as { data: Record<string, unknown>[] | null }).data ?? []);
  const tasks = ((tasksRaw as unknown as { data: OpsTask[] | null }).data ?? []);
  const dealTeamMembers: DealTeamMemberRow[] =
    ((dealTeamMembersRaw as unknown as { data: DealTeamMemberRow[] | null }).data ?? []);
  const dealTeamContacts: DealTeamContact[] = Array.isArray(dealTeamContactsRaw)
    ? dealTeamContactsRaw
    : [];

  // Step 3: Commercial UW sub-tables (only if commercial deal)
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

  const isCommercial = isCommercialDeal(deal);
  if (isCommercial) {
    const uwRawTyped = commercialUwRaw as unknown as {
      data: Record<string, unknown> | null;
      error: { message: string } | null;
    };
    if (uwRawTyped.error) {
      console.error("[CommercialUW] Failed to fetch UW record:", uwRawTyped.error.message);
    }
    let uwRecord = uwRawTyped.data;

    if (!uwRecord) {
      const ensureResult = await ensureCommercialUW(dealId);
      if (ensureResult.error) {
        console.error("[CommercialUW] Failed to auto-init UW:", ensureResult.error);
      }
      const retryRaw = await admin
        .from("deal_commercial_uw" as never)
        .select("*")
        .eq("opportunity_id" as never, dealId as never)
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
          admin.from("deal_commercial_uw" as never).select("id, version, status, created_at, created_by" as never).eq("opportunity_id" as never, dealId as never).order("version" as never, { ascending: false }),
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

  const resolvedUw = mergeUwData(
    deal.uw_data,
    (propRes.data as unknown as Row) ?? null,
    (borrowerRes.data as unknown as Row) ?? null
  );

  const days = daysInStage(deal.stage_entered_at);
  const stageConfigMap = new Map(stageConfigs.map((sc) => [sc.stage, sc]));
  const enrichedDeal: UnifiedDeal = {
    ...deal,
    uw_data: resolvedUw,
    days_in_stage: days,
    alert_level: getAlertLevel(days, stageConfigMap.get(deal.stage)),
  };

  const teamMembers: Profile[] = ((teamResult as unknown as { data: { id: string; full_name: string | null; avatar_url: string | null }[] | null }).data ?? []).map(
    (t) => ({
      id: t.id,
      full_name: t.full_name ?? "Unknown",
      avatar_url: t.avatar_url ?? null,
    })
  );

  const currentUserName = (session.profile as { full_name?: string | null }).full_name ?? "Unknown";

  return (
    <DealDetailPage
      deal={enrichedDeal}
      cardType={cardType}
      stageConfigs={stageConfigs}
      teamMembers={teamMembers}
      currentUserId={session.user.id}
      currentUserName={currentUserName}
      conditions={conditions}
      documents={documents}
      tasks={tasks}
      dealTeamMembers={dealTeamMembers}
      dealTeamContacts={dealTeamContacts}
      commercialUWData={commercialUWData}
      pinnedNote={pinnedNote ?? null}
      recentNote={recentNote ?? null}
      isSuperAdmin={session.isSuperAdmin}
    />
  );
}
