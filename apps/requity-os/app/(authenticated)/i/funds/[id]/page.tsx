import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { getEffectiveAuth, getInvestorId } from "@/lib/impersonation";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  FileText,
  Landmark,
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvestorFundDetailPage({ params }: PageProps) {
  const { supabase, userId } = await getEffectiveAuth();
  const { id } = await params;

  // Resolve auth user ID → investors.id
  const investorId = await getInvestorId(supabase, userId);
  if (!investorId) notFound();

  // Fetch commitment for this fund + investor
  const { data: commitment, error: commitmentError } = await supabase
    .from("investor_commitments")
    .select("*")
    .eq("investor_id", investorId)
    .eq("fund_id", id)
    .maybeSingle();

  if (commitmentError) {
    console.error("Error fetching commitment:", commitmentError);
  }
  if (!commitment) notFound();

  // Fetch fund details
  const { data: fund, error: fundError } = await supabase
    .from("funds")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fundError) {
    console.error("Error fetching fund:", fundError);
  }
  if (!fund) notFound();

  // Fetch contributions, distributions, and documents
  // Use capital_call_line_items and distribution_line_items for per-investor accuracy
  const [
    lineItemsResult,
    distLineItemsResult,
    capitalCallsResult,
    distributionsResult,
    documentsResult,
  ] = await Promise.all([
    supabase
      .from("capital_call_line_items")
      .select("*, capital_calls(*)")
      .eq("commitment_id", commitment.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("distribution_line_items")
      .select("*, distributions(*)")
      .eq("commitment_id", commitment.id)
      .order("created_at", { ascending: false }),
    // Also fetch direct capital_calls for this investor (fallback)
    supabase
      .from("capital_calls")
      .select("*")
      .eq("fund_id", id)
      .eq("investor_id", investorId)
      .order("due_date", { ascending: false }),
    // Also fetch direct distributions for this investor (fallback)
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

  // Use line items if available, fall back to direct queries
  const callLineItems = lineItemsResult.data ?? [];
  const distLineItems = distLineItemsResult.data ?? [];
  const directCapitalCalls = capitalCallsResult.data ?? [];
  const directDistributions = distributionsResult.data ?? [];
  const documents = documentsResult.data ?? [];

  // Build contribution rows from line items (preferred) or direct capital calls
  const hasLineItems = callLineItems.length > 0;
  const contributions = hasLineItems
    ? callLineItems.map((li) => {
        const call = li.capital_calls as Record<string, unknown> | null;
        return {
          id: li.id,
          amount: li.amount,
          due_date: (call?.due_date as string) ?? null,
          paid_date: li.paid_date,
          status: li.status,
          call_date: (call?.call_date as string) ?? null,
        };
      })
    : directCapitalCalls.map((cc) => ({
        id: cc.id,
        amount: cc.call_amount ?? 0,
        due_date: cc.due_date,
        paid_date: cc.paid_date,
        status: cc.status,
        call_date: cc.call_date,
      }));

  // Build distribution rows from line items (preferred) or direct distributions
  const hasDistLineItems = distLineItems.length > 0;
  const distributionRows = hasDistLineItems
    ? distLineItems.map((li) => {
        const dist = li.distributions as Record<string, unknown> | null;
        return {
          id: li.id,
          amount: li.amount,
          distribution_type: li.distribution_type ?? "distribution",
          distribution_date: (dist?.distribution_date as string) ?? null,
          status: li.status,
        };
      })
    : directDistributions.map((d) => ({
        id: d.id,
        amount: d.amount ?? 0,
        distribution_type: d.distribution_type ?? "distribution",
        distribution_date: d.distribution_date,
        status: d.status,
      }));

  // KPIs
  const totalContributed = contributions.reduce(
    (sum, c) => sum + (c.amount || 0),
    0
  );
  const totalDistributed = distributionRows
    .filter((d) => d.status === "paid")
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const pctFunded =
    commitment.commitment_amount > 0
      ? Math.round(
          (commitment.funded_amount / commitment.commitment_amount) * 100
        )
      : 0;

  // Contribution columns
  const contributionColumns: Column<(typeof contributions)[number]>[] = [
    {
      key: "amount",
      header: "Amount",
      cell: (row) => (
        <span className="font-medium num">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: "due_date",
      header: "Due Date",
      cell: (row) => {
        const isOverdue =
          row.status === "pending" &&
          row.due_date &&
          new Date(row.due_date) < new Date();
        return (
          <span className={isOverdue ? "text-destructive font-medium" : ""}>
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
  const distributionColumns: Column<(typeof distributionRows)[number]>[] = [
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
        <span className="font-medium num">
          {formatCurrency(row.amount)}
        </span>
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
        <DocumentDownload
          filePath={row.file_path ?? ""}
          fileName={row.file_name}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/i/funds"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Investments
      </Link>

      {/* Header with status */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-primary/5">
              <Landmark className="h-5 w-5 text-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                {fund.name}
              </h1>
              <p className="text-sm text-muted-foreground capitalize">
                {(fund.fund_type ?? "investment").replace(/_/g, " ")}
                {fund.vintage_year ? ` · Vintage ${fund.vintage_year}` : ""}
              </p>
            </div>
          </div>
        </div>
        <StatusBadge status={fund.status ?? "open"} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <KpiCard
          title="Investment Amount"
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
          title="Contributions"
          value={formatCurrency(totalContributed)}
          description={`${contributions.length} call${contributions.length !== 1 ? "s" : ""}`}
          icon={<PiggyBank className="h-5 w-5" />}
        />
        <KpiCard
          title="Distributions"
          value={formatCurrency(totalDistributed)}
          description={`${distributionRows.length} payment${distributionRows.length !== 1 ? "s" : ""}`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Investment Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Investment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6">
            <DetailField
              label="Fund Type"
              value={(fund.fund_type ?? "N/A").replace(/_/g, " ")}
            />
            <DetailField
              label="Vintage Year"
              value={fund.vintage_year?.toString() ?? "N/A"}
            />
            <DetailField
              label="Target Size"
              value={formatCurrency(fund.target_size)}
            />
            <DetailField
              label="Current AUM"
              value={formatCurrency(fund.current_aum)}
            />
            <DetailField
              label="IRR Target"
              value={formatPercent(fund.irr_target)}
            />
            <DetailField
              label="Preferred Return"
              value={formatPercent(fund.preferred_return_pct ?? fund.preferred_return)}
            />
            <DetailField
              label="Management Fee"
              value={formatPercent(fund.management_fee_pct ?? fund.management_fee)}
            />
            <DetailField
              label="Fund Status"
              value={(fund.status ?? "N/A").replace(/_/g, " ")}
            />
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
              <span className="text-muted-foreground">
                My Funding Progress
              </span>
              <span className="font-medium num">{pctFunded}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{ width: `${Math.min(pctFunded, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span className="num">{formatCurrency(commitment.funded_amount)} funded</span>
              <span className="num">
                {formatCurrency(commitment.commitment_amount)} committed
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contributions Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            Contributions
            <span className="text-sm font-normal text-muted-foreground">
              ({contributions.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={contributionColumns}
            data={contributions}
            emptyMessage="No contributions for this investment yet."
          />
        </CardContent>
      </Card>

      {/* Distributions Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            Distributions
            <span className="text-sm font-normal text-muted-foreground">
              ({distributionRows.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={distributionColumns}
            data={distributionRows}
            emptyMessage="No distributions for this investment yet."
          />
        </CardContent>
      </Card>

      {/* Documents Section */}
      {documents.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
              Documents
              <span className="text-sm font-normal text-muted-foreground">
                ({documents.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={documentColumns}
              data={documents}
              emptyMessage="No documents for this investment."
            />
          </CardContent>
        </Card>
      )}
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
  const isFinancial =
    typeof value === "string" && (value.includes("$") || value.includes("%"));
  return (
    <div>
      <p className="text-[11px] md:text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-sm font-medium capitalize ${isFinancial ? "num" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
