import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { CRM_CONTACT_SOURCES } from "@/lib/constants";
import { Contact360Client } from "@/components/crm/contact-360";
import type {
  ContactData,
  RelationshipData,
  ActivityData,
  EmailData,
  LoanData,
  InvestorCommitmentData,
  TeamMember,
  CompanyData,
} from "@/components/crm/contact-360/types";

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
      created_by_name: a.performed_by
        ? profileLookup[a.performed_by as string] || null
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

  // Determine active relationship types for data fetching
  const activeRelTypes = relationships
    .filter((r) => r.is_active)
    .map((r) => r.relationship_type);

  // Fetch linked borrower loans if borrower relationship exists
  let borrowerLoans: LoanData[] = [];
  if (
    activeRelTypes.includes("borrower") &&
    contact.borrower_id
  ) {
    const { data: loansData } = await admin
      .from("loans")
      .select(
        "id, loan_number, property_address, type, loan_amount, interest_rate, ltv, loan_term_months, stage, stage_updated_at, created_at"
      )
      .eq("borrower_id", contact.borrower_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    borrowerLoans = (loansData ?? []).map((l: Record<string, unknown>) => ({
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
  }

  // Fetch investor commitments if investor relationship exists
  let investorCommitments: InvestorCommitmentData[] = [];
  if (
    activeRelTypes.includes("investor") &&
    contact.linked_investor_id
  ) {
    const { data: commitmentsData } = await admin
      .from("investor_commitments")
      .select("id, commitment_amount, funded_amount, unfunded_amount, status, funds(name)")
      .eq("investor_id", contact.linked_investor_id);

    investorCommitments = (commitmentsData ?? []).map(
      (c: Record<string, unknown>) => ({
        id: c.id as string,
        fund_name:
          (c.funds as Record<string, unknown> | null)?.name as string | null ??
          null,
        commitment_amount: c.commitment_amount as number | null,
        funded_amount: c.funded_amount as number | null,
        unfunded_amount: c.unfunded_amount as number | null,
        status: c.status as string | null,
      })
    );
  }

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
    city: contact.city,
    state: contact.state,
    zip: contact.zip,
    user_id: contact.user_id,
    borrower_id: contact.borrower_id,
    linked_investor_id: contact.linked_investor_id,
    notes: contact.notes,
  };

  return (
    <Contact360Client
      contact={contactData}
      relationships={relationships}
      activities={activities}
      emails={emails}
      loans={borrowerLoans}
      investorCommitments={investorCommitments}
      teamMembers={teamMembers}
      company={company}
      currentUserId={user.id}
      currentUserName={currentUserName}
      assignedToName={assignedToName}
      sourceLabel={sourceLabel}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
