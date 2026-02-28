import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  DollarSign,
  Landmark,
  FileText,
  ArrowDownCircle,
  ClipboardList,
  UserPlus,
  PlusCircle,
  Upload,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch all KPI data in parallel
  const [
    fundsResult,
    loansResult,
    capitalCallsResult,
    distributionsResult,
    drawRequestsResult,
  ] = await Promise.all([
    supabase.from("funds").select("current_aum"),
    supabase.from("loans").select("loan_amount, stage"),
    supabase
      .from("capital_calls")
      .select("call_amount, status")
      .eq("status", "pending"),
    supabase
      .from("distributions")
      .select("amount, distribution_date")
      .gte(
        "distribution_date",
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString()
          .split("T")[0]
      ),
    supabase
      .from("draw_requests")
      .select("amount_requested, status")
      .in("status", ["submitted", "under_review"]),
  ]);

  const totalAUM =
    fundsResult.data?.reduce((sum, f) => sum + (f.current_aum || 0), 0) ?? 0;

  const activeLoans = loansResult.data?.filter(
    (l) => ["funded", "servicing"].includes(l.stage)
  ) ?? [];
  const totalOutstanding = activeLoans.reduce(
    (sum, l) => sum + (l.loan_amount || 0),
    0
  );
  const activeLoansCount = activeLoans.length;

  const pendingCapitalCalls =
    capitalCallsResult.data?.reduce(
      (sum, cc) => sum + (cc.call_amount || 0),
      0
    ) ?? 0;

  const mtdDistributions =
    distributionsResult.data?.reduce((sum, d) => sum + (d.amount || 0), 0) ?? 0;

  const pendingDrawRequests = drawRequestsResult.data?.length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Overview of all operations across the Requity Group portfolio."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total AUM"
          value={formatCurrency(totalAUM)}
          description="Across all investments"
          icon={<Landmark className="h-5 w-5" />}
        />
        <KpiCard
          title="Active Loans"
          value={activeLoansCount.toString()}
          description={`${formatCurrency(totalOutstanding)} outstanding`}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KpiCard
          title="Pending Contributions"
          value={formatCurrency(pendingCapitalCalls)}
          description={`${capitalCallsResult.data?.length ?? 0} contributions pending`}
          icon={<ArrowDownCircle className="h-5 w-5" />}
        />
        <KpiCard
          title="MTD Distributions"
          value={formatCurrency(mtdDistributions)}
          description="Month to date"
          icon={<FileText className="h-5 w-5" />}
        />
        <KpiCard
          title="Pending Draw Requests"
          value={pendingDrawRequests.toString()}
          description="Awaiting review"
          icon={<ClipboardList className="h-5 w-5" />}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/investors">
              <Button variant="outline" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Investor
              </Button>
            </Link>
            <Link href="/admin/borrowers">
              <Button variant="outline" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Borrower
              </Button>
            </Link>
            <Link href="/admin/loans">
              <Button variant="outline" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Create Loan
              </Button>
            </Link>
            <Link href="/admin/documents">
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            </Link>
            <Link href="/admin/capital-calls">
              <Button variant="outline" className="gap-2">
                <ArrowDownCircle className="h-4 w-4" />
                Contribution
              </Button>
            </Link>
            <Link href="/admin/distributions">
              <Button variant="outline" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Record Distribution
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
