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
  CommentData,
  ChatMessage,
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

  // ─── Fetch primary deal record ───
  // Try loans first, fallback to opportunities
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

    // Fetch property data for opportunity
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

    // Fetch primary borrower
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

    // Map opportunity -> deal format
    const OPPORTUNITY_TO_STAGE: Record<string, string> = {
      awaiting_info: "lead",
      quoting: "lead",
      uw: "underwriting",
      offer_placed: "approved",
      processing: "processing",
      closed: "funded",
      onboarding: "servicing",
      closed_lost: "withdrawn",
    };

    dealRaw = {
      id: opp.id,
      opportunity_id: opp.id,
      loan_number: null,
      deal_name: opp.deal_name,
      stage: OPPORTUNITY_TO_STAGE[opp.stage] ?? opp.stage,
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
      deal_financing: opp.deal_financing ?? null,
      funding_channel: opp.funding_channel ?? null,
      created_at: opp.created_at,
      updated_at: opp.updated_at,
      _borrower_name: oppBorrowerName,
    };
  }

  if (!dealRaw) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = dealRaw as any;

  // ─── Fetch borrower name for loans ───
  if (!isOpportunity && d.borrower_id && !d._borrower_name) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bRow } = await (supabase as any)
      .from("borrowers")
      .select("crm_contact_id, first_name, last_name")
      .eq("id", d.borrower_id)
      .maybeSingle();
    if (bRow?.crm_contact_id) {
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
    if (!d._borrower_name && bRow) {
      d._borrower_name =
        `${bRow.first_name ?? ""} ${bRow.last_name ?? ""}`.trim() || null;
    }
  }

  // ─── Fetch entity name ───
  if (d.borrower_entity_id) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: entity } = await (supabase as any)
        .from("borrower_entities")
        .select("name")
        .eq("id", d.borrower_entity_id)
        .maybeSingle();
      d._entity_name = entity?.name ?? null;
    } catch {
      /* table may not exist */
    }
  }

  // ─── Fetch team profiles ───
  const teamIds = [
    d.originator_id,
    d.processor_id,
    d.underwriter_id,
    d.closer_id,
  ].filter((tid): tid is string => Boolean(tid));

  const teamProfiles: Record<string, { full_name: string; initials: string }> =
    {};
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
  {
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    if (myProfile?.full_name) {
      currentUserInitials = getInitials(myProfile.full_name);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let commentsData: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let chatMessagesData: any[] = [];

  if (loanId) {
    // Parallel fetch for loan-related data
    // Use try/catch per query since Supabase PromiseLike doesn't support .catch()
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
      commentsRaw,
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
          .from("loan_comments")
          .select("*")
          .eq("loan_id", loanId)
          .order("created_at", { ascending: false })
      ),
    ]);

    stageHistoryData = stageHistoryRaw ?? [];
    conditionsData = conditionsRaw ?? [];
    documentsData = documentsRaw ?? [];
    activityData = activityRaw ?? [];
    commentsData = commentsRaw ?? [];

    // Fetch chat messages
    try {
      const { data: msgs } = await supabase
        .from("deal_chat_messages")
        .select("*")
        .eq("loan_id", loanId)
        .order("created_at", { ascending: true });
      chatMessagesData = msgs ?? [];
    } catch {
      /* table may not exist */
    }
  }

  // ─── Resolve names for conditions, activity, comments, chat ───
  // Collect all user IDs referenced
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
  commentsData.forEach((c: any) => {
    if (c.author_id) userIdsSet.add(c.author_id);
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chatMessagesData.forEach((m: any) => {
    if (m.sent_by) userIdsSet.add(m.sent_by);
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

  // Count documents per condition
  const condDocCounts: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documentsData.forEach((doc: any) => {
    if (doc.condition_id) {
      condDocCounts[doc.condition_id] =
        (condDocCounts[doc.condition_id] || 0) + 1;
    }
  });

  // ─── Map data to typed structures ───
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conditions: ConditionData[] = conditionsData.map((c: any) => ({
    id: c.id,
    loan_id: c.loan_id,
    name: c.name ?? c.condition_name ?? "Unnamed",
    category: c.category ?? null,
    status: c.status ?? "pending",
    assigned_to: c.assigned_to ?? null,
    due_date: c.due_date ?? null,
    critical_path: c.critical_path ?? false,
    notes: c.notes ?? null,
    template_id: c.template_id ?? null,
    cleared_at: c.cleared_at ?? null,
    cleared_by: c.cleared_by ?? null,
    created_at: c.created_at ?? null,
    updated_at: c.updated_at ?? null,
    _doc_count: condDocCounts[c.id] || 0,
    _assigned_name: c.assigned_to ? nameMap[c.assigned_to] ?? null : null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const documents: DocumentData[] = documentsData.map((doc: any) => ({
    id: doc.id,
    loan_id: doc.loan_id,
    condition_id: doc.condition_id ?? null,
    name: doc.name ?? doc.file_name ?? null,
    file_name: doc.file_name ?? null,
    file_url: doc.file_url ?? doc.url ?? null,
    file_type: doc.file_type ?? null,
    file_size: doc.file_size ?? null,
    document_type: doc.document_type ?? doc.type ?? null,
    uploaded_by: doc.uploaded_by ?? null,
    _uploaded_by_name: doc.uploaded_by
      ? nameMap[doc.uploaded_by] ?? null
      : null,
    created_at: doc.created_at ?? null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activity: ActivityData[] = activityData.map((a: any) => ({
    id: a.id,
    loan_id: a.loan_id,
    action: a.action ?? null,
    description: a.description ?? null,
    performed_by: a.performed_by ?? null,
    _actor_name: a.performed_by ? nameMap[a.performed_by] ?? null : null,
    metadata: a.metadata ?? null,
    created_at: a.created_at ?? null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const comments: CommentData[] = commentsData.map((c: any) => ({
    id: c.id,
    loan_id: c.loan_id,
    author_id: c.author_id,
    author_name: c.author_name ?? (c.author_id ? nameMap[c.author_id] ?? null : null),
    comment: c.comment ?? c.body ?? "",
    is_internal: c.is_internal ?? false,
    is_edited: c.is_edited ?? false,
    parent_comment_id: c.parent_comment_id ?? null,
    mentions: c.mentions ?? [],
    created_at: c.created_at ?? null,
    updated_at: c.updated_at ?? null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stageHistory: StageHistoryEntry[] = stageHistoryData.map((h: any) => ({
    id: h.id,
    loan_id: h.loan_id,
    from_stage: h.from_stage ?? null,
    to_stage: h.to_stage ?? null,
    changed_at: h.changed_at ?? null,
    changed_by: h.changed_by ?? null,
    duration_in_previous_stage: h.duration_in_previous_stage ?? null,
    notes: h.notes ?? null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chatMessages: ChatMessage[] = chatMessagesData.map((m: any) => {
    const senderName = m.sent_by ? nameMap[m.sent_by] ?? "Unknown" : "Unknown";
    return {
      id: m.id,
      channel_id: m.channel_id,
      loan_id: m.loan_id,
      sent_by: m.sent_by,
      content: m.content ?? "",
      message_type: m.message_type ?? "message",
      created_at: m.created_at ?? null,
      _sender_name: senderName,
      _sender_initials: getInitials(senderName),
    };
  });

  const deal: DealData = {
    ...d,
    _borrower_name: d._borrower_name ?? null,
    _entity_name: d._entity_name ?? null,
    _originator: d._originator ?? null,
    _processor: d._processor ?? null,
    _underwriter: d._underwriter ?? null,
    _closer: d._closer ?? null,
  };

  return (
    <DealDetail
      deal={deal}
      stageHistory={stageHistory}
      conditions={conditions}
      documents={documents}
      activity={activity}
      comments={comments}
      chatMessages={chatMessages}
      isOpportunity={isOpportunity}
      currentUserInitials={currentUserInitials}
    />
  );
}
