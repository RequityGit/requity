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

  const investorName = `${investor.first_name} ${investor.last_name}`;

  // Fetch related data in parallel
  const [commitmentsResult, capitalCallsResult, distributionsResult, documentsResult, fundsResult] =
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
    ]);

  const commitments = commitmentsResult.data ?? [];
  const capitalCalls = capitalCallsResult.data ?? [];
  const distributions = distributionsResult.data ?? [];
  const documents = documentsResult.data ?? [];
  const funds = fundsResult.data ?? [];

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

  const capitalCallColumns: Column<(typeof capitalCalls)[number]>[] = [
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
          {row.document_type.replace(/_/g, " ")}
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
    investor.address_line1,
    investor.address_line2,
    investor.city,
    investor.state,
    investor.zip,
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
                <p className="text-sm font-medium">{investor.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{investor.phone || "—"}</p>
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
                <StatusBadge status={investor.accreditation_status} />
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
          <TabsTrigger value="capital-calls">
            Contributions ({capitalCalls.length})
          </TabsTrigger>
          <TabsTrigger value="distributions">
            Distributions ({distributions.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({documents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="commitments" className="mt-4">
          <DataTable
            columns={commitmentColumns}
            data={commitments}
            emptyMessage="No commitments found for this investor."
          />
        </TabsContent>

        <TabsContent value="capital-calls" className="mt-4">
          <DataTable
            columns={capitalCallColumns}
            data={capitalCalls}
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
      </Tabs>
    </div>
  );
}
