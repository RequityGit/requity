"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Trash2,
  Hotel,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { showSuccess, showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  upsertIncomeBySectionRows,
  updateIncomeNotes,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/commercial-uw-actions";
import {
  getUnitLabel,
  getOccupancyPresets,
  type OccupancySpacePreset,
} from "@/lib/commercial-uw/asset-type-config";
import { SectionCard, MetricBar, n, fmtCurrency } from "./shared";

// ── Types ──

interface OccupancyMeta {
  site_count: number;
  nightly_rate: number;
  occupancy_pct: number;
  operating_days: number;
}

interface OccupancyRow {
  id?: string;
  line_item: string;
  t12_amount: number;
  year_1_amount: number;
  growth_rate: number;
  is_deduction: boolean;
  sort_order: number;
  section?: string;
  meta?: OccupancyMeta | null;
  notes?: string | null;
}

interface OccupancyIncomeSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[];
  uwId: string | null;
  propertyType: string;
  numUnits: number;
}

// ── Helpers ──

function calcAnnualRevenue(meta: OccupancyMeta): number {
  return Math.round(
    meta.site_count * meta.nightly_rate * (meta.occupancy_pct / 100) * meta.operating_days
  );
}

function calcRevPAR(meta: OccupancyMeta): number {
  if (meta.operating_days <= 0) return 0;
  return meta.nightly_rate * (meta.occupancy_pct / 100);
}

// ── Main Component ──

export function OccupancyIncomeSection({
  rows,
  uwId,
  propertyType,
  numUnits,
}: OccupancyIncomeSectionProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  const unitLabel = useMemo(() => getUnitLabel(propertyType), [propertyType]);
  const presets = useMemo(() => getOccupancyPresets(propertyType), [propertyType]);

  // Parse occupancy rows from the income data
  const occRows: OccupancyRow[] = useMemo(
    () =>
      rows
        .filter((r) => r.section === "occupancy")
        .map((r) => ({
          ...r,
          t12_amount: n(r.t12_amount),
          year_1_amount: n(r.year_1_amount),
          growth_rate: n(r.growth_rate),
          meta: r.meta as OccupancyMeta | null,
        })),
    [rows]
  );

  // Rollup KPIs
  const kpis = useMemo(() => {
    let totalSites = 0;
    let totalRevenue = 0;
    let weightedRate = 0;
    let weightedOcc = 0;

    for (const row of occRows) {
      if (!row.meta) continue;
      const m = row.meta;
      totalSites += m.site_count;
      const rev = calcAnnualRevenue(m);
      totalRevenue += rev;
      weightedRate += m.nightly_rate * m.site_count;
      weightedOcc += m.occupancy_pct * m.site_count;
    }

    const avgRate = totalSites > 0 ? weightedRate / totalSites : 0;
    const avgOcc = totalSites > 0 ? weightedOcc / totalSites : 0;
    const revpar = totalSites > 0 && avgRate > 0 ? avgRate * (avgOcc / 100) : 0;

    return { totalSites, totalRevenue, avgRate, avgOcc, revpar };
  }, [occRows]);

  // Add preset rows
  const handleApplyPresets = useCallback(async () => {
    if (!uwId) return;
    setSaving(true);
    try {
      const presetRows = presets.map((p, i) => ({
        line_item: p.label,
        t12_amount: 0,
        year_1_amount: 0,
        growth_rate: 0,
        is_deduction: false,
        sort_order: i,
        meta: {
          site_count: 0,
          nightly_rate: p.defaultRate,
          occupancy_pct: p.defaultOccupancy,
          operating_days: p.defaultDays,
        },
      }));
      const result = await upsertIncomeBySectionRows(uwId, "occupancy", presetRows);
      if (result.error) {
        showError("Could not apply presets", result.error);
      } else {
        showSuccess(`${unitLabel} type presets applied`);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }, [uwId, presets, unitLabel, router]);

  // Save all rows
  const handleSaveRows = useCallback(
    async (updatedRows: OccupancyRow[]) => {
      if (!uwId) return;
      setSaving(true);
      try {
        const toSave = updatedRows.map((r, i) => {
          const meta = r.meta ?? { site_count: 0, nightly_rate: 0, occupancy_pct: 0, operating_days: 365 };
          const revenue = calcAnnualRevenue(meta);
          return {
            line_item: r.line_item,
            t12_amount: revenue,
            year_1_amount: revenue,
            growth_rate: r.growth_rate,
            is_deduction: false,
            sort_order: i,
            meta: meta as unknown as Record<string, unknown>,
            notes: r.notes ?? null,
          };
        });
        const result = await upsertIncomeBySectionRows(uwId, "occupancy", toSave);
        if (result.error) {
          showError("Could not save occupancy income", result.error);
        } else {
          router.refresh();
        }
      } finally {
        setSaving(false);
      }
    },
    [uwId, router]
  );

  // Save note
  const handleSaveNote = useCallback(
    async (rowId: string, notes: string) => {
      const result = await updateIncomeNotes(rowId, notes || null);
      if (result.error) {
        showError("Could not save note");
      } else {
        router.refresh();
      }
    },
    [router]
  );

  if (occRows.length === 0) {
    return (
      <SectionCard title="Occupancy-Based Income" icon={Hotel}>
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            No occupancy income data yet. Apply presets for {propertyType.replace(/_/g, " ")} to get started.
          </p>
          <Button variant="outline" size="sm" onClick={handleApplyPresets} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
            Apply {unitLabel} Type Presets
          </Button>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Occupancy-Based Income"
      icon={Hotel}
      actions={
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 text-[11px] text-muted-foreground"
            onClick={() => {
              const newRow: OccupancyRow = {
                line_item: "New Site Type",
                t12_amount: 0,
                year_1_amount: 0,
                growth_rate: 0,
                is_deduction: false,
                sort_order: occRows.length,
                section: "occupancy",
                meta: { site_count: 0, nightly_rate: 0, occupancy_pct: 65, operating_days: 365 },
              };
              handleSaveRows([...occRows, newRow]);
            }}
          >
            <Plus className="h-2.5 w-2.5" /> Add Type
          </Button>
        </div>
      }
      noPad
    >
      {/* Table header */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{unitLabel} Type</th>
              <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Count</th>
              <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Nightly Rate</th>
              <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Occ %</th>
              <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Op Days</th>
              <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Annual Revenue</th>
              <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">RevPAR</th>
              <th className="w-[60px] px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {occRows.map((row, i) => {
              const meta = row.meta ?? { site_count: 0, nightly_rate: 0, occupancy_pct: 0, operating_days: 365 };
              const annualRev = calcAnnualRevenue(meta);
              const revpar = calcRevPAR(meta);

              return (
                <OccupancyTableRow
                  key={row.id ?? i}
                  row={row}
                  meta={meta}
                  annualRev={annualRev}
                  revpar={revpar}
                  expandedNoteId={expandedNoteId}
                  onToggleNote={setExpandedNoteId}
                  onSaveNote={handleSaveNote}
                  onUpdate={(updatedMeta, updatedName) => {
                    const updated = [...occRows];
                    updated[i] = {
                      ...updated[i],
                      line_item: updatedName ?? row.line_item,
                      meta: updatedMeta,
                    };
                    handleSaveRows(updated);
                  }}
                  onDelete={() => {
                    const updated = occRows.filter((_, j) => j !== i);
                    handleSaveRows(updated);
                  }}
                />
              );
            })}
          </tbody>
          {/* Totals */}
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/30 font-semibold">
              <td className="px-4 py-2.5 text-[13px]">Total</td>
              <td className="text-right px-3 py-2.5 text-[13px] num">{kpis.totalSites}</td>
              <td className="text-right px-3 py-2.5 text-[13px] num">${kpis.avgRate.toFixed(0)}</td>
              <td className="text-right px-3 py-2.5 text-[13px] num">{kpis.avgOcc.toFixed(1)}%</td>
              <td className="text-right px-3 py-2.5 text-[13px] num">{"\u2014"}</td>
              <td className="text-right px-3 py-2.5 text-[13px] num font-bold">{fmtCurrency(kpis.totalRevenue)}</td>
              <td className="text-right px-3 py-2.5 text-[13px] num">${kpis.revpar.toFixed(0)}</td>
              <td className="px-2 py-2.5" />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bottom KPI strip */}
      <div className="px-5 pb-4 pt-2">
        <MetricBar
          items={[
            { label: `Total ${unitLabel}s`, value: String(kpis.totalSites) },
            { label: "Wtd Avg Rate", value: `$${kpis.avgRate.toFixed(0)}` },
            { label: "Wtd Avg Occ", value: `${kpis.avgOcc.toFixed(1)}%` },
            { label: "Total Revenue", value: fmtCurrency(kpis.totalRevenue), accent: kpis.totalRevenue > 0 ? "text-green-500" : undefined },
            { label: "RevPAR", value: `$${kpis.revpar.toFixed(0)}` },
          ]}
        />
      </div>
    </SectionCard>
  );
}

// ── Occupancy Table Row ──

function OccupancyTableRow({
  row,
  meta,
  annualRev,
  revpar,
  expandedNoteId,
  onToggleNote,
  onSaveNote,
  onUpdate,
  onDelete,
}: {
  row: OccupancyRow;
  meta: OccupancyMeta;
  annualRev: number;
  revpar: number;
  expandedNoteId: string | null;
  onToggleNote: (id: string | null) => void;
  onSaveNote: (id: string, notes: string) => void;
  onUpdate: (meta: OccupancyMeta, name?: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const isNoteExpanded = row.id != null && expandedNoteId === row.id;

  return (
    <>
      <tr className="border-b group hover:bg-muted/20 transition-colors">
        {/* Site Type Name */}
        <td className="px-4 py-2">
          <EditableCell
            value={row.line_item}
            editing={editing === "name"}
            onEdit={() => setEditing("name")}
            onSave={(val) => { onUpdate(meta, val); setEditing(null); }}
            onCancel={() => setEditing(null)}
            type="text"
          />
          <div className="flex items-center gap-1 mt-0.5">
            {row.id && (
              <button
                onClick={() => onToggleNote(isNoteExpanded ? null : row.id!)}
                className={cn(
                  "shrink-0 rounded p-0.5 transition-all",
                  row.notes
                    ? "text-blue-500 opacity-100"
                    : "text-muted-foreground opacity-0 group-hover:opacity-60 hover:!opacity-100",
                  isNoteExpanded && "opacity-100 bg-muted"
                )}
              >
                <MessageSquare className="h-3 w-3" />
              </button>
            )}
          </div>
        </td>
        {/* Count */}
        <td className="text-right px-3 py-2">
          <EditableCell
            value={String(meta.site_count)}
            editing={editing === "count"}
            onEdit={() => setEditing("count")}
            onSave={(val) => { onUpdate({ ...meta, site_count: Number(val) || 0 }); setEditing(null); }}
            onCancel={() => setEditing(null)}
            type="number"
            align="right"
          />
        </td>
        {/* Nightly Rate */}
        <td className="text-right px-3 py-2">
          <EditableCell
            value={String(meta.nightly_rate)}
            editing={editing === "rate"}
            onEdit={() => setEditing("rate")}
            onSave={(val) => { onUpdate({ ...meta, nightly_rate: Number(val) || 0 }); setEditing(null); }}
            onCancel={() => setEditing(null)}
            type="currency"
            align="right"
          />
        </td>
        {/* Occupancy % */}
        <td className="text-right px-3 py-2">
          <EditableCell
            value={String(meta.occupancy_pct)}
            editing={editing === "occ"}
            onEdit={() => setEditing("occ")}
            onSave={(val) => { onUpdate({ ...meta, occupancy_pct: Number(val) || 0 }); setEditing(null); }}
            onCancel={() => setEditing(null)}
            type="percent"
            align="right"
          />
        </td>
        {/* Operating Days */}
        <td className="text-right px-3 py-2">
          <EditableCell
            value={String(meta.operating_days)}
            editing={editing === "days"}
            onEdit={() => setEditing("days")}
            onSave={(val) => { onUpdate({ ...meta, operating_days: Number(val) || 0 }); setEditing(null); }}
            onCancel={() => setEditing(null)}
            type="number"
            align="right"
          />
        </td>
        {/* Annual Revenue (calculated, read-only) */}
        <td className="text-right px-3 py-2 text-[13px] font-medium num">
          {fmtCurrency(annualRev)}
        </td>
        {/* RevPAR */}
        <td className="text-right px-3 py-2 text-[13px] num text-muted-foreground">
          ${revpar.toFixed(0)}
        </td>
        {/* Actions */}
        <td className="px-2 py-2 text-center">
          <button
            onClick={onDelete}
            className="text-muted-foreground opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-red-500 transition-all p-1 rounded"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </td>
      </tr>
      {/* Inline note row */}
      {isNoteExpanded && row.id && (
        <tr>
          <td colSpan={8} className="px-4 py-0">
            <InlineNote
              rowId={row.id}
              initialValue={row.notes ?? ""}
              onSave={(notes) => onSaveNote(row.id!, notes)}
              onClose={() => onToggleNote(null)}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Editable Cell ──

function EditableCell({
  value,
  editing,
  onEdit,
  onSave,
  onCancel,
  type,
  align = "left",
}: {
  value: string;
  editing: boolean;
  onEdit: () => void;
  onSave: (val: string) => void;
  onCancel: () => void;
  type: "text" | "number" | "currency" | "percent";
  align?: "left" | "right";
}) {
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <Input
        autoFocus
        className="h-7 text-[13px] w-full"
        type={type === "text" ? "text" : "number"}
        step={type === "currency" ? "0.01" : type === "percent" ? "0.1" : "1"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onSave(draft)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(draft);
          if (e.key === "Escape") onCancel();
        }}
      />
    );
  }

  const displayValue = (() => {
    const num = Number(value);
    if (type === "currency") return isNaN(num) || num === 0 ? "$0" : `$${num.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    if (type === "percent") return isNaN(num) ? "0%" : `${num}%`;
    if (type === "number") return isNaN(num) ? "0" : num.toLocaleString();
    return value || "\u2014";
  })();

  return (
    <button
      onClick={onEdit}
      className={cn(
        "text-[13px] num px-1.5 py-0.5 rounded transition-colors border border-transparent hover:border-border hover:bg-muted/40 cursor-pointer w-full",
        align === "right" ? "text-right" : "text-left",
        type === "text" && "font-medium"
      )}
    >
      {displayValue}
    </button>
  );
}

// ── Inline Note (reused pattern from T12SubTab) ──

function InlineNote({
  rowId,
  initialValue,
  onSave,
  onClose,
}: {
  rowId: string;
  initialValue: string;
  onSave: (notes: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const isDirty = value !== initialValue;

  const handleSave = async () => {
    setSaving(true);
    await onSave(value);
    setSaving(false);
    onClose();
  };

  return (
    <div className="ml-1 mb-2 mt-1 flex flex-col gap-1.5 bg-muted/30 rounded-lg p-2.5 border">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add underwriter notes..."
        className="min-h-[60px] text-xs bg-transparent border-none p-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
        autoFocus
      />
      <div className="flex items-center gap-1.5 justify-end">
        <Button variant="ghost" size="sm" className="h-6 text-[11px]" onClick={onClose}>
          Cancel
        </Button>
        {isDirty && (
          <Button size="sm" className="h-6 text-[11px]" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
          </Button>
        )}
      </div>
    </div>
  );
}
