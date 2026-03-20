"use client";

import { useEffect, useRef } from "react";
import {
  Home,
  DollarSign,
  Tag,
  ArrowUpRight,
  BarChart3,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommercialUWStore } from "@/components/commercial-uw/store";
import { DealOverviewTab } from "@/components/commercial-uw/tabs/deal-overview-tab";
import { IncomeTab } from "@/components/commercial-uw/tabs/income-tab";
import { ExpensesTab } from "@/components/commercial-uw/tabs/expenses-tab";
import { SourcesUsesTab } from "@/components/commercial-uw/tabs/sources-uses-tab";
import { ProFormaTab } from "@/components/commercial-uw/tabs/pro-forma-tab";
import { WaterfallTab } from "@/components/commercial-uw/tabs/waterfall-tab";
import type { CommercialUWState } from "@/components/commercial-uw/types";

const TABS = [
  { id: "overview", label: "Deal Overview", Icon: Home },
  { id: "income", label: "Income", Icon: DollarSign },
  { id: "expenses", label: "Expenses", Icon: Tag },
  { id: "sourcesuses", label: "Sources & Uses", Icon: ArrowUpRight },
  { id: "proforma", label: "Pro Forma", Icon: BarChart3 },
  { id: "waterfall", label: "Waterfall", Icon: Layers },
] as const;

interface CommercialTabsProps {
  initialState: CommercialUWState;
}

export function CommercialTabs({ initialState }: CommercialTabsProps) {
  const { activeTab, setActiveTab, loadState } = useCommercialUWStore();
  const loadedRef = useRef<string | null>(null);

  // Load state when initialState changes (e.g. switching versions)
  const stateKey = initialState.versionId || JSON.stringify(initialState);
  useEffect(() => {
    if (loadedRef.current !== stateKey) {
      loadState(initialState);
      loadedRef.current = stateKey;
    }
  }, [stateKey, initialState, loadState]);

  return (
    <div className="flex flex-col">
      {/* Tab Navigation */}
      <div className="border-b bg-card px-2 flex gap-0 overflow-x-auto -mx-6 -mt-6 mb-6">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-[7px] px-3.5 py-3 text-xs font-medium border-b-2 -mb-px transition-all whitespace-nowrap shrink-0 cursor-pointer bg-transparent",
                active
                  ? "font-semibold text-foreground border-foreground"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              <tab.Icon className="w-[15px] h-[15px]" strokeWidth={1.5} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="max-w-[1100px] w-full">
        {activeTab === "overview" && <DealOverviewTab />}
        {activeTab === "income" && <IncomeTab />}
        {activeTab === "expenses" && <ExpensesTab />}
        {activeTab === "sourcesuses" && <SourcesUsesTab />}
        {activeTab === "proforma" && <ProFormaTab />}
        {activeTab === "waterfall" && <WaterfallTab />}
      </div>
    </div>
  );
}
