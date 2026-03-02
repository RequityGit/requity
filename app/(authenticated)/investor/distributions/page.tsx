import { PageHeader } from "@/components/shared/page-header";
import { getEffectiveAuth } from "@/lib/impersonation";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/shared/kpi-card";
import { DISTRIBUTION_TYPES } from "@/lib/constants";
import {
  CircleDollarSign,
  TrendingUp,
  Calendar,
  Layers,
} from "lucide-react";
import { DistributionFilters } from "./filters";
import { InvestmentTabs } from "@/components/investor/investment-tabs";

type DistributionRow = {
  id: string;
  fund_name: string;
  distribution_type: string;
  amount: number;
  distribution_date: string;
  description: string | null;
  status: string;
};

export default async function DistributionsPage({
  searchParams,
}: {
  searchParams: { fund?: string; year?: string; type?: string };
}) {
  const { supabase, userId } = await getEffectiveAuth();

  // Build query
  let query = supabase
    .from("distributions")
    .select("*, funds(name)")
    .eq("investor_id", userId)
    .order("distribution_date", { ascending: false });

  if (searchParams.fund) {
    query = query.eq("fund_id", searchParams.fund);
  }

  if (searchParams.year) {
    query = query
      .gte("distribution_date", `${searchParams.year}-01-01`)
      .lte("distribution_date", `${searchParams.year}-12-31`);
  }

  if (searchParams.type) {
    query = query.eq("distribution_type", searchParams.type);
  }

  const { data: rawDistributions } = await query;

  type DistributionJoined = {
    id: string;
    fund_id: string;
    distribution_type: string;
    amount: number;
    distribution_date: string;
    description: string | null;
    status: string;
    funds: { name: string } | null;
  };

  const distributions =
    (rawDistributions as unknown as DistributionJoined[]) ?? [];

  // Get funds for the filter
  const { data: commitments } = await supabase
    .from("investor_commitments")
    .select("fund_id, funds(id, name)")
    .eq("investor_id", userId);

  const funds = (commitments ?? [])
    .map((c) => {
      const fund = (c as any).funds as { id: string; name: string } | null;
      return fund ? { id: fund.id, name: fund.name } : null;
    })
    .filter(Boolean) as { id: string; name: string }[];

  const uniqueFunds = Array.from(
    new Map(funds.map((f) => [f.id, f])).values()
  );

  // Get available years from distributions
  const { data: rawAllDistributions } = await supabase
    .from("distributions")
    .select("distribution_date")
    .eq("investor_id", userId);

  const allDistributions =
    (rawAllDistributions as unknown as Array<{ distribution_date: string }>) ?? [];

  const years = Array.from(
    new Set(
      allDistributions.map((d) =>
        new Date(d.distribution_date).getFullYear().toString()
      )
    )
  ).sort((a, b) => Number(b) - Number(a));

  // Transform data
  const rows: DistributionRow[] = distributions.map((d) => ({
    id: d.id,
    fund_name: d.funds?.name ?? "Unknown Investment",
    distribution_type: d.distribution_type,
    amount: d.amount,
    distribution_date: d.distribution_date,
    description: d.description,
    status: d.status,
  }));

  // KPI calculations
  const totalDistributed = rows.reduce((sum, r) => sum + r.amount, 0);
  const currentYear = new Date().getFullYear();
  const ytdAmount = rows
    .filter(
      (r) =>
        new Date(r.distribution_date).getFullYear() === currentYear
    )
    .reduce((sum, r) => sum + r.amount, 0);
  const distributionCount = rows.length;
  const uniqueTypes = new Set(rows.map((r) => r.distribution_type)).size;

  // Map distribution type codes to labels
  const typeLabels: Record<string, string> = {};
  DISTRIBUTION_TYPES.forEach((dt) => {
    typeLabels[dt.value] = dt.label;
  });

  const columns: Column<DistributionRow>[] = [
    {
      key: "distribution_date",
      header: "Date",
      cell: (row) => formatDate(row.distribution_date),
    },
    {
      key: "fund_name",
      header: "Investment",
      cell: (row) => (
        <span className="font-medium text-foreground">{row.fund_name}</span>
      ),
    },
    {
      key: "distribution_type",
      header: "Type",
      cell: (row) => (
        <span className="capitalize">
          {typeLabels[row.distribution_type] ??
            row.distribution_type.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => (
        <span className="font-medium text-green-700">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: "description",
      header: "Period / Description",
      cell: (row) => (
        <span className="text-muted-foreground text-sm">
          {row.description ?? "--"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distributions"
        description="View your distribution history and payment details across all investments."
      />

      <InvestmentTabs />

      {/* Summary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Distributed"
          value={formatCurrency(totalDistributed)}
          description={`${distributionCount} distribution${distributionCount !== 1 ? "s" : ""}`}
          icon={<CircleDollarSign className="h-5 w-5" />}
        />
        <KpiCard
          title="YTD Distributions"
          value={formatCurrency(ytdAmount)}
          description={`${currentYear} year to date`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <KpiCard
          title="Distribution Types"
          value={uniqueTypes}
          description="Unique payment types"
          icon={<Layers className="h-5 w-5" />}
        />
        <KpiCard
          title="Years Active"
          value={years.length}
          description={
            years.length > 0
              ? `${years[years.length - 1]} - ${years[0]}`
              : "No distributions yet"
          }
          icon={<Calendar className="h-5 w-5" />}
        />
      </div>

      {/* Filters */}
      <DistributionFilters
        funds={uniqueFunds}
        years={years}
        distributionTypes={DISTRIBUTION_TYPES.map((dt) => ({
          value: dt.value,
          label: dt.label,
        }))}
        currentFund={searchParams.fund}
        currentYear={searchParams.year}
        currentType={searchParams.type}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable<DistributionRow>
            columns={columns}
            data={rows}
            emptyMessage="No distributions found. Adjust your filters or check back later."
          />
        </CardContent>
      </Card>

      {/* Running Total */}
      {rows.length > 0 && (
        <Card>
          <CardContent className="py-4 px-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Total for Current View ({rows.length} distribution
                {rows.length !== 1 ? "s" : ""})
              </span>
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(totalDistributed)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
