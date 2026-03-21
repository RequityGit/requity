"use client";

import { useMemo } from "react";
import { SectionCard, fmtCurrency } from "@/components/pipeline/tabs/financials/shared";
import { Users, ShieldCheck, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LoanProgram, ResidentialDealInputs } from "@/lib/residential-uw/types";

export interface BorrowerEligibilitySectionProps {
  dealInputs: ResidentialDealInputs;
  selectedProgram: LoanProgram;
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="text-[13px] font-medium num">{value}</span>
    </div>
  );
}

export function BorrowerEligibilitySection({
  dealInputs,
  selectedProgram,
}: BorrowerEligibilitySectionProps) {
  const checks = useMemo(
    () => [
      {
        label: "Minimum Credit Score",
        requirement: selectedProgram.min_fico ? `${selectedProgram.min_fico} FICO` : "None",
        actual:
          dealInputs.fico_score != null && dealInputs.fico_score > 0
            ? dealInputs.fico_score.toString()
            : "N/A",
        pass:
          !selectedProgram.min_fico || (dealInputs.fico_score || 0) >= selectedProgram.min_fico,
      },
      {
        label: "Minimum Experience",
        requirement: selectedProgram.min_experience_years
          ? `${selectedProgram.min_experience_years}+ years`
          : "None",
        actual: dealInputs.real_estate_experience_years
          ? `${dealInputs.real_estate_experience_years} years`
          : "N/A",
        pass:
          !selectedProgram.min_experience_years ||
          (dealInputs.real_estate_experience_years || 0) >= selectedProgram.min_experience_years,
      },
      {
        label: "Citizenship",
        requirement:
          selectedProgram.citizenship_required === "us_citizen"
            ? "US Citizen"
            : selectedProgram.citizenship_required === "permanent_resident"
              ? "US Citizen / PR"
              : "Any",
        actual: dealInputs.is_us_citizen ? "US Citizen" : "Non-US",
        pass:
          selectedProgram.citizenship_required === "any" || dealInputs.is_us_citizen === true,
      },
      {
        label: "Entity Required",
        requirement:
          selectedProgram.entity_type === "llc"
            ? "LLC"
            : selectedProgram.entity_type === "corp"
              ? "Corporation"
              : "LLC / Corp",
        actual: "LLC",
        pass: true,
      },
      {
        label: "Appraisal",
        requirement: selectedProgram.appraisal_required ? "Full Appraisal Required" : "BPO Accepted",
        actual: "Pending",
        pass: true,
      },
    ],
    [dealInputs, selectedProgram]
  );

  const failCount = checks.filter((c) => !c.pass).length;
  const allPass = failCount === 0;

  const ficoDisplay =
    dealInputs.fico_score != null && dealInputs.fico_score > 0
      ? dealInputs.fico_score.toString()
      : "N/A";
  const experienceDisplay = dealInputs.real_estate_experience_years
    ? `${dealInputs.real_estate_experience_years} years`
    : "N/A";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionCard title="Borrower Profile" icon={Users}>
        <ProfileRow label="Credit Score (FICO)" value={ficoDisplay} />
        <ProfileRow label="Real Estate Experience" value={experienceDisplay} />
        <ProfileRow
          label="Citizenship / Residency"
          value={dealInputs.is_us_citizen ? "US Citizen" : "Non-US"}
        />
        <ProfileRow label="Entity Type" value="LLC" />
        <ProfileRow label="Liquidity Verified" value={fmtCurrency(dealInputs.liquid_reserves)} />
        <ProfileRow label="Net Worth" value={fmtCurrency(dealInputs.net_worth)} />
      </SectionCard>

      <SectionCard title="Eligibility Check" icon={ShieldCheck}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <div className="rq-section-title text-[13px]">{selectedProgram.name}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Program requirements vs borrower</p>
            </div>
            {allPass ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCircle className="h-3.5 w-3.5" strokeWidth={2} />
                All Passed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-red-700 dark:bg-red-950/40 dark:text-red-400">
                <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
                {failCount} Failed
              </span>
            )}
          </div>

          <ul className="space-y-3">
            {checks.map((c) => (
              <li
                key={c.label}
                className="flex items-start gap-3 rounded-lg border border-border/80 p-3"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    c.pass
                      ? "bg-emerald-50 dark:bg-emerald-950/50"
                      : "bg-red-50 dark:bg-red-950/50"
                  )}
                >
                  {c.pass ? (
                    <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium">{c.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Required: {c.requirement}</div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-medium num">{c.actual}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </SectionCard>
    </div>
  );
}
