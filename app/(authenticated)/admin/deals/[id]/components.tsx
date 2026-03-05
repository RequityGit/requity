"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/* ── Design Tokens ── */
export const T = {
  bg: "#F7F7F8",
  card: "#FFFFFF",
  text: "#1A1A1A",
  sub: "#6B6B6B",
  muted: "#8B8B8B",
  border: "#E5E5E7",
  div: "#F0F0F2",
  accent: "#1A1A1A",
  ok: "#22A861",
  warn: "#E5930E",
  bad: "#E5453D",
  info: "#3B82F6",
} as const;

/* ── Stage Config ── */
export const STAGES = [
  { k: "lead", l: "Lead", c: "#8B8B8B", w: 7, a: 14 },
  { k: "application", l: "Application", c: "#3B82F6", w: 5, a: 10 },
  { k: "processing", l: "Processing", c: "#3B82F6", w: 7, a: 14 },
  { k: "underwriting", l: "Underwriting", c: "#E5930E", w: 10, a: 21 },
  { k: "approved", l: "Approved", c: "#22A861", w: 5, a: 10 },
  { k: "clear_to_close", l: "Clear to Close", c: "#22A861", w: 7, a: 14 },
  { k: "funded", l: "Funded", c: "#22A861", w: 0, a: 0 },
] as const;

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

/* ── Priority / Approval Colors ── */
export const PRIORITY_COLORS: Record<string, string> = {
  hot: T.bad,
  normal: T.info,
  on_hold: T.muted,
};

export const APPROVAL_COLORS: Record<string, string> = {
  pending: T.warn,
  approved: T.ok,
  denied: T.bad,
  not_submitted: T.muted,
};

/* ── Activity Icon Mapping ── */
export const ACTIVITY_ICON_MAP: Record<
  string,
  { color: string }
> = {
  stage_change: { color: T.info },
  stage: { color: T.info },
  document: { color: T.ok },
  doc: { color: T.ok },
  comment: { color: T.accent },
  email: { color: T.info },
  call: { color: T.warn },
  system: { color: T.muted },
  alert: { color: T.bad },
  note: { color: T.accent },
};

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
  if (["lead", "application"].includes(stage)) return "overview";
  if (
    ["processing", "underwriting", "approved", "clear_to_close"].includes(stage)
  )
    return "conditions";
  return "activity";
}

/* ── Primitives ── */

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
        "inline-flex items-center gap-1.5 rounded-full font-medium font-sans",
        big ? "px-3.5 py-1 text-[13px]" : "px-2.5 py-0.5 text-xs"
      )}
      style={{ background: color + "12", color }}
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
    <span className="inline-flex items-center rounded-full border border-[#E5E5E7] px-2.5 py-0.5 text-xs font-medium text-[#6B6B6B] font-sans">
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
    <div className="rounded-xl border border-[#E5E5E7] bg-white">
      {title && (
        <div className="flex items-center justify-between border-b border-[#F0F0F2] px-5 py-3.5">
          <div className="flex items-center gap-2">
            {Ic && <Ic size={16} className="text-[#6B6B6B]" />}
            <span className="text-sm font-semibold text-[#1A1A1A] font-sans">
              {title}
            </span>
          </div>
          {right}
        </div>
      )}
      <div className={noPad ? "" : "p-5"}>{children}</div>
    </div>
  );
}

export function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-[120px] flex-1">
      <div className="mb-1 text-xs text-[#8B8B8B] font-sans">{label}</div>
      <div className="text-xl font-semibold text-[#1A1A1A] num">
        {value}
      </div>
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
        "flex items-baseline justify-between border-b border-[#F0F0F2] py-2",
        half ? "w-[calc(50%-10px)]" : "w-full"
      )}
    >
      <span className="text-[13px] text-[#8B8B8B] font-sans">{label}</span>
      <span
        className={cn(
          "max-w-[60%] text-right text-[13px] font-medium",
          mono ? "num" : "font-sans",
          link ? "text-[#3B82F6]" : "text-[#1A1A1A]"
        )}
      >
        {displayValue}
      </span>
    </div>
  );
}

export function Btn({
  label,
  icon: Ic,
  primary,
  small,
  onClick,
}: {
  label: string;
  icon?: LucideIcon;
  primary?: boolean;
  small?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg font-medium font-sans cursor-pointer",
        small ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-[13px]",
        primary
          ? "border-none bg-[#1A1A1A] text-white hover:bg-[#333]"
          : "border border-[#E5E5E7] bg-transparent text-[#1A1A1A] hover:bg-[#F7F7F8]"
      )}
    >
      {Ic && <Ic size={small ? 13 : 15} />}
      {label}
    </button>
  );
}

export function Av({ text, size = 28 }: { text: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center font-semibold text-[#1A1A1A] font-sans"
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        background: "#1A1A1A0F",
        border: "1px solid #1A1A1A15",
        fontSize: size * 0.36,
      }}
    >
      {text}
    </div>
  );
}

export function IconAv({
  icon: Ic,
  size = 56,
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
        borderRadius: 10,
        background: color + "0F",
        border: `1.5px solid ${color}20`,
      }}
    >
      <Ic size={size * 0.45} color={color} />
    </div>
  );
}

/* ── Types ── */
export interface DealData {
  id: string;
  opportunity_id?: string | null;
  loan_number?: string | null;
  deal_name?: string | null;
  // Stage
  stage: string;
  priority?: string | null;
  approval_status?: string | null;
  // Type/purpose
  type?: string | null;
  loan_type?: string | null;
  purpose?: string | null;
  loan_purpose?: string | null;
  // Financials
  loan_amount?: number | null;
  interest_rate?: number | null;
  ltv?: number | null;
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
  // Prepayment
  prepayment_type?: string | null;
  prepayment_pct?: number | null;
  prepayment_months?: number | null;
  extension_option?: string | null;
  extension_fee_pct?: number | null;
  // Property
  property_address?: string | null;
  property_address_line1?: string | null;
  property_city?: string | null;
  property_state?: string | null;
  property_zip?: string | null;
  property_type?: string | null;
  property_units?: number | null;
  str_flag?: boolean | null;
  flood_zone?: string | null;
  parcel_id?: string | null;
  occupancy_pct?: number | null;
  lease_type?: string | null;
  rental_status?: string | null;
  // Dates
  application_date?: string | null;
  expected_close_date?: string | null;
  approval_date?: string | null;
  ctc_date?: string | null;
  closing_date?: string | null;
  funding_date?: string | null;
  first_payment_date?: string | null;
  maturity_date?: string | null;
  payoff_date?: string | null;
  // Borrower / Entity
  borrower_id?: string | null;
  borrower_entity_id?: string | null;
  co_borrower_id?: string | null;
  guarantor_ids?: string[] | null;
  // Third parties
  title_company?: string | null;
  title_contact?: string | null;
  title_phone?: string | null;
  closing_attorney?: string | null;
  insurance_company?: string | null;
  // Capital
  funding_source?: string | null;
  capital_partner?: string | null;
  // Internal
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
  // Team IDs
  originator_id?: string | null;
  processor_id?: string | null;
  underwriter_id?: string | null;
  closer_id?: string | null;
  // Timestamps
  created_at?: string | null;
  updated_at?: string | null;
  // Resolved names
  _borrower_name?: string | null;
  _entity_name?: string | null;
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
