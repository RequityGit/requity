"use client";

import { MetricCard } from "@/components/dashboard/metric-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { formatCurrency, formatDate } from "@/lib/format";
import { DollarSign, Wallet, TrendingUp, Landmark } from "lucide-react";
import Link from "next/link";

interface Commitment {
  id: string;
  fundName: string;
  committed: number;
  funded: number;
  status: string;
}

interface Distribution {
  id: string;
  amount: number;
  date: string;
  type: string;
  fundName: string;
  status: string;
}

interface InvestorDashboardClientProps {
  firstName: string;
  totalCommitted: string;
  totalFunded: string;
  ytdDistributions: string;
  commitmentCount: number;
  commitments: Commitment[];
  recentDistributions: Distribution[];
}

export function InvestorDashboardClient({
  totalCommitted,
  totalFunded,
  ytdDistributions,
  commitmentCount,
  commitments,
  recentDistributions,
}: InvestorDashboardClientProps) {
  return (
    <div className="space-y-6">
      {/* Hero metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Committed"
          value={totalCommitted}
          subtext={`across ${commitmentCount} investment${commitmentCount !== 1 ? "s" : ""}`}
          icon={DollarSign}
          isCurrency
        />
        <MetricCard
          label="Total Funded"
          value={totalFunded}
          subtext="capital deployed"
          icon={Wallet}
          isCurrency
        />
        <MetricCard
          label="YTD Distributions"
          value={ytdDistributions}
          subtext={`${new Date().getFullYear()} year to date`}
          icon={TrendingUp}
          isCurrency
        />
        <MetricCard
          label="Active Investments"
          value={commitmentCount}
          subtext="fund commitments"
          icon={Landmark}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio */}
        <div className="card-cinematic">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-medium text-surface-white">
              Investment Commitments
            </h2>
            <Link
              href="/investor/investments"
              className="text-xs font-body text-gold hover:text-gold-light transition-colors"
            >
              View all
            </Link>
          </div>

          {commitments.length === 0 ? (
            <p className="text-sm text-surface-muted py-8 text-center font-body">
              No investment commitments found.
            </p>
          ) : (
            <div className="space-y-4">
              {commitments.map((c) => {
                const pct =
                  c.committed > 0
                    ? Math.round((c.funded / c.committed) * 100)
                    : 0;
                return (
                  <div key={c.id} className="pb-4 border-b border-navy-light last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-body font-medium text-surface-white">
                        {c.fundName}
                      </p>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-surface-muted font-body mb-2">
                      <span>
                        <CurrencyDisplay amount={c.funded} size="sm" className="text-surface-gray" />
                        {" of "}
                        <CurrencyDisplay amount={c.committed} size="sm" className="text-surface-gray" />
                      </span>
                      <span className="font-mono">{pct}%</span>
                    </div>
                    <div className="w-full bg-navy-deep rounded-full h-1.5">
                      <div
                        className="bg-gold h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Distributions */}
        <div className="card-cinematic">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-medium text-surface-white">
              Recent Distributions
            </h2>
            <Link
              href="/investor/distributions"
              className="text-xs font-body text-gold hover:text-gold-light transition-colors"
            >
              View all
            </Link>
          </div>

          {recentDistributions.length === 0 ? (
            <p className="text-sm text-surface-muted py-8 text-center font-body">
              No distributions yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentDistributions.slice(0, 5).map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between pb-3 border-b border-navy-light last:border-b-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-body text-surface-white">
                      {d.fundName}
                    </p>
                    <p className="text-xs text-surface-muted font-body">
                      {formatDate(d.date)} &middot;{" "}
                      {d.type.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <CurrencyDisplay
                      amount={d.amount}
                      size="sm"
                      className="text-status-success font-semibold"
                    />
                    <div className="mt-0.5">
                      <StatusBadge status={d.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
