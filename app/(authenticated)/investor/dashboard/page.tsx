import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { getEffectiveAuth } from "@/lib/impersonation";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Wallet,
  PiggyBank,
  TrendingUp,
  ArrowRight,
  FileText,
  BanknoteIcon,
  CircleDollarSign,
} from "lucide-react";
import Link from "next/link";

type CommitmentWithFund = {
  id: string;
  commitment_amount: number;
  funded_amount: number;
  unfunded_amount: number;
  commitment_date: string | null;
  status: string;
  funds: { name: string } | null;
};

type CapitalCallWithFund = {
  id: string;
  call_amount: number;
  due_date: string;
  status: string;
  funds: { name: string } | null;
};

type DistributionWithFund = {
  id: string;
  amount: number;
  distribution_date: string;
  distribution_type: string;
  status: string;
  funds: { name: string } | null;
};

type DocumentWithFund = {
  id: string;
  file_name: string;
  created_at: string;
  status: string;
  funds: { name: string } | null;
};

type ActivityItem = {
  id: string;
  type: "distribution" | "capital_call" | "document";
  title: string;
  description: string;
  date: string;
  status?: string;
};

export default async function InvestorDashboardPage() {
  const { supabase, userId } = await getEffectiveAuth();

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const profile = rawProfile as unknown as {
    id: string;
    full_name: string | null;
    email: string;
  } | null;

  if (!profile) {
    redirect("/login");
  }

  // Fetch investor commitments with fund names
  const { data: rawCommitments } = await supabase
    .from("investor_commitments")
    .select("*, funds(name)")
    .eq("investor_id", userId);

  const commitments = (rawCommitments as unknown as CommitmentWithFund[]) ?? [];

  // Fetch recent capital calls
  const { data: rawCapitalCalls } = await supabase
    .from("capital_calls")
    .select("*, funds(name)")
    .eq("investor_id", userId)
    .order("due_date", { ascending: false })
    .limit(5);

  const recentCapitalCalls =
    (rawCapitalCalls as unknown as CapitalCallWithFund[]) ?? [];

  // Fetch recent distributions
  const { data: rawDistributions } = await supabase
    .from("distributions")
    .select("*, funds(name)")
    .eq("investor_id", userId)
    .order("distribution_date", { ascending: false })
    .limit(5);

  const recentDistributions =
    (rawDistributions as unknown as DistributionWithFund[]) ?? [];

  // Fetch recent documents
  const { data: rawDocuments } = await supabase
    .from("documents")
    .select("*, funds(name)")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  const recentDocuments =
    (rawDocuments as unknown as DocumentWithFund[]) ?? [];

  // Calculate KPIs
  const totalCommitted = commitments.reduce(
    (sum, c) => sum + (c.commitment_amount ?? 0),
    0
  );
  const totalFunded = commitments.reduce(
    (sum, c) => sum + (c.funded_amount ?? 0),
    0
  );
  const unfundedCommitments = commitments.reduce(
    (sum, c) => sum + (c.unfunded_amount ?? 0),
    0
  );

  // YTD distributions - fetch all for this year
  const currentYear = new Date().getFullYear();
  const { data: rawYtd } = await supabase
    .from("distributions")
    .select("amount")
    .eq("investor_id", userId)
    .gte("distribution_date", `${currentYear}-01-01`)
    .lte("distribution_date", `${currentYear}-12-31`);

  const ytdDistributions = (rawYtd as unknown as Array<{ amount: number }>) ?? [];
  const ytdTotal = ytdDistributions.reduce(
    (sum, d) => sum + (d.amount ?? 0),
    0
  );

  // Build activity feed: merge recent distributions, capital calls, and documents
  const activityItems: ActivityItem[] = [];

  recentDistributions.forEach((d) => {
    activityItems.push({
      id: d.id,
      type: "distribution",
      title: "Distribution Received",
      description: `${formatCurrency(d.amount)} from ${d.funds?.name ?? "Unknown Investment"} - ${d.distribution_type?.replace(/_/g, " ")}`,
      date: d.distribution_date,
      status: d.status,
    });
  });

  recentCapitalCalls.forEach((cc) => {
    activityItems.push({
      id: cc.id,
      type: "capital_call",
      title: "Contribution",
      description: `${formatCurrency(cc.call_amount)} for ${cc.funds?.name ?? "Unknown Investment"} - Due ${formatDate(cc.due_date)}`,
      date: cc.due_date,
      status: cc.status,
    });
  });

  recentDocuments.forEach((doc) => {
    activityItems.push({
      id: doc.id,
      type: "document",
      title: "Document Available",
      description: `${doc.file_name}${doc.funds?.name ? ` - ${doc.funds.name}` : ""}`,
      date: doc.created_at,
      status: doc.status,
    });
  });

  // Sort by date descending and take top 5
  activityItems.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const recentActivity = activityItems.slice(0, 5);

  const firstName = profile.full_name?.split(" ")[0] ?? "Investor";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here is an overview of your investment portfolio."
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Committed"
          value={formatCurrency(totalCommitted)}
          description={`Across ${commitments.length} investment${commitments.length !== 1 ? "s" : ""}`}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KpiCard
          title="Total Funded"
          value={formatCurrency(totalFunded)}
          description={`${totalCommitted > 0 ? Math.round((totalFunded / totalCommitted) * 100) : 0}% of commitment called`}
          icon={<Wallet className="h-5 w-5" />}
        />
        <KpiCard
          title="Unfunded Commitments"
          value={formatCurrency(unfundedCommitments)}
          description="Remaining callable capital"
          icon={<PiggyBank className="h-5 w-5" />}
        />
        <KpiCard
          title="YTD Distributions"
          value={formatCurrency(ytdTotal)}
          description={`${currentYear} year to date`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No recent activity to display.
              </p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-start gap-3 pb-4 border-b last:border-b-0 last:pb-0"
                  >
                    <div className="mt-0.5 rounded-full p-2 bg-muted">
                      {item.type === "distribution" && (
                        <CircleDollarSign className="h-4 w-4 text-green-600" />
                      )}
                      {item.type === "capital_call" && (
                        <BanknoteIcon className="h-4 w-4 text-blue-600" />
                      )}
                      {item.type === "document" && (
                        <FileText className="h-4 w-4 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {item.title}
                        </p>
                        {item.status && <StatusBadge status={item.status} />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {item.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(item.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commitments by Fund */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">
              Investment Commitments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {commitments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No investment commitments found.
              </p>
            ) : (
              <div className="space-y-4">
                {commitments.map((commitment) => {
                  const pctFunded =
                    commitment.commitment_amount > 0
                      ? Math.round(
                          (commitment.funded_amount /
                            commitment.commitment_amount) *
                            100
                        )
                      : 0;

                  return (
                    <div
                      key={commitment.id}
                      className="pb-4 border-b last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-foreground">
                          {commitment.funds?.name ?? "Unknown Investment"}
                        </p>
                        <StatusBadge status={commitment.status} />
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                        <span>
                          {formatCurrency(commitment.funded_amount)} of{" "}
                          {formatCurrency(commitment.commitment_amount)}
                        </span>
                        <span>{pctFunded}% funded</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(pctFunded, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/investor/capital-calls">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-2 bg-blue-50">
                  <BanknoteIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Contributions
                  </p>
                  <p className="text-xs text-muted-foreground">
                    View all contribution notices
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/investor/distributions">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-2 bg-green-50">
                  <CircleDollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Distributions
                  </p>
                  <p className="text-xs text-muted-foreground">
                    View distribution history
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/investor/documents">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-2 bg-muted">
                  <FileText className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Documents
                  </p>
                  <p className="text-xs text-muted-foreground">
                    K-1s, statements, and reports
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
