"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/* ── Dark Design Tokens ── */
export const T = {
  bg: {
    base: "#0a0a0b",
    surface: "#111113",
    elevated: "#18181b",
    hover: "#1e1e22",
    input: "#131316",
    border: "#27272a",
    borderSubtle: "#1e1e22",
  },
  text: {
    primary: "#fafafa",
    secondary: "#a1a1aa",
    muted: "#71717a",
    inverse: "#09090b",
  },
  accent: {
    blue: "#3b82f6",
    blueMuted: "rgba(59,130,246,0.12)",
    green: "#22c55e",
    greenMuted: "rgba(34,197,94,0.12)",
    amber: "#f59e0b",
    amberMuted: "rgba(245,158,11,0.12)",
    red: "#ef4444",
    redMuted: "rgba(239,68,68,0.12)",
    purple: "#a78bfa",
    purpleMuted: "rgba(167,139,250,0.12)",
  },
} as const;

/* ── Terminal Stages ── */
export const TERMINAL_DEAL_STAGES = [
  "servicing",
  "paid_off",
  "note_sold",
  "withdrawn",
  "denied",
  "closed_lost",
  "default",
  "reo",
] as const;

/* ── Helpers ── */
export function fmt(n: number | null | undefined): string {
  if (n == null) return "\u2014";
  return "$" + n.toLocaleString("en-US");
}

export function fP(n: number | null | undefined): string {
  if (n == null) return "\u2014";
  return n.toFixed(1) + "%";
}

export function fD(d: string | null | undefined): string {
  if (!d) return "\u2014";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function cap(s: string | null | undefined): string {
  if (!s) return "\u2014";
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function dBetween(dateStr: string): number {
  const d1 = new Date(dateStr);
  const d2 = new Date();
  return Math.floor((d2.getTime() - d1.getTime()) / 86400000);
}

export function getDefaultTab(stage: string): string {
  if (["lead", "application", "awaiting_info", "quoting"].includes(stage)) return "overview";
  if (["processing", "underwriting", "uw", "approved", "clear_to_close", "uw_approval"].includes(stage))
    return "conditions";
  return "activity";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* ── Primitives ── */

export function Badge({
  children,
  color = T.text.secondary,
  bg,
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider"
      style={{ color, backgroundColor: bg || color + "14" }}
    >
      {children}
    </span>
  );
}

export function DotPill({
  label,
  color,
  big,
}: {
  label: string;
  color: string;
  big?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        big ? "px-3.5 py-1 text-[13px]" : "px-2.5 py-0.5 text-xs"
      )}
      style={{ background: color + "14", color }}
    >
      <span
        className="inline-block h-[7px] w-[7px] shrink-0 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

export function OutlinePill({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        border: `1px solid ${T.bg.border}`,
        color: T.text.secondary,
      }}
    >
      {label}
    </span>
  );
}

export function SectionCard({
  title,
  icon: Ic,
  children,
  noPad,
  right,
}: {
  title?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  noPad?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{
        backgroundColor: T.bg.surface,
        border: `1px solid ${T.bg.border}`,
      }}
    >
      {title && (
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}
        >
          <div className="flex items-center gap-2">
            {Ic && <Ic size={15} color={T.text.muted} strokeWidth={1.5} />}
            <span className="text-[13px] font-semibold" style={{ color: T.text.primary }}>
              {title}
            </span>
          </div>
          {right}
        </div>
      )}
      <div className={noPad ? "" : "px-4 py-3.5"}>{children}</div>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      className="flex flex-1 flex-col gap-0.5 rounded-[10px] px-4 py-3.5"
      style={{
        backgroundColor: T.bg.surface,
        border: `1px solid ${T.bg.border}`,
      }}
    >
      <span
        className="text-[11px] font-medium uppercase tracking-wider"
        style={{ color: T.text.muted }}
      >
        {label}
      </span>
      <span
        className="text-xl font-semibold num"
        style={{ color: T.text.primary }}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[11px]" style={{ color: T.text.muted }}>
          {sub}
        </span>
      )}
    </div>
  );
}

export function FieldRow({
  label,
  value,
  mono,
  link,
  half,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
  link?: boolean;
  half?: boolean;
}) {
  const displayValue = value != null && value !== "" ? String(value) : "\u2014";
  return (
    <div
      className={cn(
        "flex items-baseline justify-between py-[7px]",
        half ? "w-[calc(50%-16px)]" : "w-full"
      )}
      style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}
    >
      <span className="text-[13px]" style={{ color: T.text.muted }}>
        {label}
      </span>
      <span
        className={cn(
          "max-w-[60%] text-right text-[13px] font-medium",
          mono && "num"
        )}
        style={{ color: link ? T.accent.blue : T.text.primary }}
      >
        {displayValue}
      </span>
    </div>
  );
}

export function Av({ text, size = 28, color }: { text: string; size?: number; color?: string }) {
  const c = color || T.accent.blue;
  return (
    <div
      className="flex shrink-0 items-center justify-center font-semibold"
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: c + "22",
        color: c,
        fontSize: size * 0.375,
        letterSpacing: "0.02em",
      }}
    >
      {text}
    </div>
  );
}

export function IconAv({
  icon: Ic,
  size = 48,
  color,
}: {
  icon: LucideIcon;
  size?: number;
  color: string;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: `linear-gradient(135deg, ${T.accent.blue}22, ${T.accent.purple}22)`,
        border: `1px solid ${T.bg.border}`,
      }}
    >
      <Ic size={size * 0.45} color={color} strokeWidth={1.5} />
    </div>
  );
}

export function Btn({
  label,
  icon: Ic,
  primary,
  small,
  onClick,
  disabled,
}: {
  label: string;
  icon?: LucideIcon;
  primary?: boolean;
  small?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg font-medium cursor-pointer transition-colors duration-150",
        small ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-[13px]",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      style={
        primary
          ? { backgroundColor: T.accent.blue, color: "#fff", border: "none" }
          : {
              borderColor: T.bg.border,
              color: T.text.primary,
              backgroundColor: T.bg.elevated,
              border: `1px solid ${T.bg.border}`,
            }
      }
    >
      {Ic && <Ic size={small ? 13 : 15} strokeWidth={1.5} />}
      {label}
    </button>
  );
}

/* ── Types ── */

export interface PipelineStage {
  id: string;
  stage_key: string;
  label: string;
  color: string;
  sort_order: number;
  is_terminal: boolean;
  sla_days: number | null;
}

export interface UWVersion {
  id: string;
  loan_id: string;
  version_number: number;
  is_active: boolean;
  created_by: string;
  label: string | null;
  notes: string | null;
  calculator_inputs: Record<string, unknown>;
  calculator_outputs: Record<string, unknown>;
  status: string;
  created_at: string;
  _author_name?: string | null;
  _author_avatar?: string | null;
}

export interface DealData {
  id: string;
  opportunity_id?: string | null;
  loan_number?: string | null;
  deal_name?: string | null;
  stage: string;
  stage_updated_at?: string | null;
  priority?: string | null;
  approval_status?: string | null;
  type?: string | null;
  loan_type?: string | null;
  purpose?: string | null;
  loan_purpose?: string | null;
  loan_amount?: number | null;
  interest_rate?: number | null;
  ltv?: number | null;
  dscr_ratio?: number | null;
  loan_term_months?: number | null;
  term_months?: number | null;
  points?: number | null;
  points_pct?: number | null;
  origination_fee?: number | null;
  processing_fee?: number | null;
  underwriting_fee?: number | null;
  doc_prep_fee?: number | null;
  wire_fee?: number | null;
  monthly_payment?: number | null;
  purchase_price?: number | null;
  as_is_value?: number | null;
  arv?: number | null;
  appraised_value?: number | null;
  rehab_budget?: number | null;
  rehab_holdback?: number | null;
  total_loan_amount?: number | null;
  default_rate?: number | null;
  reserves?: number | null;
  cash_to_close?: number | null;
  liquidity?: number | null;
  net_worth?: number | null;
  prepayment_type?: string | null;
  prepayment_pct?: number | null;
  prepayment_months?: number | null;
  extension_option?: string | null;
  extension_fee_pct?: number | null;
  property_address?: string | null;
  property_address_line1?: string | null;
  property_city?: string | null;
  property_state?: string | null;
  property_zip?: string | null;
  property_type?: string | null;
  property_units?: number | null;
  number_of_units?: number | null;
  str_flag?: boolean | null;
  flood_zone?: string | null;
  parcel_id?: string | null;
  occupancy_pct?: number | null;
  lease_type?: string | null;
  rental_status?: string | null;
  application_date?: string | null;
  expected_close_date?: string | null;
  approval_date?: string | null;
  ctc_date?: string | null;
  closing_date?: string | null;
  funding_date?: string | null;
  first_payment_date?: string | null;
  maturity_date?: string | null;
  payoff_date?: string | null;
  borrower_id?: string | null;
  borrower_entity_id?: string | null;
  co_borrower_id?: string | null;
  guarantor_ids?: string[] | null;
  title_company?: string | null;
  title_contact?: string | null;
  title_phone?: string | null;
  closing_attorney?: string | null;
  insurance_company?: string | null;
  funding_source?: string | null;
  capital_partner?: string | null;
  notes?: string | null;
  internal_notes?: string | null;
  strategy?: string | null;
  investment_strategy?: string | null;
  financing?: string | null;
  deal_financing?: string | null;
  funding_channel?: string | null;
  debt_tranche?: string | null;
  deal_programs?: string[] | null;
  sf_id?: string | null;
  originator_id?: string | null;
  processor_id?: string | null;
  underwriter_id?: string | null;
  closer_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  _borrower_name?: string | null;
  _entity_name?: string | null;
  _entity_type?: string | null;
  _borrower_credit_score?: number | null;
  _borrower_experience?: number | null;
  _borrower_liquidity?: number | null;
  _property_year_built?: number | null;
  _property_sqft?: number | null;
  _originator?: { full_name: string; initials: string } | null;
  _processor?: { full_name: string; initials: string } | null;
  _underwriter?: { full_name: string; initials: string } | null;
  _closer?: { full_name: string; initials: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface StageHistoryEntry {
  id: string;
  loan_id: string;
  from_stage?: string | null;
  to_stage?: string | null;
  changed_at?: string | null;
  changed_by?: string | null;
  duration_in_previous_stage?: string | null;
  notes?: string | null;
}

export interface ConditionData {
  id: string;
  loan_id: string;
  name: string;
  category?: string | null;
  status: string;
  assigned_to?: string | null;
  due_date?: string | null;
  critical_path?: boolean | null;
  notes?: string | null;
  template_id?: string | null;
  cleared_at?: string | null;
  cleared_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  _doc_count?: number;
  _assigned_name?: string | null;
}

export interface DocumentData {
  id: string;
  loan_id: string;
  condition_id?: string | null;
  name?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  document_type?: string | null;
  uploaded_by?: string | null;
  _uploaded_by_name?: string | null;
  created_at?: string | null;
}

export interface ActivityData {
  id: string;
  loan_id: string;
  action?: string | null;
  description?: string | null;
  performed_by?: string | null;
  _actor_name?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
}

export interface CommentData {
  id: string;
  loan_id: string;
  author_id: string;
  author_name?: string | null;
  comment: string;
  is_internal?: boolean | null;
  is_edited?: boolean | null;
  parent_comment_id?: string | null;
  mentions?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ChatChannel {
  id: string;
  loan_id: string;
  channel_name: string;
  channel_type?: string | null;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  loan_id: string;
  sent_by: string;
  content: string;
  message_type?: string | null;
  created_at?: string | null;
  _sender_name?: string | null;
  _sender_initials?: string | null;
}
