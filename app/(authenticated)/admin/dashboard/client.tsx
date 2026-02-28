"use client";

import { MetricCard } from "@/components/dashboard/metric-card";
import { ActivityFeed, type ActivityItem } from "@/components/dashboard/activity-feed";
import { Home, Clock, TrendingUp, BarChart3 } from "lucide-react";
import Link from "next/link";

interface AdminDashboardClientProps {
  metrics: {
    activeLoans: number;
    totalPipeline: string;
    processingLoans: number;
    totalLoans: number;
  };
  activities: ActivityItem[];
}

export function AdminDashboardClient({
  metrics,
  activities,
}: AdminDashboardClientProps) {
  return (
    <div className="space-y-6">
      {/* Hero metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Loans"
          value={metrics.activeLoans}
          subtext="currently funded/servicing"
          icon={Home}
        />
        <MetricCard
          label="Pipeline Value"
          value={metrics.totalPipeline}
          subtext={`${metrics.totalLoans} total loans`}
          icon={TrendingUp}
          isCurrency
        />
        <MetricCard
          label="In Processing"
          value={metrics.processingLoans}
          subtext="loans in pipeline"
          icon={Clock}
        />
        <MetricCard
          label="Total Loans"
          value={metrics.totalLoans}
          subtext="all time"
          icon={BarChart3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Required */}
        <div className="lg:col-span-1 card-cinematic">
          <h2 className="font-display text-lg font-medium text-surface-white mb-4">
            Quick Actions
          </h2>
          <div className="space-y-2">
            <Link
              href="/admin/loans"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-body text-surface-gray hover:text-surface-white hover:bg-navy-light transition-colors"
            >
              <Home className="h-4 w-4 text-gold" />
              View Loan Pipeline
            </Link>
            <Link
              href="/admin/borrowers"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-body text-surface-gray hover:text-surface-white hover:bg-navy-light transition-colors"
            >
              <TrendingUp className="h-4 w-4 text-gold" />
              Manage Borrowers
            </Link>
            <Link
              href="/admin/investors"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-body text-surface-gray hover:text-surface-white hover:bg-navy-light transition-colors"
            >
              <BarChart3 className="h-4 w-4 text-gold" />
              Manage Investors
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 card-cinematic">
          <h2 className="font-display text-lg font-medium text-surface-white mb-4">
            Recent Activity
          </h2>
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
