"use client";

import { Landmark, TrendingUp } from "lucide-react";
import { SectionCard, DotPill, MonoValue } from "../contact-detail-shared";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
import { STATUS_CONFIG } from "../types";
import type { LoanData, InvestorCommitmentData } from "../types";

interface DetailDealsTabProps {
  loans: LoanData[];
  commitments: InvestorCommitmentData[];
}

export function DetailDealsTab({ loans, commitments }: DetailDealsTabProps) {
  const pipelineTotal = loans.reduce((a, d) => a + (d.loan_amount || 0), 0);
  const commitmentTotal = commitments.reduce((a, c) => a + (c.commitment_amount || 0), 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Loans & Opportunities */}
      <SectionCard title="Loans & Opportunities" icon={Landmark} noPad>
        {loans.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#6B6B6B]">
            No loans or opportunities found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E7]">
                  {["Deal", "Stage", "Amount", "Rate", "LTV", "Type"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-[11px] font-semibold text-[#8B8B8B] uppercase tracking-wide"
                      style={{
                        textAlign: ["Amount", "Rate", "LTV"].includes(h) ? "right" : "left",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loans.map((d) => {
                  const stageConfig = d.stage ? STATUS_CONFIG[d.stage] || STATUS_CONFIG.draft : STATUS_CONFIG.draft;
                  const stageLabel = d.stage ? d.stage.replace(/_/g, " ") : "—";
                  return (
                    <tr key={d.id} className="border-b border-[#F7F7F8] hover:bg-[#FAFAFA] cursor-pointer">
                      <td className="px-4 py-3 text-[13px] font-medium text-[#1A1A1A]">
                        {d.property_address || d.loan_number || "Untitled"}
                      </td>
                      <td className="px-4 py-3">
                        <DotPill color={stageConfig.dot} label={stageLabel} small />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <MonoValue className="text-[13px] font-medium">{formatCurrency(d.loan_amount)}</MonoValue>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <MonoValue className="text-[13px]">
                          {d.interest_rate != null ? formatPercent(d.interest_rate) : "—"}
                        </MonoValue>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <MonoValue className="text-[13px]">
                          {d.ltv != null ? `${d.ltv}%` : "—"}
                        </MonoValue>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#6B6B6B] capitalize">
                        {d.type || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-2.5 border-t border-[#E5E5E7] flex justify-between text-xs text-[#8B8B8B]">
              <span>{loans.length} deal{loans.length !== 1 ? "s" : ""}</span>
              <MonoValue className="font-medium">Pipeline: {formatCurrency(pipelineTotal)}</MonoValue>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Investor Commitments */}
      {commitments.length > 0 && (
        <SectionCard title="Investor Commitments" icon={TrendingUp} noPad>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E7]">
                  {["Fund", "Status", "Committed", "Funded", "Unfunded", "Date", "Entity"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-[11px] font-semibold text-[#8B8B8B] uppercase tracking-wide"
                        style={{
                          textAlign: ["Committed", "Funded", "Unfunded"].includes(h)
                            ? "right"
                            : "left",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {commitments.map((c) => (
                  <tr key={c.id} className="border-b border-[#F7F7F8]">
                    <td className="px-4 py-3 text-[13px] font-medium text-[#1A1A1A]">
                      {c.fund_name || "Unknown Fund"}
                    </td>
                    <td className="px-4 py-3">
                      <DotPill color="#22A861" label={c.status || "—"} small />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MonoValue className="text-[13px] font-medium">
                        {formatCurrency(c.commitment_amount)}
                      </MonoValue>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MonoValue className="text-[13px]">{formatCurrency(c.funded_amount)}</MonoValue>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MonoValue className="text-[13px]">{formatCurrency(c.unfunded_amount)}</MonoValue>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#8B8B8B]">
                      {formatDate(c.commitment_date)}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6B6B6B]">
                      {c.entity_name || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 border-t border-[#E5E5E7] flex justify-between text-xs text-[#8B8B8B]">
              <span>{commitments.length} commitment{commitments.length !== 1 ? "s" : ""}</span>
              <MonoValue className="font-medium">Total: {formatCurrency(commitmentTotal)}</MonoValue>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
