import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { getEffectiveAuth, getInvestorId } from "@/lib/impersonation";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Separator } from "@/components/ui/separator";
import { DocumentDownload } from "@/components/investor/document-download";
import {
  formatCurrency,
  formatDate,
  formatPercent,
} from "@/lib/format";
import {
  DollarSign,
  TrendingUp,
  PiggyBank,
  Wallet,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: { id: string };
}

export default async function InvestorFundDetailPage({ params }: PageProps) {
  const { supabase, userId } = await getEffectiveAuth();

  const { id } = await params;

  // Resolve auth user ID → investors.id
  const investorId = await getInvestorId(supabase, userId);
  if (!investorId) notFound();

  // Verify the investor has a commitment to this fund
  const { data: commitment } = await supabase
    .from("investor_commitments")
    .select("*")
    .eq("investor_id", investorId)
    .eq("fund_id", id)
    .single();

  if (!commitment) notFound();

  // Fetch fund details
  const { data: fund } = await supabase
    .from("funds")
    .select("*")
    .eq("id", id)
    .single();

  if (!fund) notFound();

  // Fetch capital calls, distributions, and documents for this fund+investor
  const [capitalCallsResult, distributionsResult, documentsResult] =
    await Promise.all([
      supabase
        .from("capital_calls")
        .select("*")
        .eq("fund_id", id)
        .eq("investor_id", investorId)
        .order("due_date", { ascending: false }),
      supabase
        .from("distributions")
        .select("*")
        .eq("fund_id", id)
        .eq("investor_id", investorId)
        .order("distribution_date", { ascending: false }),
      supabase
        .from("documents")
        .select("*")
        .eq("fund_id", id)
        .eq("owner_id", userId)
        .order("created_at", { ascending: false }),
    ]);

  const capitalCalls = capitalCallsResult.data ?? [];
  const distributions = distributionsResult.data ?? [];
  const documents = documentsResult.data ?? [];

  // KPIs
  const totalCalled = capitalCalls.reduce(
    (sum, cc) => sum + (cc.call_amount || 0),
    0
  );
  const totalDistributed = distributions
    .filter((d) => d.status === "paid")
    .reduce((sum, d) => sum + (d.amount || 0), 0);
  const pctFunded =
    commitment.commitment_amount > 0
      ? Math.round(
          (commitment.funded_amount / commitment.commitment_amount) * 100
        )
      : 0;

  // Capital call columns
  const capitalCallColumns: Column<(typeof capitalCalls)[number]>[] = [
    {
      key: "call_amount",
      header: "Amount",
      cell: (row) => (
        <span className="font-medium">{formatCurrency(row.call_amount)}</span>
      ),
    },
    {
      key: "due_date",
      header: "Due Date",
      cell: (row) => {
        const isOverdue =
          row.status === "pending" && new Date(row.due_date) < new Date();
        return (
          <span className={isOverdue ? "text-red-600 font-medium" : ""}>
            {formatDate(row.due_date)}
          </span>
        );
      },
    },
    {
      key: "paid_date",
      header: "Paid Date",
      cell: (row) =>
        row.paid_date ? (
          formatDate(row.paid_date)
        ) : (
          <span className="text-muted-foreground">--</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  // Distribution columns
  const distributionColumns: Column<(typeof distributions)[number]>[] = [
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
      cell: (row) => (
        <span className="font-medium">{formatCurrency(row.amount)}</span>
      ),
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

  // Document columns
  const documentColumns: Column<(typeof documents)[number]>[] = [
    {
      key: "file_name",
      header: "File Name",
      cell: (row) => (
        <span className="font-medium text-foreground">{row.file_name}</span>
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
      header: "Date",
      cell: (row) => formatDate(row.created_at),
    },
    {
      key: "download",
      header: "",
      cell: (row) => (
        <DocumentDownload filePath={row.file_path ?? ""} fileName={row.file_name} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/investor/funds"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Investments
      </Link>

      <PageHeader
        title={fund.name}
        description={`${(fund.fund_type ?? "investment").replace(/_/g, " ")} - Vintage ${fund.vintage_year || "N/A"}`}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="My Commitment"
          value={formatCurrency(commitment.commitment_amount)}
          description={`${pctFunded}% funded`}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KpiCard
          title="Amount Funded"
          value={formatCurrency(commitment.funded_amount)}
          description={`${formatCurrency(commitment.unfunded_amount)} remaining`}
          icon={<Wallet className="h-5 w-5" />}
        />
        <KpiCard
          title="Total Called"
          value={formatCurrency(totalCalled)}
          description={`${capitalCalls.length} contribution${capitalCalls.length !== 1 ? "s" : ""}`}
          icon={<PiggyBank className="h-5 w-5" />}
        />
        <KpiCard
          title="Distributions Received"
          value={formatCurrency(totalDistributed)}
          description={`${distributions.length} distribution${distributions.length !== 1 ? "s" : ""}`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Fund Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Investment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6">
            <DetailField label="Investment Type" value={(fund.fund_type ?? "N/A").replace(/_/g, " ")} />
            <DetailField label="Vintage Year" value={fund.vintage_year?.toString() ?? "N/A"} />
            <DetailField label="Target Size" value={formatCurrency(fund.target_size)} />
            <DetailField label="Current AUM" value={formatCurrency(fund.current_aum)} />
            <DetailField label="IRR Target" value={formatPercent(fund.irr_target)} />
            <DetailField label="Preferred Return" value={formatPercent(fund.preferred_return)} />
            <DetailField label="Management Fee" value={formatPercent(fund.management_fee)} />
            <DetailField label="Investment Status" value={fund.status.replace(/_/g, " ")} />
          </div>
          {fund.description && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm">{fund.description}</p>
              </div>
            </>
          )}

          {/* Funding Progress Bar */}
          <Separator className="my-4" />
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">My Funding Progress</span>
              <span className="font-medium">{pctFunded}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{ width: `${Math.min(pctFunded, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(commitment.funded_amount)} funded</span>
              <span>{formatCurrency(commitment.commitment_amount)} committed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Data */}
      <Tabs defaultValue="capital-calls">
        <TabsList>
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

        <TabsContent value="capital-calls" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <DataTable
                columns={capitalCallColumns}
                data={capitalCalls}
                emptyMessage="No contributions for this investment."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distributions" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <DataTable
                columns={distributionColumns}
                data={distributions}
                emptyMessage="No distributions for this investment."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <DataTable
                columns={documentColumns}
                data={documents}
                emptyMessage="No documents for this investment."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium capitalize">{value}</p>
    </div>
  );
}
