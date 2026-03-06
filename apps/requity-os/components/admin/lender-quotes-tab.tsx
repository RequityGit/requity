"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  formatCurrency,
  formatCurrencyDetailed,
  formatPercent,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { CreateQuoteDialog } from "@/components/admin/create-quote-dialog";
import {
  changeQuoteStatus,
  declineOtherQuotes,
} from "@/app/(authenticated)/admin/loans/[id]/quote-actions";
import {
  CheckCircle2,
  ExternalLink,
  Trophy,
  Loader2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import type { LenderQuote } from "@/lib/supabase/types";

interface Company {
  id: string;
  name: string;
}

interface LenderQuotesTabProps {
  quotes: LenderQuote[];
  loanId: string;
  companies: Company[];
}

const STATUS_LABELS: Record<string, string> = {
  request_for_quote: "Request for Quote",
  term_sheet_unsigned: "Term Sheet - Unsigned",
  term_sheet_accepted: "Term Sheet - Accepted",
  declined: "Declined",
  complete: "Complete",
};

const STATUS_COLORS: Record<string, string> = {
  request_for_quote: "bg-blue-100 text-blue-800 border-blue-200",
  term_sheet_unsigned: "bg-amber-100 text-amber-800 border-amber-200",
  term_sheet_accepted: "bg-green-100 text-green-800 border-green-200",
  declined: "bg-red-100 text-red-800 border-red-200",
  complete: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

function QuoteStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", STATUS_COLORS[status] ?? "")}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

// ── Helpers for comparison highlighting ─────────────────────────────────

function findBestWorst(
  quotes: LenderQuote[],
  field: keyof LenderQuote,
  lowerIsBetter: boolean
): { bestId: string | null; worstId: string | null } {
  const activeQuotes = quotes.filter(
    (q) => q.status !== "declined" && q[field] != null
  );
  if (activeQuotes.length < 2) return { bestId: null, worstId: null };

  const sorted = [...activeQuotes].sort((a, b) => {
    const aVal = a[field] as number;
    const bVal = b[field] as number;
    return lowerIsBetter ? aVal - bVal : bVal - aVal;
  });

  return {
    bestId: sorted[0]?.id ?? null,
    worstId: sorted[sorted.length - 1]?.id ?? null,
  };
}

function getCellHighlight(
  quoteId: string,
  bestId: string | null,
  worstId: string | null
): string {
  if (quoteId === bestId) return "bg-green-50 text-green-700 font-semibold";
  if (quoteId === worstId) return "bg-red-50 text-red-700";
  return "";
}

// ── Comparison rows config ──────────────────────────────────────────────

interface ComparisonRow {
  label: string;
  field: keyof LenderQuote;
  format: (val: unknown) => string;
  lowerIsBetter: boolean;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: "Loan Amount",
    field: "loan_amount",
    format: (v) => (v != null ? formatCurrency(v as number) : "—"),
    lowerIsBetter: false,
  },
  {
    label: "Interest Rate",
    field: "interest_rate",
    format: (v) => (v != null ? formatPercent(v as number) : "—"),
    lowerIsBetter: true,
  },
  {
    label: "Loan Term",
    field: "loan_term_months",
    format: (v) => (v != null ? `${v} mo` : "—"),
    lowerIsBetter: false,
  },
  {
    label: "IO Period",
    field: "interest_only_period_months",
    format: (v) => (v != null ? `${v} mo` : "—"),
    lowerIsBetter: false,
  },
  {
    label: "LTV",
    field: "ltv",
    format: (v) => (v != null ? formatPercent((v as number) * 100) : "—"),
    lowerIsBetter: false,
  },
  {
    label: "Amortization",
    field: "amortization_months",
    format: (v) => (v != null ? `${v} mo` : "—"),
    lowerIsBetter: false,
  },
  {
    label: "Origination Fee",
    field: "origination_fee",
    format: (v) => (v != null ? formatPercent(v as number) : "—"),
    lowerIsBetter: true,
  },
  {
    label: "UW / Processing Fee",
    field: "uw_processing_fee",
    format: (v) => (v != null ? formatCurrencyDetailed(v as number) : "—"),
    lowerIsBetter: true,
  },
  {
    label: "Requity Lending Fee",
    field: "requity_lending_fee",
    format: (v) => (v != null ? formatPercent(v as number) : "—"),
    lowerIsBetter: false,
  },
  {
    label: "Prepayment Penalty",
    field: "prepayment_penalty",
    format: (v) => (v as string) || "—",
    lowerIsBetter: false, // text field, no comparison
  },
  {
    label: "YM Spread",
    field: "ym_spread",
    format: (v) => (v != null ? formatPercent(v as number) : "—"),
    lowerIsBetter: true,
  },
];

export function LenderQuotesTab({
  quotes,
  loanId,
  companies,
}: LenderQuotesTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [pendingAcceptId, setPendingAcceptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activeQuotes = quotes.filter((q) => q.status !== "declined");
  const declinedQuotes = quotes.filter((q) => q.status === "declined");

  // Compute best/worst for each comparison field
  const highlights = COMPARISON_ROWS.reduce(
    (acc, row) => {
      if (row.field === "prepayment_penalty") {
        acc[row.field] = { bestId: null, worstId: null };
      } else {
        acc[row.field] = findBestWorst(quotes, row.field, row.lowerIsBetter);
      }
      return acc;
    },
    {} as Record<string, { bestId: string | null; worstId: string | null }>
  );

  // Calculate Requity fee income per quote
  function calcRequityFee(quote: LenderQuote): number | null {
    if (quote.loan_amount == null || quote.requity_lending_fee == null)
      return null;
    return quote.loan_amount * (quote.requity_lending_fee / 100);
  }

  // Company name lookup
  const companyMap = new Map(companies.map((c) => [c.id, c.name]));

  async function handleAcceptQuote(quoteId: string) {
    setPendingAcceptId(quoteId);
    setAcceptDialogOpen(true);
  }

  async function confirmAccept(declineOthers: boolean) {
    if (!pendingAcceptId) return;
    setLoading(true);

    try {
      const result = await changeQuoteStatus(
        pendingAcceptId,
        "term_sheet_accepted"
      );
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      if (declineOthers) {
        await declineOtherQuotes(pendingAcceptId, loanId);
      }

      toast({ title: "Quote accepted" });
      setAcceptDialogOpen(false);
      setPendingAcceptId(null);
      router.refresh();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (quotes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            No lender quotes yet for this deal.
          </p>
          <CreateQuoteDialog loanId={loanId} companies={companies} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            {quotes.length} quote{quotes.length !== 1 ? "s" : ""} |{" "}
            {activeQuotes.length} active
          </h3>
        </div>
        <CreateQuoteDialog loanId={loanId} companies={companies} />
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quote Comparison</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px] sticky left-0 bg-card z-10 border-r">
                    Term
                  </TableHead>
                  {quotes.map((q) => (
                    <TableHead
                      key={q.id}
                      className={cn(
                        "min-w-[180px] text-center",
                        q.status === "declined" && "opacity-50"
                      )}
                    >
                      <div className="space-y-1">
                        <Link
                          href={`/admin/loans/${loanId}/quotes/${q.id}`}
                          className="hover:underline font-medium text-sm text-foreground"
                        >
                          {q.quote_name}
                        </Link>
                        {q.lender_company_id && (
                          <p className="text-xs text-muted-foreground">
                            {companyMap.get(q.lender_company_id) ?? ""}
                          </p>
                        )}
                        <QuoteStatusBadge status={q.status} />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Status row */}
                <TableRow>
                  <TableCell className="font-medium text-xs text-muted-foreground sticky left-0 bg-card border-r">
                    Status
                  </TableCell>
                  {quotes.map((q) => (
                    <TableCell
                      key={q.id}
                      className={cn(
                        "text-center",
                        q.status === "declined" && "opacity-50"
                      )}
                    >
                      <QuoteStatusBadge status={q.status} />
                    </TableCell>
                  ))}
                </TableRow>

                {/* Lender Contact row */}
                <TableRow>
                  <TableCell className="font-medium text-xs text-muted-foreground sticky left-0 bg-card border-r">
                    Lender Contact
                  </TableCell>
                  {quotes.map((q) => (
                    <TableCell
                      key={q.id}
                      className={cn(
                        "text-center text-sm",
                        q.status === "declined" && "opacity-50"
                      )}
                    >
                      {q.lender_contact_name || "—"}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Comparison rows */}
                {COMPARISON_ROWS.map((row) => (
                  <TableRow key={row.field}>
                    <TableCell className="font-medium text-xs text-muted-foreground sticky left-0 bg-card border-r">
                      {row.label}
                    </TableCell>
                    {quotes.map((q) => {
                      const hl = highlights[row.field];
                      return (
                        <TableCell
                          key={q.id}
                          className={cn(
                            "text-center text-sm",
                            q.status === "declined"
                              ? "opacity-50"
                              : getCellHighlight(
                                  q.id,
                                  hl?.bestId ?? null,
                                  hl?.worstId ?? null
                                )
                          )}
                        >
                          {row.format(q[row.field])}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}

                {/* Requity Fee Income row */}
                <TableRow className="border-t-2">
                  <TableCell className="font-semibold text-xs text-foreground sticky left-0 bg-card border-r">
                    Requity Fee Income
                  </TableCell>
                  {quotes.map((q) => {
                    const fee = calcRequityFee(q);
                    return (
                      <TableCell
                        key={q.id}
                        className={cn(
                          "text-center text-sm font-semibold",
                          q.status === "declined"
                            ? "opacity-50"
                            : fee != null
                              ? "text-green-700"
                              : ""
                        )}
                      >
                        {fee != null ? formatCurrency(fee) : "—"}
                      </TableCell>
                    );
                  })}
                </TableRow>

                {/* Actions row */}
                <TableRow>
                  <TableCell className="font-medium text-xs text-muted-foreground sticky left-0 bg-card border-r">
                    Actions
                  </TableCell>
                  {quotes.map((q) => (
                    <TableCell key={q.id} className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Link href={`/admin/loans/${loanId}/quotes/${q.id}`}>
                          <Button variant="outline" size="sm" className="gap-1 text-xs">
                            <ExternalLink className="h-3 w-3" />
                            View
                          </Button>
                        </Link>
                        {q.status !== "declined" &&
                          q.status !== "term_sheet_accepted" &&
                          q.status !== "complete" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs text-green-700 hover:text-green-800"
                              onClick={() => handleAcceptQuote(q.id)}
                            >
                              <Trophy className="h-3 w-3" />
                              Accept
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-50 border border-green-200" />
          Best value
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-50 border border-red-200" />
          Least favorable
        </div>
      </div>

      {/* Accept Confirmation Dialog */}
      <AlertDialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept Quote</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to decline all other quotes for this deal? This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAcceptDialogOpen(false);
                setPendingAcceptId(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => confirmAccept(false)}
              disabled={loading}
              className="gap-1"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Accept Only
            </Button>
            <Button
              onClick={() => confirmAccept(true)}
              disabled={loading}
              className="gap-1"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <CheckCircle2 className="h-4 w-4" />
              Accept & Decline Others
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
