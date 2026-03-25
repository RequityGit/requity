import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { DealDetailPage, type DealContactRow } from "./DealDetailPage";
import {
  daysInStage,
  getAlertLevel,
  type UnifiedDeal,
  type StageConfig,
} from "@/components/pipeline/pipeline-types";
import type { Profile } from "@/lib/tasks";
import {
  mergeUwData,
  getPropertySelectColumns,
  getBorrowerSelectColumns,
} from "@/lib/pipeline/resolve-uw-data";
import { getSessionData } from "@/lib/auth/session-cache";
import { getDealTeamContacts } from "@/app/services/deal-team.server";
import type { DealTeamContact } from "@/app/types/deal-team";
import { getDealApprovalInfo } from "../approval-actions";

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
      `*, primary_contact:crm_contacts!primary_contact_id(id, first_name, last_name, email, phone), company:companies(id, name)`
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

  // Fetch broker contact separately (broker_contact_id may not exist yet pre-migration)
  const brokerContactId = (deal as unknown as Record<string, unknown>).broker_contact_id as string | null;
  if (brokerContactId) {
    try {
      const { data: brokerData } = await admin
        .from("crm_contacts" as never)
        .select("id, first_name, last_name, email, phone" as never)
        .eq("id" as never, brokerContactId as never)
        .single();
      if (brokerData) {
        (deal as unknown as Record<string, unknown>).broker_contact = brokerData;
      }
    } catch {
      // Column may not exist yet - graceful fallback
    }
  }

  // Step 2: Parallel batch -- only shell data needed for header + first paint
  // Conditions, documents, commercial UW, and notes are fetched client-side by their tabs
  const [
    stageConfigsRaw,
    teamResult,
    dealTeamMembersRaw,
    dealTeamContactsRaw,
    dealContactsRaw,
    propRes,
    borrowerRes,
  ] = await Promise.all([
    admin
      .from("unified_stage_configs" as never)
      .select("id, stage, warn_days, alert_days, description, sort_order")
      .order("sort_order" as never),
    admin
      .from("profiles" as never)
      .select("id, full_name, avatar_url, email" as never)
      .eq("role" as never, "admin" as never)
      .order("full_name" as never),
    admin
      .from("deal_team_members" as never)
      .select("id, deal_id, profile_id, role, created_at" as never)
      .eq("deal_id" as never, dealId as never)
      .order("created_at" as never),
    getDealTeamContacts(admin, dealId).catch(() => [] as DealTeamContact[]),
    admin
      .from("deal_contacts" as never)
      .select("id, deal_id, contact_id, role, is_guarantor, sort_order, contact:crm_contacts(id, first_name, last_name, email, phone, company_name)" as never)
      .eq("deal_id" as never, dealId as never)
      .order("sort_order" as never),
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

  const stageConfigs = ((stageConfigsRaw as unknown as { data: StageConfig[] | null }).data ?? []);
  const dealTeamMembers: DealTeamMemberRow[] =
    ((dealTeamMembersRaw as unknown as { data: DealTeamMemberRow[] | null }).data ?? []);
  const dealTeamContacts: DealTeamContact[] = Array.isArray(dealTeamContactsRaw)
    ? dealTeamContactsRaw
    : [];
  const dealContacts = ((dealContactsRaw as unknown as { data: DealContactRow[] | null }).data ?? []);

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

  const teamMembers: Profile[] = ((teamResult as unknown as { data: { id: string; full_name: string | null; avatar_url: string | null; email: string | null }[] | null }).data ?? []).map(
    (t) => ({
      id: t.id,
      full_name: t.full_name ?? "Unknown",
      avatar_url: t.avatar_url ?? null,
      email: t.email ?? null,
    })
  );

  const currentUserName = (session.profile as { full_name?: string | null }).full_name ?? "Unknown";

  // Fetch approval info for the banner (only for analysis stage)
  const approvalInfo = enrichedDeal.stage === "analysis" && enrichedDeal.approval_status
    ? await getDealApprovalInfo(dealId)
    : null;

  return (
    <DealDetailPage
      deal={enrichedDeal}
      stageConfigs={stageConfigs}
      teamMembers={teamMembers}
      currentUserId={session.user.id}
      currentUserName={currentUserName}
      dealTeamMembers={dealTeamMembers}
      dealTeamContacts={dealTeamContacts}
      dealContacts={dealContacts}
      isSuperAdmin={session.isSuperAdmin}
      approvalInfo={approvalInfo}
    />
  );
}
