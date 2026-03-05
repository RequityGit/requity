"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Calculator, Loader2 } from "lucide-react";
import { runPricingAction, type PricingRunInput } from "@/app/(authenticated)/admin/models/dscr/actions";
import {
  DSCR_PROPERTY_TYPES,
  DSCR_LOAN_PURPOSES,
  DSCR_BORROWER_TYPES,
  DSCR_DOC_TYPES,
  DSCR_PREPAY_OPTIONS,
  DSCR_LOCK_PERIODS,
  REQUITY_EXCLUDED_STATES,
} from "@/lib/dscr/constants";
import { US_STATES } from "@/lib/constants";
import { calculateMonthlyPI } from "@/lib/dscr/pricing-engine";
import { PricingResults } from "./pricing-results";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function DealPricingForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [pricingRunId, setPricingRunId] = useState<string | null>(null);

  const [form, setForm] = useState<PricingRunInput>({
    borrower_name: "",
    borrower_entity: "",
    property_address: "",
    property_city: "",
    property_state: "",
    property_zip: "",
    property_type: "sfr",
    property_value: 0,
    monthly_rent: 0,
    num_units: 1,
    loan_purpose: "purchase",
    loan_amount: 0,
    fico_score: 740,
    borrower_type: "us_citizen",
    income_doc_type: "dscr_only",
    is_interest_only: false,
    is_short_term_rental: false,
    escrow_waiver: false,
    prepay_preference: "declining_5yr",
    monthly_taxes: 0,
    monthly_insurance: 0,
    monthly_hoa: 0,
    monthly_flood: 0,
    lock_period_days: 45,
    broker_points: 2.0,
  });

  function setField(key: keyof PricingRunInput, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Auto-calculated fields
  const ltv = useMemo(() => {
    if (!form.property_value || form.property_value === 0) return 0;
    return (form.loan_amount / form.property_value) * 100;
  }, [form.loan_amount, form.property_value]);

  const estimatedPI = useMemo(() => {
    if (!form.loan_amount || form.loan_amount === 0) return 0;
    return calculateMonthlyPI(form.loan_amount, 7.0, 30, form.is_interest_only || false);
  }, [form.loan_amount, form.is_interest_only]);

  const estimatedPITIA = useMemo(() => {
    return (
      estimatedPI +
      (form.monthly_taxes || 0) +
      (form.monthly_insurance || 0) +
      (form.monthly_hoa || 0) +
      (form.monthly_flood || 0)
    );
  }, [estimatedPI, form.monthly_taxes, form.monthly_insurance, form.monthly_hoa, form.monthly_flood]);

  const estimatedDSCR = useMemo(() => {
    if (!estimatedPITIA || estimatedPITIA === 0 || !form.monthly_rent) return 0;
    return form.monthly_rent / estimatedPITIA;
  }, [form.monthly_rent, estimatedPITIA]);

  async function handleRunPricing() {
    if (!form.property_state) {
      toast({ title: "Error", description: "Property state is required", variant: "destructive" });
      return;
    }
    if (REQUITY_EXCLUDED_STATES.includes(form.property_state)) {
      toast({
        title: "Error",
        description: `Requity does not lend in ${form.property_state}`,
        variant: "destructive",
      });
      return;
    }
    if (!form.loan_amount || form.loan_amount <= 0) {
      toast({ title: "Error", description: "Loan amount is required", variant: "destructive" });
      return;
    }
    if (!form.property_value || form.property_value <= 0) {
      toast({ title: "Error", description: "Property value is required", variant: "destructive" });
      return;
    }
    if (!form.fico_score || form.fico_score < 300) {
      toast({ title: "Error", description: "Valid FICO score is required", variant: "destructive" });
      return;
    }

    setRunning(true);
    try {
      const result = await runPricingAction(form);
      if ("error" in result) {
        toast({ title: "Pricing Error", description: result.error, variant: "destructive" });
        return;
      }
      setResults(result.result);
      setPricingRunId(result.pricingRunId || null);
      toast({ title: "Pricing complete" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Pricing failed", variant: "destructive" });
    } finally {
      setRunning(false);
    }
  }

  if (results) {
    return (
      <PricingResults
        results={results}
        pricingRunId={pricingRunId}
        onBack={() => setResults(null)}
      />
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Borrower */}
        <Card>
          <CardHeader>
            <CardTitle>Borrower Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Borrower Name</Label>
                <Input
                  value={form.borrower_name || ""}
                  onChange={(e) => setField("borrower_name", e.target.value)}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label>FICO Score *</Label>
                <Input
                  type="number"
                  value={form.fico_score || ""}
                  onChange={(e) => setField("fico_score", Number(e.target.value))}
                  placeholder="740"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Borrower Type</Label>
                <Select
                  value={form.borrower_type || "us_citizen"}
                  onValueChange={(v) => setField("borrower_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DSCR_BORROWER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Income Documentation</Label>
                <Select
                  value={form.income_doc_type || "dscr_only"}
                  onValueChange={(v) => setField("income_doc_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DSCR_DOC_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property */}
        <Card>
          <CardHeader>
            <CardTitle>Property Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Property Address</Label>
              <Input
                value={form.property_address || ""}
                onChange={(e) => setField("property_address", e.target.value)}
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={form.property_city || ""}
                  onChange={(e) => setField("property_city", e.target.value)}
                />
              </div>
              <div>
                <Label>State *</Label>
                <Select
                  value={form.property_state || ""}
                  onValueChange={(v) => setField("property_state", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.filter(
                      (s) => !REQUITY_EXCLUDED_STATES.includes(s.value)
                    ).map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Zip</Label>
                <Input
                  value={form.property_zip || ""}
                  onChange={(e) => setField("property_zip", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Property Type *</Label>
                <Select
                  value={form.property_type || "sfr"}
                  onValueChange={(v) => setField("property_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DSCR_PROPERTY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Property Value *</Label>
                <Input
                  type="number"
                  value={form.property_value || ""}
                  onChange={(e) => setField("property_value", Number(e.target.value))}
                  placeholder="400000"
                />
              </div>
              <div className="flex items-end gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="str"
                    checked={form.is_short_term_rental || false}
                    onChange={(e) => setField("is_short_term_rental", e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="str" className="cursor-pointer">
                    Short-Term Rental (STR)
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loan Details */}
        <Card>
          <CardHeader>
            <CardTitle>Loan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Loan Purpose *</Label>
                <Select
                  value={form.loan_purpose || "purchase"}
                  onValueChange={(v) => setField("loan_purpose", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DSCR_LOAN_PURPOSES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Loan Amount *</Label>
                <Input
                  type="number"
                  value={form.loan_amount || ""}
                  onChange={(e) => setField("loan_amount", Number(e.target.value))}
                  placeholder="300000"
                />
              </div>
              <div>
                <Label>LTV</Label>
                <div className="h-10 px-3 flex items-center border rounded-md bg-muted/50 font-medium">
                  {ltv > 0 ? `${ltv.toFixed(1)}%` : "—"}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Prepay Preference</Label>
                <Select
                  value={form.prepay_preference || "declining_5yr"}
                  onValueChange={(v) => setField("prepay_preference", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DSCR_PREPAY_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lock Period</Label>
                <Select
                  value={String(form.lock_period_days || 45)}
                  onValueChange={(v) => setField("lock_period_days", Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DSCR_LOCK_PERIODS.map((t) => (
                      <SelectItem key={t.value} value={String(t.value)}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="io"
                    checked={form.is_interest_only || false}
                    onChange={(e) => setField("is_interest_only", e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="io" className="cursor-pointer">Interest Only</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="escrow"
                    checked={form.escrow_waiver || false}
                    onChange={(e) => setField("escrow_waiver", e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="escrow" className="cursor-pointer">Escrow Waiver</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Income / DSCR */}
        <Card>
          <CardHeader>
            <CardTitle>Income & Expenses (DSCR Calculation)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Monthly Gross Rental Income *</Label>
              <Input
                type="number"
                value={form.monthly_rent || ""}
                onChange={(e) => setField("monthly_rent", Number(e.target.value))}
                placeholder="2500"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Monthly Taxes</Label>
                <Input
                  type="number"
                  value={form.monthly_taxes || ""}
                  onChange={(e) => setField("monthly_taxes", Number(e.target.value))}
                  placeholder="300"
                />
              </div>
              <div>
                <Label>Monthly Insurance</Label>
                <Input
                  type="number"
                  value={form.monthly_insurance || ""}
                  onChange={(e) => setField("monthly_insurance", Number(e.target.value))}
                  placeholder="150"
                />
              </div>
              <div>
                <Label>Monthly HOA</Label>
                <Input
                  type="number"
                  value={form.monthly_hoa || ""}
                  onChange={(e) => setField("monthly_hoa", Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Monthly Flood Ins.</Label>
                <Input
                  type="number"
                  value={form.monthly_flood || ""}
                  onChange={(e) => setField("monthly_flood", Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requity Comp */}
        <Card>
          <CardHeader>
            <CardTitle>Requity Compensation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Front-End Points (broker points)</Label>
                <Input
                  type="number"
                  step="0.125"
                  value={form.broker_points ?? 2.0}
                  onChange={(e) => setField("broker_points", Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Front-End Dollars</Label>
                <div className="h-10 px-3 flex items-center border rounded-md bg-muted/50">
                  ${form.loan_amount && form.broker_points
                    ? ((form.loan_amount * (form.broker_points || 0)) / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })
                    : "—"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Run Button */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleRunPricing}
          disabled={running}
        >
          {running ? (
            <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Running Pricing Engine...</>
          ) : (
            <><Calculator className="h-5 w-5 mr-2" /> Run Pricing</>
          )}
        </Button>
      </div>

      {/* Sidebar - Live DSCR Calculator */}
      <div className="space-y-4">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle>Deal Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">LTV:</span>
                <span className={`ml-2 font-semibold ${ltv > 80 ? "text-red-600" : "text-green-600"}`}>
                  {ltv > 0 ? `${ltv.toFixed(1)}%` : "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Loan:</span>
                <span className="ml-2 font-semibold">
                  {form.loan_amount
                    ? `$${form.loan_amount.toLocaleString()}`
                    : "—"}
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground mb-1">
                Estimated DSCR (at ~7% rate)
              </div>
              <div
                className={`text-3xl font-bold ${
                  estimatedDSCR >= 1.25
                    ? "text-green-600"
                    : estimatedDSCR >= 1.0
                      ? "text-yellow-600"
                      : estimatedDSCR > 0
                        ? "text-red-600"
                        : "text-muted-foreground"
                }`}
              >
                {estimatedDSCR > 0 ? `${estimatedDSCR.toFixed(2)}x` : "—"}
              </div>
            </div>

            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. P&I:</span>
                <span>${estimatedPI > 0 ? estimatedPI.toFixed(0) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxes:</span>
                <span>${form.monthly_taxes || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Insurance:</span>
                <span>${form.monthly_insurance || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">HOA:</span>
                <span>${form.monthly_hoa || 0}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>PITIA:</span>
                <span>${estimatedPITIA > 0 ? estimatedPITIA.toFixed(0) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Rent:</span>
                <span className="font-semibold">${form.monthly_rent || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
