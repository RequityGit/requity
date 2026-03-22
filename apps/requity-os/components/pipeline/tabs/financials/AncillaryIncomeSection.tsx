"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Trash2,
  Coins,
  Pencil,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  upsertIncomeBySectionRows,
  updateIncomeNotes,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/commercial-uw-actions";
import {
  getAncillaryTemplate,
  type AncillaryTemplate,
} from "@/lib/commercial-uw/asset-type-config";
import { SectionCard, n, fmtCurrency } from "./shared";

// ── Types ──

interface AncillaryRow {
  id?: string;
  line_item: string;
  t12_amount: number;
  year_1_amount: number;
  growth_rate: number;
  is_deduction: boolean;
  sort_order: number;
  section?: string;
  notes?: string | null;
}

interface AncillaryIncomeSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[];
  uwId: string | null;
  propertyType: string;
}

// ── Main Component ──

export function AncillaryIncomeSection({
  rows,
  uwId,
  propertyType,
}: AncillaryIncomeSectionProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  const ancRows: AncillaryRow[] = useMemo(
    () =>
      rows
        .filter((r) => r.section === "ancillary")
        .map((r) => ({
          ...r,
          t12_amount: n(r.t12_amount),
          year_1_amount: n(r.year_1_amount),
          growth_rate: n(r.growth_rate),
        })),
    [rows]
  );

  const templates = useMemo(() => getAncillaryTemplate(propertyType), [propertyType]);

  const total = useMemo(
    () => ancRows.reduce((sum, r) => sum + r.t12_amount, 0),
    [ancRows]
  );

  // Apply templates
  const handleApplyTemplates = useCallback(async () => {
    if (!uwId) return;
    setSaving(true);
    try {
      const templateRows = templates.map((t, i) => ({
        line_item: t.label,
        t12_amount: t.defaultAmount,
        year_1_amount: t.defaultAmount,
        growth_rate: 0,
        is_deduction: false,
        sort_order: i,
      }));
      const result = await upsertIncomeBySectionRows(uwId, "ancillary", templateRows);
      if (result.error) {
        showError("Could not apply templates", result.error);
      } else {
        showSuccess("Ancillary income categories applied");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }, [uwId, templates, router]);

  // Save all rows
  const handleSaveRows = useCallback(
    async (updatedRows: AncillaryRow[]) => {
      if (!uwId) return;
      setSaving(true);
      try {
        const toSave = updatedRows.map((r, i) => ({
          line_item: r.line_item,
          t12_amount: r.t12_amount,
          year_1_amount: r.year_1_amount,
          growth_rate: r.growth_rate,
          is_deduction: false,
          sort_order: i,
          notes: r.notes ?? null,
        }));
        const result = await upsertIncomeBySectionRows(uwId, "ancillary", toSave);
        if (result.error) {
          showError("Could not save ancillary income", result.error);
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

  if (ancRows.length === 0) {
    return (
      <SectionCard title="Other / Ancillary Income" icon={Coins}>
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            No ancillary income items yet.
          </p>
          <div className="flex items-center gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={handleApplyTemplates} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
              Apply {propertyType.replace(/_/g, " ")} Templates
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newRow: AncillaryRow = {
                  line_item: "",
                  t12_amount: 0,
                  year_1_amount: 0,
                  growth_rate: 0,
                  is_deduction: false,
                  sort_order: 0,
                  section: "ancillary",
                };
                handleSaveRows([newRow]);
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Custom
            </Button>
          </div>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Other / Ancillary Income"
      icon={Coins}
      actions={
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 text-[11px] text-muted-foreground"
          onClick={() => {
            const newRow: AncillaryRow = {
              line_item: "",
              t12_amount: 0,
              year_1_amount: 0,
              growth_rate: 0,
              is_deduction: false,
              sort_order: ancRows.length,
              section: "ancillary",
            };
            handleSaveRows([...ancRows, newRow]);
          }}
        >
          <Plus className="h-2.5 w-2.5" /> Add Item
        </Button>
      }
    >
      {ancRows.map((row, i) => (
        <div key={row.id ?? i}>
          <div className={cn("flex items-center justify-between py-2.5 group", i < ancRows.length - 1 && "border-b")}>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <AncillaryNameCell
                value={row.line_item}
                onSave={(val) => {
                  const updated = [...ancRows];
                  updated[i] = { ...updated[i], line_item: val };
                  handleSaveRows(updated);
                }}
              />
              {row.id && (
                <button
                  onClick={() => setExpandedNoteId(expandedNoteId === row.id ? null : row.id!)}
                  className={cn(
                    "shrink-0 rounded p-0.5 transition-all",
                    row.notes
                      ? "text-blue-500 opacity-100"
                      : "text-muted-foreground opacity-0 group-hover:opacity-60 hover:!opacity-100",
                    expandedNoteId === row.id && "opacity-100 bg-muted"
                  )}
                >
                  <MessageSquare className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <AncillaryAmountCell
                value={row.t12_amount}
                onSave={(val) => {
                  const updated = [...ancRows];
                  updated[i] = { ...updated[i], t12_amount: val, year_1_amount: val };
                  handleSaveRows(updated);
                }}
              />
              <button
                onClick={() => {
                  const updated = ancRows.filter((_, j) => j !== i);
                  handleSaveRows(updated);
                }}
                className="text-muted-foreground opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-red-500 transition-all p-1 rounded"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
          {/* Inline note */}
          {row.id && expandedNoteId === row.id && (
            <InlineNote
              rowId={row.id}
              initialValue={row.notes ?? ""}
              onSave={(notes) => handleSaveNote(row.id!, notes)}
              onClose={() => setExpandedNoteId(null)}
            />
          )}
        </div>
      ))}

      {/* Total */}
      <div className="flex justify-between pt-3 mt-2 border-t-2">
        <span className="text-sm font-bold">Total Ancillary Income</span>
        <span className="text-sm font-bold num">{fmtCurrency(total)}</span>
      </div>
    </SectionCard>
  );
}

// ── Inline Editable Name ──

function AncillaryNameCell({
  value,
  onSave,
}: {
  value: string;
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <Input
        autoFocus
        className="h-7 text-[13px] w-48"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onSave(draft); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onSave(draft); setEditing(false); }
          if (e.key === "Escape") setEditing(false);
        }}
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      className="text-[13px] px-1.5 py-0.5 rounded transition-colors border border-transparent hover:border-border hover:bg-muted/40 cursor-pointer text-left truncate"
    >
      {value || "Untitled"}
    </button>
  );
}

// ── Inline Editable Amount ──

function AncillaryAmountCell({
  value,
  onSave,
}: {
  value: number;
  onSave: (val: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  if (editing) {
    return (
      <Input
        autoFocus
        className="h-7 text-[13px] w-28 text-right"
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onSave(Number(draft) || 0); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onSave(Number(draft) || 0); setEditing(false); }
          if (e.key === "Escape") setEditing(false);
        }}
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      className="text-[13px] font-medium num min-w-[80px] text-right px-1.5 py-0.5 rounded transition-colors border border-transparent hover:border-border hover:bg-muted/40 cursor-pointer"
    >
      {fmtCurrency(value)}
    </button>
  );
}

// ── Inline Note ──

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
    <div className="ml-1 mb-2 flex flex-col gap-1.5 bg-muted/30 rounded-lg p-2.5 border">
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
