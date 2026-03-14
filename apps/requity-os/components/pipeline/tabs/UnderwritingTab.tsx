"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CheckCircle2, RefreshCw, Maximize2, Minimize2, ExternalLink, Link2, Unlink } from "lucide-react";
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
import { SectionHeader } from "../uw/uw-shared";
import { ProFormaSection } from "../uw/ProFormaSection";
import { AssumptionsSection } from "../uw/AssumptionsSection";
import { SourcesUsesSubTab } from "./sources-uses/SourcesUsesSubTab";
import { updateDealGoogleSheetAction, clearDealGoogleSheetAction } from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import { toast } from "sonner";

// ── Types ──

export type { CommercialUWDataForUW as CommercialUWData };

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

const UW_SECTIONS = ["Pro Forma", "Assumptions", "Sources & Uses"];

function sectionId(name: string) {
  return name.toLowerCase().replace(/[\s\/&]+/g, "-");
}

// ── Main Component ──

export function UnderwritingTab({ data, dealId, sheetUrl }: UnderwritingTabProps) {
  const router = useRouter();
  const { uw, income, expenses, sourcesUses, scopeOfWork } = data;
  const [activeSection, setActiveSection] = useState(sectionId(UW_SECTIONS[0]));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [linkSheetOpen, setLinkSheetOpen] = useState(false);
  const [linkSheetInput, setLinkSheetInput] = useState("");
  const [linkSheetSaving, setLinkSheetSaving] = useState(false);
  const [unlinkSaving, setUnlinkSaving] = useState(false);

  const uwId = uw?.id ?? null;
  const purchasePrice = Number(uw?.purchase_price) || 0;
  const numUnits = Number(uw?.num_units) || 0;
  const exitCapRate = Number(uw?.exit_cap_rate) || 0;

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0.1 }
    );

    const ids = UW_SECTIONS.map(sectionId);
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

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
      if (result.error) {
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
      if (result.error) {
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setIsFullscreen((v) => !v);
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleRefreshSync();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uwContent = (
    <>
      {/* Section: Pro Forma */}
      <div id="pro-forma" className="scroll-mt-24 mt-4">
        <div className="rounded-xl border bg-card overflow-hidden">
          <ProFormaSection
            uw={uw ?? {}}
            income={income}
            expenses={expenses}
            debt={data.debt ?? []}
            sourcesUses={sourcesUses}
            scopeOfWork={scopeOfWork}
            purchasePrice={purchasePrice}
            numUnits={numUnits}
            holdYears={Number(uw?.hold_period_years) || 5}
            exitCapRate={exitCapRate}
          />
        </div>
      </div>

      {/* Section: Assumptions */}
      <div id="assumptions" className="scroll-mt-24 mt-6">
        <SectionHeader
          title="Assumptions"
          badge="Model inputs"
          action={
            <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              Synced
            </div>
          }
        />
        <div className="rounded-xl border bg-card overflow-hidden mt-3">
          <AssumptionsSection
            uw={uw ?? {}}
            debt={data.debt ?? []}
            purchasePrice={purchasePrice}
            numUnits={numUnits}
          />
        </div>
      </div>

      {/* Section: Sources & Uses */}
      <div id="sources--uses" className="scroll-mt-24 mt-6">
        <SectionHeader title="Sources & Uses" badge="Capital structure" />
        <div className="mt-3">
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
        </div>
      </div>

      {/* Keyboard shortcut hints */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground/60 px-1 mt-2 mb-8">
        <span><kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono">F</kbd> fullscreen</span>
        <span><kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono">R</kbd> refresh</span>
      </div>
    </>
  );

  return (
    <>
      <div className="flex flex-col gap-0">
        {/* Toolbar: jump nav + sync/fullscreen controls */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/40 -mx-1 px-1 py-2">
          <div className="flex items-center justify-between">
            <div className="inline-flex gap-1 items-center">
              {UW_SECTIONS.map((s) => {
                const id = sectionId(s);
                return (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[11px] font-medium cursor-pointer transition-colors",
                      activeSection === id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {s}
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
                {sheetUrl ? (
                  <>
                    <Link2 className="h-3 w-3" />
                    Change link
                  </>
                ) : (
                  <>
                    <Link2 className="h-3 w-3" />
                    Link Google Sheet
                  </>
                )}
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
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent
          className="max-w-[96vw] w-[96vw] h-[94vh] p-0 flex flex-col overflow-hidden rounded-xl md:rounded-xl md:max-w-[96vw]"
        >
          <DialogTitle className="sr-only">Financial Model</DialogTitle>
          <div className="shrink-0 border-b border-border/40 px-4 py-2.5 flex items-center justify-between">
            <div className="inline-flex gap-1 items-center">
              {UW_SECTIONS.map((s) => {
                const id = sectionId(s);
                return (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[11px] font-medium cursor-pointer transition-colors",
                      activeSection === id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {s}
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
                <button
                  onClick={handleRefreshSync}
                  className="ml-0.5 p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
                >
                  <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
                </button>
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
            {uwContent}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
