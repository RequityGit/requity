"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LendersList } from "@/components/admin/dscr/lenders-list";
import { RateSheetManager } from "@/components/admin/dscr/rate-sheet-manager";
import { DealPricingForm } from "@/components/admin/dscr/deal-pricing-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */

const TABS = ["overview", "lenders", "rate-sheets", "pricing", "pipeline"] as const;
type TabValue = (typeof TABS)[number];

const INPUT_FIELDS = [
  { name: "Loan Amount", description: "Total loan principal" },
  { name: "Purchase Price", description: "Property acquisition cost" },
  { name: "Appraised Value", description: "Current appraisal value" },
  { name: "Interest Rate", description: "Annual interest rate" },
  { name: "Points", description: "Origination fee percentage" },
  { name: "Loan Term", description: "Loan duration in months" },
  { name: "Monthly Rent", description: "Gross monthly rental income" },
  { name: "Annual Property Tax", description: "Annual property tax assessment" },
  { name: "Annual Insurance", description: "Annual hazard insurance premium" },
  { name: "Monthly HOA", description: "Homeowners association dues" },
  { name: "Monthly Utilities", description: "Landlord-paid utilities" },
  { name: "Operating Expenses", description: "Other monthly operating expenses" },
];

const OUTPUT_METRICS = [
  { name: "DSCR", description: "Debt Service Coverage — NOI / monthly payment" },
  { name: "LTV", description: "Loan-to-Value ratio" },
  { name: "Monthly Payment", description: "Interest-only monthly payment" },
  { name: "Net Yield", description: "Annual interest income / loan amount" },
  { name: "Investor Return", description: "(Interest + origination) / loan amount, annualized" },
  { name: "Total Cash to Close", description: "Equity required at closing" },
  { name: "Max Loan (LTV)", description: "75% of appraised value" },
  { name: "Max Loan (LTARV)", description: "70% of after repair value" },
];

const PIPELINE_STATUS_COLORS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  quoted: "default",
  submitted: "outline",
  locked: "default",
  closed: "default",
  dead: "destructive",
};

interface DSCRTabsClientProps {
  lenders: any[];
  products: any[];
  uploads: any[];
  runs: any[];
}

export function DSCRTabsClient({ lenders, products, uploads, runs }: DSCRTabsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab") as TabValue | null;
  const [activeTab, setActiveTab] = useState<TabValue>(
    TABS.includes(tabParam as TabValue) ? (tabParam as TabValue) : "overview"
  );

  // Sync tab changes to URL without full navigation
  function handleTabChange(value: string) {
    const tab = value as TabValue;
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    router.replace(`/admin/models/dscr${params.size > 0 ? `?${params}` : ""}`, { scroll: false });
  }

  // Sync from URL on mount if tab param changes externally
  useEffect(() => {
    const t = searchParams.get("tab") as TabValue | null;
    if (t && TABS.includes(t) && t !== activeTab) {
      setActiveTab(t);
    } else if (!t && activeTab !== "overview") {
      setActiveTab("overview");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-0">
      <TabsList className="h-9 border-b border-border bg-transparent rounded-none w-full justify-start px-0 gap-0">
        <TabsTrigger
          value="overview"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 h-9 text-sm"
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="lenders"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 h-9 text-sm"
        >
          Lenders
          {lenders.length > 0 && (
            <span className="ml-1.5 text-[11px] num text-muted-foreground">({lenders.length})</span>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="rate-sheets"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 h-9 text-sm"
        >
          Rate Sheets
        </TabsTrigger>
        <TabsTrigger
          value="pricing"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 h-9 text-sm"
        >
          Price a Deal
        </TabsTrigger>
        <TabsTrigger
          value="pipeline"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 h-9 text-sm"
        >
          Pipeline
          {runs.length > 0 && (
            <span className="ml-1.5 text-[11px] num text-muted-foreground">({runs.length})</span>
          )}
        </TabsTrigger>
      </TabsList>

      {/* ── Overview ── */}
      <TabsContent value="overview" className="pt-6 space-y-8">
        <div className="max-w-3xl space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-muted-foreground" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold text-foreground">DSCR Calculator</h2>
          </div>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            A calculator for debt service coverage ratio on rental investment properties. Takes
            property income and expense data along with loan terms to compute DSCR, net yield, and
            investor return metrics.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          {/* Input Fields */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Input Fields
            </h3>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-[12px] h-9">Field</TableHead>
                    <TableHead className="text-[12px] h-9">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {INPUT_FIELDS.map((f) => (
                    <TableRow key={f.name}>
                      <TableCell className="py-2 text-[12px] font-medium">{f.name}</TableCell>
                      <TableCell className="py-2 text-[12px] text-muted-foreground">{f.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Output Metrics */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Output Metrics
            </h3>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-[12px] h-9">Metric</TableHead>
                    <TableHead className="text-[12px] h-9">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {OUTPUT_METRICS.map((m) => (
                    <TableRow key={m.name}>
                      <TableCell className="py-2 text-[12px] font-medium">{m.name}</TableCell>
                      <TableCell className="py-2 text-[12px] text-muted-foreground">{m.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Quick stats summary */}
        <div className="flex flex-wrap gap-6 pt-2 border-t border-border max-w-4xl">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Active Lenders</p>
            <p className="text-2xl font-bold num mt-0.5">{lenders.filter((l) => l.is_active).length}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Active Products</p>
            <p className="text-2xl font-bold num mt-0.5">
              {products.filter((p: any) => p.is_active && p.rate_sheet_date).length}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Deals Priced</p>
            <p className="text-2xl font-bold num mt-0.5">{runs.length}</p>
          </div>
        </div>
      </TabsContent>

      {/* ── Lenders ── */}
      <TabsContent value="lenders" className="pt-6">
        <LendersList lenders={lenders} />
      </TabsContent>

      {/* ── Rate Sheets ── */}
      <TabsContent value="rate-sheets" className="pt-6">
        <RateSheetManager lenders={lenders} products={products} uploads={uploads} />
      </TabsContent>

      {/* ── Price a Deal ── */}
      <TabsContent value="pricing" className="pt-6">
        <DealPricingForm />
      </TabsContent>

      {/* ── Pipeline ── */}
      <TabsContent value="pipeline" className="pt-6">
        {runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calculator className="h-10 w-10 text-muted-foreground mb-3" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">No deals priced yet.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => handleTabChange("pricing")}
            >
              <Calculator className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Price Your First Deal
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="h-9 text-[12px]">Borrower</TableHead>
                  <TableHead className="h-9 text-[12px]">State</TableHead>
                  <TableHead className="h-9 text-[12px]">Purpose</TableHead>
                  <TableHead className="h-9 text-[12px] text-right">Loan Amt</TableHead>
                  <TableHead className="h-9 text-[12px] text-right">LTV</TableHead>
                  <TableHead className="h-9 text-[12px] text-right">FICO</TableHead>
                  <TableHead className="h-9 text-[12px]">Best Rate</TableHead>
                  <TableHead className="h-9 text-[12px]">Best Lender</TableHead>
                  <TableHead className="h-9 text-[12px]">Status</TableHead>
                  <TableHead className="h-9 text-[12px]">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((r: any) => (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="py-2.5 text-[13px] font-medium">
                      <Link
                        href={`/admin/models/dscr/price/results?run=${r.id}`}
                        className="hover:underline"
                      >
                        {r.borrower_name || "Unnamed"}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2.5 text-[13px]">{r.property_state}</TableCell>
                    <TableCell className="py-2.5 text-[13px] capitalize">
                      {r.loan_purpose?.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="py-2.5 text-[13px] text-right num">
                      {formatCurrency(r.loan_amount)}
                    </TableCell>
                    <TableCell className="py-2.5 text-[13px] text-right num">
                      {r.ltv ? `${r.ltv.toFixed(1)}%` : "—"}
                    </TableCell>
                    <TableCell className="py-2.5 text-[13px] text-right num">
                      {r.fico_score}
                    </TableCell>
                    <TableCell className="py-2.5 text-[13px] num">
                      {r.best_execution_rate ? `${r.best_execution_rate}%` : "—"}
                    </TableCell>
                    <TableCell className="py-2.5 text-[13px]">
                      {r.best_execution_lender || "—"}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant={PIPELINE_STATUS_COLORS[r.status] ?? "secondary"} className="text-[11px]">
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-[12px] text-muted-foreground num">
                      {formatDate(r.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
