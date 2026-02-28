import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { Landmark, Users, TrendingUp, DollarSign } from "lucide-react";

interface PageProps {
  params: { id: string };
}

export default async function AdminFundDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;

  const { data: fund } = await supabase
    .from("funds")
    .select("*")
    .eq("id", id)
    .single();

  if (!fund) notFound();

  const [commitmentsResult, capitalCallsResult, distributionsResult] =
    await Promise.all([
      supabase
        .from("investor_commitments")
        .select("*, profiles(full_name, email)")
        .eq("fund_id", id)
        .order("commitment_date", { ascending: false }),
      supabase
        .from("capital_calls")
        .select("*, profiles(full_name)")
        .eq("fund_id", id)
        .order("due_date", { ascending: false }),
      supabase
        .from("distributions")
        .select("*, profiles(full_name)")
        .eq("fund_id", id)
        .order("distribution_date", { ascending: false }),
    ]);

  const commitments = commitmentsResult.data ?? [];
  const capitalCalls = capitalCallsResult.data ?? [];
  const distributions = distributionsResult.data ?? [];

  const totalCommitted = commitments.reduce(
    (sum, c) => sum + (c.commitment_amount || 0),
    0
  );

  const commitmentColumns: Column<any>[] = [
    {
      key: "investor",
      header: "Investor",
      cell: (row) => (
        <span className="font-medium">
          {(row as any).profiles?.full_name ?? "Unknown"}
        </span>
      ),
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

  const capitalCallColumns: Column<any>[] = [
    {
      key: "investor",
      header: "Investor",
      cell: (row) => (
        <span className="font-medium">
          {(row as any).profiles?.full_name ?? "Unknown"}
        </span>
      ),
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

  const distributionColumns: Column<any>[] = [
    {
      key: "investor",
      header: "Investor",
      cell: (row) => (
        <span className="font-medium">
          {(row as any).profiles?.full_name ?? "Unknown"}
        </span>
      ),
    },
    {
      key: "distribution_type",
      header: "Type",
      cell: (row) => (
        <span className="capitalize">
          {row.distribution_type.replace(/_/g, " ")}
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={fund.name}
        description={`${(fund.fund_type ?? "investment").replace(/_/g, " ")} - Vintage ${fund.vintage_year || "N/A"}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          title="Target Size"
          value={formatCurrency(fund.target_size)}
          icon={<Landmark className="h-5 w-5" />}
        />
        <KpiCard
          title="Current AUM"
          value={formatCurrency(fund.current_aum)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KpiCard
          title="Investors"
          value={commitments.length.toString()}
          description={`${formatCurrency(totalCommitted)} total committed`}
          icon={<Users className="h-5 w-5" />}
        />
        <KpiCard
          title="Status"
          value={fund.status.replace(/_/g, " ")}
          description={
            fund.irr_target
              ? `Target IRR: ${formatPercent(fund.irr_target)}`
              : undefined
          }
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Investment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6">
            <DetailField
              label="Preferred Return"
              value={formatPercent(fund.preferred_return)}
            />
            <DetailField
              label="Management Fee"
              value={formatPercent(fund.management_fee)}
            />
            <DetailField
              label="IRR Target"
              value={formatPercent(fund.irr_target)}
            />
            <DetailField
              label="Vintage Year"
              value={fund.vintage_year?.toString() ?? "N/A"}
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
        </CardContent>
      </Card>

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
        </TabsList>

        <TabsContent value="commitments" className="mt-4">
          <DataTable
            columns={commitmentColumns}
            data={commitments}
            emptyMessage="No commitments for this investment."
          />
        </TabsContent>

        <TabsContent value="capital-calls" className="mt-4">
          <DataTable
            columns={capitalCallColumns}
            data={capitalCalls}
            emptyMessage="No contributions for this investment."
          />
        </TabsContent>

        <TabsContent value="distributions" className="mt-4">
          <DataTable
            columns={distributionColumns}
            data={distributions}
            emptyMessage="No distributions for this investment."
          />
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
