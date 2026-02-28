import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatCurrencyDetailed, formatDate, formatPercent } from "@/lib/format";
import {
  Building2,
  DollarSign,
  CalendarClock,
  FileText,
} from "lucide-react";

export default async function BorrowerDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all loans for this borrower
  const { data: loans } = await supabase
    .from("loans")
    .select("*")
    .eq("borrower_id", user.id)
    .order("created_at", { ascending: false });

  const allLoans = loans ?? [];

  // Active loans (funded or servicing)
  const activeLoans = allLoans.filter(
    (l) => ["funded", "servicing"].includes(l.stage)
  );

  // Total outstanding balance
  const totalOutstanding = activeLoans.reduce(
    (sum, loan) => sum + (loan.loan_amount ?? 0),
    0
  );

  // Fetch pending draw requests count
  const { count: pendingDraws } = await supabase
    .from("draw_requests")
    .select("*", { count: "exact", head: true })
    .eq("borrower_id", user.id)
    .in("status", ["submitted", "under_review"]);

  // Fetch next payment due
  const { data: nextPayments } = await supabase
    .from("loan_payments")
    .select("*")
    .eq("borrower_id", user.id)
    .eq("status", "pending")
    .gte("due_date", new Date().toISOString().split("T")[0])
    .order("due_date", { ascending: true })
    .limit(1);

  const nextPayment = nextPayments?.[0] ?? null;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your loans and activity"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Active Loans"
          value={activeLoans.length}
          description={`${allLoans.length} total loans`}
          icon={<Building2 className="h-5 w-5" />}
        />
        <KpiCard
          title="Total Outstanding Balance"
          value={formatCurrency(totalOutstanding)}
          description="Across all active loans"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KpiCard
          title="Next Payment Due"
          value={
            nextPayment
              ? formatCurrencyDetailed(nextPayment.amount_due)
              : "None"
          }
          description={
            nextPayment ? `Due ${formatDate(nextPayment.due_date)}` : "No upcoming payments"
          }
          icon={<CalendarClock className="h-5 w-5" />}
        />
        <KpiCard
          title="Pending Draw Requests"
          value={pendingDraws ?? 0}
          description="Awaiting review"
          icon={<FileText className="h-5 w-5" />}
        />
      </div>

      {/* Active Loans Section */}
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-[#1a2b4a]">Your Loans</h2>
        <p className="text-sm text-muted-foreground">
          Click a loan to view details
        </p>
      </div>

      {activeLoans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No active loans</p>
            <p className="text-sm mt-1">
              Your loans will appear here once they are created.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeLoans.map((loan) => (
            <Link
              key={loan.id}
              href={`/borrower/loans/${loan.id}`}
              className="block group"
            >
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold leading-snug">
                      {loan.property_address}
                    </CardTitle>
                    <StatusBadge status={loan.stage} />
                  </div>
                  {(loan.property_city || loan.property_state) && (
                    <p className="text-xs text-muted-foreground">
                      {[loan.property_city, loan.property_state, loan.property_zip]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Amount</p>
                      <p className="font-medium">
                        {formatCurrency(loan.loan_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Rate</p>
                      <p className="font-medium">
                        {formatPercent(loan.interest_rate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Term</p>
                      <p className="font-medium">{loan.term_months} mo</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span>Loan #{loan.loan_number}</span>
                    <span>{(loan.loan_type ?? "").replace(/_/g, " ")}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
