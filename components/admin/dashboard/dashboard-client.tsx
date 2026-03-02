"use client";

import { useState } from "react";
import { DivisionTabs } from "./division-tabs";
import { HeroMetrics } from "./hero-metrics";
import { SecondaryMetrics } from "./secondary-metrics";
import { ActionItems } from "./action-items";
import { MaturityTable } from "./maturity-table";
import { PipelineChart } from "./pipeline-chart";
import { OriginationChart } from "./origination-chart";
import { AumPathCard } from "./aum-path-card";
import { TeamActivity } from "./team-activity";
import { QuickActions } from "./quick-actions";
import { PendingApprovalsWidget } from "@/components/approvals/pending-approvals-widget";
import type { DashboardData } from "@/lib/dashboard.server";
import "@/app/globals/dashboard.css";

interface DashboardClientProps {
  data: DashboardData;
  userName: string;
}

export function DashboardClient({ data, userName }: DashboardClientProps) {
  const [tab, setTab] = useState("combined");

  const now = new Date();
  const hr = now.getHours();
  const greeting =
    hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  const firstName = userName?.split(" ")[0] || "there";

  // Current month's origination volume
  const currentMonthVol = data.originations[data.originations.length - 1]?.volume ?? 0;

  return (
    <div className="font-body -m-6 min-h-full bg-dash-bg">
      <div className="max-w-[1360px] mx-auto px-6 py-5 pb-10">
        {/* Greeting + Tabs */}
        <div className="dash-fade-up dash-delay-0">
          <div className="flex justify-between items-end mb-[18px]">
            <div>
              <h1 className="font-display text-2xl font-normal text-navy leading-tight">
                {greeting},{" "}
                <span className="text-gold">{firstName}</span>
              </h1>
              <p className="font-body text-[12.5px] text-dash-text-mut mt-0.5">
                Portfolio command center · Requity Group
              </p>
            </div>
            <DivisionTabs activeTab={tab} onTabChange={setTab} />
          </div>
        </div>

        {/* Tier 1: Hero Metrics */}
        <HeroMetrics data={data.hero} />

        {/* Tier 2: Dense Secondary Metrics */}
        <SecondaryMetrics data={data.secondary} />

        {/* Pending Approvals Widget */}
        <div className="dash-fade-up dash-delay-3 mb-4">
          <PendingApprovalsWidget />
        </div>

        {/* Tier 3: Action Items */}
        <ActionItems items={data.actions} />

        {/* Maturities + Pipeline */}
        <div className="dash-fade-up dash-delay-4">
          <div className="grid grid-cols-[1.4fr_1fr] gap-3 mb-4">
            <MaturityTable loans={data.maturities} />
            <PipelineChart
              stages={data.pipeline}
              totalValue={data.totalPipelineValue}
              totalDeals={data.totalPipelineDeals}
              monthVolume={currentMonthVol}
            />
          </div>
        </div>

        {/* Charts + $1B Path */}
        <div className="dash-fade-up dash-delay-5">
          <div className="grid grid-cols-[1.5fr_1fr] gap-3 mb-4">
            <OriginationChart data={data.originations} />
            <AumPathCard
              totalAum={data.hero.totalAum}
              qtdCapital={data.qtdCapital}
              ytdCapital={data.ytdCapital}
              prospectCount={data.prospectCount}
              capitalData={data.capitalRaised}
            />
          </div>
        </div>

        {/* Team Activity + Quick Actions section */}
        <div className="dash-fade-up dash-delay-6">
          <div className="grid grid-cols-1 gap-3 mb-4">
            <TeamActivity entries={data.activities} />
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </div>
  );
}
