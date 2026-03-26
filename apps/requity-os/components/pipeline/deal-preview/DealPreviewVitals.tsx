"use client";

import { cn } from "@/lib/utils";
import {
  Building2,
  Calendar,
  Hash,
  Landmark,
  Mail,
  Phone,
  Shield,
  TrendingUp,
  User,
} from "lucide-react";
import { formatCompactCurrency, formatPercent, formatDate } from "@/lib/format";
import type { DealPreviewData, DealTeamMember } from "./useDealPreviewData";
import type { ReactNode } from "react";

// ─── Helpers ───

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = [
  { bg: "bg-blue-100 dark:bg-blue-900/40", fg: "text-blue-700 dark:text-blue-300" },
  { bg: "bg-amber-100 dark:bg-amber-900/40", fg: "text-amber-700 dark:text-amber-300" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/40", fg: "text-emerald-700 dark:text-emerald-300" },
  { bg: "bg-purple-100 dark:bg-purple-900/40", fg: "text-purple-700 dark:text-purple-300" },
  { bg: "bg-rose-100 dark:bg-rose-900/40", fg: "text-rose-700 dark:text-rose-300" },
];

// ─── Sub-components ───

function FieldRow({ icon: Icon, label, value }: { icon?: React.ComponentType<{ className?: string }>; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/30 py-[5px]">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </span>
      <span className="num text-xs font-medium text-foreground">{value ?? "\u2014"}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="rq-micro-label mb-1">{children}</div>;
}

function ContactCard({
  name,
  subtitle,
  email,
  phone,
  iconBg,
  iconColor,
  icon: Icon,
}: {
  name: string;
  subtitle?: string | null;
  email?: string | null;
  phone?: string | null;
  iconBg: string;
  iconColor: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg bg-muted/40 p-2.5">
      <div className="mb-1 flex items-center gap-1.5">
        <div className={cn("flex h-6 w-6 items-center justify-center rounded-full", iconBg)}>
          <Icon className={cn("h-3 w-3", iconColor)} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-foreground">{name}</div>
          {subtitle && <div className="truncate text-[10px] text-muted-foreground">{subtitle}</div>}
        </div>
      </div>
      {(phone || email) && (
        <div className="flex gap-2 pl-[30px]">
          {phone && (
            <a href={`tel:${phone}`} className="flex items-center gap-1 text-[10px] text-primary no-underline hover:underline">
              <Phone className="h-2.5 w-2.5" />Call
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="flex items-center gap-1 text-[10px] text-primary no-underline hover:underline">
              <Mail className="h-2.5 w-2.5" />Email
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───

interface DealPreviewVitalsProps {
  data: DealPreviewData;
  teamMemberNames?: Map<string, string>;
}

export function DealPreviewVitals({ data, teamMemberNames }: DealPreviewVitalsProps) {
  const { deal, teamMembers, teamContacts } = data;
  const uw = deal.uw_data ?? {};
  const prop = deal.property_data ?? {};

  const amount = deal.amount;
  const rate = (uw.interest_rate as number) ?? null;
  const ltv = (uw.ltv as number) ?? (uw.loan_to_value as number) ?? null;

  return (
    <div className="flex w-[280px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-border/50 p-3.5">
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "Amount", value: amount != null ? formatCompactCurrency(amount) : "\u2014" },
          { label: "Rate", value: rate != null ? formatPercent(rate) : "\u2014" },
          { label: "LTV", value: ltv != null ? formatPercent(ltv) : "\u2014" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-md bg-muted/40 px-2.5 py-2">
            <div className="rq-micro-label">{kpi.label}</div>
            <div className="rq-stat-value mt-0.5 text-lg">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Loan Details */}
      <div>
        <SectionTitle>Loan Details</SectionTitle>
        <FieldRow icon={Landmark} label="Type" value={uw.loan_type as string} />
        <FieldRow icon={TrendingUp} label="Purpose" value={uw.loan_purpose as string} />
        <FieldRow icon={Calendar} label="Term" value={uw.term_months ? `${uw.term_months} mo` : null} />
        <FieldRow label="Orig. Fee" value={uw.origination_fee_pct != null ? `${uw.origination_fee_pct}%` : null} />
        <FieldRow icon={Calendar} label="Est. Close" value={deal.close_date ? formatDate(deal.close_date) : null} />
        <FieldRow icon={Hash} label="Source" value={deal.source} />
      </div>

      {/* Property */}
      <div>
        <SectionTitle>Property</SectionTitle>
        <FieldRow label="Year Built" value={prop.year_built as string} />
        <FieldRow label="Units" value={prop.units as string} />
        <FieldRow label="Sq Ft" value={prop.sqft != null ? Number(prop.sqft).toLocaleString() : null} />
      </div>

      {/* Borrower */}
      {deal.primary_contact && (
        <div>
          <SectionTitle>Borrower</SectionTitle>
          <ContactCard
            name={`${deal.primary_contact.first_name} ${deal.primary_contact.last_name}`}
            subtitle={deal.company?.name ?? (deal.primary_contact as Record<string, unknown>).company_name as string}
            email={deal.primary_contact.email}
            phone={deal.primary_contact.phone}
            iconBg="bg-blue-100 dark:bg-blue-900/40"
            iconColor="text-blue-600"
            icon={User}
          />
        </div>
      )}

      {/* Broker */}
      {deal.broker_contact && (
        <div>
          <SectionTitle>Broker</SectionTitle>
          <ContactCard
            name={`${deal.broker_contact.first_name} ${deal.broker_contact.last_name}`}
            subtitle={(deal.broker_contact as Record<string, unknown>).company_name as string}
            email={deal.broker_contact.email}
            phone={deal.broker_contact.phone}
            iconBg="bg-amber-100 dark:bg-amber-900/40"
            iconColor="text-amber-600"
            icon={Shield}
          />
        </div>
      )}

      {/* Team */}
      {(teamMembers.length > 0 || teamContacts.length > 0) && (
        <div>
          <SectionTitle>Team</SectionTitle>
          {teamMembers.map((m, i) => {
            const name = teamMemberNames?.get(m.profile_id) ?? "Team Member";
            const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              <div key={m.id} className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold", color.bg, color.fg)}>
                    {getInitials(name)}
                  </span>
                  <span className="text-xs font-medium text-foreground">{name}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{formatRole(m.role)}</span>
              </div>
            );
          })}
          {teamContacts.map((c, i) => {
            const name = c.contact
              ? `${c.contact.first_name ?? ""} ${c.contact.last_name ?? ""}`.trim()
              : c.manual_name || "Contact";
            const color = AVATAR_COLORS[(teamMembers.length + i) % AVATAR_COLORS.length];
            return (
              <div key={c.id} className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold", color.bg, color.fg)}>
                    {getInitials(name)}
                  </span>
                  <span className="text-xs font-medium text-foreground">{name}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{formatRole(c.role)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatRole(role: string): string {
  return role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
