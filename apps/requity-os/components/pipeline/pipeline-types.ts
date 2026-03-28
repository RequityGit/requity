// ═══════════════════════════════════════════════════════════
// Unified Pipeline — Types, Constants, Formatters
// ═══════════════════════════════════════════════════════════

import { evaluateFormula } from "@/lib/formula-engine";
import type { AssetClassKey, AnyAssetClassKey } from "@/lib/constants/asset-classes";
import {
  formatCurrency as _formatCurrency,
  formatPercent as _formatPercent,
  formatCompactCurrency,
  formatRatio as _formatRatio,
} from "@/lib/format";

export type CapitalSide = "debt" | "equity";
export type OriginationStage = "lead" | "analysis" | "negotiation" | "execution";
export type ServicingStage = "closed_brokered" | "closed_active" | "closed_pre_sale" | "closed_sold" | "closed_paid_off";
export type TerminalStage = "closed_lost";
export type UnifiedStage = OriginationStage | ServicingStage | TerminalStage | "closed";
export type DealStatus = "active" | "won" | "lost" | "on_hold";
export type AlertLevel = "normal" | "warn" | "alert";

/** @deprecated Use AssetClassKey from @/lib/constants/asset-classes instead */
export type AssetClass = AnyAssetClassKey;

export type UwFieldObject = "deal" | "property" | "borrower";

export interface UwFieldDef {
  key: string;
  label: string;
  type: "currency" | "percent" | "number" | "text" | "boolean" | "select" | "date" | "flood_risk";
  required?: boolean;
  options?: string[];
  object?: UwFieldObject;
  sectionGroup?: string;
  readOnly?: boolean;
  /** If set, this field is a computed formula. Render as read-only. */
  formulaExpression?: string;
  formulaOutputFormat?: "currency" | "percent" | "number" | "text";
  formulaDecimalPlaces?: number;
}

export interface CardMetricDef {
  key: string;
  label?: string;
  prefix?: string;
  suffix?: string;
  format?: "compact";
  computed?: boolean;
}

export interface CardTypeFieldRef {
  field_key: string;
  module: string;
  required?: boolean;
  object?: UwFieldObject;
  sort_order: number;
}

export interface FieldGroupDef {
  label: string;
  fields: string[];
}

// CardTypeStatus — status of a card type definition
export type CardTypeStatus = "active" | "draft" | "planned" | "archived";

// UnifiedCardType — row shape for the unified_card_types table
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
  card_icon: string | null;
  detail_tabs: string[];
  detail_field_groups: FieldGroupDef[];
  property_fields: UwFieldDef[];
  property_field_groups: FieldGroupDef[];
  contact_fields: UwFieldDef[];
  contact_field_groups: FieldGroupDef[];
  contact_roles: string[];
  applicable_asset_classes: string[] | null;
  uw_grid: GridTemplateDef | null;
  uw_field_refs: CardTypeFieldRef[];
  property_field_refs: CardTypeFieldRef[];
  contact_field_refs: CardTypeFieldRef[];
  status: CardTypeStatus;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
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
  broker_contact_id: string | null;
  company_id: string | null;
  property_id: string | null;
  assigned_to: string | null;
  amount: number | null;
  probability: number;
  close_date: string | null;
  status: DealStatus;
  loss_reason: string | null;
  source: string | null;
  uw_data: Record<string, unknown>;
  property_data: Record<string, unknown>;
  notes: string | null;
  is_priority: boolean;
  tags: string[];
  sort_order: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  google_sheet_id?: string | null;
  google_sheet_url?: string | null;
  // Fundraise
  fundraise_slug?: string | null;
  fundraise_enabled?: boolean | null;
  fundraise_target?: number | null;
  fundraise_description?: string | null;
  fundraise_amount_options?: number[] | null;
  fundraise_hero_image_url?: string | null;
  fundraise_deck_url?: string | null;
  fundraise_hard_cap?: number | null;
  // Joined
  primary_contact?: { id: string; first_name: string; last_name: string; email: string | null; phone: string | null } | null;
  broker_contact?: { id: string; first_name: string; last_name: string; email: string | null; phone: string | null; broker_company?: { name: string } | null } | null;
  company?: { id: string; name: string } | null;
  // Approval workflow
  approval_status?: "pending" | "approved" | "changes_requested" | "declined" | null;
  approval_requested_at?: string | null;
  approval_requested_by?: string | null;
  // Servicing fields
  maturity_date?: string | null;
  current_maturity_date?: string | null;
  funding_date?: string | null;
  first_payment_date?: string | null;
  payoff_date?: string | null;
  note_sold_to?: string | null;
  note_sale_date?: string | null;
  note_sale_price?: number | null;
  servicing_status?: string | null;
  extension_count?: number | null;
  total_draws_funded?: number | null;
  draw_count?: number | null;
  // Computed client-side
  days_in_stage?: number;
  alert_level?: AlertLevel;
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
  is_borrower_facing: boolean;
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
  /** Original template internal description (read-only guidance) */
  template_guidance?: string | null;
  /** Original template borrower description (read-only) */
  template_borrower_description?: string | null;
  /** Borrower-facing feedback explaining what needs to be revised */
  borrower_feedback?: string | null;
  /** When the borrower feedback was last updated */
  feedback_updated_at?: string | null;
  /** Comment submitted by borrower alongside their document submission */
  borrower_comment?: string | null;
  /** Borrower contact this condition is assigned to (per-borrower conditions) */
  assigned_contact_id?: string | null;
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

/** Origination-only stages (board default, pre-close dropdown) */
export const ORIGINATION_STAGES: { key: UnifiedStage; label: string }[] = [
  { key: "lead", label: "Intake" },
  { key: "analysis", label: "Analysis" },
  { key: "negotiation", label: "Negotiation" },
  { key: "execution", label: "Execution" },
];

/** Post-close / servicing stages */
export const SERVICING_STAGES: { key: ServicingStage; label: string }[] = [
  { key: "closed_brokered", label: "Brokered" },
  { key: "closed_active", label: "Active" },
  { key: "closed_pre_sale", label: "Pre-Sale" },
  { key: "closed_sold", label: "Sold" },
  { key: "closed_paid_off", label: "Paid Off" },
];

/** All stages including servicing (for lifecycle view) */
export const ALL_STAGES: { key: UnifiedStage; label: string }[] = [
  ...ORIGINATION_STAGES,
  ...SERVICING_STAGES,
];

/** Default board stages (origination + rolled-up "Closed") */
export const STAGES: { key: UnifiedStage; label: string }[] = [
  ...ORIGINATION_STAGES,
  { key: "closed", label: "Closed" },
];

/** Check if a stage is a servicing (post-close) stage */
export function isServicingStage(stage: string): stage is ServicingStage {
  return stage.startsWith("closed_") && stage !== "closed_lost";
}

/** Check if a stage is a closed stage (any closed_* or legacy "closed") */
export function isClosedStage(stage: string): boolean {
  return stage === "closed" || stage.startsWith("closed_");
}

/** Check if a deal should show servicing tabs (closed_* except brokered) */
export function showServicingUI(stage: string): boolean {
  return isServicingStage(stage) && stage !== "closed_brokered";
}

/** Get stage label from any stage key */
export function getStageLabel(stage: string): string {
  const found = ALL_STAGES.find((s) => s.key === stage);
  if (found) return found.label;
  if (stage === "closed") return "Closed";
  if (stage === "closed_lost") return "Closed Lost";
  return stage;
}

/** Stage groups for the grouped table view — ordered top to bottom like a deal lifecycle */
export interface StageGroup {
  key: UnifiedStage;
  label: string;
  color: string;
}

export const PIPELINE_STAGE_GROUPS: StageGroup[] = [
  { key: "lead", label: "Intake", color: "#6366f1" },
  { key: "analysis", label: "Analysis", color: "#f59e0b" },
  { key: "negotiation", label: "Negotiation", color: "#3b82f6" },
  { key: "execution", label: "Execution", color: "#10b981" },
  { key: "closed", label: "Closed", color: "#1a1a1a" },
];

/** Lifecycle stage groups for the grouped table view — expands "Closed" into servicing stages */
export const PIPELINE_LIFECYCLE_STAGE_GROUPS: StageGroup[] = [
  { key: "lead", label: "Intake", color: "#6366f1" },
  { key: "analysis", label: "Analysis", color: "#f59e0b" },
  { key: "negotiation", label: "Negotiation", color: "#3b82f6" },
  { key: "execution", label: "Execution", color: "#10b981" },
  { key: "closed_brokered", label: "Brokered", color: "#8b5cf6" },
  { key: "closed_active", label: "Active", color: "#06b6d4" },
  { key: "closed_pre_sale", label: "Pre-Sale", color: "#f97316" },
  { key: "closed_sold", label: "Sold", color: "#64748b" },
  { key: "closed_paid_off", label: "Paid Off", color: "#1a1a1a" },
];

export {
  ASSET_CLASS_LABELS,
  ASSET_CLASS_OPTIONS as ACTIVE_ASSET_CLASS_OPTIONS,
  getAssetClassLabel,
} from "@/lib/constants/asset-classes";
export type { AssetClassKey } from "@/lib/constants/asset-classes";

// DEPRECATED: CARD_TYPE_SHORT_LABELS removed. Use getDealShortLabel() from
// lib/pipeline/deal-display-config.ts instead.

export const CAPITAL_SIDE_COLORS: Record<CapitalSide, string> = {
  debt: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  equity: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

// ─── Formatters (re-exported from lib/format.ts) ───

export const formatCurrency = _formatCurrency;
export const formatPercent = _formatPercent;
export const formatRatio = _formatRatio;

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

export function getCardMetricValue(
  metric: CardMetricDef,
  deal: UnifiedDeal,
  formulaMap?: Map<string, string>
): string {
  const uwData = deal.uw_data;
  let value: number | null = null;

  if (metric.computed && formulaMap) {
    const formula = formulaMap.get(metric.key);
    if (formula) {
      value = evaluateFormula(formula, uwData);
    }
  } else {
    const raw = uwData[metric.key];
    value = typeof raw === "number" ? raw : null;
  }

  if (value == null) return "—";

  if (metric.format === "compact") {
    return `${metric.prefix ?? ""}${formatCompactCurrency(value).replace("$", "")}`;
  }

  const formatted = Number(value).toFixed(
    metric.suffix === "x" ? 2 : metric.suffix === "%" ? 1 : 0
  );

  return `${metric.prefix ?? ""}${formatted}${metric.suffix ?? ""}`;
}

// ─── Grid Pro Forma Types ───

export type GridPeriod = "t12" | "year1" | "year2" | "year3" | "year4" | "year5" | "stabilized";
export type GridRowType = "currency" | "percent" | "ratio" | "number";

export interface GridRowDef {
  key: string;
  label: string;
  type: GridRowType;
  formula: string;
  section: string;
  bold: boolean;
  sort_order: number;
}

export interface GridTemplateDef {
  rows: GridRowDef[];
}

export interface GridOverrides {
  [cellKey: string]: {
    value?: number;
    formula?: string;
  };
}

export interface GridResult {
  [rowKey: string]: Record<GridPeriod, number | null>;
}

export interface UwOutputDef {
  key: string;
  label: string;
  type: "currency" | "percent" | "ratio" | "number" | "text";
  formula?: string;
}

// ─── Grid Constants ───

export const GRID_PERIODS: GridPeriod[] = ["t12", "year1", "year2", "year3", "year4", "year5", "stabilized"];

export const GRID_PERIOD_LABELS: Record<GridPeriod, string> = {
  t12: "T-12",
  year1: "Year 1",
  year2: "Year 2",
  year3: "Year 3",
  year4: "Year 4",
  year5: "Year 5",
  stabilized: "Stabilized",
};

export const GRID_PERIOD_INDEX: Record<GridPeriod, number> = {
  t12: 0,
  year1: 1,
  year2: 2,
  year3: 3,
  year4: 4,
  year5: 5,
  stabilized: 6,
};
