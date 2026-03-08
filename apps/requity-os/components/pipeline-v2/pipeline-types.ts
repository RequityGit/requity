// ═══════════════════════════════════════════════════════════
// Unified Pipeline — Types, Constants, Formatters
// ═══════════════════════════════════════════════════════════

import { evaluateFormula } from "@/lib/formula-engine";

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

export type UwFieldObject = "deal" | "property" | "borrower";

export interface UwFieldDef {
  key: string;
  label: string;
  type: "currency" | "percent" | "number" | "text" | "boolean" | "select" | "date";
  required?: boolean;
  options?: string[];
  object?: UwFieldObject;
}

export interface UwOutputDef {
  key: string;
  label: string;
  type: "currency" | "percent" | "ratio";
  formula?: string;
}

// ---------------------------------------------------------------------------
// Grid Pro Forma types
// ---------------------------------------------------------------------------

export const GRID_PERIODS = [
  "t12",
  "yr1",
  "yr2",
  "yr3",
  "yr4",
  "yr5",
  "stabilized",
] as const;

export type GridPeriod = (typeof GRID_PERIODS)[number];

export const GRID_PERIOD_LABELS: Record<GridPeriod, string> = {
  t12: "T-12",
  yr1: "Year 1",
  yr2: "Year 2",
  yr3: "Year 3",
  yr4: "Year 4",
  yr5: "Year 5",
  stabilized: "Stabilized",
};

/** Maps period to a numeric index (used as `t` variable in formulas). */
export const GRID_PERIOD_INDEX: Record<GridPeriod, number> = {
  t12: 0,
  yr1: 1,
  yr2: 2,
  yr3: 3,
  yr4: 4,
  yr5: 5,
  stabilized: 6,
};

export type GridRowType = "currency" | "percent" | "ratio" | "number";

export interface GridRowDef {
  key: string;
  label: string;
  type: GridRowType;
  formula: string;
  section?: string;
  bold?: boolean;
  sort_order: number;
}

export interface GridTemplateDef {
  rows: GridRowDef[];
}

/** Per-cell override on a deal. Key format: `{row_key}:{period}` */
export interface GridCellOverride {
  value?: number;
  formula?: string;
}

export type GridOverrides = Record<string, GridCellOverride>;

/** Evaluated grid result: row key -> period -> value */
export type GridResult = Record<string, Record<GridPeriod, number | null>>;

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
  property_fields: UwFieldDef[];
  property_field_groups: FieldGroupDef[];
  contact_fields: UwFieldDef[];
  contact_field_groups: FieldGroupDef[];
  contact_roles: string[];
  applicable_asset_classes: string[] | null;
  status: CardTypeStatus;
  sort_order: number;
  uw_grid?: GridTemplateDef | null;
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
  property_id: string | null;
  assigned_to: string | null;
  amount: number | null;
  probability: number;
  expected_close_date: string | null;
  actual_close_date: string | null;
  status: DealStatus;
  loss_reason: string | null;
  source: string | null;
  uw_data: Record<string, unknown>;
  uw_grid_overrides: GridOverrides;
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

export interface DealCondition {
  id: string;
  deal_id: string;
  template_id: string | null;
  condition_name: string;
  category: string;
  required_stage: string;
  status: string;
  internal_description: string | null;
  borrower_description: string | null;
  responsible_party: string | null;
  critical_path_item: boolean;
  requires_approval: boolean;
  is_required: boolean;
  sort_order: number;
  notes: string | null;
  document_urls: string[] | null;
  due_date: string | null;
  assigned_to: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
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

  return evaluateFormula(def.formula, uwData);
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
