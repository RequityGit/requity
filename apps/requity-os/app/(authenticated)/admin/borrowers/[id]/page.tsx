import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/format";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Shield,
  Hash,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { BorrowerEntityList } from "@/components/admin/borrower-entity-list";
import { BorrowerEditDialog } from "@/components/admin/borrower-edit-dialog";
import { ClickToCallNumber } from "@/components/ui/ClickToCallNumber";
import { BorrowerLoanTable } from "@/components/admin/borrower-loan-table";
import { EmailActivityFeed } from "@/components/crm/email-activity-feed";

interface PageProps {
  params: { id: string };
}

export default async function AdminBorrowerDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;
  const admin = createAdminClient();

  const { data: borrowerRow } = await admin
    .from("borrowers")
    .select("*, crm_contacts(*)")
    .eq("id", id)
    .single();

  if (!borrowerRow) notFound();

  // Merge crm_contact fields onto borrower for display.
  // Contact fields (first_name, email, phone, address) live on crm_contacts.
  const contact = (borrowerRow as any).crm_contacts ?? {};
  const borrower = {
    ...borrowerRow,
    first_name: contact.first_name ?? null,
    last_name: contact.last_name ?? null,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
    address_line1: contact.address_line1 ?? null,
    address_line2: contact.address_line2 ?? null,
    city: contact.city ?? null,
    state: contact.state ?? null,
    zip: contact.zip ?? null,
    country: contact.country ?? null,
  };

  // Fetch related data in parallel
  const [entitiesResult, loansResult, emailsResult, profileResult] = await Promise.all([
    admin
      .from("borrower_entities")
      .select("*")
      .eq("borrower_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("loans")
      .select("*")
      .eq("borrower_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("crm_emails")
      .select("*")
      .eq("linked_borrower_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("profiles")
      .select("id, full_name")
      .eq("id", user.id)
      .single(),
  ]);

  const entities = entitiesResult.data ?? [];
  const loans = loansResult.data ?? [];
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
  const currentUserName = profileResult.data?.full_name || user.email || "Unknown";

  const fullName = `${borrower.first_name ?? ""} ${borrower.last_name ?? ""}`.trim() || "Unknown";

  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName}
        description="Borrower profile, entities, and loan activity"
        action={<BorrowerEditDialog borrower={borrower} />}
      />

      {/* Borrower Info Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">
                  {borrower.email || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <ClickToCallNumber number={borrower.phone} showIcon={false} className="text-sm font-medium" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium">
                  {borrower.city && borrower.state
                    ? `${borrower.city}, ${borrower.state}`
                    : borrower.state || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Date of Birth</p>
                <p className="text-sm font-medium">
                  {formatDate(borrower.date_of_birth)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Credit Score</p>
                <p className="text-sm font-medium">
                  {borrower.credit_score ? (
                    <span
                      className={`${
                        borrower.credit_score >= 740
                          ? "text-green-600"
                          : borrower.credit_score >= 680
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {borrower.credit_score}
                    </span>
                  ) : (
                    "—"
                  )}
                  {borrower.credit_report_date && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({formatDate(borrower.credit_report_date)})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Experience</p>
                <p className="text-sm font-medium">
                  {borrower.experience_count}{" "}
                  {borrower.experience_count === 1 ? "deal" : "deals"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">US Citizen</p>
                <p className="text-sm font-medium">
                  {borrower.is_us_citizen ? "Yes" : "No"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Added</p>
                <p className="text-sm font-medium">
                  {formatDate(borrower.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Address */}
          {borrower.address_line1 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">Address</p>
              <p className="text-sm">
                {borrower.address_line1}
                {borrower.address_line2 && `, ${borrower.address_line2}`}
                {borrower.city && `, ${borrower.city}`}
                {borrower.state && `, ${borrower.state}`}{" "}
                {borrower.zip && borrower.zip}
              </p>
            </div>
          )}

          {/* Notes */}
          {borrower.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm whitespace-pre-wrap">{borrower.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabbed Data */}
      <Tabs defaultValue="entities">
        <TabsList>
          <TabsTrigger value="entities">
            Entities ({entities.length})
          </TabsTrigger>
          <TabsTrigger value="loans">Loans ({loans.length})</TabsTrigger>
          <TabsTrigger value="emails">Emails ({emails.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="entities" className="mt-4">
          <div className="flex justify-end mb-2">
            <Link
              href="/admin/borrowers/entities"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 underline-offset-4 hover:underline"
            >
              View all entities <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <BorrowerEntityList
            borrowerId={borrower.id}
            entities={entities}
          />
        </TabsContent>

        <TabsContent value="loans" className="mt-4">
          <BorrowerLoanTable loans={loans} />
        </TabsContent>

        <TabsContent value="emails" className="mt-4">
          <EmailActivityFeed
            emails={emails}
            defaultToEmail={borrower.email || undefined}
            defaultToName={fullName}
            linkedBorrowerId={borrower.id}
            currentUserId={user.id}
            currentUserName={currentUserName}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
