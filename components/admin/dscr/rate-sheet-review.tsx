"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { commitRateSheetAction } from "@/app/(authenticated)/admin/models/dscr/actions";
import { LTV_BANDS } from "@/lib/dscr/constants";

/* eslint-disable @typescript-eslint/no-explicit-any */

const LTV_BAND_KEYS = [
  "0-50", "50.01-55", "55.01-60", "60.01-65", "65.01-70",
  "70.01-75", "75.01-80", "80.01-85", "85.01-90",
];

function mapLtvKeyToColumn(key: string): string {
  const map: Record<string, string> = {
    "0-50": "adj_ltv_0_50",
    "50.01-55": "adj_ltv_50_55",
    "55.01-60": "adj_ltv_55_60",
    "60.01-65": "adj_ltv_60_65",
    "65.01-70": "adj_ltv_65_70",
    "70.01-75": "adj_ltv_70_75",
    "75.01-80": "adj_ltv_75_80",
    "80.01-85": "adj_ltv_80_85",
    "85.01-90": "adj_ltv_85_90",
  };
  return map[key] || key;
}

export function RateSheetReview({
  uploadId,
  parsedData,
  products,
  onClose,
}: {
  uploadId: string;
  parsedData: any;
  products: any[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [committing, setCommitting] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedParsedProduct, setSelectedParsedProduct] = useState(0);

  const parsedProducts = parsedData?.products || [];
  const currentParsed = parsedProducts[selectedParsedProduct];

  async function handleCommit() {
    if (!selectedProductId) {
      toast({
        title: "Error",
        description: "Select a product to commit this rate sheet to",
        variant: "destructive",
      });
      return;
    }

    if (!currentParsed) {
      toast({ title: "Error", description: "No parsed data available", variant: "destructive" });
      return;
    }

    setCommitting(true);
    try {
      // Build base rates
      const baseRates = (currentParsed.base_rates || []).map((r: any) => ({
        note_rate: r.rate,
        base_price: r.price,
      }));

      // Build FICO/LTV adjustments
      const ficoLtvAdjustments: any[] = [];
      const grids = currentParsed.fico_ltv_grids || {};

      for (const [purpose, rows] of Object.entries(grids)) {
        if (!rows || !Array.isArray(rows)) continue;
        for (const row of rows as any[]) {
          const adjustments = row.adjustments || {};
          for (const [ltvKey, value] of Object.entries(adjustments)) {
            const [ltvMinStr, ltvMaxStr] = ltvKey.split("-");
            ficoLtvAdjustments.push({
              loan_purpose: purpose,
              fico_min: row.fico_min,
              fico_max: row.fico_max ?? null,
              fico_label: row.fico_label,
              ltv_min: parseFloat(ltvMinStr),
              ltv_max: parseFloat(ltvMaxStr),
              ltv_label: `${ltvMinStr}-${ltvMaxStr}%`,
              adjustment: value != null ? Number(value) : null,
            });
          }
        }
      }

      // Build price adjustments
      const priceAdjustments: any[] = [];
      const allAdj = [
        ...(currentParsed.price_adjustments || []),
        ...(currentParsed.prepay_adjustments || []).map((p: any) => ({
          ...p,
          category: p.category || "prepay_penalty",
        })),
      ];

      for (const adj of allAdj) {
        const entry: any = {
          category: adj.category || "other",
          condition_label: adj.label || adj.name || "",
          condition_key: adj.key || `${adj.category}:${(adj.label || "").toLowerCase().replace(/\s+/g, "_")}`,
          adj_ltv_0_50: null,
          adj_ltv_50_55: null,
          adj_ltv_55_60: null,
          adj_ltv_60_65: null,
          adj_ltv_65_70: null,
          adj_ltv_70_75: null,
          adj_ltv_75_80: null,
          adj_ltv_80_85: null,
          adj_ltv_85_90: null,
        };

        const adjustments = adj.adjustments || {};
        for (const [ltvKey, value] of Object.entries(adjustments)) {
          const colKey = mapLtvKeyToColumn(ltvKey);
          if (colKey in entry) {
            entry[colKey] = value != null ? Number(value) : null;
          }
        }

        priceAdjustments.push(entry);
      }

      const result = await commitRateSheetAction({
        product_id: selectedProductId,
        rate_sheet_date: parsedData.effective_date || new Date().toISOString().split("T")[0],
        base_rates: baseRates,
        fico_ltv_adjustments: ficoLtvAdjustments,
        price_adjustments: priceAdjustments,
        upload_id: uploadId,
      });

      if ("error" in result) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }

      toast({ title: "Rate sheet committed successfully" });
      router.refresh();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Commit failed", variant: "destructive" });
    } finally {
      setCommitting(false);
    }
  }

  if (!parsedData || parsedProducts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No parsed data available.</p>
          <Button variant="outline" onClick={onClose} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Review Parsed Rate Sheet</h2>
          <p className="text-sm text-muted-foreground">
            {parsedData.lender_name} — Effective {parsedData.effective_date}
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Product selector (if multiple) */}
      {parsedProducts.length > 1 && (
        <div className="flex gap-2">
          {parsedProducts.map((p: any, idx: number) => (
            <Button
              key={idx}
              variant={selectedParsedProduct === idx ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedParsedProduct(idx)}
            >
              {p.product_name}
            </Button>
          ))}
        </div>
      )}

      {currentParsed && (
        <>
          {/* Product info */}
          <Card>
            <CardHeader>
              <CardTitle>{currentParsed.product_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Lock:</span>{" "}
                  {currentParsed.lock_period_days || "—"} days
                </div>
                <div>
                  <span className="text-muted-foreground">Floor Rate:</span>{" "}
                  {currentParsed.floor_rate || "—"}%
                </div>
                <div>
                  <span className="text-muted-foreground">Max Price:</span>{" "}
                  {currentParsed.max_price || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Max LTV:</span>{" "}
                  P={currentParsed.max_ltv?.purchase || "—"}/
                  R&T={currentParsed.max_ltv?.rate_term || "—"}/
                  CO={currentParsed.max_ltv?.cashout || "—"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Base Rates */}
          <Card>
            <CardHeader>
              <CardTitle>
                Base Rate Ladder ({(currentParsed.base_rates || []).length} rates)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Note Rate</TableHead>
                      <TableHead>Base Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(currentParsed.base_rates || []).map((r: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{r.rate?.toFixed(3)}%</TableCell>
                        <TableCell>{r.price?.toFixed(3)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* FICO/LTV Grids */}
          {currentParsed.fico_ltv_grids && (
            <Card>
              <CardHeader>
                <CardTitle>FICO x LTV Adjustment Grids</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(currentParsed.fico_ltv_grids).map(
                  ([purpose, rows]: [string, any]) => {
                    if (!rows || !Array.isArray(rows) || rows.length === 0) return null;
                    return (
                      <div key={purpose} className="mb-6">
                        <h4 className="font-medium mb-2 capitalize">{purpose.replace(/_/g, " ")}</h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="sticky left-0 bg-card">FICO</TableHead>
                                {LTV_BAND_KEYS.map((k) => (
                                  <TableHead key={k} className="text-xs whitespace-nowrap">
                                    {k}%
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(rows as any[]).map((row: any, i: number) => (
                                <TableRow key={i}>
                                  <TableCell className="sticky left-0 bg-card font-medium text-sm">
                                    {row.fico_label}
                                  </TableCell>
                                  {LTV_BAND_KEYS.map((k) => {
                                    const val = row.adjustments?.[k];
                                    return (
                                      <TableCell
                                        key={k}
                                        className={`text-xs ${
                                          val == null
                                            ? "text-muted-foreground bg-gray-50"
                                            : val > 0
                                              ? "text-green-700"
                                              : val < 0
                                                ? "text-red-700"
                                                : ""
                                        }`}
                                      >
                                        {val == null ? "—" : val.toFixed(3)}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  }
                )}
              </CardContent>
            </Card>
          )}

          {/* Price Adjustments (LLPAs) */}
          {(currentParsed.price_adjustments || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Price Adjustments ({currentParsed.price_adjustments.length} adjusters)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-card">Adjuster</TableHead>
                        <TableHead className="sticky left-[120px] bg-card">Category</TableHead>
                        {LTV_BAND_KEYS.map((k) => (
                          <TableHead key={k} className="text-xs whitespace-nowrap">
                            {k}%
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentParsed.price_adjustments.map((adj: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="sticky left-0 bg-card text-sm font-medium">
                            {adj.label || adj.name}
                          </TableCell>
                          <TableCell className="sticky left-[120px] bg-card">
                            <Badge variant="outline" className="text-xs">
                              {adj.category}
                            </Badge>
                          </TableCell>
                          {LTV_BAND_KEYS.map((k) => {
                            const val = adj.adjustments?.[k];
                            return (
                              <TableCell
                                key={k}
                                className={`text-xs ${
                                  val == null
                                    ? "text-muted-foreground bg-gray-50"
                                    : val > 0
                                      ? "text-green-700"
                                      : val < 0
                                        ? "text-red-700"
                                        : ""
                                }`}
                              >
                                {val == null ? "—" : val.toFixed(3)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Commit Section */}
          <Card className="border-teal-200 bg-teal-50/30">
            <CardContent className="pt-6">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label>Commit to Product *</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product to update" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.dscr_lenders?.short_name || ""} — {p.product_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCommit} disabled={committing || !selectedProductId}>
                  {committing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Committing...</>
                  ) : (
                    <><CheckCircle className="h-4 w-4 mr-2" /> Commit Rate Sheet</>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This will replace all existing rate data for the selected product.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
