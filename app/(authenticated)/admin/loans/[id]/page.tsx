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
import { LOAN_STAGE_LABELS, LOAN_DB_TYPES } from "@/lib/constants";
import { LoanDetailActions } from "@/components/admin/loan-detail-actions";
import { Flame, Pause } from "lucide-react";
import GenerateTermSheetButton from "@/components/loans/GenerateTermSheetButton";
import type { PricingProgram, LeverageAdjuster } from "@/lib/supabase/types";

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
    .select(`*, borrower:borrowers!loans_borrower_id_fkey(first_name, last_name, email)`)
    .eq("id", id)
    .single();

  if (!loan) notFound();

  // Cast to any — some column references may be stale after schema migrations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loanData = loan as any;

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

  // Pricing programs & adjusters — tables may not exist in DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let programsResult: { data: any[] | null } = { data: [] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let adjustersResult: { data: any[] | null } = { data: [] };
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    programsResult = await (supabase as any)
      .from("pricing_programs")
      .select("*")
      .eq("is_current", true)
      .order("program_id");
  } catch { /* table may not exist */ }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adjustersResult = await (supabase as any)
      .from("leverage_adjusters")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
  } catch { /* table may not exist */ }

  // Underwriting versions — may not exist if migration hasn't been applied
  let underwritingVersions: any[] = [];
  try {
    const { data } = await supabase
      .from("loan_underwriting_versions")
      .select("*, creator:profiles!loan_underwriting_versions_created_by_fkey(full_name)")
      .eq("loan_id", id)
      .order("version_number", { ascending: false });
    underwritingVersions = data ?? [];
  } catch { /* table may not exist */ }

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

  // Fetch emails for this loan
  let emailsData: any[] = [];
  try {
    const { data } = await supabase
      .from("crm_emails")
      .select("*")
      .eq("linked_loan_id", id)
      .order("created_at", { ascending: false });
    emailsData = data ?? [];
  } catch { /* table may not exist */ }

  // Lookup team member names
  const teamIds = [loanData.originator_id, loanData.processor_id, loanData.underwriter_id, loanData.closer_id].filter((id): id is string => Boolean(id));
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

  // Current user name for email compose
  let currentUserName = user.email ?? "Unknown";
  {
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    if (myProfile?.full_name) currentUserName = myProfile.full_name;
  }

  const drawRequests = drawRequestsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const documents = documentsResult.data ?? [];
  const conditions = conditionsResult.data ?? [];
  const activityLog = activityResult.data ?? [];
  const programs = (programsResult.data ?? []) as PricingProgram[];
  const adjusters = (adjustersResult.data ?? []) as LeverageAdjuster[];
  const emails = emailsData.map((e: any) => ({
    id: e.id,
    created_at: e.created_at,
    from_email: e.from_email,
    to_email: e.to_email,
    to_name: e.to_name,
    subject: e.subject,
    body_text: e.body_text,
    body_html: e.body_html,
    cc_emails: e.cc_emails,
    bcc_emails: e.bcc_emails,
    sent_by_name: e.sent_by_name,
    postmark_status: e.postmark_status,
    delivered_at: e.delivered_at,
    opened_at: e.opened_at,
    attachments: e.attachments,
  }));

  const borrowerRaw = (loanData as any).borrower;
  const borrowerName = borrowerRaw
    ? `${borrowerRaw.first_name ?? ""} ${borrowerRaw.last_name ?? ""}`.trim() || "—"
    : "—";
  const borrowerEmail = borrowerRaw?.email ?? undefined;
  const originatorName = (loanData.originator_id && teamProfiles[loanData.originator_id]) ?? loanData.originator ?? "—";
  const processorName = (loanData.processor_id && teamProfiles[loanData.processor_id]) ?? "—";
  const underwriterName = (loanData.underwriter_id && teamProfiles[loanData.underwriter_id]) ?? "—";
  const closerName = (loanData.closer_id && teamProfiles[loanData.closer_id]) ?? "—";

  const loanTypeLabel = LOAN_DB_TYPES.find((t) => t.value === loanData.type)?.label ?? (loanData.type ?? "—").replace(/_/g, " ");

  // Condition summary for the header
  const condTotal = conditions.length;
  const condComplete = conditions.filter(
    (c: any) => c.status === "approved" || c.status === "waived"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Loan ${loanData.loan_number}`}
        description={`${loanData.property_address ?? "No address"} — ${borrowerName}`}
      />

      {/* Stage Tracker */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <LoanStageTracker currentStage={loanData.stage} />
        </CardContent>
      </Card>

      {/* Overview Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Loan Overview</CardTitle>
            <div className="flex items-center gap-2">
              {loanData.priority === "hot" && (
                <Badge className="bg-red-100 text-red-800 border-red-200 gap-1">
                  <Flame className="h-3 w-3" />
                  Hot
                </Badge>
              )}
              {loanData.priority === "on_hold" && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1">
                  <Pause className="h-3 w-3" />
                  On Hold
                </Badge>
              )}
              <StatusBadge status={loanData.stage} />
              {condTotal > 0 && (
                <Badge variant="outline" className="text-xs">
                  {condComplete}/{condTotal} conditions
                </Badge>
              )}
              <GenerateTermSheetButton
                loanId={loanData.id}
                loanNumber={loanData.loan_number}
                borrowerLastName={borrowerRaw?.last_name}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-y-4 gap-x-6">
            <DetailField label="Loan Number" value={loanData.loan_number ?? "—"} />
            <DetailField label="Borrower" value={borrowerName} />
            <DetailField label="Type" value={loanTypeLabel} />
            <DetailField
              label="Stage"
              value={
                LOAN_STAGE_LABELS[
                  loanData.stage as keyof typeof LOAN_STAGE_LABELS
                ] || loanData.stage
              }
            />
            <DetailField
              label="Loan Amount"
              value={formatCurrency(loanData.loan_amount)}
            />
            <DetailField
              label="Purchase Price"
              value={formatCurrency(loanData.purchase_price)}
            />
            <DetailField
              label="Appraised Value"
              value={formatCurrency(loanData.appraised_value)}
            />
            <DetailField label="LTV" value={formatPercent(loanData.ltv)} />
            <DetailField
              label="Interest Rate"
              value={formatPercent(loanData.interest_rate)}
            />
            <DetailField label="Points" value={loanData.points ? `${loanData.points}%` : "—"} />
            <DetailField label="Term" value={loanData.loan_term_months ? `${loanData.loan_term_months} months` : "—"} />
            <DetailField
              label="Expected Close"
              value={formatDate(loanData.expected_close_date)}
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
              value={formatDate(loanData.application_date)}
            />
            <DetailField
              label="Approval Date"
              value={formatDate(loanData.approval_date)}
            />
            <DetailField
              label="Origination Date"
              value={formatDate(loanData.origination_date)}
            />
            <DetailField
              label="Maturity Date"
              value={formatDate(loanData.maturity_date)}
            />
          </div>

          {/* Next action / blocker */}
          {loanData.next_action && (
            <>
              <Separator className="my-4" />
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs font-medium text-amber-800 mb-0.5">
                  Next Action / Blocker
                </p>
                <p className="text-sm text-amber-900">{loanData.next_action}</p>
              </div>
            </>
          )}

          {loanData.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Internal Notes
                </p>
                <p className="text-sm">{loanData.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions + Tabbed Data */}
      <LoanDetailActions
        loan={{
          id: loanData.id,
          loan_number: loanData.loan_number,
          borrower_id: loanData.borrower_id,
          borrower_name: borrowerName,
          loan_type: loanData.type,
          property_address: loanData.property_address,
          property_city: loanData.property_city,
          property_state: loanData.property_state,
          property_zip: loanData.property_zip,
          loan_amount: loanData.loan_amount,
          interest_rate: loanData.interest_rate,
          term_months: loanData.loan_term_months,
          origination_date: loanData.origination_date,
          maturity_date: loanData.maturity_date,
          stage: loanData.stage,
          ltv: loanData.ltv,
          appraised_value: loanData.appraised_value,
          notes: loanData.notes,
          purchase_price: loanData.purchase_price,
          points: loanData.points,
          after_repair_value: loanData.after_repair_value ?? loanData.arv,
          rehab_budget: loanData.rehab_budget,
          property_type: loanData.property_type,
          heated_sqft: (loanData as Record<string, unknown>).heated_sqft as number | null,
          annual_property_tax: loanData.annual_property_tax,
          annual_insurance: loanData.annual_insurance,
          monthly_hoa: loanData.monthly_hoa,
          monthly_utilities: loanData.monthly_utilities,
          holding_period_months: loanData.holding_period_months,
          sales_disposition_pct: loanData.sales_disposition_pct,
          mobilization_draw: loanData.mobilization_draw,
          lender_fees_flat: loanData.lender_fees_flat,
          title_closing_escrow: loanData.title_closing_escrow,
          num_partners: loanData.num_partners,
          credit_score: loanData.credit_score,
          experience_count: loanData.experience_deals_24mo,
        }}
        drawRequests={drawRequests}
        payments={payments}
        documents={documents}
        conditions={conditions}
        activityLog={activityLog}
        currentUserId={user.id}
        loanId={loanData.id}
        programs={programs}
        adjusters={adjusters}
        loanForPricing={{
          id: loanData.id,
          purchase_price: loanData.purchase_price,
          rehab_budget: loanData.rehab_budget,
          after_repair_value: loanData.after_repair_value,
          arv: loanData.arv,
          credit_score: loanData.credit_score,
          experience_deals_24mo: loanData.experience_deals_24mo,
          legal_status: loanData.legal_status,
          property_type: loanData.property_type,
          flood_zone: loanData.flood_zone,
          is_in_flood_zone: loanData.is_in_flood_zone,
          rural_status: loanData.rural_status,
          holding_period_months: loanData.holding_period_months,
          loan_term_months: loanData.loan_term_months,
          requested_loan_amount: loanData.requested_loan_amount,
          loan_amount: loanData.loan_amount,
          heated_sqft: loanData.heated_sqft,
          mobilization_draw: loanData.mobilization_draw,
          annual_property_tax: loanData.annual_property_tax,
          annual_insurance: loanData.annual_insurance,
          monthly_utilities: loanData.monthly_utilities,
          monthly_hoa: loanData.monthly_hoa,
          title_closing_escrow: loanData.title_closing_escrow,
          lender_fees_flat: loanData.lender_fees_flat,
          sales_disposition_pct: loanData.sales_disposition_pct,
          num_partners: loanData.num_partners,
          program_id: loanData.program_id,
        }}
        underwritingVersions={underwritingVersions}
        emails={emails}
        borrowerEmail={borrowerEmail}
        borrowerName={borrowerName}
        currentUserName={currentUserName}
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
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium capitalize">{value}</p>
    </div>
  );
}
