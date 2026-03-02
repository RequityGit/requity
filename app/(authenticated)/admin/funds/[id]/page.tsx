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
import {
  Landmark,
  Users,
  TrendingUp,
  DollarSign,
  PiggyBank,
  CircleDollarSign,
  FileText,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: { id: string };
}

// Helper to extract investor name from the nested join chain,
// falling back to the profile name lookup map when crm_contact_id is null.
function getInvestorName(
  row: Record<string, unknown>,
  profileNames?: Map<string, string>
): string {
  const investors = row.investors as Record<string, unknown> | null;
  if (!investors) return "Unknown";

  // Try CRM contact name first
  const crm = investors.crm_contacts as Record<string, unknown> | null;
  if (crm) {
    if (crm.name) return crm.name as string;
    const first = (crm.first_name as string) ?? "";
    const last = (crm.last_name as string) ?? "";
    const crmName = `${first} ${last}`.trim();
    if (crmName) return crmName;
  }

  // Fallback: look up profile name via investors.user_id
  const userId = investors.user_id as string | null;
  if (userId && profileNames?.has(userId)) {
    return profileNames.get(userId)!;
  }

  return "Unknown";
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

  const [
    commitmentsResult,
    contributionsResult,
    distributionsResult,
    documentsResult,
  ] = await Promise.all([
    supabase
      .from("investor_commitments")
      .select("*, investors(user_id, crm_contacts(name, first_name, last_name))")
      .eq("fund_id", id)
      .order("commitment_date", { ascending: false }),
    supabase
      .from("capital_calls")
      .select("*, investors(user_id, crm_contacts(name, first_name, last_name))")
      .eq("fund_id", id)
      .order("due_date", { ascending: false }),
    supabase
      .from("distributions")
      .select("*, investors(user_id, crm_contacts(name, first_name, last_name))")
      .eq("fund_id", id)
      .order("distribution_date", { ascending: false }),
    supabase
      .from("documents")
      .select("*")
      .eq("fund_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const commitments = commitmentsResult.data ?? [];
  const contributions = contributionsResult.data ?? [];
  const distributions = distributionsResult.data ?? [];
  const documents = documentsResult.data ?? [];

  // Build a profile name lookup for investors whose crm_contact_id is null.
  // Collect unique user_ids from all investor joins, then batch-fetch profiles.
  const investorUserIds = new Set<string>();
  [...commitments, ...contributions, ...distributions].forEach((row) => {
    const inv = (row as Record<string, unknown>).investors as Record<string, unknown> | null;
    if (inv?.user_id) investorUserIds.add(inv.user_id as string);
  });

  const profileNames = new Map<string, string>();
  if (investorUserIds.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(investorUserIds));
    (profiles ?? []).forEach((p) => {
      if (p.full_name) profileNames.set(p.id, p.full_name);
    });
  }

  // KPI calculations
  const totalCommitted = commitments.reduce(
    (sum, c) => sum + (c.commitment_amount || 0),
    0
  );
  const totalFunded = commitments.reduce(
    (sum, c) => sum + (c.funded_amount || 0),
    0
  );
  const totalContributions = contributions.reduce(
    (sum, cc) => sum + (cc.call_amount || 0),
    0
  );
  const totalDistributed = distributions
    .filter((d) => d.status === "paid")
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  // Commitment columns
  const commitmentColumns: Column<(typeof commitments)[number]>[] = [
    {
      key: "investor",
      header: "Investor",
      cell: (row) => (
        <span className="font-medium">
          {getInvestorName(row as unknown as Record<string, unknown>, profileNames)}
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

  // Contribution columns
  const contributionColumns: Column<(typeof contributions)[number]>[] = [
    {
      key: "investor",
      header: "Investor",
      cell: (row) => (
        <span className="font-medium">
          {getInvestorName(row as unknown as Record<string, unknown>, profileNames)}
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
      key: "investor",
      header: "Investor",
      cell: (row) => (
        <span className="font-medium">
          {getInvestorName(row as unknown as Record<string, unknown>, profileNames)}
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
          {row.document_type?.replace(/_/g, " ") ?? "---"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      cell: (row) => formatDate(row.created_at),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) =>
        row.status ? <StatusBadge status={row.status} /> : <span>--</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/funds"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Investments
      </Link>

      <PageHeader
        title={fund.name}
        description={`${(fund.fund_type ?? "investment").replace(/_/g, " ")} - Vintage ${fund.vintage_year || "N/A"}`}
      />

      {/* KPI Cards - Row 1: Fund overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
          title="Total Committed"
          value={formatCurrency(totalCommitted)}
          description={`${formatCurrency(totalFunded)} funded`}
          icon={<Users className="h-5 w-5" />}
        />
        <KpiCard
          title="Total Contributions"
          value={formatCurrency(totalContributions)}
          description={`${contributions.length} contribution${contributions.length !== 1 ? "s" : ""}`}
          icon={<PiggyBank className="h-5 w-5" />}
        />
        <KpiCard
          title="Total Distributions"
          value={formatCurrency(totalDistributed)}
          description={`${distributions.length} distribution${distributions.length !== 1 ? "s" : ""}`}
          icon={<CircleDollarSign className="h-5 w-5" />}
        />
        <KpiCard
          title="Status"
          value={fund.status.replace(/_/g, " ")}
          description={
            fund.irr_target
              ? `IRR: ${formatPercent(fund.irr_target)}`
              : `${commitments.length} investor${commitments.length !== 1 ? "s" : ""}`
          }
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Investment Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Investment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6">
            <DetailField
              label="Investment Type"
              value={(fund.fund_type ?? "N/A").replace(/_/g, " ")}
            />
            <DetailField
              label="Vintage Year"
              value={fund.vintage_year?.toString() ?? "N/A"}
            />
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
              label="Carry %"
              value={formatPercent(fund.carry_pct)}
            />
            <DetailField
              label="GP Commitment"
              value={formatCurrency(fund.gp_commitment)}
            />
            <DetailField
              label="Inception Date"
              value={fund.inception_date ? formatDate(fund.inception_date) : "N/A"}
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
        </TabsList>

        <TabsContent value="commitments" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <DataTable
                columns={commitmentColumns}
                data={commitments}
                emptyMessage="No commitments for this investment."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contributions" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <DataTable
                columns={contributionColumns}
                data={contributions}
                emptyMessage="No contributions for this investment."
              />
            </CardContent>
          </Card>
          {contributions.length > 0 && (
            <Card className="mt-4">
              <CardContent className="py-4 px-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total Contributions ({contributions.length} contribution
                    {contributions.length !== 1 ? "s" : ""})
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {formatCurrency(totalContributions)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
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
          {distributions.length > 0 && (
            <Card className="mt-4">
              <CardContent className="py-4 px-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total Distributions ({distributions.length} distribution
                    {distributions.length !== 1 ? "s" : ""})
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {formatCurrency(totalDistributed)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
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
