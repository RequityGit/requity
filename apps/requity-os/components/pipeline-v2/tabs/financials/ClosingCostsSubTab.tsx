"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { upsertSourcesUses } from "@/app/(authenticated)/admin/pipeline-v2/[id]/commercial-uw-actions";
import { SectionCard, n, fmtCurrency } from "./shared";

interface ClosingCostsSubTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sourcesUses: any[];
  uwId: string | null;
  loanAmount: number;
  purchasePrice: number;
}

export function ClosingCostsSubTab({ sourcesUses, uwId, loanAmount, purchasePrice }: ClosingCostsSubTabProps) {
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();

  const sources = useMemo(
    () => sourcesUses.filter((r: { type: string }) => r.type === "source"),
    [sourcesUses]
  );
  const uses = useMemo(
    () => sourcesUses.filter((r: { type: string }) => r.type === "use"),
    [sourcesUses]
  );

  const totalSources = useMemo(() => sources.reduce((s: number, r: { amount: number }) => s + n(r.amount), 0), [sources]);
  const totalUses = useMemo(() => uses.reduce((s: number, r: { amount: number }) => s + n(r.amount), 0), [uses]);
  const gap = totalSources - totalUses;
  const balanced = Math.abs(gap) < 1;

  const equitySources = useMemo(
    () => sources.filter((s: { line_item: string }) => String(s.line_item).toLowerCase().includes("equity")),
    [sources]
  );
  const equityAmount = equitySources.reduce((s: number, r: { amount: number }) => s + n(r.amount), 0);
  const ltv = purchasePrice > 0 ? ((loanAmount / purchasePrice) * 100).toFixed(1) : "0.0";

  const DOT_COLORS = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-amber-500"];

  if (sourcesUses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          No sources & uses entered yet.
        </p>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Sources & Uses
        </Button>
        <EditSourcesUsesDialog open={editOpen} onOpenChange={setEditOpen} sourcesUses={sourcesUses} uwId={uwId} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sources */}
        <SectionCard
          title="Sources"
          icon={ArrowDown}
          actions={
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setEditOpen(true)}>
              <Plus className="h-3 w-3" /> Edit
            </Button>
          }
        >
          {sources.map((r: { line_item: string; amount: number }, i: number) => (
            <div key={i} className={cn("flex justify-between items-center py-3", i < sources.length - 1 && "border-b")}>
              <div className="flex items-center gap-2.5">
                <div className={cn("w-2 h-2 rounded-full", DOT_COLORS[i % DOT_COLORS.length])} />
                <span className="text-[13px]">{r.line_item}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground num">
                  {totalSources > 0 ? `${((n(r.amount) / totalSources) * 100).toFixed(0)}%` : "\u2014"}
                </span>
                <span className="text-[13px] font-semibold num min-w-[100px] text-right">{fmtCurrency(r.amount)}</span>
              </div>
            </div>
          ))}
          <div className="flex justify-between pt-3.5 mt-2 border-t-2">
            <span className="text-sm font-bold">Total Sources</span>
            <span className="text-sm font-bold num">{fmtCurrency(totalSources)}</span>
          </div>
        </SectionCard>

        {/* Uses */}
        <SectionCard
          title="Uses"
          icon={ArrowUp}
          actions={
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setEditOpen(true)}>
              <Plus className="h-3 w-3" /> Edit
            </Button>
          }
        >
          {uses.map((r: { line_item: string; amount: number }, i: number) => (
            <div key={i} className={cn("flex justify-between items-center py-2.5", i < uses.length - 1 && "border-b")}>
              <span className="text-[13px]">{r.line_item}</span>
              <span className="text-[13px] font-medium num min-w-[90px] text-right">{fmtCurrency(r.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3.5 mt-2 border-t-2">
            <span className="text-sm font-bold">Total Uses</span>
            <span className="text-sm font-bold num">{fmtCurrency(totalUses)}</span>
          </div>
        </SectionCard>
      </div>

      {/* Balance Check Bar */}
      <div className={cn(
        "rounded-lg px-5 py-3.5 flex justify-between items-center",
        balanced ? "bg-green-500/10 border border-green-500/30" : "bg-amber-500/10 border border-amber-500/30"
      )}>
        <div className="flex items-center gap-2">
          {balanced
            ? <CheckCircle2 className="h-4 w-4 text-green-500" />
            : <AlertTriangle className="h-4 w-4 text-amber-500" />}
          <span className={cn("text-[13px] font-semibold", balanced ? "text-green-500" : "text-amber-500")}>
            {balanced ? "Sources & Uses Balanced" : `Gap: ${fmtCurrency(Math.abs(gap))} — ${gap < 0 ? "Uses exceed Sources" : "Sources exceed Uses"}`}
          </span>
        </div>
        <div className="flex gap-6">
          <span className="text-xs text-muted-foreground">LTV: <strong className="text-foreground">{ltv}%</strong></span>
          <span className="text-xs text-muted-foreground">Equity: <strong className="text-foreground">{fmtCurrency(equityAmount)}</strong></span>
        </div>
      </div>

      <EditSourcesUsesDialog open={editOpen} onOpenChange={setEditOpen} sourcesUses={sourcesUses} uwId={uwId} />
    </div>
  );
}

function EditSourcesUsesDialog({
  open,
  onOpenChange,
  sourcesUses,
  uwId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sourcesUses: any[];
  uwId: string | null;
}) {
  const [rows, setRows] = useState<{ type: string; line_item: string; amount: number; sort_order: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setRows(
        sourcesUses.length > 0
          ? sourcesUses.map((r, i) => ({
              type: r.type || "source",
              line_item: r.line_item || "",
              amount: n(r.amount),
              sort_order: i,
            }))
          : [
              { type: "source", line_item: "Senior Debt", amount: 0, sort_order: 0 },
              { type: "source", line_item: "Sponsor Equity", amount: 0, sort_order: 1 },
              { type: "use", line_item: "Purchase Price", amount: 0, sort_order: 2 },
              { type: "use", line_item: "Closing Costs", amount: 0, sort_order: 3 },
            ]
      );
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!uwId) return;
    setSaving(true);
    try {
      const result = await upsertSourcesUses(uwId, rows.map((r, i) => ({ ...r, sort_order: i })));
      if (result.error) {
        toast.error(`Failed to save: ${result.error}`);
      } else {
        toast.success("Sources & Uses saved");
        router.refresh();
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const sources = rows.filter((r) => r.type === "source");
  const uses = rows.filter((r) => r.type === "use");

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Sources & Uses</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {/* Sources */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sources</span>
              <Button variant="outline" size="sm" className="h-6 gap-1 text-[11px]" onClick={() => setRows((prev) => [...prev, { type: "source", line_item: "", amount: 0, sort_order: prev.length }])}>
                <Plus className="h-2.5 w-2.5" /> Add Source
              </Button>
            </div>
            {sources.map((row) => {
              const idx = rows.indexOf(row);
              return (
                <div key={idx} className="flex items-center gap-2 mb-1.5">
                  <Input className="h-8 flex-1" value={row.line_item} onChange={(e) => setRows((p) => p.map((r, i) => i === idx ? { ...r, line_item: e.target.value } : r))} />
                  <Input className="h-8 w-28" type="number" value={row.amount || ""} onChange={(e) => setRows((p) => p.map((r, i) => i === idx ? { ...r, amount: Number(e.target.value) || 0 } : r))} />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRows((p) => p.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Uses */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Uses</span>
              <Button variant="outline" size="sm" className="h-6 gap-1 text-[11px]" onClick={() => setRows((prev) => [...prev, { type: "use", line_item: "", amount: 0, sort_order: prev.length }])}>
                <Plus className="h-2.5 w-2.5" /> Add Use
              </Button>
            </div>
            {uses.map((row) => {
              const idx = rows.indexOf(row);
              return (
                <div key={idx} className="flex items-center gap-2 mb-1.5">
                  <Input className="h-8 flex-1" value={row.line_item} onChange={(e) => setRows((p) => p.map((r, i) => i === idx ? { ...r, line_item: e.target.value } : r))} />
                  <Input className="h-8 w-28" type="number" value={row.amount || ""} onChange={(e) => setRows((p) => p.map((r, i) => i === idx ? { ...r, amount: Number(e.target.value) || 0 } : r))} />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRows((p) => p.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
