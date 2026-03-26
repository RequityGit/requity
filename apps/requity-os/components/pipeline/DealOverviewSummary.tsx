"use client";

import { useState, useMemo, useCallback, useRef, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { InlineField } from "@/components/ui/inline-field";
import { AddressAutocomplete, type ParsedAddress } from "@/components/ui/address-autocomplete";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/format";
import { updateUwDataAction, updateDealNameAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
import { type UnifiedDeal, ASSET_CLASS_LABELS, ACTIVE_ASSET_CLASS_OPTIONS } from "./pipeline-types";
import { CostBasisSection } from "./CostBasisSection";
import { showError } from "@/lib/toast";

// Asset class dropdown: active options only (excludes legacy keys)
const ASSET_CLASS_DROPDOWN_LABELS = ACTIVE_ASSET_CLASS_OPTIONS.map((o) => o.label);
const AC_LABEL_TO_KEY = Object.fromEntries(
  ACTIVE_ASSET_CLASS_OPTIONS.map((o) => [o.label, o.key])
);
const AC_KEY_TO_LABEL = ASSET_CLASS_LABELS as Record<string, string>;

// Loan type dropdown: synced with opportunities.loan_type constraint
const LOAN_TYPE_MAP: Record<string, string> = {
  commercial_bridge: "Commercial Bridge",
  commercial_perm: "Commercial Perm",
  dscr: "DSCR",
  guc: "Ground-Up Construction",
  rtl: "Fix & Flip / RTL",
  transactional: "Transactional",
};
const LOAN_TYPE_LABELS = Object.values(LOAN_TYPE_MAP);
const LT_LABEL_TO_KEY = Object.fromEntries(
  Object.entries(LOAN_TYPE_MAP).map(([k, v]) => [v, k])
);
const LT_KEY_TO_LABEL = LOAN_TYPE_MAP;

// Funding channel dropdown
const FUNDING_CHANNEL_MAP: Record<string, string> = {
  balance_sheet: "Balance Sheet",
  correspondent: "Correspondent",
  brokered: "Brokered",
};
const FUNDING_CHANNEL_LABELS = Object.values(FUNDING_CHANNEL_MAP);
const FUNDING_CHANNEL_LABEL_TO_KEY = Object.fromEntries(
  Object.entries(FUNDING_CHANNEL_MAP).map(([k, v]) => [v, k])
);
const FUNDING_CHANNEL_KEY_TO_LABEL = FUNDING_CHANNEL_MAP;

// Loan purpose dropdown: synced with field_configurations
const LOAN_PURPOSE_MAP: Record<string, string> = {
  purchase: "Purchase",
  refinance: "Refinance",
  new_construction: "New Construction",
};
const LOAN_PURPOSE_LABELS = Object.values(LOAN_PURPOSE_MAP);
const LP_LABEL_TO_KEY = Object.fromEntries(
  Object.entries(LOAN_PURPOSE_MAP).map(([k, v]) => [v, k])
);
const LP_KEY_TO_LABEL = LOAN_PURPOSE_MAP;

// Exit strategy dropdown
const EXIT_STRATEGY_MAP: Record<string, string> = {
  refinance: "Refinance",
  sale: "Sale",
  refinance_or_sale: "Refinance or Sale",
};
const EXIT_STRATEGY_LABELS = Object.values(EXIT_STRATEGY_MAP);
const ES_LABEL_TO_KEY = Object.fromEntries(
  Object.entries(EXIT_STRATEGY_MAP).map(([k, v]) => [v, k])
);
const ES_KEY_TO_LABEL = EXIT_STRATEGY_MAP;

// Lead source dropdown
const LEAD_SOURCE_MAP: Record<string, string> = {
  broker: "Broker",
  direct: "Direct",
  referral: "Referral",
  website: "Website",
  repeat_borrower: "Repeat Borrower",
  marketing: "Marketing",
  correspondent: "Correspondent",
  other: "Other",
};
const LEAD_SOURCE_LABELS = Object.values(LEAD_SOURCE_MAP);
const LS_LABEL_TO_KEY = Object.fromEntries(
  Object.entries(LEAD_SOURCE_MAP).map(([k, v]) => [v, k])
);
const LS_KEY_TO_LABEL = LEAD_SOURCE_MAP;

import {
  Building2,
  DollarSign,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Helpers ──

function daysAgo(dateString: string | null | undefined): number | null {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

// ── Section label ──

function SectionLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="rq-section-label">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
      {children}
    </div>
  );
}

// ── Read-only field (for computed values) ──

function ReadOnlyField({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("group/field min-w-0", className)}>
      <span className="text-[11px] font-medium text-muted-foreground mb-0.5 block leading-tight">{label}</span>
      <div className="w-full text-left text-sm min-h-[32px] flex items-center rounded-md px-2 py-1 -mx-0.5">
        {children}
      </div>
    </div>
  );
}

function Placeholder() {
  return <span className="text-muted-foreground/40">Add...</span>;
}

// ── Card wrapper ──

function OverviewCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rq-overview-card", className)}>
      {children}
    </div>
  );
}

// ── Props ──

interface DealOverviewSummaryProps {
  dealId: string;
  deal: UnifiedDeal;
}

// ── Main Component ──

export function DealOverviewSummary({ dealId, deal }: DealOverviewSummaryProps) {
  // Local state for optimistic updates
  const [localUwData, setLocalUwData] = useState<Record<string, unknown>>(deal.uw_data ?? {});
  const localUwRef = useRef(localUwData);
  localUwRef.current = localUwData;

  const [, startTransition] = useTransition();

  // ── Field value accessors (use local state) ──

  const uwVal = useCallback((key: string): unknown => localUwData[key] ?? null, [localUwData]);
  const uwStr = useCallback((key: string): string | null => {
    const v = localUwData[key];
    if (v == null || v === "") return null;
    return String(v);
  }, [localUwData]);
  const uwNum = useCallback((key: string): number | null => {
    const v = localUwData[key];
    if (v == null) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }, [localUwData]);

  // ── Save handler: writes to uw_data ──

  const saveField = useCallback((key: string, value: string) => {
    // Optimistic update
    const next = { ...localUwRef.current, [key]: value };
    localUwRef.current = next;
    setLocalUwData(next);

    // Fire server action in background
    startTransition(async () => {
      const result = await updateUwDataAction(dealId, key, value);
      if (result.error) {
        showError("Could not save field", result.error);
        // Rollback
        const prev = { ...localUwRef.current, [key]: deal.uw_data?.[key] };
        localUwRef.current = prev;
        setLocalUwData(prev);
      }
    });
  }, [dealId, deal.uw_data, startTransition]);

  // ── Derived values ──

  const loanPurpose = uwStr("loan_purpose");
  const isRefi = ["refinance", "cash_out", "cash_out_refinance"].includes(loanPurpose ?? "") ||
    (loanPurpose?.toLowerCase().includes("refi") ?? false) ||
    (loanPurpose?.toLowerCase().includes("cash") ?? false);
  const isPurchase = ["acquisition", "purchase"].includes(loanPurpose ?? "") ||
    (loanPurpose?.toLowerCase().includes("purchase") ?? false);
  const isConstruction = ["new_construction", "construction"].includes(loanPurpose ?? "") ||
    (loanPurpose?.toLowerCase().includes("construction") ?? false);
  const showProposedTerms = true;

  // Property name: falls back to address if no name set
  const [localDealName, setLocalDealName] = useState(deal.name ?? "");
  const addressLine = uwStr("property_address");

  const saveDealName = useCallback((v: string) => {
    setLocalDealName(v);
    startTransition(async () => {
      const result = await updateDealNameAction(dealId, v);
      if (result.error) {
        showError("Could not save name", result.error);
        setLocalDealName(deal.name ?? "");
      }
    });
  }, [dealId, deal.name, startTransition]);

  // Build full address string for display
  const fullAddress = useMemo(() => {
    const street = uwStr("property_address");
    const cityState = [uwStr("property_city"), uwStr("property_state")].filter(Boolean).join(", ");
    const zip = uwStr("property_zip");
    const line2 = [cityState, zip].filter(Boolean).join(" ");
    if (!street && !line2) return null;
    return [street, line2].filter(Boolean).join(", ");
  }, [uwStr]);

  // Address editing state
  const [addressDraft, setAddressDraft] = useState(fullAddress ?? "");

  const handleAddressSelect = useCallback((parsed: ParsedAddress) => {
    // Save all parsed address fields at once
    const fields: Record<string, string> = {
      property_address: parsed.address_line1,
      property_city: parsed.city,
      property_state: parsed.state,
      property_zip: parsed.zip,
    };
    const next = { ...localUwRef.current, ...fields };
    localUwRef.current = next;
    setLocalUwData(next);
    // Update draft to show the full formatted address
    const newFull = [
      parsed.address_line1,
      [parsed.city, parsed.state].filter(Boolean).join(", "),
      parsed.zip,
    ].filter(Boolean).join(", ");
    setAddressDraft(newFull);

    // Save each field to the server
    for (const [key, value] of Object.entries(fields)) {
      startTransition(async () => {
        const result = await updateUwDataAction(dealId, key, value);
        if (result.error) {
          showError(`Could not save ${key}`, result.error);
        }
      });
    }
  }, [dealId, startTransition]);

  // Days in stage (computed, read-only)
  const daysInStage = deal.days_in_stage ?? daysAgo(deal.stage_entered_at);

  return (
    <div className="space-y-5">
      {/* ── Section 1: Property ── */}
      <div>
        <SectionLabel icon={Building2}>Property</SectionLabel>
        <OverviewCard>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1">
            <InlineField
              label="Property name"
              type="text"
              value={localDealName || ""}
              placeholder={fullAddress || "Enter property name..."}
              onSave={saveDealName}
            />
            <InlineField
              label="Asset class"
              type="select"
              value={AC_KEY_TO_LABEL[uwStr("property_type") ?? ""] ?? uwStr("property_type") ?? ""}
              options={ASSET_CLASS_DROPDOWN_LABELS}
              onSave={(v) => saveField("property_type", AC_LABEL_TO_KEY[v] ?? v)}
            />
            <div className="min-w-0 md:col-span-2">
              <span className="text-[11px] font-medium text-muted-foreground mb-0.5 block leading-tight">Address</span>
              <AddressAutocomplete
                value={addressDraft}
                onChange={setAddressDraft}
                onAddressSelect={handleAddressSelect}
                placeholder="Search address..."
                className="h-auto min-h-[32px] bg-transparent px-2 py-1 border border-transparent rounded-md transition-colors hover:border-border hover:bg-muted/40 focus:border-primary/60 focus:bg-background focus:ring-1 focus:ring-primary/20 focus:ring-offset-0 focus:outline-none text-sm"
              />
            </div>
            <InlineField
              label="Year built"
              type="number"
              value={uwNum("year_built")}
              onSave={(v) => saveField("year_built", v)}
            />
            <InlineField
              label="Units / lots"
              type="number"
              value={uwNum("units")}
              onSave={(v) => saveField("units", v)}
            />
            <InlineField
              label="Total sq ft"
              type="number"
              value={uwNum("total_sqft")}
              onSave={(v) => saveField("total_sqft", v)}
            />
          </div>
        </OverviewCard>
      </div>

      {/* ── Section 2: Deal Summary (merged with Loan Terms) ── */}
      <div>
        <SectionLabel icon={DollarSign}>Deal Summary</SectionLabel>
        <div className={cn("grid gap-4", showProposedTerms ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
          {/* Deal info */}
          <OverviewCard>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              {/* Always shown */}
              <InlineField
                label="Loan purpose"
                type="select"
                value={LP_KEY_TO_LABEL[loanPurpose ?? ""] ?? loanPurpose ?? ""}
                options={LOAN_PURPOSE_LABELS}
                onSave={(v) => saveField("loan_purpose", LP_LABEL_TO_KEY[v] ?? v)}
              />
              <InlineField
                label="Target loan amount"
                type="currency"
                value={uwNum("loan_amount") ?? deal.amount}
                onSave={(v) => saveField("loan_amount", v)}
              />

              {/* Purchase fields */}
              {isPurchase && (
                <>
                  <InlineField
                    label="Purchase price"
                    type="currency"
                    value={uwNum("purchase_price")}
                    onSave={(v) => saveField("purchase_price", v)}
                  />
                </>
              )}


              {/* New Construction fields */}
              {isConstruction && (
                <>
                  <InlineField
                    label="Land / lot cost"
                    type="currency"
                    value={uwNum("purchase_price")}
                    onSave={(v) => saveField("purchase_price", v)}
                  />
                  <InlineField
                    label="Construction budget"
                    type="currency"
                    value={uwNum("rehab_budget")}
                    onSave={(v) => saveField("rehab_budget", v)}
                  />
                  <InlineField
                    label="Construction holdback"
                    type="currency"
                    value={uwNum("rehab_holdback")}
                    onSave={(v) => saveField("rehab_holdback", v)}
                  />
                  <InlineField
                    label="Est. construction timeline (months)"
                    type="number"
                    value={uwNum("estimated_rehab_months")}
                    onSave={(v) => saveField("estimated_rehab_months", v)}
                  />
                  <InlineField
                    label="Total capitalization"
                    type="currency"
                    value={uwNum("total_capitalization")}
                    onSave={(v) => saveField("total_capitalization", v)}
                  />
                </>
              )}

              {/* Always shown */}
              <InlineField
                label="As-is value"
                type="currency"
                value={uwNum("as_is_value")}
                onSave={(v) => saveField("as_is_value", v)}
              />
              {!isConstruction && (
                <InlineField
                  label="Rehab budget"
                  type="currency"
                  value={uwNum("rehab_budget")}
                  onSave={(v) => saveField("rehab_budget", v)}
                />
              )}
              <InlineField
                label="ARV"
                type="currency"
                value={uwNum("arv")}
                onSave={(v) => saveField("arv", v)}
              />
              <InlineField
                label="Exit strategy"
                type="select"
                value={ES_KEY_TO_LABEL[uwStr("exit_strategy") ?? ""] ?? uwStr("exit_strategy") ?? ""}
                options={EXIT_STRATEGY_LABELS}
                onSave={(v) => saveField("exit_strategy", ES_LABEL_TO_KEY[v] ?? v)}
              />
              <InlineField
                label="Closing date"
                type="date"
                value={deal.close_date}
                onSave={(v) => saveField("close_date", v)}
              />
              <InlineField
                label="Lead source"
                type="select"
                value={LS_KEY_TO_LABEL[uwStr("source") ?? ""] ?? uwStr("source") ?? ""}
                options={LEAD_SOURCE_LABELS}
                onSave={(v) => saveField("source", LS_LABEL_TO_KEY[v] ?? v)}
              />
              <ReadOnlyField label="Days in stage">
                <span className="num">{daysInStage != null ? daysInStage : <Placeholder />}</span>
              </ReadOnlyField>
            </div>

            {/* Borrower & Broker contact info moved to People tab */}

            {/* Refinance Overview & Existing Loans (refi deals only) */}
            {isRefi && <CostBasisSection dealId={dealId} loanPurpose={loanPurpose} />}
          </OverviewCard>

          {/* Proposed Terms (only if not early stage) */}
          {showProposedTerms && (
            <OverviewCard className="border-blue-300 dark:border-blue-700 border-2">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] font-medium text-muted-foreground">Proposed terms</div>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Active</Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                {/* Loan type spans first row left */}
                <InlineField
                  label="Loan type"
                  type="select"
                  value={LT_KEY_TO_LABEL[uwStr("loan_type") ?? ""] ?? uwStr("loan_type") ?? ""}
                  options={LOAN_TYPE_LABELS}
                  onSave={(v) => saveField("loan_type", LT_LABEL_TO_KEY[v] ?? v)}
                />
                {/* Spacer for right column alignment */}
                <div />
                {/* Left column: Loan structure */}
                <InlineField
                  label="Loan amount"
                  type="currency"
                  value={uwNum("total_loan")}
                  onSave={(v) => saveField("total_loan", v)}
                />
                <InlineField
                  label="Origination fee %"
                  type="percent"
                  value={uwNum("origination_fee_pct")}
                  onSave={(v) => saveField("origination_fee_pct", v)}
                />
                <InlineField
                  label="Construction holdback"
                  type="currency"
                  value={uwNum("rehab_holdback")}
                  onSave={(v) => saveField("rehab_holdback", v)}
                />
                <InlineField
                  label="Origination fee $"
                  type="currency"
                  value={uwNum("origination_fee_amount")}
                  onSave={(v) => saveField("origination_fee_amount", v)}
                />
                <InlineField
                  label="Term (months)"
                  type="number"
                  value={uwNum("term_months")}
                  onSave={(v) => saveField("term_months", v)}
                />
                <InlineField
                  label="Draw fee"
                  type="currency"
                  value={uwNum("draw_fee")}
                  onSave={(v) => saveField("draw_fee", v)}
                />
                <InlineField
                  label="Interest rate"
                  type="percent"
                  value={uwNum("interest_rate")}
                  onSave={(v) => saveField("interest_rate", v)}
                />
                <InlineField
                  label="Exit fee"
                  type="currency"
                  value={uwNum("exit_fee")}
                  onSave={(v) => saveField("exit_fee", v)}
                />
                <InlineField
                  label="Default rate"
                  type="percent"
                  value={uwNum("default_rate")}
                  onSave={(v) => saveField("default_rate", v)}
                />
                <InlineField
                  label="Legal / doc fee"
                  type="currency"
                  value={uwNum("legal_fee")}
                  onSave={(v) => saveField("legal_fee", v)}
                />
                <InlineField
                  label="Amortization (months)"
                  type="number"
                  value={uwNum("amortization_months")}
                  onSave={(v) => saveField("amortization_months", v)}
                />
                <InlineField
                  label="UW / processing fee"
                  type="currency"
                  value={uwNum("processing_fee")}
                  onSave={(v) => saveField("processing_fee", v)}
                />
                <InlineField
                  label="Interest reserve"
                  type="currency"
                  value={uwNum("interest_reserve")}
                  onSave={(v) => saveField("interest_reserve", v)}
                />
                <InlineField
                  label="Prepayment penalty %"
                  type="percent"
                  value={uwNum("prepayment_penalty_pct")}
                  onSave={(v) => saveField("prepayment_penalty_pct", v)}
                />
                <InlineField
                  label="Min. interest earned (months)"
                  type="number"
                  value={uwNum("minimum_interest_months")}
                  onSave={(v) => saveField("minimum_interest_months", v)}
                />
                <InlineField
                  label="Funding channel"
                  type="select"
                  value={FUNDING_CHANNEL_KEY_TO_LABEL[uwStr("funding_channel") ?? ""] ?? uwStr("funding_channel") ?? ""}
                  options={FUNDING_CHANNEL_LABELS}
                  onSave={(v) => saveField("funding_channel", FUNDING_CHANNEL_LABEL_TO_KEY[v] ?? v)}
                />
                {["correspondent", "brokered"].includes(uwStr("funding_channel") ?? "") && (
                  <InlineField
                    label="Lender"
                    type="text"
                    value={uwStr("lender_name") ?? ""}
                    onSave={(v) => saveField("lender_name", v)}
                  />
                )}
              </div>
            </OverviewCard>
          )}
        </div>
      </div>

    </div>
  );
}
