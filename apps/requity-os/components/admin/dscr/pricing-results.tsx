"use client";

import { useState } from "react";
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
import { KpiCard } from "@/components/shared/kpi-card";
import { ArrowLeft, ChevronDown, ChevronRight, Trophy, AlertCircle } from "lucide-react";
import { formatCurrency, formatCurrencyDetailed } from "@/lib/format";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface PricingResultsProps {
  results: any;
  pricingRunId: string | null;
  onBack: () => void;
}

export function PricingResults({ results, pricingRunId, onBack }: PricingResultsProps) {
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [showIneligible, setShowIneligible] = useState(false);
  const [sortBy, setSortBy] = useState<"rate" | "borrower_cost" | "comp">("rate");

  const deal = results.deal;
  const eligibleProducts = (results.products || []).filter((p: any) => p.is_eligible);
  const ineligibleProducts = (results.products || []).filter((p: any) => !p.is_eligible);
  const bestExecution = results.best_execution;

  // Collect all quotes for comparison table
  const allQuotes: any[] = [];
  for (const product of eligibleProducts) {
    if (product.best_par_rate) {
      allQuotes.push({
        ...product.best_par_rate,
        product_id: product.product_id,
        lender: product.lender_short_name,
        product: product.product_name,
        type: "par",
        total_lender_fees: product.total_lender_fees,
        rate_sheet_date: product.rate_sheet_date,
      });
    }
    if (product.best_comp_rate && product.best_comp_rate.note_rate !== product.best_par_rate?.note_rate) {
      allQuotes.push({
        ...product.best_comp_rate,
        product_id: product.product_id,
        lender: product.lender_short_name,
        product: product.product_name,
        type: "comp",
        total_lender_fees: product.total_lender_fees,
        rate_sheet_date: product.rate_sheet_date,
      });
    }
  }

  // Sort
  allQuotes.sort((a, b) => {
    if (sortBy === "rate") return a.note_rate - b.note_rate;
    if (sortBy === "borrower_cost") return a.total_borrower_cost - b.total_borrower_cost;
    return b.requity_comp_dollars - a.requity_comp_dollars;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Pricing Results</h2>
          <p className="text-sm text-muted-foreground">
            {deal.borrower_name || "Deal"} — {formatCurrency(deal.loan_amount)} |{" "}
            {deal.ltv?.toFixed(1)}% LTV | FICO {deal.borrower_fico} | {deal.property_state} |{" "}
            {deal.loan_purpose}
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          New Deal
        </Button>
      </div>

      {/* Best Execution Banner */}
      {bestExecution && bestExecution.best_par_rate && (
        <Card className="border-teal-300 bg-teal-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-teal-600" />
              <div>
                <div className="font-bold text-lg text-teal-800">
                  Best Execution: {bestExecution.best_par_rate.note_rate.toFixed(3)}% via{" "}
                  {bestExecution.lender_short_name} — {bestExecution.product_name}
                </div>
                <div className="text-sm text-teal-700">
                  Borrower Cost: {bestExecution.best_par_rate.total_borrower_cost.toFixed(3)} pts |
                  DSCR: {bestExecution.best_par_rate.calculated_dscr.toFixed(2)}x |
                  PITIA: {formatCurrencyDetailed(bestExecution.best_par_rate.monthly_pitia)} |
                  Requity Comp: {formatCurrency(bestExecution.best_par_rate.requity_comp_dollars)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Eligible Lenders"
          value={eligibleProducts.length}
        />
        <KpiCard
          title="Best Rate"
          value={bestExecution?.best_par_rate ? `${bestExecution.best_par_rate.note_rate.toFixed(3)}%` : "—"}
        />
        <KpiCard
          title="Est. DSCR"
          value={bestExecution?.best_par_rate ? `${bestExecution.best_par_rate.calculated_dscr.toFixed(2)}x` : "—"}
        />
        <KpiCard
          title="Max Requity Comp"
          value={
            eligibleProducts.length > 0
              ? formatCurrency(
                  Math.max(
                    ...eligibleProducts
                      .filter((p: any) => p.best_comp_rate)
                      .map((p: any) => p.best_comp_rate.requity_comp_dollars)
                  ) || 0
                )
              : "—"
          }
        />
      </div>

      {/* Lender Comparison Cards */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lender Comparison</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={sortBy === "rate" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("rate")}
              >
                By Rate
              </Button>
              <Button
                variant={sortBy === "borrower_cost" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("borrower_cost")}
              >
                By Borrower Cost
              </Button>
              <Button
                variant={sortBy === "comp" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("comp")}
              >
                By Requity Comp
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {eligibleProducts.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No eligible lender products for this deal configuration.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lender / Product</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>FICO/LTV</TableHead>
                    <TableHead>LLPAs</TableHead>
                    <TableHead>Net Price</TableHead>
                    <TableHead>YSP</TableHead>
                    <TableHead>Borrower Cost</TableHead>
                    <TableHead>Requity Comp</TableHead>
                    <TableHead>DSCR</TableHead>
                    <TableHead>PITIA</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allQuotes.map((q, idx) => {
                    const isBest =
                      bestExecution &&
                      q.product_id === bestExecution.product_id &&
                      q.type === "par";
                    return (
                      <TableRow
                        key={idx}
                        className={isBest ? "bg-teal-50" : ""}
                      >
                        <TableCell>
                          <div className="font-medium">
                            {q.lender}
                            {isBest && (
                              <Badge className="ml-2 bg-teal-600" variant="default">
                                Best
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {q.product}
                            {q.type === "comp" && (
                              <Badge variant="outline" className="ml-1 text-xs">
                                Target Comp
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {q.note_rate.toFixed(3)}%
                        </TableCell>
                        <TableCell>{q.base_price.toFixed(3)}</TableCell>
                        <TableCell>
                          <span className={q.fico_ltv_adjustment >= 0 ? "text-green-600" : "text-red-600"}>
                            {q.fico_ltv_adjustment >= 0 ? "+" : ""}
                            {q.fico_ltv_adjustment.toFixed(3)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={q.total_llpa >= 0 ? "text-green-600" : "text-red-600"}>
                            {q.total_llpa >= 0 ? "+" : ""}
                            {q.total_llpa.toFixed(3)}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {q.net_price.toFixed(3)}
                        </TableCell>
                        <TableCell>
                          {q.ysp > 0 ? (
                            <span className="text-green-600">{q.ysp.toFixed(3)}%</span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {q.total_borrower_cost.toFixed(3)} pts
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency((q.total_borrower_cost * deal.loan_amount) / 100)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-teal-700">
                            {formatCurrency(q.requity_comp_dollars)}
                          </span>
                          <div className="text-xs text-muted-foreground">
                            {q.requity_total_comp.toFixed(3)} pts
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              q.calculated_dscr >= 1.25
                                ? "text-green-600 font-semibold"
                                : q.calculated_dscr >= 1.0
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }
                          >
                            {q.calculated_dscr.toFixed(2)}x
                          </span>
                        </TableCell>
                        <TableCell>
                          {formatCurrencyDetailed(q.monthly_pitia)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setExpandedProduct(
                                expandedProduct === `${q.product_id}-${q.type}`
                                  ? null
                                  : `${q.product_id}-${q.type}`
                              )
                            }
                          >
                            {expandedProduct === `${q.product_id}-${q.type}` ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expanded LLPA Waterfall */}
      {expandedProduct && (() => {
        const [prodId, type] = expandedProduct.split("-");
        const product = eligibleProducts.find((p: any) => p.product_id === prodId);
        const quote = type === "par" ? product?.best_par_rate : product?.best_comp_rate;
        if (!product || !quote) return null;

        return (
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-base">
                Pricing Waterfall: {product.lender_short_name} — {product.product_name} @ {quote.note_rate.toFixed(3)}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="num text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Base Price ({quote.note_rate.toFixed(3)}%):</span>
                  <span className="font-semibold">{quote.base_price.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>FICO/LTV Adjustment ({deal.borrower_fico}, {deal.ltv.toFixed(1)}% LTV):</span>
                  <span className={quote.fico_ltv_adjustment >= 0 ? "text-green-600" : "text-red-600"}>
                    {quote.fico_ltv_adjustment >= 0 ? "+" : ""}{quote.fico_ltv_adjustment.toFixed(3)}
                  </span>
                </div>
                {(quote.llpa_adjustments || []).map((adj: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span>{adj.name}:</span>
                    <span className={adj.value >= 0 ? "text-green-600" : "text-red-600"}>
                      {adj.value >= 0 ? "+" : ""}{adj.value.toFixed(3)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-1 mt-1 flex justify-between font-semibold">
                  <span>Gross Price:</span>
                  <span>{quote.gross_price.toFixed(3)}</span>
                </div>
                {quote.gross_price !== quote.capped_price && (
                  <div className="flex justify-between text-amber-600">
                    <span>Max Price Cap Applied:</span>
                    <span>{quote.capped_price.toFixed(3)}</span>
                  </div>
                )}
                <div className="border-t pt-1 mt-1 flex justify-between font-bold text-lg">
                  <span>Net Price:</span>
                  <span>{quote.net_price.toFixed(3)}</span>
                </div>
                <div className="border-t pt-2 mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>YSP ({quote.ysp.toFixed(3)}%):</span>
                    <span className="text-green-600">
                      {formatCurrency((quote.ysp * deal.loan_amount) / 100)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Broker Points ({quote.broker_points.toFixed(3)}%):</span>
                    <span>{formatCurrency((quote.broker_points * deal.loan_amount) / 100)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-teal-700">
                    <span>Total Requity Comp:</span>
                    <span>{formatCurrency(quote.requity_comp_dollars)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lender Fees:</span>
                    <span>{formatCurrency(product.total_lender_fees)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Ineligible Products */}
      {ineligibleProducts.length > 0 && (
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => setShowIneligible(!showIneligible)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-muted-foreground">
                Ineligible Products ({ineligibleProducts.length})
              </CardTitle>
              {showIneligible ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </CardHeader>
          {showIneligible && (
            <CardContent>
              <div className="space-y-2">
                {ineligibleProducts.map((p: any) => (
                  <div
                    key={p.product_id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-red-50/50"
                  >
                    <div>
                      <span className="font-medium">
                        {p.lender_short_name} — {p.product_name}
                      </span>
                    </div>
                    <div className="text-sm text-red-600">
                      {(p.ineligibility_reasons || []).join("; ")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Full Rate Sweep Table */}
      {eligibleProducts.some((p: any) => p.quotes.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Full Rate Sweep</CardTitle>
          </CardHeader>
          <CardContent>
            {eligibleProducts
              .filter((p: any) => p.quotes.length > 0)
              .map((product: any) => (
                <div key={product.product_id} className="mb-6">
                  <h4 className="font-medium mb-2">
                    {product.lender_short_name} — {product.product_name}
                  </h4>
                  <div className="overflow-x-auto max-h-64">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rate</TableHead>
                          <TableHead>Base</TableHead>
                          <TableHead>FICO/LTV</TableHead>
                          <TableHead>LLPAs</TableHead>
                          <TableHead>Net</TableHead>
                          <TableHead>YSP</TableHead>
                          <TableHead>Brwr Cost</TableHead>
                          <TableHead>RQ Comp $</TableHead>
                          <TableHead>DSCR</TableHead>
                          <TableHead>PITIA</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {product.quotes.map((q: any, i: number) => (
                          <TableRow
                            key={i}
                            className={
                              q.note_rate === product.best_par_rate?.note_rate
                                ? "bg-teal-50"
                                : ""
                            }
                          >
                            <TableCell className="font-medium">
                              {q.note_rate.toFixed(3)}%
                            </TableCell>
                            <TableCell>{q.base_price.toFixed(3)}</TableCell>
                            <TableCell>
                              <span className={q.fico_ltv_adjustment >= 0 ? "text-green-600" : "text-red-600"}>
                                {q.fico_ltv_adjustment >= 0 ? "+" : ""}
                                {q.fico_ltv_adjustment.toFixed(3)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={q.total_llpa >= 0 ? "text-green-600" : "text-red-600"}>
                                {q.total_llpa >= 0 ? "+" : ""}
                                {q.total_llpa.toFixed(3)}
                              </span>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {q.net_price.toFixed(3)}
                            </TableCell>
                            <TableCell>
                              {q.ysp > 0 ? `${q.ysp.toFixed(3)}%` : "—"}
                            </TableCell>
                            <TableCell>{q.total_borrower_cost.toFixed(3)}</TableCell>
                            <TableCell className="text-teal-700 font-medium">
                              {formatCurrency(q.requity_comp_dollars)}
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  q.calculated_dscr >= 1.25
                                    ? "text-green-600"
                                    : q.calculated_dscr >= 1.0
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                }
                              >
                                {q.calculated_dscr.toFixed(2)}x
                              </span>
                            </TableCell>
                            <TableCell>
                              {formatCurrencyDetailed(q.monthly_pitia)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
