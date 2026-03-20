"use client";

import { Landmark, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MonoValue } from "../contact-detail-shared";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
import { STATUS_CONFIG } from "../types";
import type { LoanData, InvestorCommitmentData } from "../types";

interface DetailDealsTabProps {
  loans: LoanData[];
  commitments: InvestorCommitmentData[];
}

export function DetailDealsTab({ loans, commitments }: DetailDealsTabProps) {
  const pipelineTotal = loans.reduce((a, d) => a + (d.loan_amount || 0), 0);
  const commitmentTotal = commitments.reduce(
    (a, c) => a + (c.commitment_amount || 0),
    0
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Loans & Deals */}
      <Card className="rounded-xl border-border overflow-hidden">
        <CardHeader className="px-5 py-3.5 border-b border-border/60">
          <CardTitle className="text-[13px] font-semibold text-foreground flex items-center gap-2">
            <Landmark
              size={16}
              className="text-muted-foreground"
              strokeWidth={1.5}
            />
            Loans & Deals
          </CardTitle>
        </CardHeader>
        {loans.length === 0 ? (
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No loans or deals found.
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["Deal", "Stage", "Amount", "Rate", "LTV", "Type"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide"
                        style={{
                          textAlign: ["Amount", "Rate", "LTV"].includes(h)
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
                {loans.map((d) => {
                  const stageConfig = d.stage
                    ? STATUS_CONFIG[d.stage] || STATUS_CONFIG.draft
                    : STATUS_CONFIG.draft;
                  const stageLabel = d.stage
                    ? d.stage.replace(/_/g, " ")
                    : "—";
                  return (
                    <tr
                      key={d.id}
                      className="border-b border-border/40 hover:bg-muted/50 cursor-pointer"
                    >
                      <td className="px-4 py-3 text-[13px] font-medium text-foreground">
                        {d.property_address || d.loan_number || "Untitled"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className="text-[11px] gap-1 px-1.5 py-0 h-5"
                          style={{
                            color: stageConfig.text,
                            borderColor: `${stageConfig.text}30`,
                            backgroundColor: stageConfig.bg,
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: stageConfig.dot }}
                          />
                          {stageLabel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <MonoValue className="text-[13px] font-medium">
                          {formatCurrency(d.loan_amount)}
                        </MonoValue>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <MonoValue className="text-[13px]">
                          {d.interest_rate != null
                            ? formatPercent(d.interest_rate)
                            : "—"}
                        </MonoValue>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <MonoValue className="text-[13px]">
                          {d.ltv != null ? `${d.ltv}%` : "—"}
                        </MonoValue>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground capitalize">
                        {d.type || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-2.5 border-t border-border flex justify-between text-xs text-muted-foreground">
              <span>
                {loans.length} deal{loans.length !== 1 ? "s" : ""}
              </span>
              <MonoValue className="font-medium">
                Pipeline: {formatCurrency(pipelineTotal)}
              </MonoValue>
            </div>
          </div>
        )}
      </Card>

      {/* Investor Commitments */}
      {commitments.length > 0 && (
        <Card className="rounded-xl border-border overflow-hidden">
          <CardHeader className="px-5 py-3.5 border-b border-border/60">
            <CardTitle className="text-[13px] font-semibold text-foreground flex items-center gap-2">
              <TrendingUp
                size={16}
                className="text-muted-foreground"
                strokeWidth={1.5}
              />
              Investor Commitments
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Fund",
                    "Status",
                    "Committed",
                    "Funded",
                    "Unfunded",
                    "Date",
                    "Entity",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide"
                      style={{
                        textAlign: ["Committed", "Funded", "Unfunded"].includes(
                          h
                        )
                          ? "right"
                          : "left",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commitments.map((c) => (
                  <tr key={c.id} className="border-b border-border/40">
                    <td className="px-4 py-3 text-[13px] font-medium text-foreground">
                      {c.fund_name || "Unknown Fund"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className="text-[11px] gap-1 px-1.5 py-0 h-5"
                        style={{
                          color: "#22A861",
                          borderColor: "#22A86130",
                          backgroundColor: "#22A86108",
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: "#22A861" }}
                        />
                        {c.status || "—"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MonoValue className="text-[13px] font-medium">
                        {formatCurrency(c.commitment_amount)}
                      </MonoValue>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MonoValue className="text-[13px]">
                        {formatCurrency(c.funded_amount)}
                      </MonoValue>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MonoValue className="text-[13px]">
                        {formatCurrency(c.unfunded_amount)}
                      </MonoValue>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(c.commitment_date)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {c.entity_name || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 border-t border-border flex justify-between text-xs text-muted-foreground">
              <span>
                {commitments.length} commitment
                {commitments.length !== 1 ? "s" : ""}
              </span>
              <MonoValue className="font-medium">
                Total: {formatCurrency(commitmentTotal)}
              </MonoValue>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
