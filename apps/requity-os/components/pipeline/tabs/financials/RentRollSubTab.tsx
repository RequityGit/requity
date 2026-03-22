"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Upload,
  Trash2,
  ChevronDown,
  Loader2,
  Building2,
  Download,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { showSuccess, showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { upsertRentRoll } from "@/app/(authenticated)/(admin)/pipeline/[id]/commercial-uw-actions";
import { UploadRentRollDialog } from "@/components/admin/commercial-uw/upload-rent-roll-dialog";
import type { RentRollRow } from "@/lib/commercial-uw/types";
import { MetricBar, SectionCard, StatusDot, n, fmtCurrency } from "./shared";

interface RentRollSubTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rentRoll: any[];
  uwId: string | null;
}

export function RentRollSubTab({ rentRoll, uwId }: RentRollSubTabProps) {
  const [showAllUnits, setShowAllUnits] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const router = useRouter();

  const INITIAL_UNITS = 10;
  const visibleUnits = showAllUnits
    ? rentRoll
    : rentRoll.slice(0, INITIAL_UNITS);
  const hiddenCount = rentRoll.length - INITIAL_UNITS;

  const occupied = useMemo(
    () => rentRoll.filter((r: { status: string }) => r.status === "occupied"),
    [rentRoll]
  );
  const totalCurrentRent = useMemo(
    () => occupied.reduce((sum: number, r: { current_rent: number }) => sum + n(r.current_rent), 0),
    [occupied]
  );
  const totalMarketRent = useMemo(
    () => rentRoll.reduce((sum: number, r: { market_rent: number }) => sum + n(r.market_rent), 0),
    [rentRoll]
  );
  const lossToLease = totalMarketRent - totalCurrentRent;

  const handleImport = useCallback(
    async (rows: RentRollRow[]) => {
      if (!uwId) return;
      const result = await upsertRentRoll(
        uwId,
        rows.map((r, i) => ({
          unit_number: r.unit_number || `${i + 1}`,
          unit_type: r.beds_type || null,
          bedrooms: null,
          bathrooms: null,
          sq_ft: r.sf || null,
          current_rent: r.current_monthly_rent || 0,
          market_rent: r.market_rent || 0,
          status: r.is_vacant ? "vacant" : "occupied",
          lease_start: r.lease_start || null,
          lease_end: r.lease_end || null,
          tenant_name: r.tenant_name || null,
          sort_order: i,
        }))
      );
      if (result.error) {
        showError("Could not import rent roll", result.error);
      } else {
        showSuccess(`Imported ${rows.length} units from rent roll`);
        router.refresh();
      }
    },
    [uwId, router]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setEditOpen(true)}
          >
            <Plus className="h-3 w-3" />
            {rentRoll.length > 0 ? "Edit Units" : "Add Units"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="h-3 w-3" />
            Upload & Map
          </Button>
        </div>
        {rentRoll.length > 0 && (
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
            <Download className="h-3 w-3" />
            Export
          </Button>
        )}
      </div>

      {/* Rent Roll Table */}
      {rentRoll.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No rent roll data yet"
          description="Upload a spreadsheet or enter units manually."
          action={
            <div className="flex items-center gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Upload Rent Roll
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Manually
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <SectionCard
            title="Rent Roll"
            icon={Building2}
            noPad
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b">
                    {["Unit", "Unit Type", "Tenant", "Beds", "Baths", "SF", "Status", "Current Rent"].map(h => (
                      <th key={h} className={cn(
                        "px-3 py-2.5 rq-micro-label",
                        ["SF", "Current Rent"].includes(h) ? "text-right" : "text-left"
                      )}>{h}</th>
                    ))}
                    <th className="px-3 py-2.5 rq-micro-label text-right text-purple-400">
                      Market Rent
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {visibleUnits.map((unit: any, i: number) => (
                    <tr key={unit.id || i} className="border-b hover:bg-muted/30">
                      <td className="px-3 py-2.5 font-semibold">{unit.unit_number}</td>
                      <td className="px-3 py-2.5 text-muted-foreground text-xs">
                        {unit.unit_type || "\u2014"}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground truncate max-w-[140px]">
                        {unit.tenant_name || "\u2014"}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{unit.bedrooms ?? "\u2014"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{unit.bathrooms ?? "\u2014"}</td>
                      <td className="px-3 py-2.5 text-right num text-muted-foreground">
                        {unit.sq_ft ? Number(unit.sq_ft).toLocaleString() : "\u2014"}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusDot status={unit.status} />
                      </td>
                      <td className="px-3 py-2.5 text-right num font-medium">
                        {n(unit.current_rent) > 0 ? fmtCurrency(unit.current_rent) : "\u2014"}
                      </td>
                      <td className="px-3 py-2.5 text-right num font-medium text-purple-400">
                        {fmtCurrency(unit.market_rent)}
                      </td>
                    </tr>
                  ))}
                  {!showAllUnits && hiddenCount > 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-2">
                        <button
                          onClick={() => setShowAllUnits(true)}
                          className="text-[13px] font-medium cursor-pointer border-0 bg-transparent flex items-center gap-1 mx-auto text-primary"
                        >
                          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
                          Show {hiddenCount} more units
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Summary Metrics */}
          <MetricBar
            items={[
              { label: "Total Units", value: String(rentRoll.length) },
              {
                label: "Occupied",
                value: String(occupied.length),
                sub: `${((occupied.length / rentRoll.length) * 100).toFixed(0)}% occupancy`,
                accent: "text-green-500",
              },
              {
                label: "Vacant",
                value: String(rentRoll.length - occupied.length),
                accent: rentRoll.length - occupied.length > 0 ? "text-red-500" : undefined,
              },
              {
                label: "Monthly Rent",
                value: fmtCurrency(totalCurrentRent),
                sub: `${fmtCurrency(totalCurrentRent * 12)}/yr`,
              },
              {
                label: "Avg Rent/Unit",
                value: occupied.length > 0 ? fmtCurrency(Math.round(totalCurrentRent / occupied.length)) : "\u2014",
              },
              {
                label: "Loss-to-Lease",
                value: fmtCurrency(lossToLease),
                sub: totalMarketRent > 0 ? `${((lossToLease / totalMarketRent) * 100).toFixed(1)}%` : undefined,
                accent: "text-amber-500",
              },
            ]}
          />
        </>
      )}

      {/* Upload Dialog */}
      <UploadRentRollDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onImport={handleImport}
      />

      {/* Manual Edit Dialog */}
      <RentRollEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        rentRoll={rentRoll}
        uwId={uwId}
      />
    </div>
  );
}

function RentRollEditDialog({
  open,
  onOpenChange,
  rentRoll,
  uwId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rentRoll: any[];
  uwId: string | null;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows, setRows] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setRows(
        rentRoll.length > 0
          ? rentRoll.map((r, i) => ({ ...r, sort_order: i }))
          : [
              {
                unit_number: "1",
                unit_type: null,
                bedrooms: null,
                bathrooms: null,
                sq_ft: null,
                current_rent: null,
                market_rent: null,
                status: "occupied",
                lease_start: null,
                lease_end: null,
                tenant_name: null,
                sort_order: 0,
              },
            ]
      );
    }
    onOpenChange(isOpen);
  };

  const addUnit = () => {
    setRows((prev) => [
      ...prev,
      {
        unit_number: `${prev.length + 1}`,
        unit_type: null,
        bedrooms: null,
        bathrooms: null,
        sq_ft: null,
        current_rent: 0,
        market_rent: 0,
        status: "occupied",
        lease_start: null,
        lease_end: null,
        tenant_name: null,
        sort_order: prev.length,
      },
    ]);
  };

  const removeUnit = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, field: string, value: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );
  };

  const handleSubmit = async () => {
    if (!uwId) return;
    setSaving(true);
    try {
      const result = await upsertRentRoll(
        uwId,
        rows.map((r, i) => ({
          unit_number: r.unit_number || `${i + 1}`,
          unit_type: r.unit_type || null,
          bedrooms: r.bedrooms ? Number(r.bedrooms) : null,
          bathrooms: r.bathrooms ? Number(r.bathrooms) : null,
          sq_ft: r.sq_ft ? Number(r.sq_ft) : null,
          current_rent: Number(r.current_rent) || 0,
          market_rent: Number(r.market_rent) || 0,
          status: r.status || "occupied",
          lease_start: r.lease_start || null,
          lease_end: r.lease_end || null,
          tenant_name: r.tenant_name || null,
          sort_order: i,
        }))
      );
      if (result.error) {
        showError("Could not save rent roll", result.error);
      } else {
        showSuccess(`Rent roll saved (${rows.length} units)`);
        router.refresh();
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Rent Roll</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b">
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-[70px]">Unit</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground min-w-[160px]">Unit Type</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground min-w-[140px]">Tenant</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-[70px]">BD</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-[70px]">BA</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-[90px]">SF</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground min-w-[120px]">Current Rent</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground min-w-[120px]">Market Rent</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-[110px]">Status</th>
                <th className="px-2 py-1.5 w-[40px]" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="px-2 py-1">
                    <Input className="h-8" value={row.unit_number || ""} onChange={(e) => updateRow(i, "unit_number", e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <Input className="h-8" placeholder="e.g. 2BR/2BA - 900sf" value={row.unit_type || ""} onChange={(e) => updateRow(i, "unit_type", e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <Input className="h-8" value={row.tenant_name || ""} onChange={(e) => updateRow(i, "tenant_name", e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <Input className="h-8" type="number" value={row.bedrooms ?? ""} onChange={(e) => updateRow(i, "bedrooms", e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <Input className="h-8" type="number" step="0.5" value={row.bathrooms ?? ""} onChange={(e) => updateRow(i, "bathrooms", e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <Input className="h-8" type="number" value={row.sq_ft ?? ""} onChange={(e) => updateRow(i, "sq_ft", e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <Input className="h-8" type="number" placeholder="$0" value={row.current_rent || ""} onChange={(e) => updateRow(i, "current_rent", e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <Input className="h-8" type="number" placeholder="$0" value={row.market_rent || ""} onChange={(e) => updateRow(i, "market_rent", e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <select
                      className="h-8 rounded border px-2 text-[13px] bg-background"
                      value={row.status || "occupied"}
                      onChange={(e) => updateRow(i, "status", e.target.value)}
                    >
                      <option value="occupied">Occupied</option>
                      <option value="vacant">Vacant</option>
                      <option value="down">Down</option>
                      <option value="model">Model</option>
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeUnit(i)}>
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button variant="outline" size="sm" className="w-fit gap-1" onClick={addUnit}>
          <Plus className="h-3 w-3" />
          Add Unit
        </Button>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Rent Roll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
