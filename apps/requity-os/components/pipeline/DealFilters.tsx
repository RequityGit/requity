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
import { LayoutGrid, List, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateAddedFilter } from "@/components/ui/date-added-filter";
import { ACTIVE_ASSET_CLASS_OPTIONS, type CapitalSide } from "./pipeline-types";
import { getAllDealConfigs, type DealFlavor } from "@/lib/pipeline/deal-display-config";

export interface FilterState {
  search: string;
  capitalSide: CapitalSide | "all";
  dealFlavor: DealFlavor | "all";
  assetClass: string;
  dateAdded: string;
  view: "kanban" | "table";
}

interface DealFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onNewDeal: () => void;
}

export function DealFilters({
  filters,
  onChange,
  onNewDeal,
}: DealFiltersProps) {
  function update(partial: Partial<FilterState>) {
    onChange({ ...filters, ...partial });
  }

  const dealConfigs = getAllDealConfigs();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search deals..."
            className="pl-9 h-10"
          />
        </div>

        {/* Capital side toggle */}
        <div className="flex rounded-md border">
          {(["all", "debt", "equity"] as const).map((side) => (
            <button
              key={side}
              onClick={() => update({ capitalSide: side })}
              className={cn(
                "px-3 py-2 md:py-1.5 text-xs font-medium capitalize transition-colors min-h-[36px]",
                filters.capitalSide === side
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {side === "all" ? "All" : side}
            </button>
          ))}
        </div>

        {/* Deal type (flavor) filter */}
        <Select
          value={filters.dealFlavor}
          onValueChange={(val) => update({ dealFlavor: val as DealFlavor | "all" })}
        >
          <SelectTrigger className="w-full sm:w-40 h-10 md:h-9">
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

        {/* Asset class filter */}
        <Select
          value={filters.assetClass}
          onValueChange={(val) => update({ assetClass: val })}
        >
          <SelectTrigger className="w-full sm:w-40 h-10 md:h-9">
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

        {/* Date added filter */}
        <DateAddedFilter
          value={filters.dateAdded}
          onChange={(val) => update({ dateAdded: val })}
        />
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
          <Plus className="h-4 w-4 mr-1" />
          New Deal
        </Button>
      </div>
    </div>
  );
}
