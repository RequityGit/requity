import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ServicingLoanDetailTabs } from "@/components/admin/servicing/loan-detail-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCurrency,
  formatCurrencyDetailed,
  formatDate,
  formatPercent,
} from "@/lib/format";
import { ExportServicingButton } from "@/components/admin/servicing/export-servicing-button";
import {
  DollarSign,
  Percent,
  Banknote,
  Calculator,
  CalendarClock,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function LoanDetailPage({
  params,
}: {
  params: { loanId: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { loanId: rawLoanId } = await params;
  const loanId = decodeURIComponent(rawLoanId);

  // Cast to any — servicing tables are not in generated types yet
  const db = supabase as any;

  // Fetch loan detail and related data in parallel
  const [loanResult, drawsResult, paymentsResult, budgetResult, auditResult, interestResult, payoffCountResult] =
    await Promise.all([
      db
        .from("servicing_loans")
        .select("*")
        .eq("loan_id", loanId)
        .single(),
      db
        .from("servicing_draws")
        .select("*")
        .eq("loan_id", loanId)
        .order("draw_number"),
      db
        .from("servicing_payments")
        .select("*")
        .eq("loan_id", loanId)
        .order("date", { ascending: false }),
      db
        .from("servicing_construction_budgets")
        .select("*")
        .eq("loan_id", loanId)
        .order("line_item"),
      db
        .from("servicing_audit_log")
        .select("*")
        .eq("loan_id", loanId)
        .order("timestamp", { ascending: false }),
      db.rpc("calculate_interest_for_period", {
        p_loan_id: loanId,
        p_billing_month: new Date().toISOString().slice(0, 8) + "01",
      }),
      db
        .from("payoff_statements")
        .select("id", { count: "exact", head: true })
        .eq("loan_id", loanId),
    ]);

  if (!loanResult.data) notFound();

  const loan = loanResult.data as any;
  const payments = paymentsResult.data ?? [];
  const auditLog = auditResult.data ?? [];
  const monthlyInterest = interestResult.data?.total_interest ?? 0;
  const payoffStatementCount = payoffCountResult.count ?? 0;

  // Look up the UUID loan from the pipeline by matching loan_number to servicing loan_id
  let loanUuid: string | null = null;
  let constructionBudgetData: any = null;
  let budgetLineItemsData: any[] = [];
  let drawRequestsData: any[] = [];
  let drawRequestLineItemsData: any[] = [];
  let budgetChangeRequestsData: any[] = [];
  let budgetChangeRequestLineItemsData: any[] = [];
  let budgetAuditLogData: any[] = [];

  try {
    // Try to find the pipeline loan by loan_number matching the servicing loan_id
    const { data: pipelineLoan } = await supabase
      .from("loans")
      .select("id")
      .eq("loan_number", loanId)
      .is("deleted_at", null)
      .maybeSingle();

    if (pipelineLoan) {
      loanUuid = pipelineLoan.id;

      // Fetch construction budget data
      const { data: budgetRow } = await supabase
        .from("construction_budgets")
        .select("*")
        .eq("loan_id", loanUuid)
        .order("budget_version", { ascending: false })
        .limit(1)
        .maybeSingle();

      constructionBudgetData = budgetRow;

      // Fetch draw requests
      const { data: draws } = await supabase
        .from("draw_requests")
        .select("*")
        .eq("loan_id", loanUuid)
        .order("draw_number", { ascending: false });
      drawRequestsData = draws ?? [];

      if (budgetRow) {
        const [lineItemsRes, changeReqRes, historyRes] = await Promise.all([
          supabase
            .from("budget_line_items")
            .select("*")
            .eq("construction_budget_id", budgetRow.id)
            .order("sort_order"),
          supabase
            .from("budget_change_requests")
            .select("*")
            .eq("construction_budget_id", budgetRow.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("budget_line_item_history")
            .select("*")
            .eq("construction_budget_id", budgetRow.id)
            .order("changed_at", { ascending: false })
            .limit(100),
        ]);
        budgetLineItemsData = lineItemsRes.data ?? [];
        budgetChangeRequestsData = changeReqRes.data ?? [];
        budgetAuditLogData = historyRes.data ?? [];

        // Fetch change request line items
        if (budgetChangeRequestsData.length > 0) {
          const coIds = budgetChangeRequestsData.map((co: any) => co.id);
          const { data: coLineItems } = await supabase
            .from("budget_change_request_line_items")
            .select("*")
            .in("budget_change_request_id", coIds);
          budgetChangeRequestLineItemsData = coLineItems ?? [];
        }
      }

      // Fetch draw request line items
      if (drawRequestsData.length > 0) {
        const drawIds = drawRequestsData.map((d: any) => d.id);
        const { data: drLineItems } = await supabase
          .from("draw_request_line_items")
          .select("*")
          .in("draw_request_id", drawIds);
        drawRequestLineItemsData = drLineItems ?? [];
      }
    }
  } catch {
    /* construction budget tables may not exist yet */
  }

  const isMatured =
    loan.maturity_date != null && new Date(loan.maturity_date) <= new Date();
  const daysToMaturity =
    loan.maturity_date && !isMatured
      ? Math.ceil(
          (new Date(loan.maturity_date).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Back link + header */}
      <div>
        <Link
          href="/admin/servicing"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Servicing
        </Link>
        <PageHeader
          title={`${loan.loan_id} — ${loan.entity_name ?? loan.borrower_name ?? "Unknown"}`}
          description={loan.property_address ?? undefined}
          action={
            <div className="flex items-center gap-2">
              <ExportServicingButton loanId={loan.loan_id} />
              <StatusBadge status={loan.loan_status} className="text-sm px-3 py-1" />
            </div>
          }
        />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Current Balance"
          value={formatCurrency(loan.current_balance)}
          description={`of ${formatCurrency(loan.total_loan_amount)} total`}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KpiCard
          title="Interest Rate"
          value={
            loan.interest_rate != null
              ? formatPercent(loan.interest_rate * 100)
              : "—"
          }
          description={loan.dutch_interest ? "Dutch Interest" : "Non-Dutch Interest"}
          icon={<Percent className="h-5 w-5" />}
        />
        <KpiCard
          title="Total Loan Amount"
          value={formatCurrency(loan.total_loan_amount)}
          description={`${formatCurrency(loan.construction_holdback)} holdback`}
          icon={<Banknote className="h-5 w-5" />}
        />
        <KpiCard
          title="Monthly Interest"
          value={formatCurrencyDetailed(monthlyInterest)}
          description="Current period estimate"
          icon={<Calculator className="h-5 w-5" />}
        />
        <KpiCard
          title="Days to Maturity"
          value={
            isMatured
              ? "MATURED"
              : daysToMaturity > 0
              ? daysToMaturity.toString()
              : "—"
          }
          description={loan.maturity_date ? formatDate(loan.maturity_date) : "No maturity date"}
          icon={<CalendarClock className="h-5 w-5" />}
        />
      </div>

      {/* Loan Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Loan Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4">
            <InfoRow label="Borrower" value={loan.borrower_name} />
            <InfoRow label="Entity" value={loan.entity_name} />
            <InfoRow label="Property" value={loan.property_address} />
            <InfoRow label="City/State/Zip" value={loan.city_state_zip} />
            <InfoRow label="Loan Type" value={loan.loan_type} />
            <InfoRow label="Loan Purpose" value={loan.loan_purpose} />
            <InfoRow label="Asset Class" value={loan.asset_class} />
            <InfoRow label="Program" value={loan.program} />
            <InfoRow label="Origination Date" value={formatDate(loan.origination_date)} />
            <InfoRow label="Maturity Date" value={formatDate(loan.maturity_date)} />
            <InfoRow label="Term" value={loan.term_months ? `${loan.term_months} months` : "—"} />
            <InfoRow label="Payment Type" value={loan.payment_type} />
            <InfoRow label="Fund" value={loan.fund_name} />
            <InfoRow
              label="Fund Ownership"
              value={
                loan.fund_ownership_pct != null
                  ? formatPercent(loan.fund_ownership_pct * 100)
                  : "—"
              }
            />
            <InfoRow label="Originator" value={loan.originator} />
            <InfoRow
              label="Dutch Interest"
              value={loan.dutch_interest ? "Yes" : "No"}
            />
            <InfoRow label="Funds Released" value={formatCurrency(loan.funds_released)} />
            <InfoRow label="Draw Funds Available" value={formatCurrency(loan.draw_funds_available)} />
            <InfoRow
              label="LTV at Origination"
              value={
                loan.ltv_origination != null
                  ? formatPercent(loan.ltv_origination * 100)
                  : "—"
              }
            />
            <InfoRow
              label="LTC"
              value={
                loan.ltc != null ? formatPercent(loan.ltc * 100) : "—"
              }
            />
            <InfoRow label="Purchase Price" value={formatCurrency(loan.purchase_price)} />
            <InfoRow label="Origination Value" value={formatCurrency(loan.origination_value)} />
            <InfoRow label="Stabilized Value" value={formatCurrency(loan.stabilized_value)} />
            <InfoRow label="Borrower Credit Score" value={loan.borrower_credit_score?.toString()} />
            <InfoRow label="Days Past Due" value={loan.days_past_due?.toString() ?? "0"} />
            <InfoRow label="Default Status" value={loan.default_status ?? "Current"} />
            <InfoRow label="ACH Status" value={loan.ach_status} />
            <InfoRow label="Next Payment Due" value={formatDate(loan.next_payment_due)} />
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <ServicingLoanDetailTabs
        payments={payments}
        auditLog={auditLog}
        loan={loan}
        payoffStatementCount={payoffStatementCount}
        loanUuid={loanUuid}
        currentUserId={user.id}
        constructionBudget={constructionBudgetData}
        budgetLineItems={budgetLineItemsData}
        drawRequests={drawRequestsData}
        drawRequestLineItems={drawRequestLineItemsData}
        budgetChangeRequests={budgetChangeRequestsData}
        budgetChangeRequestLineItems={budgetChangeRequestLineItemsData}
        budgetAuditLog={budgetAuditLogData}
        totalUnits={1}
      />
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium mt-0.5">{value ?? "—"}</dd>
    </div>
  );
}
