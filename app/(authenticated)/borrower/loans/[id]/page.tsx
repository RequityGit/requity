import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LoanStageTracker } from "@/components/shared/loan-stage-tracker";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  formatCurrency,
  formatDate,
  formatPercent,
} from "@/lib/format";
import { LOAN_TYPES } from "@/lib/constants";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LoanDetailTabs } from "@/components/borrower/loan-detail-tabs";

interface LoanDetailPageProps {
  params: { id: string };
}

export default async function LoanDetailPage({ params }: LoanDetailPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch loan and verify ownership (profile_id links loan to auth user)
  const { data: loan } = await supabase
    .from("loans")
    .select("*")
    .eq("id", params.id)
    .eq("profile_id", user.id)
    .single();

  if (!loan) {
    notFound();
  }

  // Fetch payments for this loan
  const { data: payments } = await supabase
    .from("loan_payments")
    .select("*")
    .eq("loan_id", loan.id)
    .order("due_date", { ascending: false });

  // Fetch documents for this loan
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("loan_id", loan.id)
    .order("created_at", { ascending: false });

  const loanTypeLabel =
    LOAN_TYPES.find((t) => t.value === loan.type)?.label ?? loan.type ?? "—";

  const fullAddress = [
    loan.property_address,
    loan.property_city,
    loan.property_state,
    loan.property_zip,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <PageHeader
        title={loan.property_address ?? "Loan Details"}
        description={`Loan #${loan.loan_number ?? "—"} - ${loanTypeLabel}`}
        action={
          <Link href="/borrower/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        }
      />

      {/* Loan Stage Tracker */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <LoanStageTracker currentStage={loan.stage} />
        </CardContent>
      </Card>

      {/* Loan Details */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Loan Details</CardTitle>
            <StatusBadge status={loan.stage} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Financial Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#1a2b4a]">
                Financial
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loan Amount</span>
                  <span className="font-medium">
                    {formatCurrency(loan.loan_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interest Rate</span>
                  <span className="font-medium">
                    {formatPercent(loan.interest_rate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Term</span>
                  <span className="font-medium">
                    {loan.loan_term_months} months
                  </span>
                </div>
                {loan.ltv != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">LTV</span>
                    <span className="font-medium">
                      {formatPercent(loan.ltv)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Property Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#1a2b4a]">
                Property
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <span className="font-medium text-right max-w-[60%]">
                    {fullAddress}
                  </span>
                </div>
                {loan.appraised_value != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Appraised Value
                    </span>
                    <span className="font-medium">
                      {formatCurrency(loan.appraised_value)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#1a2b4a]">Dates</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Origination Date
                  </span>
                  <span className="font-medium">
                    {formatDate(loan.origination_date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maturity Date</span>
                  <span className="font-medium">
                    {formatDate(loan.maturity_date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {formatDate(loan.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments & Documents Tabs */}
      <LoanDetailTabs
        payments={payments ?? []}
        documents={documents ?? []}
      />
    </div>
  );
}
