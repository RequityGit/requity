import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { CrmActivityLog } from "@/components/crm/crm-activity-log";
import { ContactEditDialog } from "@/components/crm/contact-edit-dialog";
import { ContactRelationships } from "@/components/crm/contact-relationships";
import { ContactTags } from "@/components/crm/contact-tags";
import { EmailActivityFeed } from "@/components/crm/email-activity-feed";
import { formatDate, formatCurrency } from "@/lib/format";
import { CRM_CONTACT_SOURCES } from "@/lib/constants";
import {
  LIFECYCLE_STAGE_COLORS,
  CRM_LIFECYCLE_STAGES,
} from "@/lib/constants";
import {
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  User,
  Tag,
  Bell,
  Landmark,
  ShieldCheck,
  CreditCard,
  Briefcase,
  Ban,
  Shield,
  History,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
    tagsResult,
    auditLogResult,
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
    admin
      .from("contact_tags")
      .select("*")
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("contact_audit_log")
      .select("*")
      .eq("contact_id", id)
      .order("changed_at", { ascending: false })
      .limit(50),
    contact.company_id
      ? admin
          .from("companies")
          .select("id, name, company_type")
          .eq("id", contact.company_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  // Fetch linked investor data if applicable
  let investorData: any = null;
  let investorCommitments: any[] = [];
  let investorEntities: any[] = [];
  if (contact.linked_investor_id) {
    const [invResult, commitmentsResult, entitiesResult] = await Promise.all([
      admin
        .from("investors")
        .select("*")
        .eq("id", contact.linked_investor_id)
        .single(),
      admin
        .from("investor_commitments")
        .select("*, funds(name)")
        .eq("investor_id", contact.linked_investor_id),
      admin
        .from("investing_entities")
        .select("*")
        .eq("investor_id", contact.linked_investor_id),
    ]);
    investorData = invResult.data;
    investorCommitments = commitmentsResult.data ?? [];
    investorEntities = entitiesResult.data ?? [];
  }

  // Fetch linked borrower data if applicable
  let borrowerData: any = null;
  let borrowerEntities: any[] = [];
  let borrowerLoans: any[] = [];
  if (contact.borrower_id) {
    const [borResult, borEntitiesResult, loansResult] = await Promise.all([
      admin
        .from("borrowers")
        .select("*")
        .eq("id", contact.borrower_id)
        .single(),
      admin
        .from("borrower_entities")
        .select("*")
        .eq("borrower_id", contact.borrower_id),
      admin
        .from("loans")
        .select("id, loan_number, property_address, type, loan_amount, stage")
        .eq("borrower_id", contact.borrower_id)
        .is("deleted_at", null),
    ]);
    borrowerData = borResult.data;
    borrowerEntities = borEntitiesResult.data ?? [];
    borrowerLoans = loansResult.data ?? [];
  }

  const teamMembers = (teamResult.data ?? []).map(
    (t: { id: string; full_name: string | null; email: string | null }) => ({
      id: t.id,
      full_name: t.full_name || t.email || "Unknown",
    })
  );

  // Build profile lookup for activity created_by names
  const profileLookup: Record<string, string> = {};
  (teamResult.data ?? []).forEach(
    (t: { id: string; full_name: string | null; email: string | null }) => {
      profileLookup[t.id] = t.full_name || t.email || "Unknown";
    }
  );

  const activities = (activitiesResult.data ?? []).map((a: any) => ({
    id: a.id,
    activity_type: a.activity_type,
    subject: a.subject,
    description: a.description,
    outcome: a.outcome,
    created_by_name: a.created_by ? profileLookup[a.created_by] || null : null,
    created_at: a.created_at,
  }));

  const emails = (emailsResult.data ?? []).map((e: any) => ({
    id: e.id,
    created_at: e.created_at,
    from_email: e.from_email,
    to_email: e.to_email,
    to_name: e.to_name,
    subject: e.subject,
    body_text: e.body_text,
    body_html: e.body_html,
    cc_emails: e.cc_emails,
    bcc_emails: e.bcc_emails,
    sent_by_name: e.sent_by_name,
    postmark_status: e.postmark_status,
    delivered_at: e.delivered_at,
    opened_at: e.opened_at,
    attachments: e.attachments,
  }));

  const relationships = relationshipsResult.data ?? [];
  const tags = tagsResult.data ?? [];
  const auditLog = auditLogResult.data ?? [];
  const company = companyResult.data;

  const currentUserName = profileLookup[user.id] || user.email || "Unknown";

  const fullName = `${contact.first_name} ${contact.last_name}`;
  const assignedToName = contact.assigned_to
    ? profileLookup[contact.assigned_to] || null
    : null;
  const sourceLabel = contact.source
    ? CRM_CONTACT_SOURCES.find((s) => s.value === contact.source)?.label ||
      contact.source
    : null;

  const lifecycleLabel = contact.lifecycle_stage
    ? CRM_LIFECYCLE_STAGES.find((s) => s.value === contact.lifecycle_stage)
        ?.label || contact.lifecycle_stage
    : null;

  const isFollowUpOverdue =
    contact.next_follow_up_date &&
    new Date(contact.next_follow_up_date) < new Date();

  return (
    <div className="space-y-6">
      {/* Header with lifecycle + DNC badges */}
      <PageHeader
        title={fullName}
        description={
          <div className="flex items-center gap-2 mt-1">
            {contact.lifecycle_stage && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-medium capitalize",
                  LIFECYCLE_STAGE_COLORS[contact.lifecycle_stage] ?? ""
                )}
              >
                {lifecycleLabel}
              </Badge>
            )}
            {contact.dnc && (
              <Badge
                variant="outline"
                className="text-xs font-semibold bg-red-100 text-red-800 border-red-200"
              >
                <Ban className="h-3 w-3 mr-1" />
                DNC
              </Badge>
            )}
          </div>
        }
        action={
          <ContactEditDialog
            contact={contact}
            teamMembers={teamMembers}
            isSuperAdmin={isSuperAdmin}
          />
        }
      />

      {/* Contact Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">
                  {contact.email || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">
                  {contact.phone || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Company</p>
                {company ? (
                  <p className="text-sm font-medium">{company.name}</p>
                ) : contact.company_name ? (
                  <p className="text-sm font-medium text-muted-foreground">
                    {contact.company_name}
                  </p>
                ) : (
                  <p className="text-sm font-medium">—</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <p className="text-sm font-medium">{sourceLabel || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Assigned To</p>
                <p className="text-sm font-medium">
                  {assignedToName || "Unassigned"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Next Follow-Up</p>
                <p
                  className={`text-sm font-medium ${
                    isFollowUpOverdue ? "text-red-600" : ""
                  }`}
                >
                  {formatDate(contact.next_follow_up_date)}
                  {isFollowUpOverdue && " (Overdue)"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Marketing Consent
                </p>
                <p className="text-sm font-medium">
                  {contact.marketing_consent ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>

          {/* Address */}
          {contact.address_line1 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">
                    {contact.address_line1}
                    {contact.city && `, ${contact.city}`}
                    {contact.state && `, ${contact.state}`}{" "}
                    {contact.zip && contact.zip}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Last Contacted */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Last Contacted
                  </p>
                  <p className="text-sm font-medium">
                    {formatDate(contact.last_contacted_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Added</p>
                  <p className="text-sm font-medium">
                    {formatDate(contact.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Linked Investor */}
          {contact.linked_investor_id && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">
                Linked Investor
              </p>
              <Link
                href={`/admin/investors/${contact.linked_investor_id}`}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                View Investor Profile
              </Link>
            </div>
          )}

          {/* Linked Borrower */}
          {contact.borrower_id && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">
                Linked Borrower
              </p>
              <Link
                href={`/admin/borrowers/${contact.borrower_id}`}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                View Borrower Profile
              </Link>
            </div>
          )}

          {/* Notes */}
          {contact.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Relationships */}
      <ContactRelationships
        contactId={contact.id}
        relationships={relationships}
      />

      {/* Tags */}
      <ContactTags
        contactId={contact.id}
        tags={tags}
        currentUserId={user.id}
      />

      {/* Linked Investor Details */}
      {investorData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              Investor Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Accreditation Status
                  </p>
                  <StatusBadge
                    status={investorData.accreditation_status || "pending"}
                  />
                </div>
              </div>
              {investorData.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Investor Phone
                    </p>
                    <p className="text-sm font-medium">{investorData.phone}</p>
                  </div>
                </div>
              )}
              {investorData.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Investor Email
                    </p>
                    <p className="text-sm font-medium">{investorData.email}</p>
                  </div>
                </div>
              )}
            </div>

            {investorEntities.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                  Investing Entities
                </p>
                <div className="space-y-2">
                  {investorEntities.map((entity: any) => (
                    <div
                      key={entity.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{entity.entity_name}</span>
                        {entity.entity_type && (
                          <StatusBadge status={entity.entity_type} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {investorCommitments.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                  Fund Commitments
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Fund</th>
                        <th className="pb-2 font-medium">Committed</th>
                        <th className="pb-2 font-medium">Funded</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investorCommitments.map((c: any) => (
                        <tr key={c.id} className="border-b last:border-0">
                          <td className="py-2">
                            {c.funds?.name || "—"}
                          </td>
                          <td className="py-2">
                            {formatCurrency(c.commitment_amount)}
                          </td>
                          <td className="py-2">
                            {formatCurrency(c.funded_amount)}
                          </td>
                          <td className="py-2">
                            <StatusBadge status={c.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Linked Borrower Details */}
      {borrowerData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Borrower Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Credit Score</p>
                  <p className="text-sm font-medium">
                    {borrowerData.credit_score ?? "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Experience</p>
                  <p className="text-sm font-medium">
                    {borrowerData.experience_count ?? 0} deals
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">US Citizen</p>
                  <p className="text-sm font-medium">
                    {borrowerData.is_us_citizen ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>

            {borrowerEntities.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                  Borrower Entities
                </p>
                <div className="space-y-2">
                  {borrowerEntities.map((entity: any) => (
                    <div
                      key={entity.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{entity.entity_name}</span>
                        {entity.entity_type && (
                          <StatusBadge status={entity.entity_type} />
                        )}
                      </div>
                      {entity.state_of_formation && (
                        <span className="text-xs text-muted-foreground">
                          {entity.state_of_formation}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {borrowerLoans.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                  Linked Loans
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Loan #</th>
                        <th className="pb-2 font-medium">Property</th>
                        <th className="pb-2 font-medium">Type</th>
                        <th className="pb-2 font-medium">Amount</th>
                        <th className="pb-2 font-medium">Stage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {borrowerLoans.map((loan: any) => (
                        <tr key={loan.id} className="border-b last:border-0">
                          <td className="py-2">
                            <Link
                              href={`/admin/loans/${loan.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {loan.loan_number || "—"}
                            </Link>
                          </td>
                          <td className="py-2">
                            {loan.property_address || "—"}
                          </td>
                          <td className="py-2">
                            {loan.type ? (
                              <StatusBadge status={loan.type} />
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-2">
                            {loan.loan_amount
                              ? formatCurrency(loan.loan_amount)
                              : "—"}
                          </td>
                          <td className="py-2">
                            {loan.stage ? (
                              <StatusBadge status={loan.stage} />
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Compliance Audit Trail */}
      {auditLog.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Compliance Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditLog.map((entry: any) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex-1">
                    <span className="font-medium capitalize">
                      {(entry.field_name || "").replace(/_/g, " ")}
                    </span>
                    <span className="text-muted-foreground mx-1">:</span>
                    {entry.old_value && (
                      <>
                        <span className="text-red-600 line-through">
                          {entry.old_value}
                        </span>
                        <span className="text-muted-foreground mx-1">&rarr;</span>
                      </>
                    )}
                    <span className="text-green-700">{entry.new_value}</span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(entry.changed_at)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emails */}
      <EmailActivityFeed
        emails={emails}
        defaultToEmail={contact.email || undefined}
        defaultToName={fullName}
        linkedContactId={contact.id}
        currentUserId={user.id}
        currentUserName={currentUserName}
      />

      {/* Activity Log */}
      <CrmActivityLog
        contactId={contact.id}
        activities={activities}
        currentUserId={user.id}
      />
    </div>
  );
}
