"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/shared/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Pencil,
  History,
  Shield,
  Building2,
  FileText,
  Upload,
} from "lucide-react";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface DscrPricingManagerProps {
  lenders: any[];
  products: any[];
  adjustments: any[];
  versions: any[];
  uploads: any[];
}

export function DscrPricingManager({
  lenders,
  products,
  adjustments,
  versions,
  uploads,
}: DscrPricingManagerProps) {
  const activeProducts = products.filter((p: any) => p.is_active);

  return (
    <Tabs defaultValue="products">
      <TabsList>
        <TabsTrigger value="products">
          Lender Products ({activeProducts.length})
        </TabsTrigger>
        <TabsTrigger value="adjustments">
          LLPAs ({adjustments.length})
        </TabsTrigger>
        <TabsTrigger value="history" className="gap-1">
          <History className="h-3.5 w-3.5" />
          Version History ({versions.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="products" className="mt-4">
        <div className="space-y-6">
          {lenders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No lender partners configured.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  <Link
                    href="/dscr/lenders"
                    className="text-teal-600 hover:underline"
                  >
                    Add lenders
                  </Link>{" "}
                  to get started with DSCR pricing.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {lenders
                .filter((l: any) => l.is_active)
                .map((lender: any) => {
                  const lenderProducts = products.filter(
                    (p: any) => p.lender_id === lender.id
                  );
                  return (
                    <LenderProductCard
                      key={lender.id}
                      lender={lender}
                      products={lenderProducts}
                    />
                  );
                })}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="adjustments" className="mt-4">
        <LlpaPanel adjustments={adjustments} products={products} lenders={lenders} />
      </TabsContent>

      <TabsContent value="history" className="mt-4">
        <DscrVersionHistoryTable versions={versions} uploads={uploads} />
      </TabsContent>
    </Tabs>
  );
}

// ---------------------------------------------------------------------------
// Lender Product Card (mirrors ProgramCard from RTL)
// ---------------------------------------------------------------------------

function LenderProductCard({
  lender,
  products,
}: {
  lender: any;
  products: any[];
}) {
  const activeProducts = products.filter((p: any) => p.is_active);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {lender.short_name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs"
            >
              {activeProducts.length} product{activeProducts.length !== 1 ? "s" : ""}
            </Badge>
            <Badge
              className="bg-green-100 text-green-800 border-green-200 text-xs"
            >
              Active
            </Badge>
            <Link href={`/dscr/lenders/${lender.id}`}>
              <Button variant="ghost" size="sm">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active products</p>
        ) : (
          <div className="space-y-3">
            {activeProducts.map((product: any) => (
              <div key={product.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{product.product_name}</p>
                  {product.rate_sheet_date ? (
                    <Badge
                      variant={
                        Date.now() - new Date(product.rate_sheet_date).getTime() >
                        86400000
                          ? "destructive"
                          : "default"
                      }
                      className="text-xs"
                    >
                      {formatDate(product.rate_sheet_date)}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      No rate sheet
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-sm">
                  <Field label="Lock" value={`${product.lock_period_days}d`} />
                  <Field
                    label="Floor Rate"
                    value={product.floor_rate ? `${product.floor_rate}%` : "—"}
                  />
                  <Field
                    label="Max LTV (P/R/CO)"
                    value={`${product.max_ltv_purchase ?? "—"}/${product.max_ltv_rate_term ?? "—"}/${product.max_ltv_cashout ?? "—"}%`}
                  />
                  <Field
                    label="Max Price"
                    value={product.max_price ? `${product.max_price}` : "—"}
                  />
                </div>
                {(product.underwriting_fee ||
                  product.processing_fee ||
                  product.funding_fee) && (
                  <p className="text-xs text-muted-foreground">
                    Fees:{" "}
                    {[
                      product.underwriting_fee &&
                        `UW ${formatCurrency(product.underwriting_fee)}`,
                      product.processing_fee &&
                        `Proc ${formatCurrency(product.processing_fee)}`,
                      product.funding_fee &&
                        `Fund ${formatCurrency(product.funding_fee)}`,
                    ]
                      .filter(Boolean)
                      .join(" | ")}
                  </p>
                )}
                {product !==
                  activeProducts[activeProducts.length - 1] && (
                  <Separator className="mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
        <Separator className="my-3" />
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {lender.account_executive && `AE: ${lender.account_executive}`}
            {lender.nmls_id && ` | NMLS: ${lender.nmls_id}`}
          </div>
          <Link href={`/dscr/lenders/${lender.id}`}>
            <Button variant="outline" size="sm" className="text-xs h-7">
              Manage
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LLPA Panel (mirrors AdjustersPanel from RTL)
// ---------------------------------------------------------------------------

function LlpaPanel({
  adjustments,
  products,
  lenders,
}: {
  adjustments: any[];
  products: any[];
  lenders: any[];
}) {
  const [selectedProduct, setSelectedProduct] = useState<string>("all");

  const filteredAdjustments =
    selectedProduct === "all"
      ? adjustments
      : adjustments.filter((a: any) => a.product_id === selectedProduct);

  // Group by category
  const grouped: Record<string, any[]> = {};
  filteredAdjustments.forEach((a: any) => {
    const cat = a.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(a);
  });

  const categoryLabels: Record<string, string> = {
    property_type: "Property Type",
    loan_amount: "Loan Amount",
    loan_purpose: "Loan Purpose",
    dscr_ratio: "DSCR Ratio",
    prepay_penalty: "Prepayment Penalty",
    interest_only: "Interest Only",
    borrower_type: "Borrower Type",
    income_doc: "Income Documentation",
    escrow_waiver: "Escrow Waiver",
    rental_type: "Rental Type",
    credit_grade: "Credit Grade",
    state_specific: "State Specific",
    lock_extension: "Lock Extension",
    other: "Other",
  };

  const activeProducts = products.filter((p: any) => p.is_active);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Loan-Level Price Adjustments (LLPAs)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-[240px] h-8 text-xs">
                <SelectValue placeholder="Filter by product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {activeProducts.map((p: any) => {
                  const lender = lenders.find(
                    (l: any) => l.id === p.lender_id
                  );
                  return (
                    <SelectItem key={p.id} value={p.id}>
                      {lender?.short_name} — {p.product_name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAdjustments.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No LLPAs configured.{" "}
            <Link
              href="/dscr/rate-sheets"
              className="text-teal-600 hover:underline"
            >
              Upload a rate sheet
            </Link>{" "}
            to populate adjustments.
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, items]) => (
                <div key={category}>
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                    {categoryLabels[category] || category}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-1.5 pr-2 font-medium">
                            Condition
                          </th>
                          <th className="text-right py-1.5 px-1 font-medium">
                            0-50%
                          </th>
                          <th className="text-right py-1.5 px-1 font-medium">
                            50-55%
                          </th>
                          <th className="text-right py-1.5 px-1 font-medium">
                            55-60%
                          </th>
                          <th className="text-right py-1.5 px-1 font-medium">
                            60-65%
                          </th>
                          <th className="text-right py-1.5 px-1 font-medium">
                            65-70%
                          </th>
                          <th className="text-right py-1.5 px-1 font-medium">
                            70-75%
                          </th>
                          <th className="text-right py-1.5 px-1 font-medium">
                            75-80%
                          </th>
                          <th className="text-right py-1.5 px-1 font-medium">
                            80-85%
                          </th>
                          <th className="text-right py-1.5 px-1 font-medium">
                            85-90%
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items
                          .sort(
                            (a: any, b: any) =>
                              (a.sort_order ?? 0) - (b.sort_order ?? 0)
                          )
                          .map((adj: any) => (
                            <tr key={adj.id} className="border-b last:border-0">
                              <td className="py-1.5 pr-2 font-medium">
                                {adj.condition_label}
                              </td>
                              {[
                                "adj_ltv_0_50",
                                "adj_ltv_50_55",
                                "adj_ltv_55_60",
                                "adj_ltv_60_65",
                                "adj_ltv_65_70",
                                "adj_ltv_70_75",
                                "adj_ltv_75_80",
                                "adj_ltv_80_85",
                                "adj_ltv_85_90",
                              ].map((col) => (
                                <td
                                  key={col}
                                  className={`text-right py-1.5 px-1 num ${
                                    adj[col] != null && adj[col] < 0
                                      ? "text-red-600"
                                      : adj[col] != null && adj[col] > 0
                                        ? "text-green-600"
                                        : ""
                                  }`}
                                >
                                  {adj[col] != null
                                    ? adj[col] > 0
                                      ? `+${Number(adj[col]).toFixed(3)}`
                                      : Number(adj[col]).toFixed(3)
                                    : "—"}
                                </td>
                              ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Version History Table (mirrors VersionHistoryTable from RTL)
// ---------------------------------------------------------------------------

function DscrVersionHistoryTable({
  versions,
  uploads,
}: {
  versions: any[];
  uploads: any[];
}) {
  // Merge version records and rate sheet uploads into a unified timeline
  const timeline: any[] = [
    ...versions.map((v: any) => ({
      id: v.id,
      type: "version" as const,
      lender_name: v.lender_name,
      product_name: v.product_name,
      version: v.version,
      change_type: v.change_type,
      change_description: v.change_description,
      changed_at: v.changed_at,
    })),
    ...uploads.map((u: any) => ({
      id: u.id,
      type: "upload" as const,
      lender_name: u.dscr_lenders?.short_name || u.dscr_lenders?.name || "Unknown",
      product_name: u.dscr_lender_products?.product_name || null,
      version: null,
      change_type: "rate_sheet_upload",
      change_description: `Rate sheet uploaded: ${u.file_name}${u.effective_date ? ` (effective ${formatDate(u.effective_date)})` : ""}`,
      changed_at: u.created_at,
      parsing_status: u.parsing_status,
    })),
  ].sort(
    (a, b) =>
      new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );

  const changeTypeLabels: Record<string, string> = {
    product_update: "Product Update",
    product_added: "Product Added",
    product_deactivated: "Product Deactivated",
    rate_sheet_commit: "Rate Sheet Committed",
    rate_sheet_upload: "Rate Sheet Upload",
    llpa_update: "LLPA Update",
    lender_added: "Lender Added",
    lender_update: "Lender Update",
  };

  const changeTypeColors: Record<string, string> = {
    product_update: "bg-blue-100 text-blue-800 border-blue-200",
    product_added: "bg-green-100 text-green-800 border-green-200",
    product_deactivated: "bg-slate-100 text-slate-800 border-slate-200",
    rate_sheet_commit: "bg-teal-100 text-teal-800 border-teal-200",
    rate_sheet_upload: "bg-amber-100 text-amber-800 border-amber-200",
    llpa_update: "bg-purple-100 text-purple-800 border-purple-200",
    lender_added: "bg-green-100 text-green-800 border-green-200",
    lender_update: "bg-blue-100 text-blue-800 border-blue-200",
  };

  const columns: Column<any>[] = [
    {
      key: "lender_name",
      header: "Lender",
      cell: (row) => (
        <Badge variant="outline" className="text-xs">
          {row.lender_name ?? "—"}
        </Badge>
      ),
    },
    {
      key: "product_name",
      header: "Product",
      cell: (row) => (
        <span className="text-sm">{row.product_name ?? "—"}</span>
      ),
    },
    {
      key: "change_type",
      header: "Type",
      cell: (row) => (
        <Badge
          className={`text-xs ${changeTypeColors[row.change_type] || "bg-slate-100 text-slate-800 border-slate-200"}`}
        >
          {row.type === "upload" && row.parsing_status ? (
            <span className="flex items-center gap-1">
              {row.parsing_status === "success" ? (
                <FileText className="h-3 w-3" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
              {changeTypeLabels[row.change_type] || row.change_type}
            </span>
          ) : (
            changeTypeLabels[row.change_type] || row.change_type
          )}
        </Badge>
      ),
    },
    {
      key: "change_description",
      header: "Change",
      cell: (row) => (
        <span className="text-sm">{row.change_description ?? "—"}</span>
      ),
    },
    {
      key: "version",
      header: "Version",
      cell: (row) =>
        row.version ? `v${row.version}` : "—",
    },
    {
      key: "changed_at",
      header: "Date",
      cell: (row) => formatDate(row.changed_at),
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Version History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable<any>
          columns={columns}
          data={timeline}
          emptyMessage="No version history yet"
        />
      </CardContent>
    </Card>
  );
}
