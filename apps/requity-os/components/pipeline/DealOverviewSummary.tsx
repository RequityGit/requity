"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatDate,
  formatPercent,
  formatFieldValue,
} from "@/lib/format";
import type { UnifiedDeal } from "./pipeline-types";
import {
  Building2,
  FileText,
  BarChart3,
  Users,
  Landmark,
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

function uw(deal: UnifiedDeal, key: string): unknown {
  return deal.uw_data?.[key] ?? null;
}

function uwNum(deal: UnifiedDeal, key: string): number | null {
  const v = uw(deal, key);
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function uwStr(deal: UnifiedDeal, key: string): string | null {
  const v = uw(deal, key);
  if (v == null || v === "") return null;
  return String(v);
}

function prop(deal: UnifiedDeal, key: string): unknown {
  return (deal.property_data as Record<string, unknown>)?.[key] ?? deal.uw_data?.[key] ?? null;
}

function propStr(deal: UnifiedDeal, key: string): string | null {
  const v = prop(deal, key);
  if (v == null || v === "") return null;
  return String(v);
}

function propNum(deal: UnifiedDeal, key: string): number | null {
  const v = prop(deal, key);
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

// ── Section label ──

function SectionLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
      {children}
    </div>
  );
}

// ── Field display ──

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="text-[11px] text-muted-foreground/70">{label}</div>
      <div className="text-sm font-medium text-foreground mt-0.5">{children}</div>
    </div>
  );
}

function CurrencyField({ label, value, className }: { label: string; value: number | null; className?: string }) {
  return (
    <Field label={label} className={className}>
      <span className="num">{value != null ? formatCurrency(value) : <Placeholder />}</span>
    </Field>
  );
}

function PercentField({ label, value, className }: { label: string; value: number | null; className?: string }) {
  return (
    <Field label={label} className={className}>
      <span className="num">{value != null ? formatPercent(value) : <Placeholder />}</span>
    </Field>
  );
}

function Placeholder() {
  return <span className="text-muted-foreground/40">Add...</span>;
}

// ── Card wrapper ──

function OverviewCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4 px-5", className)}>
      {children}
    </div>
  );
}

// ── Avatar circle ──

function InitialsAvatar({ name, palette }: { name: string; palette: "green" | "amber" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
        palette === "green"
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
      )}
    >
      {initials}
    </div>
  );
}

// ── Props ──

interface DealOverviewSummaryProps {
  deal: UnifiedDeal;
}

// ── Main Component ──

export function DealOverviewSummary({ deal }: DealOverviewSummaryProps) {
  const loanPurpose = uwStr(deal, "purpose") ?? uwStr(deal, "loan_purpose");
  const isRefi = loanPurpose?.toLowerCase().includes("refi") ?? false;
  const isPurchase = loanPurpose?.toLowerCase().includes("purchase") ?? false;
  const isEarlyStage = ["lead", "awaiting_info"].includes(deal.stage);
  const showProposedTerms = !isEarlyStage;

  // Build property address string
  const address = useMemo(() => {
    const parts = [
      uwStr(deal, "property_address"),
    ].filter(Boolean);
    const cityState = [
      uwStr(deal, "property_city"),
      uwStr(deal, "property_state"),
    ]
      .filter(Boolean)
      .join(", ");
    const zip = uwStr(deal, "property_zip");
    const line2 = [cityState, zip].filter(Boolean).join(" ");
    if (parts.length === 0 && !line2) return null;
    return [parts.join(""), line2].filter(Boolean).join(", ");
  }, [deal]);

  // Borrower info
  const borrowerName = deal.primary_contact
    ? `${deal.primary_contact.first_name ?? ""} ${deal.primary_contact.last_name ?? ""}`.trim()
    : null;
  const borrowerEmail = uwStr(deal, "borrower_email");
  const borrowerEntity = uwStr(deal, "entity_name") ?? uwStr(deal, "borrowing_entity");
  const borrowerFico = uwNum(deal, "borrower_fico") ?? uwNum(deal, "fico_score");
  const borrowerLiquidity = uwNum(deal, "liquid_reserves") ?? uwNum(deal, "borrower_liquidity");
  const borrowerPhone = uwStr(deal, "borrower_phone");

  // Broker info
  const brokerName = uwStr(deal, "broker_name");
  const brokerEmail = uwStr(deal, "broker_email");
  const brokerCompany = uwStr(deal, "broker_company");
  const brokerLicense = uwStr(deal, "broker_license");
  const brokerFeePct = uwNum(deal, "broker_fee_pct");
  const brokerFeeAmt = uwNum(deal, "broker_fee_amount");
  const leadSource = uwStr(deal, "lead_source") ?? deal.source;

  // Days in stage
  const daysInStage = deal.days_in_stage ?? daysAgo(deal.stage_entered_at);

  return (
    <div className="space-y-5">
      {/* ── Section 1: Property ── */}
      <div>
        <SectionLabel icon={Building2}>Property</SectionLabel>
        <OverviewCard>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
            <Field label="Property type">
              {uwStr(deal, "property_type")
                ? formatFieldValue(uwStr(deal, "property_type"), "select")
                : <Placeholder />}
            </Field>
            <Field label="Units / lots">
              <span className="num">
                {uwNum(deal, "number_of_units") ?? uwNum(deal, "units_lots_sites") ?? <Placeholder />}
              </span>
            </Field>
            <Field label="Total sq ft">
              <span className="num">
                {uwNum(deal, "total_sf") != null
                  ? new Intl.NumberFormat("en-US").format(uwNum(deal, "total_sf")!)
                  : <Placeholder />}
              </span>
            </Field>
            <Field label="Year built">
              {uwStr(deal, "year_built") ?? <Placeholder />}
            </Field>
            <Field label="Address" className="col-span-2 md:col-span-4">
              {address ?? <Placeholder />}
            </Field>
          </div>
        </OverviewCard>
      </div>

      {/* ── Section 2: Deal Summary ── */}
      <div>
        <SectionLabel icon={DollarSign}>Deal Summary</SectionLabel>
        <OverviewCard>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
            <Field label="Loan purpose">
              {loanPurpose
                ? formatFieldValue(loanPurpose, "select")
                : <Placeholder />}
            </Field>
            <CurrencyField
              label="Target loan amount"
              value={uwNum(deal, "loan_amount") ?? uwNum(deal, "total_loan_amount") ?? deal.amount}
            />
            <Field label="Target close date">
              {uwStr(deal, "expected_close_date") ?? deal.expected_close_date
                ? formatDate(uwStr(deal, "expected_close_date") ?? deal.expected_close_date)
                : <Placeholder />}
            </Field>
            <Field label="Days in stage">
              <span className="num">
                {daysInStage != null ? `${daysInStage}d` : <Placeholder />}
              </span>
            </Field>
          </div>

          {/* Conditional: Refinance details */}
          {isRefi && (
            <>
              <Separator className="my-3" />
              <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
                Refinance details
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
                <CurrencyField label="Original purchase price" value={uwNum(deal, "original_purchase_price")} />
                <Field label="Purchase date">
                  {uwStr(deal, "original_purchase_date")
                    ? formatDate(uwStr(deal, "original_purchase_date"))
                    : <Placeholder />}
                </Field>
                <CurrencyField label="Total invested to date" value={uwNum(deal, "total_invested")} />
                <CurrencyField label="Rehab budget" value={uwNum(deal, "rehab_budget")} />
              </div>
            </>
          )}

          {/* Conditional: Purchase details */}
          {isPurchase && (
            <>
              <Separator className="my-3" />
              <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
                Purchase details
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
                <CurrencyField label="Purchase price" value={uwNum(deal, "purchase_price")} />
                <CurrencyField
                  label="Down payment"
                  value={(() => {
                    const pp = uwNum(deal, "purchase_price");
                    const la = uwNum(deal, "loan_amount");
                    return pp != null && la != null ? pp - la : null;
                  })()}
                />
                <CurrencyField label="Earnest money deposit" value={uwNum(deal, "earnest_money_deposit")} />
                <Field label="Seller">
                  {uwStr(deal, "seller_name") ?? <Placeholder />}
                </Field>
              </div>
            </>
          )}
        </OverviewCard>
      </div>

      {/* ── Section 3: Loan Terms ── */}
      <div>
        <SectionLabel icon={FileText}>Loan Terms</SectionLabel>
        <div className={cn("grid gap-4", showProposedTerms ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
          {/* Borrower Ask */}
          <OverviewCard>
            <div className="text-[11px] font-medium text-muted-foreground mb-3">Borrower ask</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <CurrencyField label="Loan amount" value={uwNum(deal, "loan_amount") ?? deal.amount} />
              <PercentField label="Interest rate" value={uwNum(deal, "interest_rate")} />
              <Field label="Term (months)">
                <span className="num">
                  {uwNum(deal, "loan_term_months") ?? <Placeholder />}
                </span>
              </Field>
              <PercentField label="LTV" value={uwNum(deal, "ltv")} />
              <PercentField label="Origination fee %" value={uwNum(deal, "origination_fee_pct") ?? uwNum(deal, "origination_pts")} />
              <Field label="IO vs amortizing">
                {uwStr(deal, "amortization_type") ??
                  (uw(deal, "is_io") === true ? "Interest only" :
                   uw(deal, "is_io") === false ? "Amortizing" : <Placeholder />)}
              </Field>
            </div>
          </OverviewCard>

          {/* Proposed Terms (only if not early stage) */}
          {showProposedTerms && (
            <OverviewCard className="border-blue-300 dark:border-blue-700 border-2">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] font-medium text-muted-foreground">Proposed terms</div>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Active</Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <CurrencyField label="Loan amount" value={uwNum(deal, "proposed_loan_amount") ?? uwNum(deal, "loan_amount") ?? deal.amount} />
                <PercentField label="Interest rate" value={uwNum(deal, "proposed_interest_rate") ?? uwNum(deal, "interest_rate")} />
                <Field label="Term (months)">
                  <span className="num">
                    {uwNum(deal, "proposed_loan_term_months") ?? uwNum(deal, "loan_term_months") ?? <Placeholder />}
                  </span>
                </Field>
                <PercentField label="LTV" value={uwNum(deal, "proposed_ltv") ?? uwNum(deal, "ltv")} />
                <PercentField label="Origination fee %" value={uwNum(deal, "proposed_origination_fee_pct") ?? uwNum(deal, "origination_fee_pct") ?? uwNum(deal, "origination_pts")} />
                <Field label="IO vs amortizing">
                  {uwStr(deal, "proposed_amortization_type") ?? uwStr(deal, "amortization_type") ??
                    (uw(deal, "is_io") === true ? "Interest only" :
                     uw(deal, "is_io") === false ? "Amortizing" : <Placeholder />)}
                </Field>
              </div>
            </OverviewCard>
          )}
        </div>
      </div>

      {/* ── Section 4: Key Financials ── */}
      <div>
        <SectionLabel icon={BarChart3}>Key Financials</SectionLabel>
        <OverviewCard>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
            <Field label="DSCR">
              <span className="num">
                {uwNum(deal, "dscr") != null ? `${uwNum(deal, "dscr")!.toFixed(2)}x` : <Placeholder />}
              </span>
            </Field>
            <PercentField label="Cap rate" value={uwNum(deal, "cap_rate_in") ?? uwNum(deal, "going_in_cap_rate")} />
            <CurrencyField label="Annual cash flow" value={uwNum(deal, "annual_cash_flow")} />
            <CurrencyField label="Annual debt service" value={uwNum(deal, "annual_debt_service")} />
            <PercentField label="Cash-on-cash return" value={uwNum(deal, "cash_on_cash")} />
            <CurrencyField label="Existing debt" value={uwNum(deal, "existing_debt")} />
            <CurrencyField label="Seller financing" value={uwNum(deal, "seller_financing")} />
            <PercentField label="LTV (proposed)" value={uwNum(deal, "proposed_ltv") ?? uwNum(deal, "ltv")} />
          </div>
        </OverviewCard>
      </div>

      {/* ── Section 5: People ── */}
      <div>
        <SectionLabel icon={Users}>People</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Borrower card */}
          <OverviewCard>
            {borrowerName ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <InitialsAvatar name={borrowerName} palette="green" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{borrowerName}</div>
                    {borrowerEmail && (
                      <div className="text-xs text-muted-foreground truncate">{borrowerEmail}</div>
                    )}
                  </div>
                </div>
                <Separator className="mb-3" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <Field label="Entity name">{borrowerEntity ?? <Placeholder />}</Field>
                  <Field label="Credit score">
                    <span className="num">{borrowerFico ?? <Placeholder />}</span>
                  </Field>
                  <CurrencyField label="Liquidity" value={borrowerLiquidity} />
                  <Field label="Phone">{borrowerPhone ?? <Placeholder />}</Field>
                </div>
              </>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No borrower linked
              </div>
            )}
          </OverviewCard>

          {/* Broker / Source card */}
          <OverviewCard>
            {brokerName ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <InitialsAvatar name={brokerName} palette="amber" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{brokerName}</div>
                    {brokerEmail && (
                      <div className="text-xs text-muted-foreground truncate">{brokerEmail}</div>
                    )}
                  </div>
                </div>
                <Separator className="mb-3" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <Field label="Company">{brokerCompany ?? <Placeholder />}</Field>
                  <Field label="License #">{brokerLicense ?? <Placeholder />}</Field>
                  <Field label="Broker fee">
                    <span className="num">
                      {brokerFeePct != null || brokerFeeAmt != null
                        ? [
                            brokerFeePct != null ? `${brokerFeePct}%` : null,
                            brokerFeeAmt != null ? formatCurrency(brokerFeeAmt) : null,
                          ].filter(Boolean).join(" / ")
                        : <Placeholder />}
                    </span>
                  </Field>
                  <Field label="Lead source">{leadSource ?? <Placeholder />}</Field>
                </div>
              </>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No broker linked
              </div>
            )}
          </OverviewCard>
        </div>
      </div>

      {/* ── Section 6: Capital & Funding ── */}
      <div>
        <SectionLabel icon={Landmark}>Capital and Funding</SectionLabel>
        <OverviewCard>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
            <Field label="Funding channel">
              {uwStr(deal, "funding_channel")
                ? formatFieldValue(uwStr(deal, "funding_channel"), "select")
                : <Placeholder />}
            </Field>
            <Field label="Funding source">
              {uwStr(deal, "funding_source")
                ? formatFieldValue(uwStr(deal, "funding_source"), "select")
                : <Placeholder />}
            </Field>
            <Field label="Investment strategy">
              {uwStr(deal, "strategy") ?? uwStr(deal, "investment_strategy")
                ? formatFieldValue(uwStr(deal, "strategy") ?? uwStr(deal, "investment_strategy") ?? "", "select")
                : <Placeholder />}
            </Field>
            <Field label="Loan type">
              {uwStr(deal, "loan_type")
                ? formatFieldValue(uwStr(deal, "loan_type"), "select")
                : <Placeholder />}
            </Field>
          </div>
        </OverviewCard>
      </div>
    </div>
  );
}
