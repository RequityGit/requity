"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { updateMarketRentByUnitType } from "@/app/(authenticated)/(admin)/pipeline/[id]/commercial-uw-actions";
import { SectionCard, n, fmtCurrency } from "./shared";
import { EmptyState } from "@/components/shared/EmptyState";
import { Building2 } from "lucide-react";

// ── Types ──

export interface RentRollUnit {
  id?: string;
  unit_number: string;
  unit_type?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  sq_ft?: number | null;
  current_rent: number;
  market_rent: number;
  status: string;
  tenant_name?: string | null;
}

export interface UnitMixGroup {
  unitType: string;
  units: RentRollUnit[];
  unitCount: number;
  occupiedCount: number;
  vacantCount: number;
  occupancyPct: number;
  avgSqFt: number;
  avgEffectiveRent: number;
  marketRent: number;
  annualAtCurrent: number;
  annualAtMarket: number;
}

// ── Grouping Logic ──

function deriveUnitType(unit: RentRollUnit): string {
  // If unit_type is explicitly set, use it
  if (unit.unit_type && unit.unit_type.trim()) {
    return unit.unit_type.trim();
  }
  // Fallback: build from bedrooms/bathrooms/sqft
  const beds = unit.bedrooms != null ? unit.bedrooms : null;
  const baths = unit.bathrooms != null ? unit.bathrooms : null;
  if (beds != null && baths != null) {
    return `${beds}BR / ${baths}BA`;
  }
  if (beds != null) {
    return `${beds}BR`;
  }
  return "Unclassified";
}

function buildUnitMixGroups(rentRoll: RentRollUnit[]): UnitMixGroup[] {
  const groupMap = new Map<string, RentRollUnit[]>();

  for (const unit of rentRoll) {
    const key = deriveUnitType(unit);
    const existing = groupMap.get(key) || [];
    existing.push(unit);
    groupMap.set(key, existing);
  }

  const groups: UnitMixGroup[] = [];
  for (const [unitType, units] of Array.from(groupMap.entries())) {
    const occupied = units.filter((u) => u.status === "occupied");
    const occupiedCount = occupied.length;
    const unitCount = units.length;
    const vacantCount = unitCount - occupiedCount;
    const occupancyPct = unitCount > 0 ? (occupiedCount / unitCount) * 100 : 0;

    // Average SF across all units in group
    const unitsWithSf = units.filter((u) => n(u.sq_ft) > 0);
    const avgSqFt =
      unitsWithSf.length > 0
        ? Math.round(
            unitsWithSf.reduce((sum, u) => sum + n(u.sq_ft), 0) /
              unitsWithSf.length
          )
        : 0;

    // Average effective rent = avg current_rent of occupied units
    const avgEffectiveRent =
      occupiedCount > 0
        ? Math.round(
            occupied.reduce((sum, u) => sum + n(u.current_rent), 0) /
              occupiedCount
          )
        : 0;

    // Market rent = avg of market_rent across all units in this group
    const unitsWithMarket = units.filter((u) => n(u.market_rent) > 0);
    const marketRent =
      unitsWithMarket.length > 0
        ? Math.round(
            unitsWithMarket.reduce((sum, u) => sum + n(u.market_rent), 0) /
              unitsWithMarket.length
          )
        : 0;

    // Annual revenue at current = sum of occupied current_rent x 12
    const annualAtCurrent =
      occupied.reduce((sum, u) => sum + n(u.current_rent), 0) * 12;

    // Annual revenue at market = unitCount x marketRent x 12
    const annualAtMarket = unitCount * marketRent * 12;

    groups.push({
      unitType,
      units,
      unitCount,
      occupiedCount,
      vacantCount,
      occupancyPct,
      avgSqFt,
      avgEffectiveRent,
      marketRent,
      annualAtCurrent,
      annualAtMarket,
    });
  }

  // Sort by unit count descending
  groups.sort((a, b) => b.unitCount - a.unitCount);
  return groups;
}

// ── Component ──

interface UnitMixSectionProps {
  rentRoll: RentRollUnit[];
  uwId: string | null;
}

export function UnitMixSection({ rentRoll, uwId }: UnitMixSectionProps) {
  const router = useRouter();
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const groups = useMemo(() => buildUnitMixGroups(rentRoll), [rentRoll]);

  // Totals
  const totals = useMemo(() => {
    const totalUnits = groups.reduce((s, g) => s + g.unitCount, 0);
    const totalOccupied = groups.reduce((s, g) => s + g.occupiedCount, 0);
    const totalAnnualCurrent = groups.reduce(
      (s, g) => s + g.annualAtCurrent,
      0
    );
    const totalAnnualMarket = groups.reduce(
      (s, g) => s + g.annualAtMarket,
      0
    );
    const occupancyPct =
      totalUnits > 0 ? (totalOccupied / totalUnits) * 100 : 0;
    // Weighted average market rent
    const avgMarketRent =
      totalUnits > 0
        ? Math.round(totalAnnualMarket / 12 / totalUnits)
        : 0;
    // Weighted average effective rent
    const avgEffectiveRent =
      totalOccupied > 0
        ? Math.round(totalAnnualCurrent / 12 / totalOccupied)
        : 0;
    return {
      totalUnits,
      totalOccupied,
      totalVacant: totalUnits - totalOccupied,
      occupancyPct,
      avgMarketRent,
      avgEffectiveRent,
      totalAnnualCurrent,
      totalAnnualMarket,
    };
  }, [groups]);

  const handleMarketRentEdit = useCallback(
    (unitType: string, currentValue: number) => {
      setEditingType(unitType);
      setEditValue(String(currentValue));
    },
    []
  );

  const handleMarketRentSave = useCallback(
    async (unitType: string) => {
      if (!uwId) return;
      const newRent = Math.round(Number(editValue) || 0);
      setSaving(true);
      try {
        const result = await updateMarketRentByUnitType(
          uwId,
          unitType,
          newRent
        );
        if (result.error) {
          toast.error(`Failed to update market rent: ${result.error}`);
        } else {
          toast.success(`Market rent updated for ${unitType}`);
          router.refresh();
        }
      } finally {
        setSaving(false);
        setEditingType(null);
      }
    },
    [uwId, editValue, router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, unitType: string) => {
      if (e.key === "Enter") {
        handleMarketRentSave(unitType);
      } else if (e.key === "Escape") {
        setEditingType(null);
      }
    },
    [handleMarketRentSave]
  );

  if (rentRoll.length === 0) {
    return (
      <SectionCard title="Unit Mix" icon={LayoutGrid}>
        <EmptyState
          icon={Building2}
          title="No unit mix data"
          description="Upload or enter a rent roll on the Rent Roll tab to see the unit mix summary."
          compact
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Unit Mix"
      icon={LayoutGrid}
      noPad
      actions={
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      }
    >
      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-2.5 rq-micro-label">
                  Unit Type
                </th>
                <th className="text-right px-4 py-2.5 rq-micro-label">
                  # Units
                </th>
                <th className="text-right px-4 py-2.5 rq-micro-label">
                  Occupied
                </th>
                <th className="text-right px-4 py-2.5 rq-micro-label">
                  Occupancy
                </th>
                <th className="text-right px-4 py-2.5 rq-micro-label">
                  Avg SF
                </th>
                <th className="text-right px-4 py-2.5 rq-micro-label">
                  Avg Eff. Rent
                </th>
                <th className="text-right px-4 py-2.5 rq-micro-label">
                  Annual (Current)
                </th>
                <th className="text-right px-4 py-2.5 rq-micro-label text-purple-400">
                  Market Rent
                </th>
                <th className="text-right px-4 py-2.5 rq-micro-label text-purple-400">
                  Annual (Market)
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr
                  key={group.unitType}
                  className="border-b hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-2.5 font-semibold">
                    {group.unitType}
                  </td>
                  <td className="px-4 py-2.5 text-right num">
                    {group.unitCount}
                  </td>
                  <td className="px-4 py-2.5 text-right num">
                    {group.occupiedCount}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className={cn(
                        "num",
                        group.occupancyPct >= 95
                          ? "rq-value-positive"
                          : group.occupancyPct >= 85
                            ? "text-foreground"
                            : "rq-value-warn"
                      )}
                    >
                      {group.occupancyPct.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right num text-muted-foreground">
                    {group.avgSqFt > 0
                      ? group.avgSqFt.toLocaleString()
                      : "\u2014"}
                  </td>
                  <td className="px-4 py-2.5 text-right num font-medium">
                    {group.avgEffectiveRent > 0
                      ? fmtCurrency(group.avgEffectiveRent)
                      : "\u2014"}
                  </td>
                  <td className="px-4 py-2.5 text-right num">
                    {fmtCurrency(group.annualAtCurrent)}
                  </td>
                  {/* Editable market rent */}
                  <td className="px-4 py-2 text-right">
                    {editingType === group.unitType ? (
                      <Input
                        type="number"
                        className="h-7 w-24 text-right text-[13px] ml-auto"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleMarketRentSave(group.unitType)}
                        onKeyDown={(e) => handleKeyDown(e, group.unitType)}
                        autoFocus
                        disabled={saving}
                      />
                    ) : (
                      <button
                        onClick={() =>
                          handleMarketRentEdit(
                            group.unitType,
                            group.marketRent
                          )
                        }
                        className={cn(
                          "num font-medium text-purple-400 cursor-pointer",
                          "inline-flex items-center justify-end rounded-md px-2 py-0.5 -mr-2",
                          "border border-transparent hover:border-border hover:bg-muted/40 transition-colors"
                        )}
                      >
                        {group.marketRent > 0
                          ? fmtCurrency(group.marketRent)
                          : "$0"}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right num font-medium text-purple-400">
                    {fmtCurrency(group.annualAtMarket)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Total row */}
            <tfoot>
              <tr className="rq-total-row">
                <td className="px-4 py-3 font-bold">
                  Total / Weighted Average
                </td>
                <td className="px-4 py-3 text-right num font-bold">
                  {totals.totalUnits}
                </td>
                <td className="px-4 py-3 text-right num font-bold">
                  {totals.totalOccupied}
                </td>
                <td className="px-4 py-3 text-right num font-bold">
                  {totals.occupancyPct.toFixed(0)}%
                </td>
                <td className="px-4 py-3 text-right num text-muted-foreground">
                  {"\u2014"}
                </td>
                <td className="px-4 py-3 text-right num font-bold">
                  {totals.avgEffectiveRent > 0
                    ? fmtCurrency(totals.avgEffectiveRent)
                    : "\u2014"}
                </td>
                <td className="px-4 py-3 text-right num font-bold">
                  {fmtCurrency(totals.totalAnnualCurrent)}
                </td>
                <td className="px-4 py-3 text-right num font-bold text-purple-400">
                  {fmtCurrency(totals.avgMarketRent)}
                </td>
                <td className="px-4 py-3 text-right num font-bold text-purple-400">
                  {fmtCurrency(totals.totalAnnualMarket)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
