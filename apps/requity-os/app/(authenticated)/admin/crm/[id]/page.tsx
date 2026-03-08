import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { CRM_CONTACT_SOURCES } from "@/lib/constants";
import { ContactDetailClient } from "@/components/crm/contact-360";
import type {
  ContactData,
  RelationshipData,
  ActivityData,
  EmailData,
  LoanData,
  InvestorCommitmentData,
  TeamMember,
  CompanyData,
  BorrowerData,
  InvestorProfileData,
  EntityData,
} from "@/components/crm/contact-360/types";
import type { OpsTask, Profile } from "@/lib/tasks";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function CrmContactDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if user is super admin
  const { data: superAdminRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .eq("is_active", true)
    .maybeSingle();

  const isSuperAdmin = !!superAdminRole;

  const { id } = await params;
  const admin = createAdminClient();

  const { data: contact } = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("id", id)
    .single();

  if (!contact) notFound();

  // Fetch all related data in parallel
  const [
    activitiesResult,
    teamResult,
    emailsResult,
    relationshipsResult,
    companyResult,
    tasksResult,
  ] = await Promise.all([
    supabase
      .from("crm_activities")
      .select("*")
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "admin")
      .order("full_name"),
    admin
      .from("crm_emails")
      .select("*")
      .eq("linked_contact_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("contact_relationship_types")
      .select("*")
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
    contact.company_id
      ? admin
          .from("companies")
          .select("id, name, company_type")
          .eq("id", contact.company_id)
          .single()
      : Promise.resolve({ data: null }),
    admin
      .from("ops_tasks")
      .select("*")
      .eq("linked_entity_type", "contact")
      .eq("linked_entity_id", id)
      .order("created_at", { ascending: false }),
  ]);

  // Build profile lookup for display names
  const profileLookup: Record<string, string> = {};
  (teamResult.data ?? []).forEach(
    (t: { id: string; full_name: string | null; email: string | null }) => {
      profileLookup[t.id] = t.full_name || t.email || "Unknown";
    }
  );

  const teamMembers: TeamMember[] = (teamResult.data ?? []).map(
    (t: { id: string; full_name: string | null; email: string | null }) => ({
      id: t.id,
      full_name: t.full_name || t.email || "Unknown",
    })
  );

  // Map activities
  const activities: ActivityData[] = (activitiesResult.data ?? []).map(
    (a: Record<string, unknown>) => ({
      id: a.id as string,
      activity_type: a.activity_type as string,
      subject: a.subject as string | null,
      description: a.description as string | null,
      outcome: (a.outcome as string | null) ?? null,
      direction: (a.direction as string | null) ?? null,
      call_duration_seconds: (a.call_duration_seconds as number | null) ?? null,
      created_by_name: a.performed_by
        ? a.performed_by_name as string | null || profileLookup[a.performed_by as string] || null
        : null,
      created_at: a.created_at as string,
    })
  );

  // Map emails
  const emails: EmailData[] = (emailsResult.data ?? []).map(
    (e: Record<string, unknown>) => ({
      id: e.id as string,
      created_at: e.created_at as string,
      from_email: e.from_email as string,
      to_email: e.to_email as string,
      to_name: e.to_name as string | null,
      subject: e.subject as string,
      body_text: e.body_text as string | null,
      body_html: e.body_html as string | null,
      cc_emails: e.cc_emails as string[] | null,
      bcc_emails: e.bcc_emails as string[] | null,
      sent_by_name: e.sent_by_name as string | null,
      postmark_status: e.postmark_status as string | null,
      delivered_at: e.delivered_at as string | null,
      opened_at: e.opened_at as string | null,
      attachments: e.attachments,
    })
  );

  // Map relationships
  const relationships: RelationshipData[] = (
    relationshipsResult.data ?? []
  ).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    contact_id: r.contact_id as string,
    relationship_type: r.relationship_type as string,
    is_active: r.is_active as boolean | null,
    lender_direction: r.lender_direction as string | null,
    vendor_type: r.vendor_type as string | null,
    notes: r.notes as string | null,
    started_at: r.started_at as string | null,
    ended_at: r.ended_at as string | null,
    created_at: r.created_at as string,
  }));

  // Map tasks (from ops_tasks)
  const tasks: OpsTask[] = (tasksResult.data ?? []).map(
    (t: Record<string, unknown>) => ({
      id: t.id as string,
      title: t.title as string,
      description: t.description as string | null,
      status: t.status as string,
      priority: t.priority as string,
      assigned_to: t.assigned_to as string | null,
      assigned_to_name: t.assigned_to_name as string | null,
      project_id: t.project_id as string | null,
      due_date: t.due_date as string | null,
      completed_at: t.completed_at as string | null,
      category: t.category as string | null,
      linked_entity_type: t.linked_entity_type as string | null,
      linked_entity_id: t.linked_entity_id as string | null,
      linked_entity_label: t.linked_entity_label as string | null,
      is_recurring: t.is_recurring as boolean | null,
      is_active_recurrence: t.is_active_recurrence as boolean | null,
      recurrence_pattern: t.recurrence_pattern as string | null,
      recurrence_repeat_interval: t.recurrence_repeat_interval as number | null,
      recurrence_days_of_week: t.recurrence_days_of_week as number[] | null,
      recurrence_day_of_month: t.recurrence_day_of_month as number | null,
      recurrence_monthly_when: t.recurrence_monthly_when as string | null,
      recurrence_start_date: t.recurrence_start_date as string | null,
      recurrence_end_date: t.recurrence_end_date as string | null,
      next_recurrence_date: t.next_recurrence_date as string | null,
      recurring_template_id: t.recurring_template_id as string | null,
      recurrence_period: t.recurrence_period as string | null,
      previous_incomplete: t.previous_incomplete as boolean | null,
      recurring_series_id: t.recurring_series_id as string | null,
      source_task_id: t.source_task_id as string | null,
      parent_task_id: t.parent_task_id as string | null,
      created_by: t.created_by as string | null,
      sort_order: (t.sort_order as number) ?? 0,
      updated_at: t.updated_at as string | null,
      created_at: t.created_at as string | null,
      type: ((t.type as string) ?? "task") as "task" | "approval",
      approval_status: t.approval_status as string | null,
      active_party: t.active_party as string | null,
      requestor_user_id: t.requestor_user_id as string | null,
      requestor_name: t.requestor_name as string | null,
      amount: t.amount as number | null,
      decision_note: t.decision_note as string | null,
      approved_at: t.approved_at as string | null,
      rejected_at: t.rejected_at as string | null,
      resubmitted_at: t.resubmitted_at as string | null,
      revision_count: t.revision_count as number | null,
    })
  );

  // Build profiles list for TaskSheet
  const profiles: Profile[] = (teamResult.data ?? []).map(
    (t: { id: string; full_name: string | null; email: string | null }) => ({
      id: t.id,
      full_name: t.full_name || t.email || "Unknown",
      avatar_url: null,
    })
  );

  // Determine active relationship types for data fetching
  const activeRelTypes = relationships
    .filter((r) => r.is_active)
    .map((r) => r.relationship_type);

  // Fetch borrower data if borrower relationship exists
  let borrowerData: BorrowerData | null = null;
  let borrowerLoans: LoanData[] = [];
  let borrowerEntities: EntityData[] = [];

  if (
    activeRelTypes.includes("borrower") &&
    contact.borrower_id
  ) {
    const [borrowerResult, loansResult, entitiesResult] = await Promise.all([
      admin
        .from("borrowers")
        .select(
          "id, credit_score, credit_report_date, experience_count, date_of_birth, is_us_citizen, marital_status, ssn_last_four, stated_liquidity, verified_liquidity, stated_net_worth, verified_net_worth"
        )
        .eq("id", contact.borrower_id)
        .single(),
      admin
        .from("loans")
        .select(
          "id, loan_number, property_address, type, loan_amount, interest_rate, ltv, loan_term_months, stage, stage_updated_at, created_at"
        )
        .eq("borrower_id", contact.borrower_id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      admin
        .from("borrower_entities")
        .select(
          "id, entity_name, entity_type, ein, state_of_formation, formation_date, operating_agreement_url, articles_of_org_url, certificate_good_standing_url, ein_letter_url"
        )
        .eq("borrower_id", contact.borrower_id),
    ]);

    if (borrowerResult.data) {
      const b = borrowerResult.data;
      borrowerData = {
        id: b.id,
        credit_score: b.credit_score,
        credit_report_date: b.credit_report_date,
        experience_count: b.experience_count,
        date_of_birth: b.date_of_birth,
        is_us_citizen: b.is_us_citizen,
        marital_status: b.marital_status,
        ssn_last_four: b.ssn_last_four,
        stated_liquidity: b.stated_liquidity,
        verified_liquidity: b.verified_liquidity,
        stated_net_worth: b.stated_net_worth,
        verified_net_worth: b.verified_net_worth,
      };
    }

    borrowerLoans = (loansResult.data ?? []).map((l: Record<string, unknown>) => ({
      id: l.id as string,
      loan_number: l.loan_number as string | null,
      property_address: l.property_address as string | null,
      type: l.type as string | null,
      loan_amount: l.loan_amount as number | null,
      interest_rate: l.interest_rate as number | null,
      ltv: l.ltv as number | null,
      loan_term_months: l.loan_term_months as number | null,
      stage: l.stage as string | null,
      stage_updated_at: l.stage_updated_at as string | null,
      created_at: l.created_at as string,
    }));

    borrowerEntities = (entitiesResult.data ?? []).map(
      (e: Record<string, unknown>) => ({
        id: e.id as string,
        entity_name: e.entity_name as string,
        entity_type: e.entity_type as string,
        ein: e.ein as string | null,
        state_of_formation: e.state_of_formation as string | null,
        formation_date: e.formation_date as string | null,
        kind: "borrower" as const,
        operating_agreement_url: e.operating_agreement_url as string | null,
        articles_of_org_url: e.articles_of_org_url as string | null,
        certificate_good_standing_url: e.certificate_good_standing_url as string | null,
        ein_letter_url: e.ein_letter_url as string | null,
        formation_doc_url: null,
      })
    );
  }

  // Fetch investor data if investor relationship exists
  let investorProfile: InvestorProfileData | null = null;
  let investorCommitments: InvestorCommitmentData[] = [];
  let investingEntities: EntityData[] = [];

  if (
    activeRelTypes.includes("investor") &&
    contact.linked_investor_id
  ) {
    const [investorResult, commitmentsResult, entitiesResult] = await Promise.all([
      admin
        .from("investors")
        .select("id, accreditation_status, accreditation_verified_at")
        .eq("id", contact.linked_investor_id)
        .single(),
      admin
        .from("investor_commitments")
        .select(
          "id, commitment_amount, funded_amount, unfunded_amount, status, commitment_date, funds(name), investing_entities(entity_name)"
        )
        .eq("investor_id", contact.linked_investor_id),
      admin
        .from("investing_entities")
        .select(
          "id, entity_name, entity_type, ein, state_of_formation, operating_agreement_url, formation_doc_url, other_doc_urls"
        )
        .eq("investor_id", contact.linked_investor_id),
    ]);

    if (investorResult.data) {
      investorProfile = {
        id: investorResult.data.id,
        accreditation_status: investorResult.data.accreditation_status,
        accreditation_verified_at: investorResult.data.accreditation_verified_at,
      };
    }

    investorCommitments = (commitmentsResult.data ?? []).map(
      (c: Record<string, unknown>) => ({
        id: c.id as string,
        fund_name:
          (c.funds as Record<string, unknown> | null)?.name as string | null ??
          null,
        commitment_amount: c.commitment_amount as number | null,
        funded_amount: c.funded_amount as number | null,
        unfunded_amount: c.unfunded_amount as number | null,
        status: c.status as string | null,
        commitment_date: c.commitment_date as string | null,
        entity_name:
          (c.investing_entities as Record<string, unknown> | null)?.entity_name as string | null ??
          null,
      })
    );

    investingEntities = (entitiesResult.data ?? []).map(
      (e: Record<string, unknown>) => ({
        id: e.id as string,
        entity_name: e.entity_name as string,
        entity_type: e.entity_type as string,
        ein: e.ein as string | null,
        state_of_formation: e.state_of_formation as string | null,
        formation_date: null,
        kind: "investing" as const,
        operating_agreement_url: e.operating_agreement_url as string | null,
        articles_of_org_url: null,
        certificate_good_standing_url: null,
        ein_letter_url: null,
        formation_doc_url: e.formation_doc_url as string | null,
      })
    );
  }

  const allEntities = [...borrowerEntities, ...investingEntities];

  const company: CompanyData | null = companyResult.data
    ? {
        id: companyResult.data.id,
        name: companyResult.data.name,
        company_type: companyResult.data.company_type,
      }
    : null;

  const currentUserName = profileLookup[user.id] || user.email || "Unknown";

  const assignedToName = contact.assigned_to
    ? profileLookup[contact.assigned_to] || null
    : null;

  const sourceLabel = contact.source
    ? CRM_CONTACT_SOURCES.find(
        (s) => s.value === contact.source
      )?.label || contact.source
    : null;

  // Map contact to our typed shape
  const contactData: ContactData = {
    id: contact.id,
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    phone: contact.phone,
    company_name: contact.company_name,
    company_id: contact.company_id,
    source: contact.source,
    assigned_to: contact.assigned_to,
    next_follow_up_date: contact.next_follow_up_date,
    last_contacted_at: contact.last_contacted_at,
    marketing_consent: contact.marketing_consent,
    created_at: contact.created_at,
    updated_at: contact.updated_at,
    lifecycle_stage: contact.lifecycle_stage,
    dnc: contact.dnc,
    address_line1: contact.address_line1,
    address_line2: contact.address_line2 ?? null,
    city: contact.city,
    state: contact.state,
    zip: contact.zip,
    country: contact.country ?? null,
    user_id: contact.user_id,
    borrower_id: contact.borrower_id,
    linked_investor_id: contact.linked_investor_id,
    notes: contact.notes,
    contact_types: contact.contact_types ?? null,
    rating: contact.rating ?? null,
    status: contact.status ?? null,
    user_function: contact.user_function ?? null,
    language_preference: contact.language_preference ?? null,
  };

  return (
    <ContactDetailClient
      contact={contactData}
      relationships={relationships}
      activities={activities}
      emails={emails}
      loans={borrowerLoans}
      investorCommitments={investorCommitments}
      teamMembers={teamMembers}
      profiles={profiles}
      company={company}
      borrower={borrowerData}
      investor={investorProfile}
      entities={allEntities}
      tasks={tasks}
      currentUserId={user.id}
      currentUserName={currentUserName}
      assignedToName={assignedToName}
      sourceLabel={sourceLabel}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
