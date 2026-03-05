"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, Column } from "@/components/shared/data-table";
import { formatCurrencyDetailed, formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Calculator,
  CalendarDays,
} from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface PayoffStatementGeneratorProps {
  loanId: string;
  loan: any;
}

interface FeeDefault {
  id: string;
  fee_name: string;
  fee_label: string;
  default_amount: number;
  is_active: boolean;
  sort_order: number;
}

interface PayoffStatement {
  id: string;
  loan_id: string;
  unpaid_principal: number;
  accrued_interest: number;
  outstanding_late_fees: number;
  prepayment_penalty: number;
  exit_fee: number;
  release_fee: number;
  wire_fee: number;
  other_fees: number;
  total_payoff: number;
  per_diem: number;
  interest_rate: number;
  good_through_date: string;
  generated_at: string;
  generated_by: string | null;
  file_url: string | null;
  storage_path: string | null;
  status: string;
  sent_at: string | null;
  sent_to: string | null;
  notes: string | null;
}

// Default good-through date: 10 days from today
function getDefaultGoodThroughDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 10);
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

const STATUS_STYLES: Record<string, { dot: string; bg: string; text: string }> = {
  generated: { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
  sent: { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  paid: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  expired: { dot: "bg-muted-foreground", bg: "bg-muted", text: "text-muted-foreground" },
  voided: { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700" },
};

export function PayoffStatementGenerator({ loanId, loan }: PayoffStatementGeneratorProps) {
  const supabase = createClient();

  // Panel state
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFeeOverrides, setShowFeeOverrides] = useState(false);

  // Generator state
  const [goodThroughDateStr, setGoodThroughDateStr] = useState(getDefaultGoodThroughDate);
  const [feeDefaults, setFeeDefaults] = useState<FeeDefault[]>([]);
  const [feeOverrides, setFeeOverrides] = useState<Record<string, string>>({});
  const [otherFees, setOtherFees] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // History state
  const [statements, setStatements] = useState<PayoffStatement[]>([]);
  const [loadingStatements, setLoadingStatements] = useState(true);

  // Feedback
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Load fee defaults and statement history
  const loadData = useCallback(async () => {
    const db = supabase as any;

    const [feesResult, statementsResult] = await Promise.all([
      db
        .from("payoff_fee_defaults")
        .select("*")
        .eq("is_active", true)
        .order("sort_order"),
      db
        .from("payoff_statements")
        .select("*")
        .eq("loan_id", loanId)
        .order("generated_at", { ascending: false }),
    ]);

    if (feesResult.data) setFeeDefaults(feesResult.data);
    if (statementsResult.data) setStatements(statementsResult.data);
    setLoadingStatements(false);
  }, [supabase, loanId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Preview calculations ─────────────────────────────────────

  const upb = loan?.current_balance ?? 0;
  const rate = loan?.effective_rate ?? loan?.interest_rate ?? 0;
  // interest_rate is stored as decimal (e.g., 0.12 for 12%)
  const ratePercent = rate > 1 ? rate : rate * 100;
  const perDiem = (upb * ratePercent / 100) / 360;

  // Days from 1st of current month to good-through date
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  // Parse selected date (YYYY-MM-DD) in local time
  const [gtYear, gtMonth, gtDay] = goodThroughDateStr.split("-").map(Number);
  const goodThroughDate = new Date(gtYear, gtMonth - 1, gtDay);
  const goodThroughDays = Math.ceil(
    (goodThroughDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const accrualDays = Math.ceil(
    (goodThroughDate.getTime() - firstOfMonth.getTime()) / (1000 * 60 * 60 * 24)
  );
  const accruedInterest = perDiem * accrualDays;

  // Fee amounts: use override if present, else default
  const getFeeAmount = (feeName: string): number => {
    if (feeOverrides[feeName] !== undefined && feeOverrides[feeName] !== "") {
      return parseFloat(feeOverrides[feeName]) || 0;
    }
    const def = feeDefaults.find((f) => f.fee_name === feeName);
    return def?.default_amount ?? 0;
  };

  const releaseFee = getFeeAmount("release_reconveyance");
  const wireFee = getFeeAmount("wire_fee");
  const exitFee = getFeeAmount("exit_fee");
  const prepayPenalty = getFeeAmount("prepayment_penalty");
  const otherFeesAmount = parseFloat(otherFees) || 0;

  const totalPayoff = upb + accruedInterest + releaseFee + wireFee + exitFee + prepayPenalty + otherFeesAmount;

  // ── Generate payoff statement ────────────────────────────────

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setErrorMessage("Not authenticated. Please refresh the page and try again.");
        return;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      // Build fee overrides — only include if user changed values
      const overrides: Record<string, number> = {};
      for (const [key, val] of Object.entries(feeOverrides)) {
        if (val !== "") {
          overrides[key] = parseFloat(val) || 0;
        }
      }
      if (otherFeesAmount > 0) {
        overrides.other_fees = otherFeesAmount;
      }

      const res = await fetch(
        `${supabaseUrl}/functions/v1/generate-payoff-statement`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            loan_id: loanId,
            good_through_days: goodThroughDays,
            good_through_date: goodThroughDateStr,
            ...(Object.keys(overrides).length > 0 && { fee_overrides: overrides }),
          }),
        }
      );

      const result = await res.json();

      if (!res.ok || !result.success) {
        setErrorMessage(result.error || "Failed to generate payoff statement.");
        return;
      }

      setSuccessMessage(
        `Payoff statement generated — Total: ${formatCurrencyDetailed(result.summary?.total_payoff)}`
      );

      // Refresh statement history
      await loadData();

      // Auto-download the PDF
      if (result.download_url) {
        window.open(result.download_url, "_blank");
      }
    } catch (err: any) {
      console.error("Generate payoff error:", err);
      setErrorMessage(err?.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Status actions ───────────────────────────────────────────

  const updateStatus = async (statementId: string, status: string) => {
    const db = supabase as any;
    const updates: Record<string, any> = { status };
    if (status === "sent") updates.sent_at = new Date().toISOString();

    const { error } = await db
      .from("payoff_statements")
      .update(updates)
      .eq("id", statementId);

    if (error) {
      setErrorMessage(`Failed to update status: ${error.message}`);
      return;
    }
    await loadData();
  };

  const handleDownload = async (statement: PayoffStatement) => {
    if (statement.file_url) {
      window.open(statement.file_url, "_blank");
      return;
    }
    // If URL expired, regenerate from storage_path
    if (statement.storage_path) {
      const { data } = await supabase.storage
        .from("loan-documents")
        .createSignedUrl(statement.storage_path, 60 * 60 * 24 * 7);
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      } else {
        setErrorMessage("Could not generate download URL.");
      }
    }
  };

  // ── History table columns ────────────────────────────────────

  const historyColumns: Column<PayoffStatement>[] = [
    {
      key: "generated_at",
      header: "Date",
      cell: (r) => formatDate(r.generated_at),
    },
    {
      key: "good_through_date",
      header: "Good Through",
      cell: (r) => formatDate(r.good_through_date),
    },
    {
      key: "total_payoff",
      header: "Total Payoff",
      cell: (r) => (
        <span className="num font-medium">
          {formatCurrencyDetailed(r.total_payoff)}
        </span>
      ),
    },
    {
      key: "per_diem",
      header: "Per Diem",
      cell: (r) => (
        <span className="num text-sm">
          {formatCurrencyDetailed(r.per_diem)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => {
        const style = STATUS_STYLES[r.status] || STATUS_STYLES.generated;
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(r);
            }}
            title="Download PDF"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          {r.status === "generated" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                updateStatus(r.id, "sent");
              }}
              title="Mark as Sent"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
          {(r.status === "generated" || r.status === "sent") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                updateStatus(r.id, "paid");
              }}
              title="Mark as Paid"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </Button>
          )}
          {r.status !== "voided" && r.status !== "paid" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                updateStatus(r.id, "voided");
              }}
              title="Void"
            >
              <XCircle className="h-3.5 w-3.5 text-red-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ── No loan in servicing ─────────────────────────────────────

  if (!loan) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            This loan is not in the servicing system. Payoff statements are only available for servicing loans.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with toggle button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Payoff Statement Generator
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-1.5"
        >
          <FileText className="h-3.5 w-3.5" />
          Generate Payoff Quote
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Success / Error banners */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {successMessage}
          <button
            onClick={() => setSuccessMessage("")}
            className="ml-auto text-emerald-600 hover:text-emerald-800"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {errorMessage}
          <button
            onClick={() => setErrorMessage("")}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Generator Panel */}
      {isExpanded && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Generate Payoff Quote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Good-through date picker */}
            <div className="space-y-2">
              <Label htmlFor="good-through-date" className="text-sm font-medium flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                Payoff Good Through Date
              </Label>
              <Input
                id="good-through-date"
                type="date"
                min={getTodayString()}
                value={goodThroughDateStr}
                onChange={(e) => setGoodThroughDateStr(e.target.value)}
                className="w-full md:w-[220px]"
              />
              <p className="text-xs text-muted-foreground">
                Statement valid through:{" "}
                {goodThroughDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                {goodThroughDays > 0 && ` (${goodThroughDays} day${goodThroughDays !== 1 ? "s" : ""} from today)`}
              </p>
            </div>

            {/* Live Preview Breakdown */}
            <div className="rounded-lg border bg-[#F7F7F8] p-4 space-y-3">
              <h4 className="text-sm font-semibold text-[#1A1A1A]">Payoff Breakdown (Preview)</h4>

              <div className="space-y-2">
                <PreviewRow
                  label="Unpaid Principal Balance (UPB)"
                  amount={upb}
                />
                <PreviewRow
                  label={`Accrued Interest (${accrualDays} days × ${formatCurrencyDetailed(perDiem)}/day)`}
                  amount={accruedInterest}
                />
                {releaseFee > 0 && (
                  <PreviewRow label="Release / Reconveyance Fee" amount={releaseFee} />
                )}
                {wireFee > 0 && (
                  <PreviewRow label="Wire Fee" amount={wireFee} />
                )}
                {exitFee > 0 && (
                  <PreviewRow label="Exit Fee" amount={exitFee} />
                )}
                {prepayPenalty > 0 && (
                  <PreviewRow label="Prepayment Penalty" amount={prepayPenalty} />
                )}
                {otherFeesAmount > 0 && (
                  <PreviewRow label="Other Fees / Adjustments" amount={otherFeesAmount} />
                )}

                <div className="border-t border-[#E5E5E7] pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-[#1A1A1A]">Total Payoff</span>
                    <span className="num text-base font-bold text-[#1A1A1A]">
                      {formatCurrencyDetailed(totalPayoff)}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#9B9B9B]">
                Per diem: <span className="num">{formatCurrencyDetailed(perDiem)}</span> /day
                &mdash; Interest calculated on 30/360 basis
              </p>
            </div>

            {/* Collapsible Fee Overrides */}
            <div>
              <button
                onClick={() => setShowFeeOverrides(!showFeeOverrides)}
                className="flex items-center gap-1.5 text-sm font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
              >
                {showFeeOverrides ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                Fee Overrides
              </button>

              {showFeeOverrides && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feeDefaults.map((fee) => (
                    <div key={fee.id} className="space-y-1">
                      <Label className="text-xs text-[#6B6B6B]">{fee.fee_label}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={fee.default_amount.toFixed(2)}
                        value={feeOverrides[fee.fee_name] ?? ""}
                        onChange={(e) =>
                          setFeeOverrides((prev) => ({
                            ...prev,
                            [fee.fee_name]: e.target.value,
                          }))
                        }
                        className="num"
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <Label className="text-xs text-[#6B6B6B]">Other Fees / Adjustments</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={otherFees}
                      onChange={(e) => setOtherFees(e.target.value)}
                      className="num"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full md:w-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate &amp; Save Payoff Statement
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payoff Statement History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Payoff Statement History</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStatements ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              columns={historyColumns}
              data={statements}
              emptyMessage="No payoff statements have been generated for this loan yet."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Helper component ───────────────────────────────────────────

function PreviewRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-[#6B6B6B]">{label}</span>
      <span className="num font-medium text-[#1A1A1A]">
        {formatCurrencyDetailed(amount)}
      </span>
    </div>
  );
}
