"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, Calendar, LayoutGrid, List, Plus, Search, SlidersHorizontal, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateAddedFilter } from "@/components/ui/date-added-filter";
import { ACTIVE_ASSET_CLASS_OPTIONS, type CapitalSide } from "./pipeline-types";
import { getAllDealConfigs, type DealFlavor } from "@/lib/pipeline/deal-display-config";

export type ClosingDateFilter = "all" | "overdue" | "this_week" | "next_2_weeks" | "this_month" | "no_date";

export interface FilterState {
  search: string;
  capitalSide: CapitalSide | "all";
  dealFlavor: DealFlavor | "all";
  assetClass: string;
  dateAdded: string;
  closingDate: ClosingDateFilter;
  view: "kanban" | "table";
}

interface DealFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onNewDeal: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  showingLostDeals?: boolean;
  onToggleLostDeals?: () => void;
  lifecycleView?: boolean;
  onToggleLifecycle?: () => void;
}

export function DealFilters({
  filters,
  onChange,
  onNewDeal,
  searchInputRef,
  showingLostDeals,
  onToggleLostDeals,
  lifecycleView,
  onToggleLifecycle,
}: DealFiltersProps) {
  function update(partial: Partial<FilterState>) {
    onChange({ ...filters, ...partial });
  }

  const dealConfigs = getAllDealConfigs();

  const activeFilterCount = [
    lifecycleView === true,
    filters.capitalSide !== "all",
    filters.dealFlavor !== "all",
    filters.assetClass !== "all",
    filters.dateAdded !== "all",
    filters.closingDate !== "all",
    showingLostDeals === true,
  ].filter(Boolean).length;

  function clearFilters() {
    update({
      capitalSide: "all",
      dealFlavor: "all",
      assetClass: "all",
      dateAdded: "all",
      closingDate: "all",
    });
    if (showingLostDeals && onToggleLostDeals) {
      onToggleLostDeals();
    }
    if (lifecycleView && onToggleLifecycle) {
      onToggleLifecycle();
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef as React.Ref<HTMLInputElement>}
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search deals..."
            className="pl-9 h-10"
          />
        </div>

        {/* Filter popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-10 md:h-9 gap-1.5",
                activeFilterCount > 0 &&
                  "border-primary/50 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="default" className="ml-0.5 h-5 min-w-[20px] px-1.5 text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start" sideOffset={8}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-medium">Filters</span>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-muted-foreground hover:text-foreground rq-transition"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="p-4 space-y-4">
              {/* Lifecycle */}
              {onToggleLifecycle && !showingLostDeals && (
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Lifecycle</span>
                  <div className="flex rounded-md border">
                    <button
                      onClick={() => lifecycleView && onToggleLifecycle()}
                      className={cn(
                        "flex-1 px-3 py-1.5 text-xs font-medium rq-transition",
                        !lifecycleView
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Origination
                    </button>
                    <button
                      onClick={() => !lifecycleView && onToggleLifecycle()}
                      className={cn(
                        "flex-1 px-3 py-1.5 text-xs font-medium rq-transition flex items-center justify-center gap-1",
                        lifecycleView
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <ArrowLeftRight className="h-3 w-3" />
                      Full Lifecycle
                    </button>
                  </div>
                </div>
              )}

              {/* Capital side */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Capital Side</span>
                <div className="flex rounded-md border">
                  {(["all", "debt", "equity"] as const).map((side) => (
                    <button
                      key={side}
                      onClick={() => update({ capitalSide: side })}
                      className={cn(
                        "flex-1 px-3 py-1.5 text-xs font-medium capitalize rq-transition",
                        filters.capitalSide === side
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {side === "all" ? "All" : side}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deal type */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Deal Type</span>
                <Select
                  value={filters.dealFlavor}
                  onValueChange={(val) => update({ dealFlavor: val as DealFlavor | "all" })}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {dealConfigs.map((dc) => (
                      <SelectItem key={dc.flavor} value={dc.flavor}>
                        {dc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Asset class */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Asset Class</span>
                <Select
                  value={filters.assetClass}
                  onValueChange={(val) => update({ assetClass: val })}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="All asset classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All asset classes</SelectItem>
                    {ACTIVE_ASSET_CLASS_OPTIONS.map(({ key, label }) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date added */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Date Added</span>
                <DateAddedFilter
                  value={filters.dateAdded}
                  onChange={(val) => update({ dateAdded: val })}
                  className="w-full h-9"
                />
              </div>

              {/* Closing date */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Closing Date</span>
                <Select
                  value={filters.closingDate}
                  onValueChange={(val) => update({ closingDate: val as ClosingDateFilter })}
                >
                  <SelectTrigger className="w-full h-9">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue placeholder="Closing date" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All closing dates</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="this_week">This week</SelectItem>
                    <SelectItem value="next_2_weeks">Next 2 weeks</SelectItem>
                    <SelectItem value="this_month">This month</SelectItem>
                    <SelectItem value="no_date">No date set</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status (Active / Closed Lost) */}
              {onToggleLostDeals && (
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Status</span>
                  <div className="flex rounded-md border">
                    <button
                      onClick={() => showingLostDeals && onToggleLostDeals()}
                      className={cn(
                        "flex-1 px-3 py-1.5 text-xs font-medium rq-transition",
                        !showingLostDeals
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => !showingLostDeals && onToggleLostDeals()}
                      className={cn(
                        "flex-1 px-3 py-1.5 text-xs font-medium rq-transition flex items-center justify-center gap-1",
                        showingLostDeals
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <XCircle className="h-3 w-3" />
                      Closed Lost
                    </button>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        {/* View toggle (hidden on mobile -- table view is forced) */}
        <div className="hidden md:flex rounded-md border">
          <button
            onClick={() => update({ view: "kanban" })}
            className={cn(
              "p-1.5 transition-colors",
              filters.view === "kanban"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Kanban view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => update({ view: "table" })}
            className={cn(
              "p-1.5 transition-colors",
              filters.view === "table"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Table view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        <Button onClick={onNewDeal} size="sm">
          <Plus className="h-4 w-4 md:mr-1" />
          <span className="hidden md:inline">New Deal</span>
        </Button>
      </div>
    </div>
  );
}
