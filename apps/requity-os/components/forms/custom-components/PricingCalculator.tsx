"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/format";
import { parseCurrency, calculateTerms, qualifyForProgram, LOAN_PROGRAMS } from "@repo/lib/src/pricing";
import type { CustomFieldComponentProps } from "./index";

export function PricingCalculator({
  field,
  formData,
}: CustomFieldComponentProps) {
  const config = (field.component_config || {}) as {
    loan_type_field?: string;
    credit_score_field?: string;
    deals_24_months_field?: string;
    citizenship_field?: string;
    purchase_price_field?: string;
    rehab_budget_field?: string;
    arv_field?: string;
    loan_amount_field?: string;
  };

  const loanTypeField = config.loan_type_field || "loan_type";
  const creditScoreField = config.credit_score_field || "credit_score";
  const deals24MonthsField = config.deals_24_months_field || "deals_in_last_24_months";
  const citizenshipField = config.citizenship_field || "citizenship_status";
  const purchasePriceField = config.purchase_price_field || "purchase_price";
  const rehabBudgetField = config.rehab_budget_field || "rehab_budget";
  const arvField = config.arv_field || "after_repair_value";
  const loanAmountField = config.loan_amount_field || "loan_amount";

  const loanType = String(formData[loanTypeField] || "");
  const creditScore = String(formData[creditScoreField] || "");
  const deals24Months = String(formData[deals24MonthsField] || "");
  const citizenship = String(formData[citizenshipField] || "");
  const purchasePrice = parseCurrency(String(formData[purchasePriceField] || "0"));
  const rehabBudget = parseCurrency(String(formData[rehabBudgetField] || "0"));
  const arv = parseCurrency(String(formData[arvField] || "0"));
  const loanAmount = parseCurrency(String(formData[loanAmountField] || "0"));

  const generatedTerms = useMemo(() => {
    if (!loanType || !creditScore || !deals24Months || !citizenship) {
      return null;
    }

    const form = {
      loanType,
      creditScore,
      dealsInLast24Months: deals24Months,
      citizenshipStatus: citizenship,
      purchasePrice: String(purchasePrice),
      rehabBudget: String(rehabBudget),
      afterRepairValue: String(arv),
      loanAmount: String(loanAmount),
    };

    const program = qualifyForProgram(form, LOAN_PROGRAMS);
    if (!program) return null;

    return calculateTerms(form, program);
  }, [loanType, creditScore, deals24Months, citizenship, purchasePrice, rehabBudget, arv, loanAmount]);

  if (!generatedTerms) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
        Complete borrower profile fields to see pricing
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{generatedTerms.programName}</CardTitle>
          <Badge variant="outline" className="text-xs">
            Auto-Qualified
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Interest Rate</div>
            <div className="text-lg font-semibold text-foreground">
              {formatPercent(generatedTerms.interestRate / 100)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Loan Amount</div>
            <div className="text-lg font-semibold text-foreground num">
              {formatCurrency(generatedTerms.estimatedLoan)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Term</div>
            <div className="text-lg font-semibold text-foreground">
              {generatedTerms.loanTermMonths} months
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Origination Fee</div>
            <div className="text-sm font-semibold text-foreground num">
              {generatedTerms.originationFee
                ? formatCurrency(generatedTerms.originationFee)
                : "—"}
            </div>
            {generatedTerms.originationFeeFloored && (
              <div className="text-xs text-amber-600 mt-0.5">Minimum fee applied</div>
            )}
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Monthly Interest</div>
            <div className="text-sm font-semibold text-foreground num">
              {generatedTerms.monthlyInterest ? formatCurrency(generatedTerms.monthlyInterest) : "—"}
            </div>
          </div>
        </div>

        {generatedTerms.capped && (
          <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2 text-xs text-amber-700 dark:text-amber-400">
            Loan amount capped at {formatCurrency(generatedTerms.maxLoan || 0)} based on LTV/LTC limits
          </div>
        )}
      </CardContent>
    </Card>
  );
}
