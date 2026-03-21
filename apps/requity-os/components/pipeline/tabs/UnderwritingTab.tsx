"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  DollarSign,
  Layers,
  RefreshCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  Link2,
  Unlink,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SourcesUsesSubTab } from "./sources-uses/SourcesUsesSubTab";
import { T12SubTab } from "./financials/T12SubTab";
import { CommercialUnderwritingTab } from "./CommercialUnderwritingTab";
import { updateDealGoogleSheetAction, clearDealGoogleSheetAction } from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import { toast } from "sonner";

// ── Types ──

export type { CommercialUWDataForUW as CommercialUWData };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface CommercialUWDataForUW {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uw: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  income: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expenses: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rentRoll: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scopeOfWork: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sourcesUses: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debt: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  waterfall: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allVersions: any[];
}

interface UnderwritingTabProps {
  data: CommercialUWDataForUW;
  dealId: string;
  sheetUrl?: string | null;
}

// ── Sub-tab definitions (matching mockup) ──

const SUB_TABS = [
  { key: "proforma" as const, label: "Pro Forma", icon: TrendingUp },
  { key: "income" as const, label: "Income", icon: DollarSign },
  { key: "expenses" as const, label: "Expenses", icon: BarChart3 },
  { key: "capital-stack" as const, label: "Capital Stack", icon: Layers },
] as const;

type SubTabKey = (typeof SUB_TABS)[number]["key"];

// ── Main Component ──

export function UnderwritingTab({ data, dealId, sheetUrl }: UnderwritingTabProps) {
  const router = useRouter();
  const { uw, income, expenses, rentRoll, sourcesUses, scopeOfWork } = data;
  const [activeTab, setActiveTab] = useState<SubTabKey>("proforma");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [linkSheetOpen, setLinkSheetOpen] = useState(false);
  const [linkSheetInput, setLinkSheetInput] = useState("");
  const [linkSheetSaving, setLinkSheetSaving] = useState(false);
  const [unlinkSaving, setUnlinkSaving] = useState(false);

  const uwId = uw?.id ?? null;
  const purchasePrice = Number(uw?.purchase_price) || 0;
  const numUnits = Number(uw?.num_units) || 0;
  const totalSf = Number(uw?.total_sf) || 0;
  const propertyType = (uw?.property_type as string) ?? "";
  const exitCapRate = Number(uw?.exit_cap_rate) || 0;

  const handleRefreshSync = useCallback(() => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  }, []);

  const handleOpenLinkSheet = useCallback(() => {
    setLinkSheetInput(sheetUrl ?? "");
    setLinkSheetOpen(true);
  }, [sheetUrl]);

  const handleLinkSheetSubmit = useCallback(async () => {
    const value = linkSheetInput.trim();
    if (!value) {
      toast.error("Enter a Google Sheet URL or sheet ID");
      return;
    }
    setLinkSheetSaving(true);
    try {
      const result = await updateDealGoogleSheetAction(dealId, value);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Google Sheet linked");
      setLinkSheetOpen(false);
      setLinkSheetInput("");
      router.refresh();
    } finally {
      setLinkSheetSaving(false);
    }
  }, [dealId, linkSheetInput, router]);

  const handleUnlinkSheet = useCallback(async () => {
    setUnlinkSaving(true);
    try {
      const result = await clearDealGoogleSheetAction(dealId);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Google Sheet unlinked");
      setLinkSheetOpen(false);
      setLinkSheetInput("");
      router.refresh();
    } finally {
      setUnlinkSaving(false);
    }
  }, [dealId, router]);

  // ── Tab content renderer ──
  const renderTabContent = () => {
    switch (activeTab) {
      case "proforma":
        return <CommercialUnderwritingTab data={data} dealId={dealId} />;
      case "income":
        return (
          <T12SubTab
            income={income}
            expenses={expenses}
            uwId={uwId}
            purchasePrice={purchasePrice}
            numUnits={numUnits}
            propertyType={propertyType}
            totalSf={totalSf}
            initialView="income"
          />
        );
      case "expenses":
        return (
          <T12SubTab
            income={income}
            expenses={expenses}
            uwId={uwId}
            purchasePrice={purchasePrice}
            numUnits={numUnits}
            propertyType={propertyType}
            totalSf={totalSf}
            initialView="expenses"
          />
        );
      case "capital-stack":
        return (
          <SourcesUsesSubTab
            uwId={uwId}
            purchasePrice={purchasePrice}
            numUnits={numUnits}
            exitCapRate={exitCapRate}
            uw={uw ?? {}}
            debt={data.debt ?? []}
            sourcesUses={sourcesUses}
            scopeOfWork={scopeOfWork}
          />
        );
      default:
        return null;
    }
  };

  const uwContent = (
    <div className="flex flex-col gap-0">
      {/* Sub-tab navigation bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/40 -mx-1 px-1 py-2">
        <div className="flex items-center justify-between">
          {/* Tab pills */}
          <div className="inline-flex gap-1 p-1 bg-muted/50 rounded-lg">
            {SUB_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-[7px] text-[13px] font-medium cursor-pointer transition-all whitespace-nowrap",
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", isActive ? "opacity-100" : "opacity-50")} strokeWidth={1.5} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Right controls: sync, sheet link, fullscreen */}
          <div className="inline-flex items-center gap-1.5">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isSyncing ? "bg-amber-500 animate-ping" : "bg-emerald-500"
                )}
              />
              <span>{isSyncing ? "Syncing..." : "Synced"}</span>
              <button
                onClick={handleRefreshSync}
                className="ml-0.5 p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
              >
                <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
              </button>
            </div>

            <div className="h-4 w-px bg-border/60" />

            {sheetUrl && (
              <>
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open in Sheets
                </a>
                <div className="h-4 w-px bg-border/60" />
              </>
            )}

            <button
              onClick={handleOpenLinkSheet}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Link2 className="h-3 w-3" />
              {sheetUrl ? "Change link" : "Link Google Sheet"}
            </button>

            <div className="h-4 w-px bg-border/60" />

            <button
              onClick={() => setIsFullscreen(true)}
              className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {renderTabContent()}
      </div>
    </div>
  );

  return (
    <>
      {uwContent}

      {/* Link Google Sheet dialog */}
      <Dialog open={linkSheetOpen} onOpenChange={setLinkSheetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{sheetUrl ? "Change Google Sheet link" : "Link Google Sheet"}</DialogTitle>
            <DialogDescription>
              Paste the full Google Sheet URL (e.g. https://docs.google.com/spreadsheets/d/...) to open it from this deal and, in a future update, sync commercial UW data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sheet-url">Sheet URL or ID</Label>
              <Input
                id="sheet-url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={linkSheetInput}
                onChange={(e) => setLinkSheetInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLinkSheetSubmit()}
              />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <div>
              {sheetUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={handleUnlinkSheet}
                  disabled={unlinkSaving}
                >
                  <Unlink className="h-3.5 w-3.5 mr-1.5" />
                  Unlink sheet
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setLinkSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleLinkSheetSubmit} disabled={linkSheetSaving}>
                {linkSheetSaving ? "Saving..." : "Save link"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent
          className="max-w-[96vw] w-[96vw] h-[94vh] p-0 flex flex-col overflow-hidden rounded-xl md:rounded-xl md:max-w-[96vw]"
        >
          <DialogTitle className="sr-only">Financial Model</DialogTitle>
          <div className="shrink-0 border-b border-border/40 px-4 py-2.5 flex items-center justify-between">
            <div className="inline-flex gap-1 p-1 bg-muted/50 rounded-lg">
              {SUB_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-[7px] text-[13px] font-medium cursor-pointer transition-all whitespace-nowrap",
                      isActive
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", isActive ? "opacity-100" : "opacity-50")} strokeWidth={1.5} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="inline-flex items-center gap-1.5">
              <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isSyncing ? "bg-amber-500 animate-ping" : "bg-emerald-500"
                  )}
                />
                <span>{isSyncing ? "Syncing..." : "Synced"}</span>
              </div>
              {sheetUrl && (
                <>
                  <div className="h-4 w-px bg-border/60" />
                  <a
                    href={sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open in Sheets
                  </a>
                </>
              )}
              <div className="h-4 w-px bg-border/60" />
              <button
                onClick={() => setIsFullscreen(false)}
                className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="mt-2">{renderTabContent()}</div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
