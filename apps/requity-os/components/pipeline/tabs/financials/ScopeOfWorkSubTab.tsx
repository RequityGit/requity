"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Hammer, Loader2, Trash2 } from "lucide-react";
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
import { upsertScopeOfWork } from "@/app/(authenticated)/(admin)/pipeline/[id]/commercial-uw-actions";
import { MetricBar, SectionCard, n, fmtCurrency } from "./shared";

interface ScopeOfWorkSubTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scopeOfWork: any[];
  uwId: string | null;
  numUnits: number;
}

export function ScopeOfWorkSubTab({ scopeOfWork, uwId, numUnits }: ScopeOfWorkSubTabProps) {
  const [editOpen, setEditOpen] = useState(false);

  const totalBudget = useMemo(
    () => scopeOfWork.reduce((s: number, r: { estimated_cost: number }) => s + n(r.estimated_cost), 0),
    [scopeOfWork]
  );
  const costPerUnit = numUnits > 0 ? Math.round(totalBudget / numUnits) : 0;

  if (scopeOfWork.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            No scope of work items yet.
          </p>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Items
          </Button>
        </div>
        <EditScopeDialog open={editOpen} onOpenChange={setEditOpen} scopeOfWork={scopeOfWork} uwId={uwId} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <MetricBar
        items={[
          { label: "Total Budget", value: fmtCurrency(totalBudget) },
          { label: "Cost / Unit", value: costPerUnit > 0 ? fmtCurrency(costPerUnit) : "\u2014" },
          { label: "Line Items", value: String(scopeOfWork.length) },
        ]}
      />

      {/* Table */}
      <SectionCard
        title="Scope of Work"
        icon={Hammer}
        noPad
        actions={
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setEditOpen(true)}>
            <Plus className="h-3 w-3" /> Edit Items
          </Button>
        }
      >
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b">
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Item</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Estimated Cost</th>
            </tr>
          </thead>
          <tbody>
            {scopeOfWork.map((r: { id?: string; item_name: string; description?: string; estimated_cost: number }, i: number) => (
              <tr key={r.id || i} className="border-b hover:bg-muted/30">
                <td className="px-4 py-2.5 font-medium">{r.item_name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.description || "\u2014"}</td>
                <td className="px-4 py-2.5 text-right num font-semibold">{fmtCurrency(r.estimated_cost)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2">
              <td colSpan={2} className="px-4 py-3 font-bold">Total Budget</td>
              <td className="px-4 py-3 text-right font-bold num">{fmtCurrency(totalBudget)}</td>
            </tr>
          </tfoot>
        </table>
      </SectionCard>

      <EditScopeDialog open={editOpen} onOpenChange={setEditOpen} scopeOfWork={scopeOfWork} uwId={uwId} />
    </div>
  );
}

function EditScopeDialog({
  open,
  onOpenChange,
  scopeOfWork,
  uwId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scopeOfWork: any[];
  uwId: string | null;
}) {
  const [rows, setRows] = useState<{ item_name: string; description: string; estimated_cost: number; sort_order: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setRows(
        scopeOfWork.length > 0
          ? scopeOfWork.map((r, i) => ({
              item_name: r.item_name || "",
              description: r.description || "",
              estimated_cost: n(r.estimated_cost),
              sort_order: i,
            }))
          : [{ item_name: "", description: "", estimated_cost: 0, sort_order: 0 }]
      );
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!uwId) return;
    setSaving(true);
    try {
      const result = await upsertScopeOfWork(
        uwId,
        rows.filter((r) => r.item_name.trim()).map((r, i) => ({ ...r, sort_order: i }))
      );
      if (result.error) {
        toast.error(`Failed to save: ${result.error}`);
      } else {
        toast.success("Scope of work saved");
        router.refresh();
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Scope of Work</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input className="h-8 flex-1" placeholder="Item name" value={row.item_name} onChange={(e) => setRows((p) => p.map((r, j) => j === i ? { ...r, item_name: e.target.value } : r))} />
              <Input className="h-8 flex-1" placeholder="Description" value={row.description} onChange={(e) => setRows((p) => p.map((r, j) => j === i ? { ...r, description: e.target.value } : r))} />
              <Input className="h-8 w-28" type="number" placeholder="Cost" value={row.estimated_cost || ""} onChange={(e) => setRows((p) => p.map((r, j) => j === i ? { ...r, estimated_cost: Number(e.target.value) || 0 } : r))} />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRows((p) => p.filter((_, j) => j !== i))}>
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-fit gap-1" onClick={() => setRows((prev) => [...prev, { item_name: "", description: "", estimated_cost: 0, sort_order: prev.length }])}>
          <Plus className="h-3 w-3" /> Add Item
        </Button>
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
