"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Calculator,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Home,
  Percent,
  Loader2,
} from "lucide-react";
// Tables pricing_programs / leverage_adjusters may not be in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PricingProgram = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LeverageAdjuster = Record<string, any>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DealInputs {
  program_id: string;
  purchase_price: string;
  rehab_budget: string;
  after_repair_value: string;
  credit_score: string;
  experience_deals_24mo: string;
  legal_status: string;
  property_type: string;
  flood_zone: boolean;
  rural_status: string;
  holding_period_months: string;
  requested_loan_amount: string;
  heated_sqft: string;
  mobilization_draw: string;
  annual_property_tax: string;
  annual_insurance: string;
  monthly_utilities: string;
  monthly_hoa: string;
  title_closing_escrow: string;
  lender_fees_flat: string;
  sales_disposition_pct: string;
  num_partners: string;
}

interface CalculationResult {
  program: PricingProgram;
  eligibility: {
    credit_score_check: string;
    experience_check: string;
    citizenship_check: string;
    overall_result: string;
    notes: string[];
  } | null;
  leverage: {
    base_ltv: number;
    base_ltc: number;
    base_ltp: number;
    effective_ltv: number;
    effective_ltc: number;
    effective_ltp: number;
    adjustments: Array<{
      risk_factor: string;
      display_name: string;
      ltc_adjustment: number;
      ltv_adjustment: number;
      applies: boolean;
    }>;
  } | null;
  sizing: {
    total_project_cost: number;
    max_loan_arv: number;
    max_loan_ltc: number;
    max_loan_ltp: number;
    binding_constraint: number;
    binding_type: string;
    total_loan: number;
    requested_exceeds_max: boolean;
    allocated_to_purchase: number;
    allocated_to_rehab: number;
    lender_cash_at_closing: number;
    remaining_rehab_draws: number;
  };
  holding: {
    monthly_interest: number;
    total_monthly: number;
    total_holding: number;
  };
  closing: {
    origination_fee: number;
    prepaid_interest: number;
    total_closing: number;
    total_cash_to_close: number;
    cash_to_close_pct: number;
  };
  pnl: {
    gross_proceeds: number;
    sales_costs: number;
    net_proceeds: number;
    net_profit: number;
    roi: number;
    annualized_roi: number;
    cash_per_partner: number;
    profit_per_partner: number;
  };
  creditBox: {
    ltv_arv: number;
    ltc: number;
    ltp: number;
    day1_ltv: number;
    loan_per_sqft: number | null;
    equity_at_closing: number;
    arv_cushion: number;
    break_even: number;
  };
  perSqft: {
    purchase: number;
    arv: number;
    rehab: number;
    loan: number;
  } | null;
}

interface PricingCalculatorProps {
  programs: PricingProgram[];
  adjusters: LeverageAdjuster[];
  /** Pre-fill values from an existing loan */
  initialValues?: Partial<DealInputs>;
  /** Called when calculation completes (to save to loan) */
  onSave?: (result: CalculationResult, inputs: DealInputs) => Promise<void>;
  saving?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function num(val: string): number {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const DEFAULT_INPUTS: DealInputs = {
  program_id: "",
  purchase_price: "",
  rehab_budget: "",
  after_repair_value: "",
  credit_score: "",
  experience_deals_24mo: "",
  legal_status: "",
  property_type: "",
  flood_zone: false,
  rural_status: "Non-Rural",
  holding_period_months: "12",
  requested_loan_amount: "",
  heated_sqft: "",
  mobilization_draw: "0",
  annual_property_tax: "",
  annual_insurance: "",
  monthly_utilities: "",
  monthly_hoa: "",
  title_closing_escrow: "",
  lender_fees_flat: "",
  sales_disposition_pct: "3",
  num_partners: "1",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PricingCalculator({
  programs,
  adjusters,
  initialValues,
  onSave,
  saving,
}: PricingCalculatorProps) {
  const [inputs, setInputs] = useState<DealInputs>({
    ...DEFAULT_INPUTS,
    ...initialValues,
  });
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [adjusterState, setAdjusterState] = useState<Record<string, boolean>>(
    {}
  );

  function updateInput(field: keyof DealInputs, value: string | boolean) {
    setInputs((prev) => ({ ...prev, [field]: value }));
  }

  function calculate() {
    // Find program
    const programId =
      inputs.program_id || autoSelectProgram();
    const program = programs.find(
      (p) => p.program_id === programId && p.is_current
    );
    if (!program) return;

    const pp = num(inputs.purchase_price);
    const rehab = num(inputs.rehab_budget);
    const arv = num(inputs.after_repair_value);
    const totalCost = pp + rehab;
    const sqft = num(inputs.heated_sqft);
    const holdMonths = num(inputs.holding_period_months) || program.loan_term_months;
    const numPartners = Math.max(1, num(inputs.num_partners));
    const salesPct = num(inputs.sales_disposition_pct) || 3;
    const mobilization = num(inputs.mobilization_draw);
    const feesFlat = num(inputs.lender_fees_flat);
    const titleEscrow = num(inputs.title_closing_escrow);

    // Eligibility (Premier)
    let eligibility: CalculationResult["eligibility"] = null;
    if (programId === "ff_premier") {
      const cs = num(inputs.credit_score);
      const exp = num(inputs.experience_deals_24mo);
      const notes: string[] = [];

      const csCheck =
        cs === 0 ? "N/A" : cs >= program.min_credit_score ? "PASS" : "FAIL";
      const expCheck =
        exp === 0 && !inputs.experience_deals_24mo
          ? "N/A"
          : exp >= program.min_deals_24mo
            ? "PASS"
            : "FAIL";
      let citCheck = "N/A";
      if (inputs.legal_status) {
        citCheck =
          program.citizenship === "any" ||
          (program.citizenship === "us_resident" &&
            (inputs.legal_status === "US Citizen" ||
              inputs.legal_status === "Permanent Resident"))
            ? "PASS"
            : "FAIL";
      }

      if (csCheck === "FAIL")
        notes.push(`FICO ${cs} < ${program.min_credit_score}`);
      if (expCheck === "FAIL")
        notes.push(`${exp} deals < ${program.min_deals_24mo} required`);
      if (citCheck === "FAIL") notes.push(`${inputs.legal_status} not eligible`);

      const checks = [csCheck, expCheck, citCheck];
      const overall = checks.includes("FAIL")
        ? "NOT ELIGIBLE"
        : checks.every((c) => c === "PASS")
          ? "ELIGIBLE"
          : "NOT ELIGIBLE";

      eligibility = {
        credit_score_check: csCheck,
        experience_check: expCheck,
        citizenship_check: citCheck,
        overall_result: overall,
        notes,
      };
    }

    // Leverage adjustments (Balance Sheet)
    let effLtv = program.max_ltv;
    let effLtc = program.max_ltc;
    let effLtp = program.max_ltp;
    let leverage: CalculationResult["leverage"] = null;

    if (programId === "ff_balance") {
      const adjResults: (LeverageAdjuster & { applies: boolean })[] = adjusters
        .filter((a) => a.is_active)
        .map((a) => {
          const applies = adjusterState[a.risk_factor] ?? autoDetectAdjuster(a, inputs, pp, rehab, holdMonths, program);
          return { ...a, applies } as LeverageAdjuster & { applies: boolean };
        });

      adjResults.forEach((a) => {
        if (a.applies) {
          effLtc += a.ltc_adjustment;
          effLtv += a.ltv_adjustment;
          effLtp += a.ltc_adjustment;
        }
      });

      leverage = {
        base_ltv: program.max_ltv,
        base_ltc: program.max_ltc,
        base_ltp: program.max_ltp,
        effective_ltv: effLtv,
        effective_ltc: effLtc,
        effective_ltp: effLtp,
        adjustments: adjResults.map((a) => ({
          risk_factor: a.risk_factor,
          display_name: a.display_name,
          ltc_adjustment: a.ltc_adjustment,
          ltv_adjustment: a.ltv_adjustment,
          applies: a.applies,
        })),
      };
    }

    // Loan sizing
    const maxArv = (effLtv / 100) * arv;
    const maxLtc = (effLtc / 100) * totalCost;
    const maxLtp = (effLtp / 100) * pp;
    const binding = Math.min(maxArv, maxLtc, maxLtp);
    const bindingType =
      binding === maxArv ? "ARV" : binding === maxLtc ? "LTC" : "LTP";

    const requested = num(inputs.requested_loan_amount);
    const exceedsMax = requested > 0 && requested > binding;
    const totalLoan =
      requested > 0 && !exceedsMax ? requested : binding;

    const allocPurchase = Math.min(totalLoan, pp);
    const allocRehab = totalLoan - allocPurchase;
    const lenderCash = allocPurchase + mobilization;
    const remainingDraws = allocRehab - mobilization;

    // Interest & holding
    const rate = program.interest_rate;
    const monthlyInt = totalLoan * (rate / 100 / 12);
    const monthlyTotal =
      monthlyInt +
      num(inputs.annual_property_tax) / 12 +
      num(inputs.annual_insurance) / 12 +
      num(inputs.monthly_utilities) +
      num(inputs.monthly_hoa);
    const totalHolding = monthlyTotal * holdMonths;

    // Closing costs
    const origFee = Math.max(
      totalLoan * (program.origination_points / 100),
      program.min_origination_fee
    );
    const prepaidInt = totalLoan * (rate / 100 / 360) * 15;
    const totalClosing = origFee + titleEscrow + prepaidInt + feesFlat;
    const cashToClose =
      (pp - allocPurchase) + (rehab - allocRehab) + totalClosing;
    const cashPct = pp > 0 ? (cashToClose / pp) * 100 : 0;

    // P&L
    const grossProceeds = arv;
    const salesCosts = arv * (salesPct / 100);
    const netProceeds = grossProceeds - salesCosts;
    const netProfit = netProceeds - pp - rehab - totalClosing - totalHolding;
    const roi = cashToClose > 0 ? (netProfit / cashToClose) * 100 : 0;
    const annRoi = holdMonths > 0 ? roi * (12 / holdMonths) : 0;

    // Credit box
    const ltvArv = arv > 0 ? (totalLoan / arv) * 100 : 0;
    const ltc = totalCost > 0 ? (totalLoan / totalCost) * 100 : 0;
    const ltp = pp > 0 ? (totalLoan / pp) * 100 : 0;
    const day1 = arv > 0 ? (lenderCash / arv) * 100 : 0;
    const loanSqft = sqft > 0 ? totalLoan / sqft : null;

    setResult({
      program,
      eligibility,
      leverage,
      sizing: {
        total_project_cost: totalCost,
        max_loan_arv: round2(maxArv),
        max_loan_ltc: round2(maxLtc),
        max_loan_ltp: round2(maxLtp),
        binding_constraint: round2(binding),
        binding_type: bindingType,
        total_loan: round2(totalLoan),
        requested_exceeds_max: exceedsMax,
        allocated_to_purchase: round2(allocPurchase),
        allocated_to_rehab: round2(allocRehab),
        lender_cash_at_closing: round2(lenderCash),
        remaining_rehab_draws: round2(remainingDraws),
      },
      holding: {
        monthly_interest: round2(monthlyInt),
        total_monthly: round2(monthlyTotal),
        total_holding: round2(totalHolding),
      },
      closing: {
        origination_fee: round2(origFee),
        prepaid_interest: round2(prepaidInt),
        total_closing: round2(totalClosing),
        total_cash_to_close: round2(cashToClose),
        cash_to_close_pct: round2(cashPct),
      },
      pnl: {
        gross_proceeds: grossProceeds,
        sales_costs: round2(salesCosts),
        net_proceeds: round2(netProceeds),
        net_profit: round2(netProfit),
        roi: round2(roi),
        annualized_roi: round2(annRoi),
        cash_per_partner: round2(cashToClose / numPartners),
        profit_per_partner: round2(netProfit / numPartners),
      },
      creditBox: {
        ltv_arv: round2(ltvArv),
        ltc: round2(ltc),
        ltp: round2(ltp),
        day1_ltv: round2(day1),
        loan_per_sqft: loanSqft ? round2(loanSqft) : null,
        equity_at_closing: round2(cashToClose),
        arv_cushion: round2(arv - totalLoan),
        break_even: round2(totalLoan + totalClosing + totalHolding + salesCosts),
      },
      perSqft:
        sqft > 0
          ? {
              purchase: round2(pp / sqft),
              arv: round2(arv / sqft),
              rehab: round2(rehab / sqft),
              loan: round2(totalLoan / sqft),
            }
          : null,
    });
  }

  function autoSelectProgram(): string {
    const cs = num(inputs.credit_score);
    const exp = num(inputs.experience_deals_24mo);
    const isPremier =
      cs >= 650 &&
      exp >= 3 &&
      (inputs.legal_status === "US Citizen" ||
        inputs.legal_status === "Permanent Resident");
    return isPremier ? "ff_premier" : "ff_balance";
  }

  const hasRequiredInputs =
    num(inputs.purchase_price) > 0 &&
    num(inputs.rehab_budget) >= 0 &&
    num(inputs.after_repair_value) > 0;

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Deal & Borrower */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="h-4 w-4" />
              Deal & Borrower Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Program</Label>
              <Select
                value={inputs.program_id}
                onValueChange={(v) => updateInput("program_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auto-select based on eligibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-select</SelectItem>
                  {programs
                    .filter((p) => p.is_current)
                    .map((p) => (
                      <SelectItem key={p.program_id} value={p.program_id}>
                        {p.program_name} ({p.interest_rate}%)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Purchase Price *</Label>
                <Input
                  type="number"
                  placeholder="350000"
                  value={inputs.purchase_price}
                  onChange={(e) => updateInput("purchase_price", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Rehab Budget *</Label>
                <Input
                  type="number"
                  placeholder="75000"
                  value={inputs.rehab_budget}
                  onChange={(e) => updateInput("rehab_budget", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">After Repair Value (ARV) *</Label>
              <Input
                type="number"
                placeholder="550000"
                value={inputs.after_repair_value}
                onChange={(e) =>
                  updateInput("after_repair_value", e.target.value)
                }
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Credit Score</Label>
                <Input
                  type="number"
                  placeholder="720"
                  value={inputs.credit_score}
                  onChange={(e) => updateInput("credit_score", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Deals (24 mo)</Label>
                <Input
                  type="number"
                  placeholder="5"
                  value={inputs.experience_deals_24mo}
                  onChange={(e) =>
                    updateInput("experience_deals_24mo", e.target.value)
                  }
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Legal Status</Label>
              <Select
                value={inputs.legal_status}
                onValueChange={(v) => updateInput("legal_status", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US Citizen">US Citizen</SelectItem>
                  <SelectItem value="Permanent Resident">
                    Permanent Resident
                  </SelectItem>
                  <SelectItem value="Foreign National">
                    Foreign National
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Property Type</Label>
              <Select
                value={inputs.property_type}
                onValueChange={(v) => updateInput("property_type", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SFR">SFR</SelectItem>
                  <SelectItem value="2-4 Unit">2-4 Unit</SelectItem>
                  <SelectItem value="Condo">Condo</SelectItem>
                  <SelectItem value="Townhouse">Townhouse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Column 2: Loan & Costs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Loan Structure & Costs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Holding Period (mo)</Label>
                <Input
                  type="number"
                  placeholder="12"
                  value={inputs.holding_period_months}
                  onChange={(e) =>
                    updateInput("holding_period_months", e.target.value)
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Heated Sq Ft</Label>
                <Input
                  type="number"
                  placeholder="1800"
                  value={inputs.heated_sqft}
                  onChange={(e) => updateInput("heated_sqft", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Requested Loan Amount</Label>
              <Input
                type="number"
                placeholder="Leave blank for max"
                value={inputs.requested_loan_amount}
                onChange={(e) =>
                  updateInput("requested_loan_amount", e.target.value)
                }
              />
            </div>

            <div>
              <Label className="text-xs">Day-1 Mobilization Draw</Label>
              <Input
                type="number"
                placeholder="0"
                value={inputs.mobilization_draw}
                onChange={(e) =>
                  updateInput("mobilization_draw", e.target.value)
                }
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Annual Prop. Tax</Label>
                <Input
                  type="number"
                  placeholder="4200"
                  value={inputs.annual_property_tax}
                  onChange={(e) =>
                    updateInput("annual_property_tax", e.target.value)
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Annual Insurance</Label>
                <Input
                  type="number"
                  placeholder="2400"
                  value={inputs.annual_insurance}
                  onChange={(e) =>
                    updateInput("annual_insurance", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Monthly Utilities</Label>
                <Input
                  type="number"
                  placeholder="200"
                  value={inputs.monthly_utilities}
                  onChange={(e) =>
                    updateInput("monthly_utilities", e.target.value)
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Monthly HOA</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={inputs.monthly_hoa}
                  onChange={(e) => updateInput("monthly_hoa", e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Title/Closing/Escrow</Label>
                <Input
                  type="number"
                  placeholder="3500"
                  value={inputs.title_closing_escrow}
                  onChange={(e) =>
                    updateInput("title_closing_escrow", e.target.value)
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Lender Fees (flat)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={inputs.lender_fees_flat}
                  onChange={(e) =>
                    updateInput("lender_fees_flat", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Sales/Disp. %</Label>
                <Input
                  type="number"
                  placeholder="3"
                  value={inputs.sales_disposition_pct}
                  onChange={(e) =>
                    updateInput("sales_disposition_pct", e.target.value)
                  }
                />
              </div>
              <div>
                <Label className="text-xs"># Partners</Label>
                <Input
                  type="number"
                  placeholder="1"
                  value={inputs.num_partners}
                  onChange={(e) => updateInput("num_partners", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Column 3: Adjusters (Balance Sheet) or Eligibility (Premier) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Percent className="h-4 w-4" />
              {(inputs.program_id === "ff_balance" || (!inputs.program_id && autoSelectProgram() === "ff_balance"))
                ? "Leverage Adjusters"
                : "Flood / Rural / Adjusters"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Flood Zone</Label>
                <Select
                  value={inputs.flood_zone ? "yes" : "no"}
                  onValueChange={(v) => updateInput("flood_zone", v === "yes")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Rural Status</Label>
                <Select
                  value={inputs.rural_status}
                  onValueChange={(v) => updateInput("rural_status", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Non-Rural">Non-Rural</SelectItem>
                    <SelectItem value="Rural">Rural</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {adjusters.filter((a) => a.is_active).length > 0 && (
              <>
                <Separator />
                <p className="text-xs text-muted-foreground">
                  Balance Sheet adjusters (toggle to override auto-detection):
                </p>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {adjusters
                    .filter((a) => a.is_active)
                    .map((adj) => {
                      const autoApplies = autoDetectAdjuster(
                        adj,
                        inputs,
                        num(inputs.purchase_price),
                        num(inputs.rehab_budget),
                        num(inputs.holding_period_months),
                        programs.find((p) => p.program_id === "ff_balance" && p.is_current) ?? null
                      );
                      const isOn = adjusterState[adj.risk_factor] ?? autoApplies;
                      return (
                        <div
                          key={adj.id}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer transition-colors",
                            isOn
                              ? "bg-red-50 text-red-900"
                              : "hover:bg-muted/50"
                          )}
                        >
                          <Checkbox
                            checked={isOn}
                            onCheckedChange={(v) =>
                              setAdjusterState((prev) => ({
                                ...prev,
                                [adj.risk_factor]: !!v,
                              }))
                            }
                          />
                          <span className="flex-1">
                            {adj.display_name}
                            <span className="text-muted-foreground ml-1">
                              ({adj.ltc_adjustment}% LTC, {adj.ltv_adjustment}% LTV)
                            </span>
                          </span>
                        </div>
                      );
                    })}
                </div>
              </>
            )}

            <Separator />

            <Button
              onClick={calculate}
              disabled={!hasRequiredInputs}
              className="w-full"
              size="lg"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Pricing
            </Button>

            {onSave && result && (
              <Button
                onClick={() => onSave(result, inputs)}
                disabled={saving}
                variant="outline"
                className="w-full"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <DollarSign className="h-4 w-4 mr-2" />
                )}
                Save to Loan
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {result && <PricingResults result={result} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Auto-detect adjuster applicability
// ---------------------------------------------------------------------------

function autoDetectAdjuster(
  adj: LeverageAdjuster,
  inputs: DealInputs,
  pp: number,
  rehab: number,
  holdMonths: number,
  program: PricingProgram | null
): boolean {
  switch (adj.risk_factor) {
    case "foreign_national":
      return inputs.legal_status === "Foreign National";
    case "low_credit":
      return num(inputs.credit_score) > 0 && num(inputs.credit_score) < 600;
    case "no_experience":
      return (
        inputs.experience_deals_24mo !== "" &&
        num(inputs.experience_deals_24mo) === 0
      );
    case "rural_property":
      return inputs.rural_status === "Rural";
    case "flood_zone":
      return inputs.flood_zone === true;
    case "condo_townhouse":
      return (
        inputs.property_type === "Condo" ||
        inputs.property_type === "Townhouse"
      );
    case "high_rehab_ratio":
      return pp > 0 && rehab / pp > 0.5;
    case "extended_term":
      return holdMonths > 12;
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Results Display
// ---------------------------------------------------------------------------

function ResultRow({
  label,
  value,
  bold,
  warn,
  indent,
}: {
  label: string;
  value: string | number;
  bold?: boolean;
  warn?: boolean;
  indent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between py-1 text-sm",
        bold && "font-semibold",
        warn && "text-red-600",
        indent && "pl-4"
      )}
    >
      <span className={cn(indent && "text-muted-foreground")}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function PricingResults({ result }: { result: CalculationResult }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {/* Program & Eligibility */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {result.program.program_name} (v{result.program.version})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <ResultRow
            label="Interest Rate"
            value={`${result.program.interest_rate}% ${result.program.rate_type}`}
          />
          <ResultRow
            label="Origination"
            value={result.program.points_note ?? `${result.program.origination_points}%`}
          />
          <ResultRow
            label="Term"
            value={result.program.term_note ?? `${result.program.loan_term_months} mo`}
          />
          <ResultRow
            label="Legal/Doc Fee"
            value={formatCurrency(result.program.legal_doc_fee)}
          />
          <ResultRow
            label="BPO/Appraisal"
            value={formatCurrency(result.program.bpo_appraisal_cost)}
          />

          {result.eligibility && (
            <>
              <Separator className="my-2" />
              <div className="flex items-center gap-2 mb-1">
                {result.eligibility.overall_result === "ELIGIBLE" ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    ELIGIBLE
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    <XCircle className="h-3 w-3 mr-1" />
                    NOT ELIGIBLE
                  </Badge>
                )}
              </div>
              <ResultRow
                label="Credit Score"
                value={result.eligibility.credit_score_check}
                warn={result.eligibility.credit_score_check === "FAIL"}
              />
              <ResultRow
                label="Experience"
                value={result.eligibility.experience_check}
                warn={result.eligibility.experience_check === "FAIL"}
              />
              <ResultRow
                label="Citizenship"
                value={result.eligibility.citizenship_check}
                warn={result.eligibility.citizenship_check === "FAIL"}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Loan Sizing */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Loan Sizing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {result.leverage && (
            <>
              <ResultRow
                label={`Max LTV (${result.leverage.effective_ltv}%)`}
                value={formatCurrency(result.sizing.max_loan_arv)}
                indent
              />
              <ResultRow
                label={`Max LTC (${result.leverage.effective_ltc}%)`}
                value={formatCurrency(result.sizing.max_loan_ltc)}
                indent
              />
              <ResultRow
                label={`Max LTP (${result.leverage.effective_ltp}%)`}
                value={formatCurrency(result.sizing.max_loan_ltp)}
                indent
              />
            </>
          )}
          {!result.leverage && (
            <>
              <ResultRow
                label={`Max LTV (${result.program.max_ltv}%)`}
                value={formatCurrency(result.sizing.max_loan_arv)}
                indent
              />
              <ResultRow
                label={`Max LTC (${result.program.max_ltc}%)`}
                value={formatCurrency(result.sizing.max_loan_ltc)}
                indent
              />
              <ResultRow
                label={`Max LTP (${result.program.max_ltp}%)`}
                value={formatCurrency(result.sizing.max_loan_ltp)}
                indent
              />
            </>
          )}
          <Separator className="my-1" />
          <ResultRow
            label={`Binding (${result.sizing.binding_type})`}
            value={formatCurrency(result.sizing.binding_constraint)}
            bold
          />
          {result.sizing.requested_exceeds_max && (
            <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
              <AlertTriangle className="h-3 w-3" />
              Requested amount exceeds maximum
            </div>
          )}
          <Separator className="my-1" />
          <ResultRow
            label="Total Loan"
            value={formatCurrency(result.sizing.total_loan)}
            bold
          />
          <ResultRow
            label="To Purchase"
            value={formatCurrency(result.sizing.allocated_to_purchase)}
            indent
          />
          <ResultRow
            label="To Rehab"
            value={formatCurrency(result.sizing.allocated_to_rehab)}
            indent
          />
          <ResultRow
            label="Lender Cash @ Close"
            value={formatCurrency(result.sizing.lender_cash_at_closing)}
            indent
          />
          <ResultRow
            label="Remaining Draws"
            value={formatCurrency(result.sizing.remaining_rehab_draws)}
            indent
          />
        </CardContent>
      </Card>

      {/* Holding & Closing Costs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Costs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">
            Monthly Holding
          </p>
          <ResultRow
            label="Interest"
            value={formatCurrency(result.holding.monthly_interest)}
            indent
          />
          <ResultRow
            label="Total Monthly"
            value={formatCurrency(result.holding.total_monthly)}
            bold
          />
          <ResultRow
            label="Total Holding"
            value={formatCurrency(result.holding.total_holding)}
            bold
          />

          <Separator className="my-1" />

          <p className="text-xs text-muted-foreground font-medium">
            Closing Costs
          </p>
          <ResultRow
            label="Origination Fee"
            value={formatCurrency(result.closing.origination_fee)}
            indent
          />
          <ResultRow
            label="Prepaid Interest"
            value={formatCurrency(result.closing.prepaid_interest)}
            indent
          />
          <ResultRow
            label="Total Closing"
            value={formatCurrency(result.closing.total_closing)}
            bold
          />

          <Separator className="my-1" />

          <ResultRow
            label="Cash to Close"
            value={formatCurrency(result.closing.total_cash_to_close)}
            bold
          />
          <ResultRow
            label="% of Purchase"
            value={`${result.closing.cash_to_close_pct}%`}
            indent
          />
        </CardContent>
      </Card>

      {/* Borrower P&L */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Borrower P&L
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <ResultRow
            label="Gross Sale (ARV)"
            value={formatCurrency(result.pnl.gross_proceeds)}
          />
          <ResultRow
            label="Sales Costs"
            value={`(${formatCurrency(result.pnl.sales_costs)})`}
            indent
          />
          <ResultRow
            label="Net Proceeds"
            value={formatCurrency(result.pnl.net_proceeds)}
          />
          <Separator className="my-1" />
          <ResultRow
            label="Net Profit"
            value={formatCurrency(result.pnl.net_profit)}
            bold
            warn={result.pnl.net_profit < 0}
          />
          <ResultRow
            label="Cash-on-Cash ROI"
            value={`${result.pnl.roi}%`}
            bold
            warn={result.pnl.roi < 0}
          />
          <ResultRow
            label="Annualized ROI"
            value={`${result.pnl.annualized_roi}%`}
            bold
          />
          {result.pnl.cash_per_partner !== result.closing.total_cash_to_close && (
            <>
              <Separator className="my-1" />
              <ResultRow
                label="Cash / Partner"
                value={formatCurrency(result.pnl.cash_per_partner)}
              />
              <ResultRow
                label="Profit / Partner"
                value={formatCurrency(result.pnl.profit_per_partner)}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Credit Box */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Credit Box Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <ResultRow label="LTV (ARV)" value={`${result.creditBox.ltv_arv}%`} />
          <ResultRow label="LTC" value={`${result.creditBox.ltc}%`} />
          <ResultRow label="LTP" value={`${result.creditBox.ltp}%`} />
          <ResultRow
            label="Day-1 LTV"
            value={`${result.creditBox.day1_ltv}%`}
          />
          {result.creditBox.loan_per_sqft !== null && (
            <ResultRow
              label="Loan / Sq Ft"
              value={formatCurrency(result.creditBox.loan_per_sqft)}
            />
          )}
          <Separator className="my-1" />
          <ResultRow
            label="Borrower Equity"
            value={formatCurrency(result.creditBox.equity_at_closing)}
          />
          <ResultRow
            label="ARV Cushion"
            value={formatCurrency(result.creditBox.arv_cushion)}
          />
          <ResultRow
            label="Break-Even Sale"
            value={formatCurrency(result.creditBox.break_even)}
          />
        </CardContent>
      </Card>

      {/* Per-Sqft */}
      {result.perSqft && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Per Sq Ft Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <ResultRow
              label="Purchase / sqft"
              value={formatCurrency(result.perSqft.purchase)}
            />
            <ResultRow
              label="ARV / sqft"
              value={formatCurrency(result.perSqft.arv)}
            />
            <ResultRow
              label="Rehab / sqft"
              value={formatCurrency(result.perSqft.rehab)}
            />
            <ResultRow
              label="Loan / sqft"
              value={formatCurrency(result.perSqft.loan)}
            />
          </CardContent>
        </Card>
      )}

      {/* Leverage Adjustments Detail */}
      {result.leverage && result.leverage.adjustments.some((a) => a.applies) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Applied Adjustments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {result.leverage.adjustments
              .filter((a) => a.applies)
              .map((a) => (
                <ResultRow
                  key={a.risk_factor}
                  label={a.display_name}
                  value={`${a.ltc_adjustment}% LTC / ${a.ltv_adjustment}% LTV`}
                  warn
                />
              ))}
            <Separator className="my-1" />
            <ResultRow
              label="Base LTV / LTC"
              value={`${result.leverage.base_ltv}% / ${result.leverage.base_ltc}%`}
              indent
            />
            <ResultRow
              label="Effective LTV / LTC"
              value={`${result.leverage.effective_ltv}% / ${result.leverage.effective_ltc}%`}
              bold
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
