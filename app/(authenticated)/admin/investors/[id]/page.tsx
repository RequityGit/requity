import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { Mail, Phone, MapPin, Calendar, Shield } from "lucide-react";
import { EmailActivityFeed } from "@/components/crm/email-activity-feed";
import { ClickToCallNumber } from "@/components/ui/ClickToCallNumber";

interface PageProps {
  params: { id: string };
}

export default async function AdminInvestorDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;

  // Use admin client to ensure we can always read the investor,
  // bypassing any RLS timing issues for newly created investors.
  const admin = createAdminClient();
  const { data: investor } = await admin
    .from("investors")
    .select("*")
    .eq("id", id)
    .single();

  if (!investor) notFound();

  // Cast to any — investor contact fields (name, email, phone, address) now
  // live on crm_contacts in the new schema, but legacy code still references them.
  const inv = investor as any;
  const investorName = `${inv.first_name ?? ""} ${inv.last_name ?? ""}`.trim() || "Unknown";

  // Fetch related data in parallel
  const [commitmentsResult, contributionsResult, distributionsResult, documentsResult, fundsResult, emailsResult, profileResult] =
    await Promise.all([
      admin
        .from("investor_commitments")
        .select("*, funds(name)")
        .eq("investor_id", id)
        .order("created_at", { ascending: false }),
      admin
        .from("capital_calls")
        .select("*, funds(name)")
        .eq("investor_id", id)
        .order("due_date", { ascending: false }),
      admin
        .from("distributions")
        .select("*, funds(name)")
        .eq("investor_id", id)
        .order("distribution_date", { ascending: false }),
      admin
        .from("documents")
        .select("*")
        .eq("owner_id", id)
        .order("created_at", { ascending: false }),
      admin.from("funds").select("id, name").order("name"),
      admin
        .from("crm_emails")
        .select("*")
        .eq("linked_investor_id", id)
        .order("created_at", { ascending: false }),
      admin
        .from("profiles")
        .select("id, full_name")
        .eq("id", user.id)
        .single(),
    ]);

  const commitments = commitmentsResult.data ?? [];
  const contributions = contributionsResult.data ?? [];
  const distributions = distributionsResult.data ?? [];
  const documents = documentsResult.data ?? [];
  const funds = fundsResult.data ?? [];
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

  // Define columns for each tab
  const commitmentColumns: Column<(typeof commitments)[number]>[] = [
    {
      key: "fund",
      header: "Investment",
      cell: (row) => (row as Record<string, unknown> & { funds?: { name?: string } }).funds?.name ?? "—",
    },
    {
      key: "commitment_amount",
      header: "Committed",
      cell: (row) => formatCurrency(row.commitment_amount),
    },
    {
      key: "funded_amount",
      header: "Funded",
      cell: (row) => formatCurrency(row.funded_amount),
    },
    {
      key: "unfunded_amount",
      header: "Unfunded",
      cell: (row) => formatCurrency(row.unfunded_amount),
    },
    {
      key: "commitment_date",
      header: "Date",
      cell: (row) => formatDate(row.commitment_date),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const contributionColumns: Column<(typeof contributions)[number]>[] = [
    {
      key: "fund",
      header: "Investment",
      cell: (row) => (row as Record<string, unknown> & { funds?: { name?: string } }).funds?.name ?? "—",
    },
    {
      key: "call_amount",
      header: "Amount",
      cell: (row) => formatCurrency(row.call_amount),
    },
    {
      key: "due_date",
      header: "Due Date",
      cell: (row) => formatDate(row.due_date),
    },
    {
      key: "paid_date",
      header: "Paid Date",
      cell: (row) => formatDate(row.paid_date),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const distributionColumns: Column<(typeof distributions)[number]>[] = [
    {
      key: "fund",
      header: "Investment",
      cell: (row) => (row as Record<string, unknown> & { funds?: { name?: string } }).funds?.name ?? "—",
    },
    {
      key: "distribution_type",
      header: "Type",
      cell: (row) => (
        <span className="capitalize">
          {(row.distribution_type ?? "").replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => formatCurrency(row.amount),
    },
    {
      key: "distribution_date",
      header: "Date",
      cell: (row) => formatDate(row.distribution_date),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const documentColumns: Column<(typeof documents)[number]>[] = [
    {
      key: "file_name",
      header: "File Name",
      cell: (row) => (
        <span className="font-medium">{row.description || row.file_name}</span>
      ),
    },
    {
      key: "document_type",
      header: "Type",
      cell: (row) => (
        <span className="capitalize">
          {row.document_type?.replace(/_/g, " ") ?? "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Uploaded",
      cell: (row) => formatDate(row.created_at),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status ?? "pending"} />,
    },
  ];

  const fullAddress = [
    inv.address_line1,
    inv.address_line2,
    inv.city,
    inv.state,
    inv.zip,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <PageHeader
        title={investorName}
        description="Investor profile and activity"
      />

      {/* Investor Info Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{inv.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <ClickToCallNumber number={inv.phone} showIcon={false} className="text-sm font-medium" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm font-medium">
                  {fullAddress || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Added</p>
                <p className="text-sm font-medium">
                  {formatDate(investor.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Accreditation</p>
                <StatusBadge status={investor.accreditation_status ?? "pending"} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Data */}
      <Tabs defaultValue="commitments">
        <TabsList>
          <TabsTrigger value="commitments">
            Commitments ({commitments.length})
          </TabsTrigger>
          <TabsTrigger value="contributions">
            Contributions ({contributions.length})
          </TabsTrigger>
          <TabsTrigger value="distributions">
            Distributions ({distributions.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="emails">
            Emails ({emails.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="commitments" className="mt-4">
          <DataTable
            columns={commitmentColumns}
            data={commitments}
            emptyMessage="No commitments found for this investor."
          />
        </TabsContent>

        <TabsContent value="contributions" className="mt-4">
          <DataTable
            columns={contributionColumns}
            data={contributions}
            emptyMessage="No contributions for this investor."
          />
        </TabsContent>

        <TabsContent value="distributions" className="mt-4">
          <DataTable
            columns={distributionColumns}
            data={distributions}
            emptyMessage="No distributions for this investor."
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DataTable
            columns={documentColumns}
            data={documents}
            emptyMessage="No documents for this investor."
          />
        </TabsContent>

        <TabsContent value="emails" className="mt-4">
          <EmailActivityFeed
            emails={emails}
            defaultToEmail={inv.email || undefined}
            defaultToName={investorName}
            linkedInvestorId={investor.id}
            currentUserId={user.id}
            currentUserName={currentUserName}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
