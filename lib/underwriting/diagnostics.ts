/**
 * Underwriting Diagnostics — Input completeness analysis
 *
 * Analyzes which inputs are populated vs missing and determines
 * per-metric computation status based on dependency chains.
 */

import type { UnderwritingInputs, UnderwritingOutputs } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DiagnosticStatus = "computed" | "incomplete" | "empty";

export interface InputDiagnostic {
  key: keyof UnderwritingInputs;
  label: string;
  present: boolean;
  value: number | null;
}

export interface MetricDiagnostic {
  key: keyof UnderwritingOutputs;
  label: string;
  status: DiagnosticStatus;
  value: number | null;
  requiredInputs: { key: keyof UnderwritingInputs; label: string; present: boolean }[];
}

export interface DiagnosticResult {
  overallStatus: DiagnosticStatus;
  inputSummary: { total: number; populated: number; missing: string[] };
  metrics: MetricDiagnostic[];
  inputs: InputDiagnostic[];
}

// ---------------------------------------------------------------------------
// Input labels (human-readable names for each numeric input field)
// ---------------------------------------------------------------------------

const INPUT_LABELS: Partial<Record<keyof UnderwritingInputs, string>> = {
  loan_amount: "Loan Amount",
  purchase_price: "Purchase Price",
  appraised_value: "Appraised Value",
  interest_rate: "Interest Rate",
  points: "Points",
  loan_term_months: "Loan Term",
  after_repair_value: "After Repair Value",
  rehab_budget: "Rehab Budget",
  heated_sqft: "Heated Sq Ft",
  monthly_rent: "Monthly Rent",
  annual_property_tax: "Annual Property Tax",
  annual_insurance: "Annual Insurance",
  monthly_hoa: "Monthly HOA",
  monthly_utilities: "Monthly Utilities",
  operating_expenses: "Operating Expenses",
  holding_period_months: "Holding Period",
  projected_sale_price: "Projected Sale Price",
  sales_disposition_pct: "Sales Disposition %",
  credit_score: "Credit Score",
  experience_count: "Experience Count",
  mobilization_draw: "Mobilization Draw",
  lender_fees_flat: "Lender Fees (Flat)",
  title_closing_escrow: "Title / Closing / Escrow",
  num_partners: "Number of Partners",
};

// Numeric input keys (skip string-typed fields)
const NUMERIC_INPUT_KEYS = Object.keys(INPUT_LABELS) as (keyof UnderwritingInputs)[];

// ---------------------------------------------------------------------------
// Output metric labels
// ---------------------------------------------------------------------------

const OUTPUT_LABELS: Record<keyof UnderwritingOutputs, string> = {
  ltv: "LTV",
  ltarv: "LTARV",
  ltc: "LTC",
  debt_service_coverage: "DSCR",
  monthly_payment: "Monthly Payment",
  total_interest: "Total Interest",
  origination_fee: "Origination Fee",
  total_fees: "Total Fees",
  total_closing_costs: "Total Closing Costs",
  total_cash_to_close: "Total Cash to Close",
  monthly_holding_costs: "Monthly Holding Costs",
  total_holding_costs: "Total Holding Costs",
  net_yield: "Net Yield",
  investor_return: "Investor Return",
  net_profit: "Net Profit",
  borrower_roi: "Borrower ROI",
  annualized_roi: "Annualized ROI",
  total_project_cost: "Total Project Cost",
  max_loan_ltv: "Max Loan (LTV)",
  max_loan_ltarv: "Max Loan (LTARV)",
  gross_sale_proceeds: "Gross Sale Proceeds",
  sales_costs: "Sales Costs",
  net_sale_proceeds: "Net Sale Proceeds",
  cash_per_partner: "Cash per Partner",
  profit_per_partner: "Profit per Partner",
};

// ---------------------------------------------------------------------------
// Dependency maps — which inputs each output metric requires
// ---------------------------------------------------------------------------

type DepMap = Record<keyof UnderwritingOutputs, (keyof UnderwritingInputs)[]>;

const SHARED_DEPS: DepMap = {
  ltv: ["loan_amount", "appraised_value"],
  ltarv: ["loan_amount", "after_repair_value"],
  ltc: ["loan_amount", "purchase_price", "rehab_budget"],
  debt_service_coverage: ["loan_amount", "interest_rate", "monthly_rent", "annual_property_tax", "annual_insurance"],
  monthly_payment: ["loan_amount", "interest_rate"],
  total_interest: ["loan_amount", "interest_rate", "loan_term_months"],
  origination_fee: ["loan_amount", "points"],
  total_fees: ["loan_amount", "points", "lender_fees_flat"],
  total_closing_costs: ["loan_amount", "interest_rate", "points", "lender_fees_flat", "title_closing_escrow"],
  total_cash_to_close: ["loan_amount", "purchase_price", "interest_rate", "points", "lender_fees_flat", "title_closing_escrow", "mobilization_draw"],
  monthly_holding_costs: ["loan_amount", "interest_rate", "annual_property_tax", "annual_insurance"],
  total_holding_costs: ["loan_amount", "interest_rate", "annual_property_tax", "annual_insurance", "loan_term_months"],
  net_yield: ["loan_amount", "interest_rate"],
  investor_return: ["loan_amount", "interest_rate", "points"],
  net_profit: ["loan_amount", "purchase_price", "interest_rate", "points", "rehab_budget", "after_repair_value"],
  borrower_roi: ["loan_amount", "purchase_price", "interest_rate", "points", "rehab_budget", "after_repair_value"],
  annualized_roi: ["loan_amount", "purchase_price", "interest_rate", "points", "rehab_budget", "after_repair_value", "loan_term_months"],
  total_project_cost: ["purchase_price", "rehab_budget"],
  max_loan_ltv: ["appraised_value"],
  max_loan_ltarv: ["after_repair_value"],
  gross_sale_proceeds: ["after_repair_value"],
  sales_costs: ["after_repair_value", "sales_disposition_pct"],
  net_sale_proceeds: ["after_repair_value", "sales_disposition_pct"],
  cash_per_partner: ["loan_amount", "purchase_price", "interest_rate", "points", "num_partners"],
  profit_per_partner: ["loan_amount", "purchase_price", "interest_rate", "points", "rehab_budget", "after_repair_value", "num_partners"],
};

// RTL focuses on fix & flip metrics
const RTL_KEY_METRICS: (keyof UnderwritingOutputs)[] = [
  "ltv", "ltarv", "ltc",
  "monthly_payment", "total_interest",
  "origination_fee", "total_fees", "total_closing_costs", "total_cash_to_close",
  "monthly_holding_costs", "total_holding_costs",
  "net_profit", "borrower_roi", "annualized_roi",
  "total_project_cost", "max_loan_ltv", "max_loan_ltarv",
  "gross_sale_proceeds", "sales_costs", "net_sale_proceeds",
  "cash_per_partner", "profit_per_partner",
];

// DSCR focuses on rental/income metrics
const DSCR_KEY_METRICS: (keyof UnderwritingOutputs)[] = [
  "ltv", "ltarv",
  "debt_service_coverage",
  "monthly_payment", "total_interest",
  "origination_fee", "total_fees", "total_closing_costs", "total_cash_to_close",
  "net_yield", "investor_return",
  "max_loan_ltv", "max_loan_ltarv",
];

// RTL-relevant inputs (numeric only)
const RTL_INPUTS: (keyof UnderwritingInputs)[] = [
  "loan_amount", "purchase_price", "appraised_value", "interest_rate", "points",
  "loan_term_months", "after_repair_value", "rehab_budget",
  "holding_period_months", "projected_sale_price", "sales_disposition_pct",
  "mobilization_draw", "lender_fees_flat", "title_closing_escrow", "num_partners",
];

// DSCR-relevant inputs (numeric only)
const DSCR_INPUTS: (keyof UnderwritingInputs)[] = [
  "loan_amount", "purchase_price", "appraised_value", "interest_rate", "points",
  "loan_term_months", "after_repair_value",
  "monthly_rent", "annual_property_tax", "annual_insurance",
  "monthly_hoa", "monthly_utilities", "operating_expenses",
  "lender_fees_flat", "title_closing_escrow",
];

// ---------------------------------------------------------------------------
// Core analysis function
// ---------------------------------------------------------------------------

function isNumericPopulated(value: unknown): boolean {
  return typeof value === "number" && !Number.isNaN(value);
}

export function analyzeDiagnostics(
  inputs: UnderwritingInputs,
  outputs: UnderwritingOutputs,
  modelType: "rtl" | "dscr"
): DiagnosticResult {
  const relevantInputKeys = modelType === "rtl" ? RTL_INPUTS : DSCR_INPUTS;
  const relevantMetrics = modelType === "rtl" ? RTL_KEY_METRICS : DSCR_KEY_METRICS;

  // Analyze all numeric inputs
  const inputDiagnostics: InputDiagnostic[] = NUMERIC_INPUT_KEYS.map((key) => ({
    key,
    label: INPUT_LABELS[key] || key,
    present: isNumericPopulated(inputs[key]),
    value: (inputs[key] as number | null) ?? null,
  }));

  // Input summary (scoped to model-relevant inputs)
  const relevantDiags = inputDiagnostics.filter((d) => relevantInputKeys.includes(d.key));
  const populated = relevantDiags.filter((d) => d.present).length;
  const missing = relevantDiags.filter((d) => !d.present).map((d) => d.label);

  // Per-metric diagnostics
  const metricDiagnostics: MetricDiagnostic[] = relevantMetrics.map((metricKey) => {
    const deps = SHARED_DEPS[metricKey] || [];
    const reqInputs = deps.map((inputKey) => ({
      key: inputKey,
      label: INPUT_LABELS[inputKey] || inputKey,
      present: isNumericPopulated(inputs[inputKey]),
    }));

    const allPresent = reqInputs.every((r) => r.present);
    const nonePresent = reqInputs.every((r) => !r.present);

    let status: DiagnosticStatus;
    if (allPresent) {
      status = "computed";
    } else if (nonePresent && reqInputs.length > 0) {
      status = "empty";
    } else {
      status = "incomplete";
    }

    return {
      key: metricKey,
      label: OUTPUT_LABELS[metricKey],
      status,
      value: outputs[metricKey],
      requiredInputs: reqInputs,
    };
  });

  // Overall status
  let overallStatus: DiagnosticStatus;
  if (populated === 0) {
    overallStatus = "empty";
  } else if (metricDiagnostics.every((m) => m.status === "computed")) {
    overallStatus = "computed";
  } else {
    overallStatus = "incomplete";
  }

  return {
    overallStatus,
    inputSummary: { total: relevantDiags.length, populated, missing },
    metrics: metricDiagnostics,
    inputs: inputDiagnostics,
  };
}

// ---------------------------------------------------------------------------
// Commercial UW simplified diagnostics (based on outputs JSONB)
// ---------------------------------------------------------------------------

export function analyzeCommercialStatus(
  outputs: Record<string, unknown>
): DiagnosticStatus {
  if (!outputs || Object.keys(outputs).length === 0) return "empty";
  const hasNoi = typeof outputs.noi === "number" || typeof outputs.stabilized_noi === "number";
  const hasDscr = typeof outputs.dscr === "number" || typeof outputs.going_in_dscr === "number";
  if (hasNoi && hasDscr) return "computed";
  return "incomplete";
}

// ---------------------------------------------------------------------------
// Format diagnostic result as plain text (for clipboard copy)
// ---------------------------------------------------------------------------

export function formatDiagnosticReport(result: DiagnosticResult, modelType: string): string {
  const lines: string[] = [
    `Underwriting Diagnostics Report — ${modelType.toUpperCase()}`,
    `Status: ${result.overallStatus.toUpperCase()}`,
    `Inputs: ${result.inputSummary.populated} of ${result.inputSummary.total} populated`,
    "",
  ];

  if (result.inputSummary.missing.length > 0) {
    lines.push("Missing Inputs:");
    result.inputSummary.missing.forEach((m) => lines.push(`  - ${m}`));
    lines.push("");
  }

  lines.push("Metric Status:");
  result.metrics.forEach((m) => {
    const icon = m.status === "computed" ? "[OK]" : m.status === "incomplete" ? "[!!]" : "[--]";
    const val = m.value != null ? ` = ${m.value}` : "";
    const missingDeps = m.requiredInputs
      .filter((r) => !r.present)
      .map((r) => r.label);
    const depInfo = missingDeps.length > 0 ? ` (needs: ${missingDeps.join(", ")})` : "";
    lines.push(`  ${icon} ${m.label}${val}${depInfo}`);
  });

  return lines.join("\n");
}
