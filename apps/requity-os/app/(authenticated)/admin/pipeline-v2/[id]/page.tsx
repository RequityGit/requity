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
  type DealActivity,
  type DealCondition,
} from "@/components/pipeline-v2/pipeline-types";
import type { OpsTask, Profile } from "@/lib/tasks";
import {
  mergeUwData,
  getPropertySelectColumns,
  getBorrowerSelectColumns,
} from "@/lib/pipeline/resolve-uw-data";

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
    activitiesRaw,
    teamResult,
    profileResult,
    conditionsRaw,
    documentsRaw,
    tasksRaw,
    dealTeamMembersRaw,
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
      .from("unified_deal_conditions" as never)
      .select("*")
      .eq("deal_id" as never, id as never)
      .order("sort_order" as never),
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
    admin
      .from("deal_team_members" as never)
      .select("id, deal_id, profile_id, role, created_at" as never)
      .eq("deal_id" as never, id as never)
      .order("created_at" as never),
  ]);

  const cardTypeResult = cardTypeRaw as unknown as {
    data: UnifiedCardType | null;
    error: { message: string } | null;
  };
  if (cardTypeResult.error || !cardTypeResult.data) notFound();

  const cardType = cardTypeResult.data;
  const stageConfigs = ((stageConfigsRaw as unknown as { data: StageConfig[] | null }).data ?? []);
  const activities = ((activitiesRaw as unknown as { data: DealActivity[] | null }).data ?? []);
  const conditions = ((conditionsRaw as unknown as { data: DealCondition[] | null }).data ?? []);
  const documents = ((documentsRaw as unknown as { data: Record<string, unknown>[] | null }).data ?? []);
  const tasks = ((tasksRaw as unknown as { data: OpsTask[] | null }).data ?? []);

  type DealTeamMemberRow = {
    id: string;
    deal_id: string;
    profile_id: string;
    role: string;
    created_at: string;
  };
  const dealTeamMembers: DealTeamMemberRow[] =
    ((dealTeamMembersRaw as unknown as { data: DealTeamMemberRow[] | null }).data ?? []);

  // ─── Fetch CRM activities & emails for primary contact ───
  type CrmActivityRow = {
    id: string;
    activity_type: string;
    subject: string | null;
    description: string | null;
    outcome: string | null;
    direction: string | null;
    call_duration_seconds: number | null;
    performed_by_name: string | null;
    created_at: string;
  };
  type CrmEmailRow = {
    id: string;
    created_at: string;
    from_email: string;
    to_email: string;
    to_name: string | null;
    subject: string;
    body_text: string | null;
    body_html: string | null;
    cc_emails: string[] | null;
    bcc_emails: string[] | null;
    sent_by_name: string | null;
    postmark_status: string | null;
    delivered_at: string | null;
    opened_at: string | null;
    attachments: unknown;
  };

  let crmActivities: CrmActivityRow[] = [];
  let crmEmails: CrmEmailRow[] = [];

  if (deal.primary_contact_id) {
    const [crmActivitiesRaw, crmEmailsRaw] = await Promise.all([
      admin
        .from("crm_activities" as never)
        .select(
          "id, activity_type, subject, description, outcome, direction, call_duration_seconds, performed_by_name, created_at" as never
        )
        .eq("contact_id" as never, deal.primary_contact_id as never)
        .order("created_at" as never, { ascending: false })
        .limit(200),
      admin
        .from("crm_emails" as never)
        .select("*" as never)
        .eq("linked_contact_id" as never, deal.primary_contact_id as never)
        .order("created_at" as never, { ascending: false })
        .limit(100),
    ]);

    crmActivities =
      ((crmActivitiesRaw as unknown as { data: CrmActivityRow[] | null }).data ?? []);
    crmEmails =
      ((crmEmailsRaw as unknown as { data: CrmEmailRow[] | null }).data ?? []);
  }

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

  // Resolve UW data from real tables (properties, borrowers) and merge with JSONB
  type Row = Record<string, unknown>;

  const [propRes, borrowerRes] = await Promise.all([
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
  ]);

  const resolvedUw = mergeUwData(
    deal.uw_data,
    (propRes.data as unknown as Row) ?? null,
    (borrowerRes.data as unknown as Row) ?? null
  );

  // Compute stage metrics
  const days = daysInStage(deal.stage_entered_at);
  const stageConfigMap = new Map(stageConfigs.map((sc) => [sc.stage, sc]));
  const enrichedDeal: UnifiedDeal = {
    ...deal,
    uw_data: resolvedUw,
    days_in_stage: days,
    alert_level: getAlertLevel(days, stageConfigMap.get(deal.stage)),
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
      activities={activities}
      crmActivities={crmActivities.map((a) => ({
        ...a,
        created_by_name: a.performed_by_name,
      }))}
      crmEmails={crmEmails}
      teamMembers={teamMembers}
      currentUserId={user.id}
      currentUserName={currentProfile?.full_name ?? "Unknown"}
      conditions={conditions}
      documents={documents}
      tasks={tasks}
      dealTeamMembers={dealTeamMembers}
      commercialUWData={commercialUWData}
    />
  );
}
