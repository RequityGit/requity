import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { CrmActivityLog } from "@/components/crm/crm-activity-log";
import { ContactEditDialog } from "@/components/crm/contact-edit-dialog";
import { formatDate } from "@/lib/format";
import { CRM_CONTACT_TYPES, CRM_CONTACT_SOURCES } from "@/lib/constants";
import {
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  User,
  Tag,
  Bell,
} from "lucide-react";
import Link from "next/link";

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

  const { id } = await params;

  const { data: contact } = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("id", id)
    .single();

  if (!contact) notFound();

  // Fetch activities and team members in parallel
  const [activitiesResult, teamResult] = await Promise.all([
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
  ]);

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

  const fullName = `${contact.first_name} ${contact.last_name}`;
  const assignedToName = contact.assigned_to
    ? profileLookup[contact.assigned_to] || null
    : null;
  const contactTypeLabel =
    CRM_CONTACT_TYPES.find((t) => t.value === contact.contact_type)?.label ||
    contact.contact_type;
  const sourceLabel = contact.source
    ? CRM_CONTACT_SOURCES.find((s) => s.value === contact.source)?.label ||
      contact.source
    : null;

  const isFollowUpOverdue =
    contact.next_follow_up_date &&
    new Date(contact.next_follow_up_date) < new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName}
        description={`${contactTypeLabel} contact`}
        action={
          <ContactEditDialog contact={contact} teamMembers={teamMembers} />
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
                <p className="text-sm font-medium">
                  {contact.company_name || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <StatusBadge status={contact.contact_type} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <StatusBadge status={contact.status} />
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

      {/* Activity Log */}
      <CrmActivityLog
        contactId={contact.id}
        activities={activities}
        currentUserId={user.id}
      />
    </div>
  );
}
