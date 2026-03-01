import { PageHeader } from "@/components/shared/page-header";
import { getEffectiveAuth } from "@/lib/impersonation";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/shared/kpi-card";
import {
  BanknoteIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { CapitalCallFilters } from "./filters";

type CapitalCallRow = {
  id: string;
  fund_name: string;
  call_amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
};

export default async function CapitalCallsPage({
  searchParams,
}: {
  searchParams: { fund?: string; status?: string };
}) {
  const { supabase, userId } = await getEffectiveAuth();

  // Build query
  let query = supabase
    .from("capital_calls")
    .select("*, funds(name)")
    .eq("investor_id", userId)
    .order("due_date", { ascending: false });

  if (searchParams.fund) {
    query = query.eq("fund_id", searchParams.fund);
  }

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }

  const { data: rawCapitalCalls } = await query;

  type CapitalCallJoined = {
    id: string;
    fund_id: string;
    call_amount: number;
    due_date: string;
    paid_date: string | null;
    status: string;
    funds: { name: string } | null;
  };

  const capitalCalls =
    (rawCapitalCalls as unknown as CapitalCallJoined[]) ?? [];

  // Get list of funds for the filter
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

  // Deduplicate funds
  const uniqueFunds = Array.from(
    new Map(funds.map((f) => [f.id, f])).values()
  );

  // Transform data for the table
  const rows: CapitalCallRow[] = capitalCalls.map((cc) => ({
    id: cc.id,
    fund_name: cc.funds?.name ?? "Unknown Investment",
    call_amount: cc.call_amount,
    due_date: cc.due_date,
    paid_date: cc.paid_date,
    status: cc.status,
  }));

  // KPI calculations
  const totalCalled = rows.reduce((sum, r) => sum + r.call_amount, 0);
  const totalPaid = rows
    .filter((r) => r.status === "paid")
    .reduce((sum, r) => sum + r.call_amount, 0);
  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const overdueCount = rows.filter((r) => r.status === "overdue").length;

  const columns: Column<CapitalCallRow>[] = [
    {
      key: "fund_name",
      header: "Investment",
      cell: (row) => (
        <span className="font-medium text-[#1a2b4a]">{row.fund_name}</span>
      ),
    },
    {
      key: "call_amount",
      header: "Contribution Amount",
      cell: (row) => (
        <span className="font-medium">{formatCurrency(row.call_amount)}</span>
      ),
    },
    {
      key: "due_date",
      header: "Due Date",
      cell: (row) => {
        const isOverdue =
          row.status === "pending" &&
          new Date(row.due_date) < new Date();
        return (
          <span className={isOverdue ? "text-red-600 font-medium" : ""}>
            {formatDate(row.due_date)}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
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
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contributions"
        description="Track all contribution notices and payment status across your investment commitments."
      />

      {/* Summary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Called"
          value={formatCurrency(totalCalled)}
          description={`${rows.length} contribution${rows.length !== 1 ? "s" : ""}`}
          icon={<BanknoteIcon className="h-5 w-5" />}
        />
        <KpiCard
          title="Total Paid"
          value={formatCurrency(totalPaid)}
          description="Payments completed"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <KpiCard
          title="Pending Contributions"
          value={pendingCount}
          description="Awaiting payment"
          icon={<Clock className="h-5 w-5" />}
        />
        <KpiCard
          title="Overdue"
          value={overdueCount}
          description="Past due date"
          icon={<AlertCircle className="h-5 w-5" />}
          className={overdueCount > 0 ? "border-red-200" : ""}
        />
      </div>

      {/* Filters */}
      <CapitalCallFilters
        funds={uniqueFunds}
        currentFund={searchParams.fund}
        currentStatus={searchParams.status}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable<CapitalCallRow>
            columns={columns}
            data={rows}
            emptyMessage="No contributions found. Adjust your filters or check back later."
          />
        </CardContent>
      </Card>
    </div>
  );
}
