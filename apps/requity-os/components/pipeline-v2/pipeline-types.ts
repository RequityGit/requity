// ═══════════════════════════════════════════════════════════
// Unified Pipeline — Types, Constants, Formatters
// ═══════════════════════════════════════════════════════════

export type CapitalSide = "debt" | "equity";
export type UnifiedStage = "lead" | "analysis" | "negotiation" | "execution" | "closed";
export type CardTypeStatus = "active" | "draft" | "planned" | "archived";
export type DealStatus = "active" | "won" | "lost" | "on_hold";
export type AlertLevel = "normal" | "warn" | "alert";

export type AssetClass =
  | "sfr"
  | "duplex_fourplex"
  | "multifamily"
  | "mhc"
  | "rv_park"
  | "campground"
  | "commercial"
  | "mixed_use"
  | "land";

export interface UwFieldDef {
  key: string;
  label: string;
  type: "currency" | "percent" | "number" | "text" | "boolean" | "select" | "date";
  required?: boolean;
  options?: string[];
}

export interface UwOutputDef {
  key: string;
  label: string;
  type: "currency" | "percent" | "ratio";
  formula?: string;
}

export interface CardMetricDef {
  key: string;
  label?: string;
  prefix?: string;
  suffix?: string;
  format?: "compact";
  computed?: boolean;
}

export interface FieldGroupDef {
  label: string;
  fields: string[];
}

export interface UnifiedCardType {
  id: string;
  slug: string;
  label: string;
  capital_side: CapitalSide;
  category: string;
  description: string | null;
  uw_model_key: string;
  uw_fields: UwFieldDef[];
  uw_outputs: UwOutputDef[];
  card_metrics: CardMetricDef[];
  card_icon: string;
  detail_tabs: string[];
  detail_field_groups: FieldGroupDef[];
  applicable_asset_classes: string[] | null;
  status: CardTypeStatus;
  sort_order: number;
}

export interface UnifiedDeal {
  id: string;
  card_type_id: string;
  capital_side: CapitalSide;
  asset_class: AssetClass | null;
  name: string;
  deal_number: string | null;
  stage: UnifiedStage;
  stage_entered_at: string;
  primary_contact_id: string | null;
  company_id: string | null;
  assigned_to: string | null;
  amount: number | null;
  probability: number;
  expected_close_date: string | null;
  actual_close_date: string | null;
  status: DealStatus;
  loss_reason: string | null;
  source: string | null;
  uw_data: Record<string, unknown>;
  property_data: Record<string, unknown>;
  notes: string | null;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  card_type?: UnifiedCardType;
  primary_contact?: { id: string; first_name: string; last_name: string } | null;
  company?: { id: string; name: string } | null;
  // Computed client-side
  checklist_total?: number;
  checklist_completed?: number;
  days_in_stage?: number;
  alert_level?: AlertLevel;
}

export interface ChecklistItem {
  id: string;
  deal_id: string;
  template_id: string | null;
  item_label: string;
  sort_order: number;
  is_required: boolean;
  completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
}

export interface StageConfig {
  id: string;
  stage: UnifiedStage;
  warn_days: number | null;
  alert_days: number | null;
  description: string | null;
  sort_order: number;
}

export interface DealActivity {
  id: string;
  deal_id: string;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export interface DealTask {
  id: string;
  deal_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  status: "pending" | "in_progress" | "completed" | "blocked" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

// ─── Constants ───

export const STAGES: { key: UnifiedStage; label: string }[] = [
  { key: "lead", label: "Lead" },
  { key: "analysis", label: "Analysis" },
  { key: "negotiation", label: "Negotiation" },
  { key: "execution", label: "Execution" },
  { key: "closed", label: "Closed" },
];

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  sfr: "SFR",
  duplex_fourplex: "Duplex/Fourplex",
  multifamily: "Multifamily",
  mhc: "MHC",
  rv_park: "RV Park",
  campground: "Campground",
  commercial: "Commercial",
  mixed_use: "Mixed Use",
  land: "Land",
};

export const CARD_TYPE_SHORT_LABELS: Record<string, string> = {
  res_debt_dscr: "DSCR",
  res_debt_rtl: "RTL",
  comm_equity: "Comm Eq",
  comm_debt: "Comm Debt",
};

export const CAPITAL_SIDE_COLORS: Record<CapitalSide, string> = {
  debt: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  equity: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

// ─── Formatters ───

export function formatCurrency(value: number | null | undefined, compact?: boolean): string {
  if (value == null) return "--";
  if (compact) {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "--";
  return `${Number(value).toFixed(2)}%`;
}

export function formatRatio(value: number | null | undefined): string {
  if (value == null) return "--";
  return `${Number(value).toFixed(2)}x`;
}

export function daysInStage(stageEnteredAt: string): number {
  const entered = new Date(stageEnteredAt);
  const now = new Date();
  return Math.floor((now.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24));
}

export function getAlertLevel(
  days: number,
  config: StageConfig | undefined
): AlertLevel {
  if (!config) return "normal";
  if (config.alert_days != null && days >= config.alert_days) return "alert";
  if (config.warn_days != null && days >= config.warn_days) return "warn";
  return "normal";
}

export function computeUwOutput(
  key: string,
  uwData: Record<string, unknown>,
  outputs: UwOutputDef[]
): number | null {
  const def = outputs.find((o) => o.key === key);
  if (!def?.formula) return null;

  const formula = def.formula;
  const val = (k: string) => {
    const v = uwData[k];
    return typeof v === "number" ? v : null;
  };

  // Simple formula evaluation for common patterns
  if (key === "ltv" || key === "ltv_as_is") {
    const num = val("loan_amount");
    const den = key === "ltv_as_is" ? val("as_is_value") : val("property_value");
    if (num != null && den != null && den !== 0) return (num / den) * 100;
  }
  if (key === "dscr") {
    const rent = val("monthly_rent");
    const exp = val("monthly_expenses");
    if (rent != null && exp != null && exp !== 0) return rent / exp;
  }
  if (key === "cap_rate_in") {
    const noi = val("noi_current");
    const price = val("offer_price");
    if (noi != null && price != null && price !== 0) return (noi / price) * 100;
  }
  if (key === "ltc") {
    const total = val("total_loan");
    const pp = val("purchase_price");
    const rehab = val("rehab_budget");
    if (total != null && pp != null && rehab != null && pp + rehab !== 0)
      return (total / (pp + rehab)) * 100;
  }
  if (key === "ltv_arv") {
    const total = val("total_loan");
    const arv = val("arv");
    if (total != null && arv != null && arv !== 0) return (total / arv) * 100;
  }
  if (key === "debt_yield") {
    const noi = val("noi") ?? val("noi_current");
    const loan = val("loan_amount");
    if (noi != null && loan != null && loan !== 0) return (noi / loan) * 100;
  }
  if (key === "price_per_unit") {
    const price = val("offer_price") ?? val("property_value");
    const units = val("units_lots_sites");
    if (price != null && units != null && units !== 0) return price / units;
  }
  if (key === "cap_rate_stabilized") {
    const noi = val("noi_stabilized");
    const price = val("offer_price") ?? val("property_value");
    if (noi != null && price != null && price !== 0) return (noi / price) * 100;
  }
  if (key === "cap_rate_going_in") {
    const noi = val("noi_current") ?? val("noi");
    const price = val("property_value") ?? val("offer_price");
    if (noi != null && price != null && price !== 0) return (noi / price) * 100;
  }
  if (key === "bridge_ltv") {
    const bridgeLoan = val("bridge_loan_amount");
    const propVal = val("property_value");
    if (bridgeLoan != null && propVal != null && propVal !== 0) return (bridgeLoan / propVal) * 100;
  }
  if (key === "exit_dscr") {
    const noi = val("noi_stabilized") ?? val("noi_current") ?? val("noi");
    const exitLoan = val("exit_loan_amount");
    const exitRate = val("exit_rate");
    const exitAmort = val("exit_amortization_years");
    if (noi != null && exitLoan != null && exitRate != null && exitAmort != null && exitAmort > 0) {
      const monthlyRate = exitRate / 100 / 12;
      const numPayments = exitAmort * 12;
      const monthlyPayment = monthlyRate > 0
        ? exitLoan * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
        : exitLoan / numPayments;
      const annualDebtService = monthlyPayment * 12;
      if (annualDebtService > 0) return noi / annualDebtService;
    }
  }

  // Fallback: try to parse simple "a / b * c" patterns
  const parts = formula.split(/\s*([/*+-])\s*/);
  if (parts.length === 5 && parts[1] === "/" && parts[3] === "*") {
    const a = val(parts[0]);
    const b = val(parts[2]);
    const c = Number(parts[4]);
    if (a != null && b != null && b !== 0 && !isNaN(c)) return (a / b) * c;
  }

  return null;
}

export function getCardMetricValue(
  metric: CardMetricDef,
  deal: UnifiedDeal,
  cardType: UnifiedCardType
): string {
  const uwData = deal.uw_data;
  let value: number | null = null;

  if (metric.computed) {
    value = computeUwOutput(metric.key, uwData, cardType.uw_outputs);
  } else {
    const raw = uwData[metric.key];
    value = typeof raw === "number" ? raw : null;
  }

  if (value == null) return "--";

  if (metric.format === "compact") {
    return `${metric.prefix ?? ""}${formatCurrency(value, true).replace("$", "")}`;
  }

  const formatted = Number(value).toFixed(
    metric.suffix === "x" ? 2 : metric.suffix === "%" ? 1 : 0
  );

  return `${metric.prefix ?? ""}${formatted}${metric.suffix ?? ""}`;
}
