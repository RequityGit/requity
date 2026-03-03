"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  Briefcase,
  Users,
  Activity,
  UserPlus,
  MapPin,
  Building2,
  Landmark,
  Home,
} from "lucide-react";
import { StagePill, EmptyState, MonoValue, TimelineEvent } from "../shared";
import { formatCurrency } from "@/lib/format";
import type {
  ContactData,
  LoanData,
  InvestorCommitmentData,
  BorrowerEntityData,
  InvestingEntityData,
  ActivityData,
  CompanyData,
} from "../types";
import Link from "next/link";

function formatPropertyType(type: string): string {
  const labels: Record<string, string> = {
    sfr: "SFR",
    condo: "Condo",
    townhouse: "Townhouse",
    duplex: "Duplex",
    triplex: "Triplex",
    fourplex: "Fourplex",
    multifamily_5_plus: "Multifamily 5+",
    mixed_use: "Mixed Use",
    retail: "Retail",
    office: "Office",
    industrial: "Industrial",
    mobile_home_park: "Mobile Home Park",
    land: "Land",
    other: "Other",
  };
  return labels[type] || type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEntityType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPurpose(purpose: string): string {
  return purpose.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Activity type icon/color mapping
const activityIconConfig: Record<
  string,
  { icon: React.ElementType; bg: string; color: string }
> = {
  call: { icon: Activity, bg: "#EFF6FF", color: "#2563EB" },
  email: { icon: Activity, bg: "#F5F3FF", color: "#7C3AED" },
  meeting: { icon: Activity, bg: "#ECFDF3", color: "#16A34A" },
  note: { icon: Activity, bg: "#FFF7ED", color: "#C2410C" },
  text_message: { icon: Activity, bg: "#EFF6FF", color: "#2563EB" },
  follow_up: { icon: Activity, bg: "#FEF2F2", color: "#DC2626" },
  deal_update: { icon: Activity, bg: "#ECFDF3", color: "#16A34A" },
};

// ---------- Deals & Properties Card ----------
function DealsPropertiesCard({ loans }: { loans: LoanData[] }) {
  const activeLoans = loans.filter(
    (l) =>
      l.stage &&
      !["paid_off", "payoff", "denied", "withdrawn"].includes(l.stage)
  );

  if (activeLoans.length === 0) {
    return (
      <Card className="rounded-xl border-[#E5E5E7] bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
            <Home className="h-4 w-4" strokeWidth={1.5} />
            Deals & Properties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No active deals"
            description="Start a new loan application for this borrower."
            icon={Home}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border-[#E5E5E7] bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
          <Home className="h-4 w-4" strokeWidth={1.5} />
          Deals & Properties ({activeLoans.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeLoans.slice(0, 5).map((loan) => {
          const location = [loan.property_city, loan.property_state]
            .filter(Boolean)
            .join(", ");
          return (
            <Link
              key={loan.id}
              href={`/admin/loans/${loan.id}`}
              className="block rounded-lg border border-[#E5E5E7] p-3 hover:bg-[#F7F7F8] transition-colors"
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">
                    {loan.property_address || "No address"}
                  </p>
                  {location && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-[#9A9A9A] shrink-0" strokeWidth={1.5} />
                      <span className="text-xs text-[#6B6B6B]">{location}</span>
                    </div>
                  )}
                </div>
                {loan.stage && <StagePill stage={loan.stage} />}
              </div>
              <div className="flex items-center gap-3 flex-wrap text-xs text-[#6B6B6B]">
                <MonoValue>{formatCurrency(loan.loan_amount)}</MonoValue>
                {loan.property_type && (
                  <span className="inline-flex items-center rounded-md bg-[#F7F7F8] px-1.5 py-0.5 text-[10px] font-medium text-[#6B6B6B]">
                    {formatPropertyType(loan.property_type)}
                  </span>
                )}
                {loan.purpose && (
                  <span className="text-[#9A9A9A]">{formatPurpose(loan.purpose)}</span>
                )}
                {loan.interest_rate != null && (
                  <MonoValue>{loan.interest_rate}%</MonoValue>
                )}
                {loan.ltv != null && <MonoValue>{loan.ltv}% LTV</MonoValue>}
              </div>
            </Link>
          );
        })}
        {activeLoans.length > 5 && (
          <p className="text-xs text-[#6B6B6B] text-center">
            +{activeLoans.length - 5} more deals
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Entities Card ----------
function EntitiesCard({
  borrowerEntities,
  investingEntities,
  company,
}: {
  borrowerEntities: BorrowerEntityData[];
  investingEntities: InvestingEntityData[];
  company: CompanyData | null;
}) {
  const hasEntities =
    borrowerEntities.length > 0 ||
    investingEntities.length > 0 ||
    company !== null;

  if (!hasEntities) return null;

  return (
    <Card className="rounded-xl border-[#E5E5E7] bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
          <Building2 className="h-4 w-4" strokeWidth={1.5} />
          Associated Entities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Company */}
        {company && (
          <Link
            href={`/admin/crm/companies/${company.id}`}
            className="flex items-center gap-3 rounded-lg border border-[#E5E5E7] p-3 hover:bg-[#F7F7F8] transition-colors"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
              style={{ backgroundColor: "#EFF6FF" }}
            >
              <Building2 className="h-4 w-4" strokeWidth={1.5} style={{ color: "#2563EB" }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1A1A1A] truncate">{company.name}</p>
              <p className="text-xs text-[#6B6B6B]">
                {company.company_type
                  ? company.company_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                  : "Company"}
              </p>
            </div>
          </Link>
        )}

        {/* Borrower Entities */}
        {borrowerEntities.length > 0 && (
          <div className="space-y-2">
            {(investingEntities.length > 0 || company) && (
              <p className="text-[10px] font-medium text-[#9A9A9A] uppercase tracking-wider">
                Borrower Entities
              </p>
            )}
            {borrowerEntities.map((entity) => (
              <div
                key={entity.id}
                className="flex items-center gap-3 rounded-lg border border-[#E5E5E7] p-3"
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                  style={{ backgroundColor: "#ECFDF3" }}
                >
                  <Landmark className="h-4 w-4" strokeWidth={1.5} style={{ color: "#16A34A" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">
                    {entity.entity_name}
                  </p>
                  <p className="text-xs text-[#6B6B6B]">
                    {formatEntityType(entity.entity_type)}
                    {entity.state_of_formation && (
                      <span> &middot; {entity.state_of_formation}</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Investing Entities */}
        {investingEntities.length > 0 && (
          <div className="space-y-2">
            {(borrowerEntities.length > 0 || company) && (
              <p className="text-[10px] font-medium text-[#9A9A9A] uppercase tracking-wider">
                Investing Entities
              </p>
            )}
            {investingEntities.map((entity) => (
              <div
                key={entity.id}
                className="flex items-center gap-3 rounded-lg border border-[#E5E5E7] p-3"
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                  style={{ backgroundColor: "#F5F3FF" }}
                >
                  <Landmark className="h-4 w-4" strokeWidth={1.5} style={{ color: "#7C3AED" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">
                    {entity.entity_name}
                  </p>
                  <p className="text-xs text-[#6B6B6B]">
                    {formatEntityType(entity.entity_type)}
                    {entity.state_of_formation && (
                      <span> &middot; {entity.state_of_formation}</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Investment Summary Card (investor) ----------
function InvestmentSummaryCard({
  commitments,
}: {
  commitments: InvestorCommitmentData[];
}) {
  const totalCommitted = commitments.reduce(
    (s, c) => s + (c.commitment_amount || 0),
    0
  );
  const totalFunded = commitments.reduce(
    (s, c) => s + (c.funded_amount || 0),
    0
  );

  if (commitments.length === 0) {
    return (
      <Card className="rounded-xl border-[#E5E5E7] bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
            <TrendingUp className="h-4 w-4" strokeWidth={1.5} />
            Investments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No investments yet"
            description="Record a new investment for this investor."
            icon={TrendingUp}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border-[#E5E5E7] bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
          <TrendingUp className="h-4 w-4" strokeWidth={1.5} />
          Investment Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[#6B6B6B]">Total Committed</p>
            <MonoValue className="text-sm font-semibold text-[#1A1A1A]">
              {formatCurrency(totalCommitted)}
            </MonoValue>
          </div>
          <div>
            <p className="text-xs text-[#6B6B6B]">Total Funded</p>
            <MonoValue className="text-sm font-semibold text-[#1A1A1A]">
              {formatCurrency(totalFunded)}
            </MonoValue>
          </div>
        </div>
        {commitments.slice(0, 3).map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-lg border border-[#E5E5E7] p-3"
          >
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">
                {c.fund_name || "Unknown Fund"}
              </p>
              <MonoValue className="text-xs text-[#6B6B6B]">
                {formatCurrency(c.commitment_amount)}
              </MonoValue>
            </div>
            {c.status && <StagePill stage={c.status} />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------- Servicing Summary Card (lender) ----------
function ServicingSummaryCard({ loans }: { loans: LoanData[] }) {
  const servicingLoans = loans.filter(
    (l) => l.stage === "funded" || l.stage === "servicing"
  );
  return (
    <Card className="rounded-xl border-[#E5E5E7] bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
          <Briefcase className="h-4 w-4" strokeWidth={1.5} />
          Servicing Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {servicingLoans.length === 0 ? (
          <EmptyState
            title="No serviced loans"
            description="No loans currently being serviced by this lender."
            icon={Briefcase}
          />
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs text-[#6B6B6B]">Active Loans</p>
                <MonoValue className="text-sm font-semibold text-[#1A1A1A]">
                  {servicingLoans.length}
                </MonoValue>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B]">Total Balance</p>
                <MonoValue className="text-sm font-semibold text-[#1A1A1A]">
                  {formatCurrency(
                    servicingLoans.reduce(
                      (s, l) => s + (l.loan_amount || 0),
                      0
                    )
                  )}
                </MonoValue>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Referral Summary Card (broker) ----------
function ReferralSummaryCard() {
  return (
    <Card className="rounded-xl border-[#E5E5E7] bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
          <Users className="h-4 w-4" strokeWidth={1.5} />
          Referral Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState
          title="No referrals tracked"
          description="Referral tracking data will appear here."
          icon={Users}
        />
      </CardContent>
    </Card>
  );
}

// ---------- Recent Activity Card (always) ----------
function RecentActivityCard({ activities }: { activities: ActivityData[] }) {
  const recent = activities.slice(0, 5);

  return (
    <Card className="rounded-xl border-[#E5E5E7] bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
          <Activity className="h-4 w-4" strokeWidth={1.5} />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-[#6B6B6B] text-center py-4">
            No recent activity.
          </p>
        ) : (
          <div className="space-y-0">
            {recent.map((act, i) => {
              const config =
                activityIconConfig[act.activity_type] ||
                activityIconConfig.note;
              return (
                <TimelineEvent
                  key={act.id}
                  icon={config.icon}
                  iconBg={config.bg}
                  iconColor={config.color}
                  title={
                    act.subject ||
                    act.activity_type.replace(/_/g, " ").replace(/\b\w/g, (c) =>
                      c.toUpperCase()
                    )
                  }
                  description={act.description}
                  timestamp={act.created_at}
                  actor={act.created_by_name}
                  isLast={i === recent.length - 1}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Overview Tab ----------
interface OverviewTabProps {
  contact: ContactData;
  activeRelationships: string[];
  loans: LoanData[];
  investorCommitments: InvestorCommitmentData[];
  borrowerEntities: BorrowerEntityData[];
  investingEntities: InvestingEntityData[];
  activities: ActivityData[];
  company: CompanyData | null;
}

export function OverviewTab({
  contact,
  activeRelationships,
  loans,
  investorCommitments,
  borrowerEntities,
  investingEntities,
  activities,
  company,
}: OverviewTabProps) {
  const showLoans = activeRelationships.includes("borrower");
  const showInvestments = activeRelationships.includes("investor");
  const showServicing = activeRelationships.includes("lender");
  const showReferrals = activeRelationships.includes("broker");
  const hasRelationships = activeRelationships.length > 0;
  const hasEntities =
    borrowerEntities.length > 0 ||
    investingEntities.length > 0 ||
    company !== null;

  return (
    <div className="space-y-4">
      {!hasRelationships && (
        <Card className="rounded-xl border-[#E5E5E7] bg-white">
          <CardContent className="py-8">
            <EmptyState
              title="No relationships defined"
              description="Add a relationship to see more details about this contact."
              icon={UserPlus}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-[#E5E5E7]"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
                  Add Relationship
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}

      {showLoans && <DealsPropertiesCard loans={loans} />}
      {showInvestments && (
        <InvestmentSummaryCard commitments={investorCommitments} />
      )}
      {showServicing && <ServicingSummaryCard loans={loans} />}
      {showReferrals && <ReferralSummaryCard />}

      {hasEntities && (
        <EntitiesCard
          borrowerEntities={borrowerEntities}
          investingEntities={investingEntities}
          company={company}
        />
      )}

      <RecentActivityCard activities={activities} />
    </div>
  );
}
