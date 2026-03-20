"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  Briefcase,
  Users,
  Activity,
  UserPlus,
} from "lucide-react";
import { StagePill, EmptyState, MonoValue, TimelineEvent } from "../shared";
import { formatCurrency } from "@/lib/format";
import type {
  ContactData,
  LoanData,
  InvestorCommitmentData,
  ActivityData,
} from "../types";
import Link from "next/link";

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

// ---------- Active Loans Card (borrower) ----------
function ActiveLoansCard({ loans }: { loans: LoanData[] }) {
  const activeLoans = loans.filter(
    (l) =>
      l.stage &&
      !["paid_off", "payoff", "denied", "withdrawn"].includes(l.stage)
  );

  if (activeLoans.length === 0) {
    return (
      <Card className="rounded-xl border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4" strokeWidth={1.5} />
            Active Loans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No active loans"
            description="Start a new loan application for this borrower."
            icon={DollarSign}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <DollarSign className="h-4 w-4" strokeWidth={1.5} />
          Active Loans ({activeLoans.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeLoans.slice(0, 3).map((loan) => (
          <Link
            key={loan.id}
            href={`/pipeline/${loan.loan_number || loan.id}`}
            className="block rounded-lg border border-border p-3 hover:bg-muted transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-foreground truncate">
                {loan.property_address || "No address"}
              </p>
              {loan.stage && <StagePill stage={loan.stage} />}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <MonoValue>{formatCurrency(loan.loan_amount)}</MonoValue>
              {loan.interest_rate != null && (
                <MonoValue>{loan.interest_rate}%</MonoValue>
              )}
              {loan.ltv != null && <MonoValue>{loan.ltv}% LTV</MonoValue>}
            </div>
          </Link>
        ))}
        {activeLoans.length > 3 && (
          <p className="text-xs text-muted-foreground text-center">
            +{activeLoans.length - 3} more loans
          </p>
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
      <Card className="rounded-xl border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
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
    <Card className="rounded-xl border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4" strokeWidth={1.5} />
          Investment Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Committed</p>
            <MonoValue className="text-sm font-semibold text-foreground">
              {formatCurrency(totalCommitted)}
            </MonoValue>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Funded</p>
            <MonoValue className="text-sm font-semibold text-foreground">
              {formatCurrency(totalFunded)}
            </MonoValue>
          </div>
        </div>
        {commitments.slice(0, 3).map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-lg border border-border p-3"
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                {c.fund_name || "Unknown Fund"}
              </p>
              <MonoValue className="text-xs text-muted-foreground">
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
    <Card className="rounded-xl border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
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
                <p className="text-xs text-muted-foreground">Active Loans</p>
                <MonoValue className="text-sm font-semibold text-foreground">
                  {servicingLoans.length}
                </MonoValue>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Balance</p>
                <MonoValue className="text-sm font-semibold text-foreground">
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
    <Card className="rounded-xl border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
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
    <Card className="rounded-xl border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4" strokeWidth={1.5} />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
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
  activities: ActivityData[];
}

export function OverviewTab({
  contact,
  activeRelationships,
  loans,
  investorCommitments,
  activities,
}: OverviewTabProps) {
  const showLoans = activeRelationships.includes("borrower");
  const showInvestments = activeRelationships.includes("investor");
  const showServicing = activeRelationships.includes("lender");
  const showReferrals = activeRelationships.includes("broker");
  const hasRelationships = activeRelationships.length > 0;

  return (
    <div className="space-y-4">
      {!hasRelationships && (
        <Card className="rounded-xl border-border bg-card">
          <CardContent className="py-8">
            <EmptyState
              title="No relationships defined"
              description="Add a relationship to see more details about this contact."
              icon={UserPlus}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-border"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
                  Add Relationship
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}

      {showLoans && <ActiveLoansCard loans={loans} />}
      {showInvestments && (
        <InvestmentSummaryCard commitments={investorCommitments} />
      )}
      {showServicing && <ServicingSummaryCard loans={loans} />}
      {showReferrals && <ReferralSummaryCard />}

      <RecentActivityCard activities={activities} />
    </div>
  );
}
