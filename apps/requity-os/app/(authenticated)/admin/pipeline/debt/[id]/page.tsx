import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { DealDetail } from "./DealDetail";
import type {
  DealData,
  StageHistoryEntry,
  ConditionData,
  DocumentData,
  ActivityData,
  PipelineStage,
  UWVersion,
} from "./components";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function DealDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;

  // ─── Fetch pipeline stages from config ───
  let pipelineStages: PipelineStage[] = [];
  try {
    const { data: stages } = await supabase
      .from("pipeline_stage_config")
      .select("id, stage_key, label, color, sort_order, is_terminal, sla_days")
      .eq("pipeline_type", "debt")
      .order("sort_order");
    pipelineStages = (stages ?? []) as PipelineStage[];
  } catch {
    // table may not exist, fallback handled in client
  }

  // ─── Fetch primary deal record ───
  let isOpportunity = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dealRaw: any = null;

  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .select("*")
    .eq("id", id)
    .single();

  if (loanError && loanError.code !== "PGRST116") {
    console.error("Loan query error:", loanError.message);
  }

  if (loan) {
    dealRaw = loan;
  } else {
    // Fallback to opportunities
    const admin = createAdminClient();
    const { data: opp } = await admin
      .from("opportunities")
      .select("*")
      .eq("id", id)
      .single();

    if (!opp) notFound();

    isOpportunity = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let propertyData: any = null;
    if (opp.property_id) {
      const { data: prop } = await admin
        .from("properties")
        .select("*")
        .eq("id", opp.property_id)
        .single();
      propertyData = prop;
    }

    let oppBorrowerName: string | null = null;
    const { data: oppBorrowers } = await admin
      .from("opportunity_borrowers")
      .select("borrower_id, role")
      .eq("opportunity_id", id)
      .order("sort_order");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const primaryBorrower = (oppBorrowers ?? []).find((b: any) => b.role === "primary") ?? (oppBorrowers ?? [])[0];
    if (primaryBorrower) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: bRow } = await (admin as any)
        .from("borrowers")
        .select("first_name, last_name, crm_contact_id")
        .eq("id", primaryBorrower.borrower_id)
        .maybeSingle();
      if (bRow?.crm_contact_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: contact } = await (admin as any)
          .from("crm_contacts")
          .select("first_name, last_name")
          .eq("id", bRow.crm_contact_id)
          .maybeSingle();
        if (contact) {
          oppBorrowerName =
            `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim() || null;
        }
      }
      if (!oppBorrowerName && bRow) {
        oppBorrowerName =
          `${bRow.first_name ?? ""} ${bRow.last_name ?? ""}`.trim() || null;
      }
    }

    const OPPORTUNITY_TO_STAGE: Record<string, string> = {
      awaiting_info: "awaiting_info",
      quoting: "quoting",
      uw: "uw",
      uw_approval: "uw_approval",
      offer_placed: "offer_placed",
      processing: "processing",
      closed: "closed",
      onboarding: "servicing",
      closed_lost: "withdrawn",
    };

    dealRaw = {
      id: opp.id,
      opportunity_id: opp.id,
      loan_number: null,
      deal_name: opp.deal_name,
      stage: OPPORTUNITY_TO_STAGE[opp.stage] ?? opp.stage,
      stage_updated_at: opp.stage_changed_at ?? opp.updated_at,
      priority: null,
      approval_status: opp.approval_status ?? null,
      type: opp.loan_type ?? null,
      purpose: opp.loan_purpose ?? null,
      property_type: propertyData?.property_type ?? null,
      property_address: propertyData
        ? [propertyData.address_line1, propertyData.city, propertyData.state]
            .filter(Boolean)
            .join(", ")
        : null,
      property_address_line1: propertyData?.address_line1 ?? null,
      property_city: propertyData?.city ?? null,
      property_state: propertyData?.state ?? null,
      property_zip: propertyData?.zip ?? null,
      property_units: propertyData?.number_of_units ?? null,
      loan_amount: opp.proposed_loan_amount ?? null,
      interest_rate: opp.proposed_interest_rate ?? null,
      ltv: opp.proposed_ltv ?? null,
      loan_term_months: opp.proposed_loan_term_months ?? null,
      originator_id: opp.originator ?? null,
      processor_id: opp.processor ?? null,
      underwriter_id: opp.assigned_underwriter ?? null,
      closer_id: null,
      borrower_id: primaryBorrower?.borrower_id ?? null,
      borrower_entity_id: opp.borrower_entity_id ?? null,
      notes: opp.internal_notes ?? null,
      internal_notes: null,
      investment_strategy: opp.investment_strategy ?? null,
      funding_channel: opp.funding_channel ?? null,
      created_at: opp.created_at,
      updated_at: opp.updated_at,
      _borrower_name: oppBorrowerName,
    };
  }

  if (!dealRaw) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = dealRaw as any;

  // ─── Fetch borrower data ───
  if (!isOpportunity && d.borrower_id && !d._borrower_name) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bRow } = await (supabase as any)
      .from("borrowers")
      .select("crm_contact_id, first_name, last_name, credit_score, experience_count, verified_liquidity")
      .eq("id", d.borrower_id)
      .maybeSingle();
    if (bRow) {
      d._borrower_credit_score = bRow.credit_score ?? null;
      d._borrower_experience = bRow.experience_count ?? null;
      d._borrower_liquidity = bRow.verified_liquidity ?? null;
      if (bRow.crm_contact_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: contact } = await (supabase as any)
          .from("crm_contacts")
          .select("first_name, last_name")
          .eq("id", bRow.crm_contact_id)
          .maybeSingle();
        if (contact) {
          d._borrower_name =
            `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim() || null;
        }
      }
      if (!d._borrower_name) {
        d._borrower_name =
          `${bRow.first_name ?? ""} ${bRow.last_name ?? ""}`.trim() || null;
      }
    }
  }

  // ─── Fetch entity ───
  if (d.borrower_entity_id) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: entity } = await (supabase as any)
        .from("borrower_entities")
        .select("name, entity_name, entity_type")
        .eq("id", d.borrower_entity_id)
        .maybeSingle();
      d._entity_name = entity?.entity_name ?? entity?.name ?? null;
      d._entity_type = entity?.entity_type ?? null;
    } catch {
      /* ok */
    }
  }

  // ─── Fetch team profiles ───
  const teamIds = [
    d.originator_id,
    d.processor_id,
    d.underwriter_id,
    d.closer_id,
  ].filter((tid): tid is string => Boolean(tid));

  const teamProfiles: Record<string, { full_name: string; initials: string }> = {};
  if (teamIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", teamIds);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profiles ?? []).forEach((p: any) => {
      const name = p.full_name ?? "Unknown";
      teamProfiles[p.id] = { full_name: name, initials: getInitials(name) };
    });
  }

  d._originator = d.originator_id ? teamProfiles[d.originator_id] ?? null : null;
  d._processor = d.processor_id ? teamProfiles[d.processor_id] ?? null : null;
  d._underwriter = d.underwriter_id ? teamProfiles[d.underwriter_id] ?? null : null;
  d._closer = d.closer_id ? teamProfiles[d.closer_id] ?? null : null;

  // ─── Fetch current user profile ───
  let currentUserInitials = "??";
  let currentUserName = "Unknown";
  const currentUserId = user.id;
  {
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    if (myProfile?.full_name) {
      currentUserInitials = getInitials(myProfile.full_name);
      currentUserName = myProfile.full_name;
    }
  }

  // ─── Fetch related data in parallel ───
  const loanId = isOpportunity ? null : d.id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let stageHistoryData: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let conditionsData: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let documentsData: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let activityData: any[] = [];
  let uwVersionsData: UWVersion[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dealTasksData: any[] = [];

  if (loanId) {
    const fetchSafe = async <T,>(
      fn: () => PromiseLike<{ data: T | null }>
    ): Promise<T | null> => {
      try {
        const result = await fn();
        return result.data;
      } catch {
        return null;
      }
    };

    const [
      stageHistoryRaw,
      conditionsRaw,
      documentsRaw,
      activityRaw,
      uwVersionsRaw,
      dealTasksRaw,
    ] = await Promise.all([
      fetchSafe(() =>
        supabase
          .from("loan_stage_history")
          .select("*")
          .eq("loan_id", loanId)
          .order("changed_at", { ascending: true })
      ),
      fetchSafe(() =>
        supabase
          .from("loan_conditions")
          .select("*")
          .eq("loan_id", loanId)
          .order("sort_order")
      ),
      fetchSafe(() =>
        supabase
          .from("documents")
          .select("*")
          .eq("loan_id", loanId)
          .order("created_at", { ascending: false })
      ),
      fetchSafe(() =>
        supabase
          .from("loan_activity_log")
          .select("*")
          .eq("loan_id", loanId)
          .order("created_at", { ascending: false })
          .limit(50)
      ),
      fetchSafe(() =>
        supabase
          .from("loan_underwriting_versions")
          .select("*")
          .eq("loan_id", loanId)
          .order("version_number", { ascending: false })
      ),
      fetchSafe(() =>
        supabase
          .from("ops_tasks")
          .select("*")
          .eq("linked_entity_type", "loan")
          .eq("linked_entity_id", loanId)
          .order("sort_order")
      ),
    ]);

    stageHistoryData = stageHistoryRaw ?? [];
    conditionsData = conditionsRaw ?? [];
    documentsData = documentsRaw ?? [];
    activityData = activityRaw ?? [];
    dealTasksData = (dealTasksRaw ?? []) as any[];

    // Map UW versions with author names
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uwRaw = (uwVersionsRaw ?? []) as any[];
    const uwAuthorIds = Array.from(new Set(uwRaw.map((v) => v.created_by).filter(Boolean)));
    const uwAuthorMap: Record<string, string> = {};
    if (uwAuthorIds.length > 0) {
      const { data: uwProfiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", uwAuthorIds);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (uwProfiles ?? []).forEach((p: any) => {
        uwAuthorMap[p.id] = p.full_name ?? "Unknown";
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    uwVersionsData = uwRaw.map((v: any) => ({
      id: v.id,
      loan_id: v.loan_id,
      version_number: v.version_number,
      is_active: v.is_active ?? false,
      created_by: v.created_by,
      label: v.label ?? null,
      notes: v.notes ?? null,
      model_type: v.model_type || "rtl",
      calculator_inputs: v.calculator_inputs ?? {},
      calculator_outputs: v.calculator_outputs ?? {},
      status: v.status ?? "draft",
      created_at: v.created_at,
      _author_name: v.created_by ? uwAuthorMap[v.created_by] ?? null : null,
    }));

  }

  // ─── Fetch commercial UW data (for commercial opportunities) ───
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let commercialUWData: any = null;
  const isCommercial = (d.type === "commercial" || d.loan_type === "commercial");
  if (isCommercial) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    const { data: uwRecord } = await admin
      .from("deal_commercial_uw")
      .select("*")
      .eq("opportunity_id", d.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (uwRecord) {
      const [incomeRes, expensesRes, rentRollRes, scopeRes, suRes, debtRes, waterfallRes] =
        await Promise.all([
          admin.from("deal_commercial_income").select("*").eq("uw_id", uwRecord.id).order("sort_order"),
          admin.from("deal_commercial_expenses").select("*").eq("uw_id", uwRecord.id).order("sort_order"),
          admin.from("deal_commercial_rent_roll").select("*").eq("uw_id", uwRecord.id).order("sort_order"),
          admin.from("deal_commercial_scope_of_work").select("*").eq("uw_id", uwRecord.id).order("sort_order"),
          admin.from("deal_commercial_sources_uses").select("*").eq("uw_id", uwRecord.id).order("sort_order"),
          admin.from("deal_commercial_debt").select("*").eq("uw_id", uwRecord.id).order("sort_order"),
          admin.from("deal_commercial_waterfall").select("*").eq("uw_id", uwRecord.id).order("tier_order"),
        ]);

      // Also fetch all versions for version selector
      const { data: allVersions } = await admin
        .from("deal_commercial_uw")
        .select("id, version, status, created_at, created_by")
        .eq("opportunity_id", d.id)
        .order("version", { ascending: false });

      commercialUWData = {
        uw: uwRecord,
        income: incomeRes.data ?? [],
        expenses: expensesRes.data ?? [],
        rentRoll: rentRollRes.data ?? [],
        scopeOfWork: scopeRes.data ?? [],
        sourcesUses: suRes.data ?? [],
        debt: debtRes.data ?? [],
        waterfall: waterfallRes.data ?? [],
        allVersions: allVersions ?? [],
      };
    }
  }

  // ─── Resolve names ───
  const userIdsSet = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conditionsData.forEach((c: any) => {
    if (c.assigned_to) userIdsSet.add(c.assigned_to);
    if (c.cleared_by) userIdsSet.add(c.cleared_by);
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activityData.forEach((a: any) => {
    if (a.performed_by) userIdsSet.add(a.performed_by);
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documentsData.forEach((doc: any) => {
    if (doc.uploaded_by) userIdsSet.add(doc.uploaded_by);
  });

  const allUserIds = Array.from(userIdsSet);
  const nameMap: Record<string, string> = {};

  if (allUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", allUserIds);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profiles ?? []).forEach((p: any) => {
      nameMap[p.id] = p.full_name ?? "Unknown";
    });
  }

  const condDocCounts: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documentsData.forEach((doc: any) => {
    if (doc.condition_id) {
      condDocCounts[doc.condition_id] = (condDocCounts[doc.condition_id] || 0) + 1;
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conditions: ConditionData[] = conditionsData.map((c: any) => ({
    id: c.id, loan_id: c.loan_id,
    name: c.name ?? c.condition_name ?? "Unnamed",
    category: c.category ?? null, status: c.status ?? "pending",
    assigned_to: c.assigned_to ?? null, due_date: c.due_date ?? null,
    critical_path: c.critical_path ?? false, notes: c.notes ?? null,
    template_id: c.template_id ?? null, cleared_at: c.cleared_at ?? null,
    cleared_by: c.cleared_by ?? null, created_at: c.created_at ?? null,
    updated_at: c.updated_at ?? null, _doc_count: condDocCounts[c.id] || 0,
    _assigned_name: c.assigned_to ? nameMap[c.assigned_to] ?? null : null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const documents: DocumentData[] = documentsData.map((doc: any) => ({
    id: doc.id, loan_id: doc.loan_id, condition_id: doc.condition_id ?? null,
    name: doc.name ?? doc.file_name ?? null, file_name: doc.file_name ?? null,
    file_url: doc.file_url ?? doc.url ?? null, file_type: doc.file_type ?? null,
    file_size: doc.file_size ?? null, document_type: doc.document_type ?? doc.type ?? null,
    uploaded_by: doc.uploaded_by ?? null,
    _uploaded_by_name: doc.uploaded_by ? nameMap[doc.uploaded_by] ?? null : null,
    created_at: doc.created_at ?? null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activity: ActivityData[] = activityData.map((a: any) => ({
    id: a.id, loan_id: a.loan_id, action: a.action ?? null,
    description: a.description ?? null, performed_by: a.performed_by ?? null,
    _actor_name: a.performed_by ? nameMap[a.performed_by] ?? null : null,
    metadata: a.metadata ?? null, created_at: a.created_at ?? null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stageHistory: StageHistoryEntry[] = stageHistoryData.map((h: any) => ({
    id: h.id, loan_id: h.loan_id, from_stage: h.from_stage ?? null,
    to_stage: h.to_stage ?? null, changed_at: h.changed_at ?? null,
    changed_by: h.changed_by ?? null,
    duration_in_previous_stage: h.duration_in_previous_stage ?? null, notes: h.notes ?? null,
  }));

  // ─── Fetch admin/team profiles for team assignment ───
  let adminProfiles: { id: string; full_name: string }[] = [];
  try {
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");
    adminProfiles = (allProfiles ?? []).map((p: { id: string; full_name: string | null }) => ({
      id: p.id,
      full_name: p.full_name ?? "Unknown",
    }));
  } catch {
    /* ok */
  }

  const deal: DealData = {
    ...d,
    _borrower_name: d._borrower_name ?? null,
    _entity_name: d._entity_name ?? null,
    _entity_type: d._entity_type ?? null,
    _borrower_credit_score: d._borrower_credit_score ?? null,
    _borrower_experience: d._borrower_experience ?? null,
    _borrower_liquidity: d._borrower_liquidity ?? null,
    _property_year_built: d._property_year_built ?? null,
    _property_sqft: d._property_sqft ?? null,
    _originator: d._originator ?? null,
    _processor: d._processor ?? null,
    _underwriter: d._underwriter ?? null,
    _closer: d._closer ?? null,
  };

  return (
    <DealDetail
      deal={deal}
      stageHistory={stageHistory}
      pipelineStages={pipelineStages}
      uwVersions={uwVersionsData}
      conditions={conditions}
      documents={documents}
      activity={activity}
      dealTasks={dealTasksData}
      isOpportunity={isOpportunity}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      currentUserInitials={currentUserInitials}
      adminProfiles={adminProfiles}
      commercialUW={commercialUWData}
    />
  );
}
