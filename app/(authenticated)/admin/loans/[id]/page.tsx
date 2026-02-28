import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LoanStageTracker } from "@/components/shared/loan-stage-tracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Separator } from "@/components/ui/separator";
import {
  formatCurrency,
  formatDate,
  formatPercent,
} from "@/lib/format";
import { LOAN_STAGE_LABELS, LOAN_TYPES } from "@/lib/constants";
import { LoanDetailActions } from "@/components/admin/loan-detail-actions";
import { Flame, Pause } from "lucide-react";

interface PageProps {
  params: { id: string };
}

export default async function AdminLoanDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;

  const { data: loan } = await supabase
    .from("loans")
    .select(`*, borrower:profiles!loans_borrower_id_fkey(full_name, email)`)
    .eq("id", id)
    .single();

  if (!loan) notFound();

  // Fetch all related data in parallel — keep conditions/activity separate so they don't break if tables don't exist
  const [drawRequestsResult, paymentsResult, documentsResult] =
    await Promise.all([
      supabase
        .from("draw_requests")
        .select("*")
        .eq("loan_id", id)
        .order("draw_number", { ascending: false }),
      supabase
        .from("loan_payments")
        .select("*")
        .eq("loan_id", id)
        .order("due_date", { ascending: false }),
      supabase
        .from("documents")
        .select("*")
        .eq("loan_id", id)
        .order("created_at", { ascending: false }),
    ]);

  // Conditions and activity log — may not exist if migrations haven't been applied
  let conditionsResult: { data: any[] | null } = { data: [] };
  let activityResult: { data: any[] | null } = { data: [] };
  try {
    conditionsResult = await supabase
      .from("loan_conditions")
      .select("*")
      .eq("loan_id", id)
      .order("sort_order");
  } catch { /* table may not exist */ }
  try {
    activityResult = await supabase
      .from("loan_activity_log")
      .select("*")
      .eq("loan_id", id)
      .order("created_at", { ascending: false })
      .limit(50);
  } catch { /* table may not exist */ }

  // Lookup team member names
  const teamIds = [loan.originator_id, loan.processor_id, loan.underwriter_id, loan.closer_id].filter((id): id is string => Boolean(id));
  let teamProfiles: Record<string, string> = {};
  if (teamIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", teamIds);
    (profiles ?? []).forEach((p: any) => {
      teamProfiles[p.id] = p.full_name ?? "Unknown";
    });
  }

  const drawRequests = drawRequestsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const documents = documentsResult.data ?? [];
  const conditions = conditionsResult.data ?? [];
  const activityLog = activityResult.data ?? [];

  const borrowerName = (loan as any).borrower?.full_name ?? "—";
  const originatorName = (loan.originator_id && teamProfiles[loan.originator_id]) ?? loan.originator ?? "—";
  const processorName = (loan.processor_id && teamProfiles[loan.processor_id]) ?? "—";
  const underwriterName = (loan.underwriter_id && teamProfiles[loan.underwriter_id]) ?? "—";
  const closerName = (loan.closer_id && teamProfiles[loan.closer_id]) ?? "—";

  const loanTypeLabel = LOAN_TYPES.find((t) => t.value === loan.loan_type)?.label ?? (loan.loan_type ?? "—").replace(/_/g, " ");

  // Condition summary for the header
  const condTotal = conditions.length;
  const condComplete = conditions.filter(
    (c: any) => c.status === "approved" || c.status === "waived"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Loan ${loan.loan_number}`}
        description={`${loan.property_address ?? "No address"} — ${borrowerName}`}
      />

      {/* Stage Tracker */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <LoanStageTracker currentStage={loan.stage} />
        </CardContent>
      </Card>

      {/* Overview Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Loan Overview</CardTitle>
            <div className="flex items-center gap-2">
              {loan.priority === "hot" && (
                <Badge className="bg-red-100 text-red-800 border-red-200 gap-1">
                  <Flame className="h-3 w-3" />
                  Hot
                </Badge>
              )}
              {loan.priority === "on_hold" && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1">
                  <Pause className="h-3 w-3" />
                  On Hold
                </Badge>
              )}
              <StatusBadge status={loan.stage} />
              {condTotal > 0 && (
                <Badge variant="outline" className="text-xs">
                  {condComplete}/{condTotal} conditions
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-y-4 gap-x-6">
            <DetailField label="Loan Number" value={loan.loan_number ?? "—"} />
            <DetailField label="Borrower" value={borrowerName} />
            <DetailField label="Type" value={loanTypeLabel} />
            <DetailField
              label="Stage"
              value={
                LOAN_STAGE_LABELS[
                  loan.stage as keyof typeof LOAN_STAGE_LABELS
                ] || loan.stage
              }
            />
            <DetailField
              label="Loan Amount"
              value={formatCurrency(loan.loan_amount)}
            />
            <DetailField
              label="Purchase Price"
              value={formatCurrency(loan.purchase_price)}
            />
            <DetailField
              label="Appraised Value"
              value={formatCurrency(loan.appraised_value)}
            />
            <DetailField label="LTV" value={formatPercent(loan.ltv)} />
            <DetailField
              label="Interest Rate"
              value={formatPercent(loan.interest_rate)}
            />
            <DetailField label="Points" value={loan.points ? `${loan.points}%` : "—"} />
            <DetailField label="Term" value={loan.term_months ? `${loan.term_months} months` : "—"} />
            <DetailField
              label="Expected Close"
              value={formatDate(loan.expected_close_date)}
            />
          </div>

          <Separator className="my-4" />

          {/* Team */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-6">
            <DetailField label="Originator" value={originatorName} />
            <DetailField label="Processor" value={processorName} />
            <DetailField label="Underwriter" value={underwriterName} />
            <DetailField label="Closer" value={closerName} />
          </div>

          {/* Key Dates */}
          <Separator className="my-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-6">
            <DetailField
              label="Application Date"
              value={formatDate(loan.application_date)}
            />
            <DetailField
              label="Approval Date"
              value={formatDate(loan.approval_date)}
            />
            <DetailField
              label="Origination Date"
              value={formatDate(loan.origination_date)}
            />
            <DetailField
              label="Maturity Date"
              value={formatDate(loan.maturity_date)}
            />
          </div>

          {/* Next action / blocker */}
          {loan.next_action && (
            <>
              <Separator className="my-4" />
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs font-medium text-amber-800 mb-0.5">
                  Next Action / Blocker
                </p>
                <p className="text-sm text-amber-900">{loan.next_action}</p>
              </div>
            </>
          )}

          {loan.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-xs text-surface-muted mb-1">
                  Internal Notes
                </p>
                <p className="text-sm">{loan.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions + Tabbed Data */}
      <LoanDetailActions
        loan={{
          id: loan.id,
          loan_number: loan.loan_number,
          borrower_id: loan.borrower_id,
          borrower_name: borrowerName,
          loan_type: loan.loan_type,
          property_address: loan.property_address,
          property_city: loan.property_city,
          property_state: loan.property_state,
          property_zip: loan.property_zip,
          loan_amount: loan.loan_amount,
          interest_rate: loan.interest_rate,
          term_months: loan.term_months,
          origination_date: loan.origination_date,
          maturity_date: loan.maturity_date,
          stage: loan.stage,
          ltv: loan.ltv,
          appraised_value: loan.appraised_value,
          notes: loan.notes,
        }}
        drawRequests={drawRequests}
        payments={payments}
        documents={documents}
        conditions={conditions}
        activityLog={activityLog}
        currentUserId={user.id}
        loanId={loan.id}
      />
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
      <p className="text-xs text-surface-muted">{label}</p>
      <p className="text-sm font-medium capitalize">{value}</p>
    </div>
  );
}
