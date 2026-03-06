"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Building2, Upload } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type {
  CommercialPropertyType,
  RentRollRow,
  OccupancyRow,
  AncillaryRow,
  LeaseType,
} from "@/lib/commercial-uw/types";
import {
  COMMERCIAL_PROPERTY_TYPES,
  LEASE_TYPES,
  ANCILLARY_PRESETS,
  isLeaseBased,
  isOccupancyBased,
} from "@/lib/commercial-uw/types";
import { UploadRentRollDialog } from "./upload-rent-roll-dialog";
import type { RentRollImportMetadata } from "./upload-rent-roll-dialog";
import { RentRollVersionHistory } from "./rent-roll-version-history";
import type { UploadVersion } from "./rent-roll-version-history";

interface Props {
  propertyType: CommercialPropertyType;
  setPropertyType: (v: CommercialPropertyType) => void;
  totalUnits: number;
  setTotalUnits: (v: number) => void;
  totalSf: number;
  setTotalSf: (v: number) => void;
  yearBuilt: number;
  setYearBuilt: (v: number) => void;
  operatingDays: number;
  setOperatingDays: (v: number) => void;
  rentRoll: RentRollRow[];
  setRentRoll: (v: RentRollRow[]) => void;
  occupancyRows: OccupancyRow[];
  setOccupancyRows: (v: OccupancyRow[]) => void;
  ancillaryRows: AncillaryRow[];
  setAncillaryRows: (v: AncillaryRow[]) => void;
  gpi: { current: number; stabilized: number };
  onRentRollImport: (rows: RentRollRow[], metadata: RentRollImportMetadata) => void;
  rentRollVersions: UploadVersion[];
  onRestoreVersion: (rows: RentRollRow[]) => void;
}

function emptyRentRow(sortOrder: number): RentRollRow {
  return {
    sort_order: sortOrder,
    unit_number: "",
    tenant_name: "",
    sf: 0,
    beds_type: "",
    baths: 0,
    lease_start: "",
    lease_end: "",
    lease_type: "Gross",
    current_monthly_rent: 0,
    cam_nnn: 0,
    other_income: 0,
    poh_income: 0,
    is_vacant: false,
    market_rent: 0,
    market_cam_nnn: 0,
    market_other: 0,
  };
}

function emptyOccRow(sortOrder: number): OccupancyRow {
  return {
    sort_order: sortOrder,
    space_type: "",
    count: 0,
    rate_per_night: 0,
    occupancy_pct: 0,
    operating_days: null,
    target_rate: 0,
    target_occupancy_pct: 0,
    occupancy_pct_yr1: null,
    occupancy_pct_yr2: null,
    occupancy_pct_yr3: null,
    occupancy_pct_yr4: null,
    occupancy_pct_yr5: null,
  };
}

function emptyAncRow(sortOrder: number, source: string = ""): AncillaryRow {
  return {
    sort_order: sortOrder,
    income_source: source,
    current_annual_amount: 0,
    stabilized_annual_amount: 0,
  };
}

export function IncomeTab({
  propertyType,
  setPropertyType,
  totalUnits,
  setTotalUnits,
  totalSf,
  setTotalSf,
  yearBuilt,
  setYearBuilt,
  operatingDays,
  setOperatingDays,
  rentRoll,
  setRentRoll,
  occupancyRows,
  setOccupancyRows,
  ancillaryRows,
  setAncillaryRows,
  gpi,
  onRentRollImport,
  rentRollVersions,
  onRestoreVersion,
}: Props) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const updateRentRow = useCallback(
    (idx: number, field: keyof RentRollRow, value: unknown) => {
      const rows = [...rentRoll];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (rows[idx] as any)[field] = value;
      setRentRoll(rows);
    },
    [rentRoll, setRentRoll]
  );

  const updateOccRow = useCallback(
    (idx: number, field: keyof OccupancyRow, value: unknown) => {
      const rows = [...occupancyRows];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (rows[idx] as any)[field] = value;
      setOccupancyRows(rows);
    },
    [occupancyRows, setOccupancyRows]
  );

  const updateAncRow = useCallback(
    (idx: number, field: keyof AncillaryRow, value: unknown) => {
      const rows = [...ancillaryRows];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (rows[idx] as any)[field] = value;
      setAncillaryRows(rows);
    },
    [ancillaryRows, setAncillaryRows]
  );

  const upsidePercent =
    gpi.current > 0
      ? (((gpi.stabilized - gpi.current) / gpi.current) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-4">
      {/* Property Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Property Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <Label className="text-xs">Property Type</Label>
              <Select
                value={propertyType}
                onValueChange={(v) => setPropertyType(v as CommercialPropertyType)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMERCIAL_PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Total Units / Spaces</Label>
              <Input
                type="number"
                value={totalUnits || ""}
                onChange={(e) => setTotalUnits(Number(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Total SF</Label>
              <Input
                type="number"
                value={totalSf || ""}
                onChange={(e) => setTotalSf(Number(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Year Built</Label>
              <Input
                type="number"
                value={yearBuilt || ""}
                onChange={(e) => setYearBuilt(Number(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Operating Days/Year</Label>
              <Input
                type="number"
                value={operatingDays || ""}
                onChange={(e) => setOperatingDays(Number(e.target.value) || 365)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rent Roll — Lease-Based */}
      {isLeaseBased(propertyType) && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Rent Roll</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setUploadOpen(true)}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Upload Rent Roll
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setRentRoll([...rentRoll, emptyRentRow(rentRoll.length)])
                  }
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Unit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1.5 font-medium">Unit #</th>
                    <th className="text-left p-1.5 font-medium">Tenant</th>
                    <th className="text-right p-1.5 font-medium">SF</th>
                    <th className="text-left p-1.5 font-medium">Type</th>
                    <th className="text-left p-1.5 font-medium">Lease Type</th>
                    <th className="text-right p-1.5 font-medium">Current Rent</th>
                    <th className="text-right p-1.5 font-medium">CAM/NNN</th>
                    <th className="text-right p-1.5 font-medium">Other</th>
                    <th className="text-center p-1.5 font-medium">Vacant</th>
                    <th className="text-right p-1.5 font-medium text-purple-700">Mkt Rent</th>
                    <th className="text-right p-1.5 font-medium text-purple-700">Mkt CAM</th>
                    <th className="text-right p-1.5 font-medium text-purple-700">Mkt Other</th>
                    <th className="p-1.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {rentRoll.map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted">
                      <td className="p-1">
                        <Input
                          value={row.unit_number}
                          onChange={(e) => updateRentRow(idx, "unit_number", e.target.value)}
                          className="h-7 text-xs w-16"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          value={row.tenant_name}
                          onChange={(e) => updateRentRow(idx, "tenant_name", e.target.value)}
                          className="h-7 text-xs w-24"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={row.sf || ""}
                          onChange={(e) => updateRentRow(idx, "sf", Number(e.target.value) || 0)}
                          className="h-7 text-xs w-16 text-right"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          value={row.beds_type}
                          onChange={(e) => updateRentRow(idx, "beds_type", e.target.value)}
                          className="h-7 text-xs w-16"
                        />
                      </td>
                      <td className="p-1">
                        <select
                          value={row.lease_type}
                          onChange={(e) => updateRentRow(idx, "lease_type", e.target.value as LeaseType)}
                          className="h-7 text-xs border rounded px-1 w-20"
                        >
                          {LEASE_TYPES.map((lt) => (
                            <option key={lt} value={lt}>{lt}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={row.current_monthly_rent || ""}
                          onChange={(e) => updateRentRow(idx, "current_monthly_rent", Number(e.target.value) || 0)}
                          className="h-7 text-xs w-20 text-right"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={row.cam_nnn || ""}
                          onChange={(e) => updateRentRow(idx, "cam_nnn", Number(e.target.value) || 0)}
                          className="h-7 text-xs w-16 text-right"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={row.other_income || ""}
                          onChange={(e) => updateRentRow(idx, "other_income", Number(e.target.value) || 0)}
                          className="h-7 text-xs w-16 text-right"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <input
                          type="checkbox"
                          checked={row.is_vacant}
                          onChange={(e) => updateRentRow(idx, "is_vacant", e.target.checked)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={row.market_rent || ""}
                          onChange={(e) => updateRentRow(idx, "market_rent", Number(e.target.value) || 0)}
                          className="h-7 text-xs w-20 text-right bg-purple-50 border-purple-200"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={row.market_cam_nnn || ""}
                          onChange={(e) => updateRentRow(idx, "market_cam_nnn", Number(e.target.value) || 0)}
                          className="h-7 text-xs w-16 text-right bg-purple-50 border-purple-200"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={row.market_other || ""}
                          onChange={(e) => updateRentRow(idx, "market_other", Number(e.target.value) || 0)}
                          className="h-7 text-xs w-16 text-right bg-purple-50 border-purple-200"
                        />
                      </td>
                      <td className="p-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setRentRoll(rentRoll.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {rentRoll.length === 0 && (
                    <tr>
                      <td colSpan={13} className="text-center py-6 text-muted-foreground">
                        No units added. Click &quot;Add Unit&quot; to start.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rent Roll Version History */}
      {isLeaseBased(propertyType) && rentRollVersions.length > 0 && (
        <RentRollVersionHistory
          versions={rentRollVersions}
          onRestore={onRestoreVersion}
        />
      )}

      {/* Upload Rent Roll Dialog */}
      <UploadRentRollDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onImport={onRentRollImport}
      />

      {/* Occupancy-Based Income */}
      {isOccupancyBased(propertyType) && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Occupancy-Based Income</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setOccupancyRows([
                    ...occupancyRows,
                    emptyOccRow(occupancyRows.length),
                  ])
                }
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Space Type
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1.5 font-medium">Space Type</th>
                    <th className="text-right p-1.5 font-medium">Count</th>
                    <th className="text-right p-1.5 font-medium">Rate/Night</th>
                    <th className="text-right p-1.5 font-medium">Occ %</th>
                    <th className="text-right p-1.5 font-medium">Op Days</th>
                    <th className="text-right p-1.5 font-medium text-purple-700">Target Rate</th>
                    <th className="text-right p-1.5 font-medium text-purple-700">Target Occ %</th>
                    <th className="p-1.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {occupancyRows.map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted">
                      <td className="p-1">
                        <Input
                          value={row.space_type}
                          onChange={(e) => updateOccRow(idx, "space_type", e.target.value)}
                          className="h-7 text-xs w-32"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={row.count || ""}
                          onChange={(e) => updateOccRow(idx, "count", Number(e.target.value) || 0)}
                          className="h-7 text-xs w-16 text-right"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={row.rate_per_night || ""}
                          onChange={(e) => updateOccRow(idx, "rate_per_night", Number(e.target.value) || 0)}
                          className="h-7 text-xs w-20 text-right"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={row.occupancy_pct || ""}
                          onChange={(e) => updateOccRow(idx, "occupancy_pct", Number(e.target.value) || 0)}
                          className="h-7 text-xs w-16 text-right"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={row.operating_days ?? ""}
                          onChange={(e) => updateOccRow(idx, "operating_days", e.target.value ? Number(e.target.value) : null)}
                          placeholder="inherit"
                          className="h-7 text-xs w-16 text-right"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={row.target_rate || ""}
                          onChange={(e) => updateOccRow(idx, "target_rate", Number(e.target.value) || 0)}
                          className="h-7 text-xs w-20 text-right bg-purple-50 border-purple-200"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={row.target_occupancy_pct || ""}
                          onChange={(e) => updateOccRow(idx, "target_occupancy_pct", Number(e.target.value) || 0)}
                          className="h-7 text-xs w-16 text-right bg-purple-50 border-purple-200"
                        />
                      </td>
                      <td className="p-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setOccupancyRows(occupancyRows.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {occupancyRows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-muted-foreground">
                        No space types added.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ancillary Income */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Ancillary Income</CardTitle>
            <div className="flex gap-2">
              <Select
                onValueChange={(v) =>
                  setAncillaryRows([
                    ...ancillaryRows,
                    emptyAncRow(ancillaryRows.length, v),
                  ])
                }
              >
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue placeholder="Add preset..." />
                </SelectTrigger>
                <SelectContent>
                  {ANCILLARY_PRESETS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setAncillaryRows([
                    ...ancillaryRows,
                    emptyAncRow(ancillaryRows.length),
                  ])
                }
              >
                <Plus className="h-3 w-3 mr-1" />
                Custom
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-1.5 font-medium">Source</th>
                  <th className="text-right p-1.5 font-medium">Current Annual</th>
                  <th className="text-right p-1.5 font-medium text-purple-700">Stabilized Annual</th>
                  <th className="p-1.5"></th>
                </tr>
              </thead>
              <tbody>
                {ancillaryRows.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted">
                    <td className="p-1">
                      <Input
                        value={row.income_source}
                        onChange={(e) => updateAncRow(idx, "income_source", e.target.value)}
                        className="h-7 text-xs w-40"
                      />
                    </td>
                    <td className="p-1">
                      <Input
                        type="number"
                        value={row.current_annual_amount || ""}
                        onChange={(e) => updateAncRow(idx, "current_annual_amount", Number(e.target.value) || 0)}
                        className="h-7 text-xs w-28 text-right"
                      />
                    </td>
                    <td className="p-1">
                      <Input
                        type="number"
                        value={row.stabilized_annual_amount || ""}
                        onChange={(e) => updateAncRow(idx, "stabilized_annual_amount", Number(e.target.value) || 0)}
                        className="h-7 text-xs w-28 text-right bg-purple-50 border-purple-200"
                      />
                    </td>
                    <td className="p-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setAncillaryRows(ancillaryRows.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {ancillaryRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-muted-foreground">
                      No ancillary income sources.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* GPI Summary Bar */}
      <div className="sticky bottom-0 z-10 bg-card border rounded-lg p-3 shadow-sm">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Current GPI</p>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(gpi.current)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Stabilized GPI</p>
            <p className="text-lg font-bold text-purple-700">
              {formatCurrency(gpi.stabilized)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Upside</p>
            <p className="text-lg font-bold text-green-600">{upsidePercent}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
