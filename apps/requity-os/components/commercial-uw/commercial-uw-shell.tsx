"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Home,
  DollarSign,
  Tag,
  ArrowUpRight,
  BarChart3,
  Layers,
  ArrowLeft,
  Download,
  Briefcase,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
  const { toast } = useToast();

  const handleExportExcel = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportToExcel(state, calcs, dealName);
    } catch {
      toast({ title: "Export failed", description: "Failed to export Excel file. Please try again.", variant: "destructive" });
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
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-w-0 flex flex-col">
          {/* Tab Navigation */}
          <TabsList className="border-b bg-card px-6 h-auto rounded-none justify-start gap-0 sticky top-[52px] z-40 overflow-x-auto">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-[7px] px-3.5 py-3 text-xs font-medium rounded-none border-b-2 border-transparent -mb-px transition-all whitespace-nowrap data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:border-foreground data-[state=active]:shadow-none data-[state=inactive]:text-muted-foreground"
              >
                <tab.Icon className="w-[15px] h-[15px]" strokeWidth={1.5} />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Content */}
          <div className="px-7 py-6 pb-[60px] max-w-[1100px] mx-auto w-full">
            <TabsContent value="overview" className="mt-0"><DealOverviewTab /></TabsContent>
            <TabsContent value="income" className="mt-0"><IncomeTab /></TabsContent>
            <TabsContent value="expenses" className="mt-0"><ExpensesTab /></TabsContent>
            <TabsContent value="sourcesuses" className="mt-0"><SourcesUsesTab /></TabsContent>
            <TabsContent value="proforma" className="mt-0"><ProFormaTab /></TabsContent>
            <TabsContent value="waterfall" className="mt-0"><WaterfallTab /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
