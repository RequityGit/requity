import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { BillingTabs } from "@/components/admin/servicing/billing-tabs";
import { formatCurrency, formatCurrencyDetailed } from "@/lib/format";
import {
  Receipt,
  CalendarCheck,
  AlertTriangle,
  DollarSign,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const db = supabase as any;

  // Fetch billing data in parallel
  const [cyclesResult, delinquencyResult, activeLoansResult] =
    await Promise.all([
      db
        .from("billing_cycles")
        .select("*")
        .order("billing_month", { ascending: false }),
      db
        .from("delinquency_records")
        .select("*")
        .order("days_delinquent", { ascending: false }),
      db
        .from("servicing_loans")
        .select("loan_id, borrower_name, entity_name, loan_status, total_loan_amount, current_balance, interest_rate, dutch_interest, maturity_date")
        .eq("loan_status", "Active")
        .order("loan_id"),
    ]);

  const cycles = cyclesResult.data ?? [];
  const delinquencyRecords = delinquencyResult.data ?? [];
  const activeLoans = activeLoansResult.data ?? [];

  // Calculate KPIs
  const latestCycle = cycles[0];
  const totalBilledThisMonth = latestCycle?.total_billed ?? 0;
  const delinquentLoans = delinquencyRecords.filter(
    (d: any) => d.delinquency_status !== "current"
  );
  const totalPastDue = delinquentLoans.reduce(
    (sum: number, d: any) => sum + (d.amount_past_due ?? 0),
    0
  );
  const completedCycles = cycles.filter(
    (c: any) => c.status === "complete"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Collections"
        description="Generate billing cycles, track payments, manage delinquencies, and generate NACHA files."
        action={
          <Link href="/servicing">
            <Button variant="outline" size="sm">
              Back to Servicing
            </Button>
          </Link>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard
          title="Latest Billing"
          value={formatCurrencyDetailed(totalBilledThisMonth)}
          description={
            latestCycle
              ? `${latestCycle.loan_count} loans — ${latestCycle.status}`
              : "No billing cycles yet"
          }
          icon={<Receipt className="h-5 w-5" />}
        />
        <KpiCard
          title="Active Loans"
          value={activeLoans.length.toString()}
          description="Eligible for billing"
          icon={<FileText className="h-5 w-5" />}
        />
        <KpiCard
          title="Billing Cycles"
          value={cycles.length.toString()}
          description={`${completedCycles} completed`}
          icon={<CalendarCheck className="h-5 w-5" />}
        />
        <KpiCard
          title="Delinquent"
          value={delinquentLoans.length.toString()}
          description={`${formatCurrencyDetailed(totalPastDue)} past due`}
          icon={
            delinquentLoans.length > 0 ? (
              <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            ) : (
              <DollarSign className="h-5 w-5" />
            )
          }
        />
      </div>

      {/* Tabbed Content */}
      <BillingTabs
        cycles={cycles}
        delinquencyRecords={delinquencyRecords}
        activeLoans={activeLoans}
      />
    </div>
  );
}
