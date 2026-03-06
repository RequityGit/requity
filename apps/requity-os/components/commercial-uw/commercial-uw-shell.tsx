"use client";

import { useState } from "react";
import {
  Home,
  DollarSign,
  Tag,
  ArrowUpRight,
  BarChart3,
  Layers,
  ArrowLeft,
  Download,
  Save,
  CheckCircle2,
  Copy,
  User,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommercialUWStore } from "./store";
import { useCommercialUWCalcs } from "./use-calcs";
import { exportToExcel } from "./excel-export";
import { DealOverviewTab } from "./tabs/deal-overview-tab";
import { IncomeTab } from "./tabs/income-tab";
import { ExpensesTab } from "./tabs/expenses-tab";
import { SourcesUsesTab } from "./tabs/sources-uses-tab";
import { ProFormaTab } from "./tabs/pro-forma-tab";
import { WaterfallTab } from "./tabs/waterfall-tab";

const TABS = [
  { id: "overview", label: "Deal Overview", Icon: Home },
  { id: "income", label: "Income", Icon: DollarSign },
  { id: "expenses", label: "Expenses", Icon: Tag },
  { id: "sourcesuses", label: "Sources & Uses", Icon: ArrowUpRight },
  { id: "proforma", label: "Pro Forma", Icon: BarChart3 },
  { id: "waterfall", label: "Waterfall", Icon: Layers },
] as const;

interface CommercialUWShellProps {
  dealId: string;
  dealName?: string;
}

export function CommercialUWShell({ dealId, dealName = "123 Test Deal" }: CommercialUWShellProps) {
  const { state, activeTab, setActiveTab } = useCommercialUWStore();
  const calcs = useCommercialUWCalcs(state);
  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportToExcel(state, calcs, dealName);
    } catch {
      alert("Failed to export Excel");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-background font-sans text-foreground">
      {/* Top Bar */}
      <div className="h-[52px] border-b flex items-center px-5 bg-card sticky top-0 z-50 justify-between">
        <div className="flex items-center gap-2.5">
          <a
            href={`/admin/deals/${dealId}`}
            className="flex items-center gap-[5px] text-muted-foreground text-xs font-medium hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
            Back to Deal
          </a>
          <div className="w-px h-[18px] bg-border" />
          <div className="flex items-center gap-[7px]">
            <Briefcase className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span className="text-sm font-bold tracking-tight">{dealName}</span>
          </div>
          <span className="text-[10px] font-semibold px-[7px] py-0.5 rounded bg-accent border text-muted-foreground">
            Commercial UW
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-lg border text-xs font-medium cursor-pointer bg-transparent text-foreground hover:bg-accent/50 transition-colors"
          >
            <Download className="w-[13px] h-[13px]" strokeWidth={1.5} />
            {exporting ? "Exporting..." : "Export Excel"}
          </button>
          <button className="inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-lg border text-xs font-medium cursor-pointer bg-transparent text-foreground hover:bg-accent/50 transition-colors">
            <Save className="w-[13px] h-[13px]" strokeWidth={1.5} />
            Save Draft
          </button>
          <button className="inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-lg border-none text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <CheckCircle2 className="w-[13px] h-[13px]" strokeWidth={2} />
            Save & Activate
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Versions Sidebar */}
        <div className="w-[190px] border-r px-3.5 py-[18px] bg-card shrink-0">
          <div className="flex justify-between items-center mb-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Versions
            </span>
            <button className="px-2 py-[3px] rounded-lg border text-[11px] font-medium text-muted-foreground cursor-pointer bg-transparent hover:bg-accent/50 transition-colors">
              + New
            </button>
          </div>
          <div className="p-2.5 rounded-lg bg-accent/50 border-2 border-border">
            <div className="flex items-center gap-1.5 mb-[3px]">
              <span className="text-[13px] font-bold tabular-nums">v{state.version}</span>
              <span
                className={cn(
                  "text-[9px] font-bold px-[5px] py-px rounded uppercase tracking-[0.04em]",
                  state.status === "draft"
                    ? "bg-[hsl(36,40%,42%,0.15)] text-[hsl(36,40%,42%)]"
                    : "bg-[hsl(145,63%,29%,0.15)] text-[hsl(145,63%,29%)]"
                )}
              >
                {state.status}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <User className="w-2.5 h-2.5" strokeWidth={2} />
              Dylan Marma · Mar 6, 2026
            </div>
            <button className="mt-1.5 text-[10px] text-muted-foreground bg-transparent border-none cursor-pointer flex items-center gap-[3px] p-0 hover:text-foreground transition-colors">
              <Copy className="w-2.5 h-2.5" strokeWidth={2} />
              Clone as new version
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b bg-card px-6 flex gap-0 sticky top-[52px] z-40 overflow-x-auto">
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
          <div className="px-7 py-6 pb-[60px] max-w-[1100px] mx-auto w-full">
            {activeTab === "overview" && <DealOverviewTab />}
            {activeTab === "income" && <IncomeTab />}
            {activeTab === "expenses" && <ExpensesTab />}
            {activeTab === "sourcesuses" && <SourcesUsesTab />}
            {activeTab === "proforma" && <ProFormaTab />}
            {activeTab === "waterfall" && <WaterfallTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
