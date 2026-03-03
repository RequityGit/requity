"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Column } from "@/components/shared/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/format";
import {
  Plus,
  Upload,
  Pencil,
  Check,
  HardHat,
  Trash2,
} from "lucide-react";
import type { ConstructionBudget, BudgetLineItem } from "./types";
import { DEFAULT_BUDGET_CATEGORIES } from "./types";

interface ScopeOfWorkTabProps {
  loanId: string;
  budget: ConstructionBudget | null;
  lineItems: BudgetLineItem[];
  currentUserId: string;
  onRefresh: () => void;
}

interface LineItemDraft {
  category: string;
  description: string;
  budgetAmount: string;
}

export function ScopeOfWorkTab({
  loanId,
  budget,
  lineItems,
  currentUserId,
  onRefresh,
}: ScopeOfWorkTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  if (!budget) {
    return (
      <>
        <EmptyState onCreateClick={() => setShowCreateModal(true)} />
        <CreateBudgetModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          loanId={loanId}
          currentUserId={currentUserId}
          onRefresh={onRefresh}
        />
      </>
    );
  }

  return (
    <ActiveBudgetView
      budget={budget}
      lineItems={lineItems}
      loanId={loanId}
      currentUserId={currentUserId}
      isEditing={isEditing}
      onToggleEdit={() => setIsEditing(!isEditing)}
      onRefresh={onRefresh}
    />
  );
}

// ── Empty State ──────────────────────────────────────────────────────

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <Card>
      <CardContent className="py-16 flex flex-col items-center justify-center text-center">
        <HardHat className="h-12 w-12 text-muted-foreground/50 mb-4" strokeWidth={1.5} />
        <p className="text-muted-foreground mb-4">
          No construction budget uploaded for this loan.
        </p>
        <Button onClick={onCreateClick} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Scope of Work
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Create Budget Modal ──────────────────────────────────────────────

function CreateBudgetModal({
  open,
  onOpenChange,
  loanId,
  currentUserId,
  onRefresh,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loanId: string;
  currentUserId: string;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItemDraft[]>(
    DEFAULT_BUDGET_CATEGORIES.map((cat) => ({
      category: cat,
      description: "",
      budgetAmount: "",
    }))
  );

  function updateLineItem(idx: number, field: keyof LineItemDraft, value: string) {
    setLineItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      { category: "", description: "", budgetAmount: "" },
    ]);
  }

  function removeLineItem(idx: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const totalBudget = lineItems.reduce((sum, li) => {
    const amt = parseFloat(li.budgetAmount);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  async function handleSubmit() {
    const validItems = lineItems.filter(
      (li) => li.category && parseFloat(li.budgetAmount) > 0
    );

    if (validItems.length === 0) {
      toast({
        title: "At least one line item with a budget amount is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      const { data: budgetData, error: budgetError } = await supabase
        .from("construction_budgets")
        .insert({
          loan_id: loanId,
          total_budget: totalBudget,
          total_drawn: 0,
          status: "draft" as any,
          notes: notes || null,
          created_by: currentUserId,
        } as any)
        .select("id")
        .single();

      if (budgetError) throw budgetError;

      const lineItemRows = validItems.map((li, idx) => ({
        construction_budget_id: budgetData.id,
        loan_id: loanId,
        category: li.category,
        description: li.description || null,
        budgeted_amount: parseFloat(li.budgetAmount),
        revised_amount: parseFloat(li.budgetAmount),
        drawn_amount: 0,
        percent_complete: 0,
        is_active: true,
        sort_order: idx + 1,
      }));

      const { error: itemsError } = await supabase
        .from("budget_line_items")
        .insert(lineItemRows);

      if (itemsError) throw itemsError;

      toast({ title: "Scope of work created successfully" });
      onOpenChange(false);
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Error creating budget",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Scope of Work</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="General notes about this scope of work..."
              rows={2}
            />
          </div>

          <div className="rounded-md border">
            <div className="grid grid-cols-[1fr_1fr_140px_40px] gap-2 p-3 bg-muted text-xs font-medium text-muted-foreground">
              <span>Category</span>
              <span>Description</span>
              <span>Budget ($)</span>
              <span></span>
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              {lineItems.map((li, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_1fr_140px_40px] gap-2 p-2 border-t items-center"
                >
                  <Input
                    value={li.category}
                    onChange={(e) => updateLineItem(idx, "category", e.target.value)}
                    placeholder="Category"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={li.description}
                    onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                    placeholder="Description"
                    className="h-8 text-sm"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={li.budgetAmount}
                    onChange={(e) => updateLineItem(idx, "budgetAmount", e.target.value)}
                    placeholder="0.00"
                    className="h-8 text-sm font-mono"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                    onClick={() => removeLineItem(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLineItem}
              className="gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Line Item
            </Button>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Total Budget: </span>
              <span className="text-lg font-bold font-mono">
                {formatCurrency(totalBudget)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Scope of Work"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Active Budget View (read-only with edit for pipeline) ─────────────

function ActiveBudgetView({
  budget,
  lineItems,
  loanId,
  currentUserId,
  isEditing,
  onToggleEdit,
  onRefresh,
}: {
  budget: ConstructionBudget;
  lineItems: BudgetLineItem[];
  loanId: string;
  currentUserId: string;
  isEditing: boolean;
  onToggleEdit: () => void;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [activating, setActivating] = useState(false);
  const [editValues, setEditValues] = useState<
    Record<string, { description: string; budgetAmount: string }>
  >({});

  const activeItems = lineItems.filter(
    (li) => li.is_active && (li.budgeted_amount > 0 || li.description || isEditing)
  );

  const totalBudget = budget.total_budget;

  async function handleActivate() {
    setActivating(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("construction_budgets")
        .update({ status: "active" as any, updated_at: new Date().toISOString() })
        .eq("id", budget.id);

      if (error) throw error;
      toast({ title: "Scope of work activated — budget is now locked" });
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error activating budget", description: message, variant: "destructive" });
    } finally {
      setActivating(false);
    }
  }

  async function handleSaveEdits() {
    try {
      const supabase = createClient();
      const updates = Object.entries(editValues);
      if (updates.length === 0) {
        onToggleEdit();
        return;
      }

      for (const [id, vals] of updates) {
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (vals.description !== undefined) updateData.description = vals.description;
        if (budget.status === "draft" && vals.budgetAmount !== undefined) {
          const amt = parseFloat(vals.budgetAmount);
          if (!isNaN(amt)) {
            updateData.budgeted_amount = amt;
            updateData.revised_amount = amt;
          }
        }

        const { error } = await supabase
          .from("budget_line_items")
          .update(updateData)
          .eq("id", id);

        if (error) throw error;
      }

      // Recalculate total budget
      if (budget.status === "draft") {
        const newTotal = lineItems.reduce((sum, li) => {
          const edit = editValues[li.id];
          if (edit?.budgetAmount) {
            const amt = parseFloat(edit.budgetAmount);
            return sum + (isNaN(amt) ? li.budgeted_amount : amt);
          }
          return sum + li.budgeted_amount;
        }, 0);

        await supabase
          .from("construction_budgets")
          .update({ total_budget: newTotal, updated_at: new Date().toISOString() })
          .eq("id", budget.id);
      }

      toast({ title: "Scope of work updated" });
      setEditValues({});
      onToggleEdit();
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error saving edits", description: message, variant: "destructive" });
    }
  }

  const columns: Column<BudgetLineItem>[] = [
    {
      key: "sort_order",
      header: "#",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">{row.sort_order}</span>
      ),
    },
    {
      key: "category",
      header: "Line Item",
      cell: (row) => {
        if (isEditing) {
          return (
            <Input
              className="h-7 text-sm"
              defaultValue={row.description ?? ""}
              placeholder={row.category}
              onChange={(e) => {
                setEditValues((prev) => ({
                  ...prev,
                  [row.id]: {
                    ...prev[row.id],
                    description: e.target.value,
                    budgetAmount: prev[row.id]?.budgetAmount ?? row.budgeted_amount.toString(),
                  },
                }));
              }}
            />
          );
        }
        return (
          <div>
            <span className="text-sm font-medium">{row.category}</span>
            {row.description && (
              <p className="text-xs text-muted-foreground">{row.description}</p>
            )}
          </div>
        );
      },
    },
    {
      key: "budgeted_amount",
      header: "Budget ($)",
      cell: (row) => {
        if (isEditing && budget.status === "draft") {
          return (
            <Input
              type="number"
              step="0.01"
              min="0"
              className="h-7 w-28 text-sm font-mono"
              defaultValue={row.budgeted_amount}
              onChange={(e) => {
                setEditValues((prev) => ({
                  ...prev,
                  [row.id]: {
                    ...prev[row.id],
                    description: prev[row.id]?.description ?? row.description ?? "",
                    budgetAmount: e.target.value,
                  },
                }));
              }}
            />
          );
        }
        return <span className="font-mono text-sm">{formatCurrency(row.budgeted_amount)}</span>;
      },
    },
    {
      key: "pct_budget",
      header: "% of Budget",
      cell: (row) => {
        const pct = totalBudget > 0 ? (row.budgeted_amount / totalBudget) * 100 : 0;
        return <span className="font-mono text-sm">{pct.toFixed(1)}%</span>;
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium">Scope of Work</h3>
          <StatusBadge status={budget.status} />
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSaveEdits} size="sm" className="gap-1">
                <Check className="h-3.5 w-3.5" />
                Save Changes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditValues({});
                  onToggleEdit();
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={onToggleEdit} className="gap-1">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              {budget.status === "draft" && (
                <Button
                  size="sm"
                  onClick={handleActivate}
                  disabled={activating}
                  className="gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  {activating ? "Activating..." : "Activate Budget"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <DataTable<BudgetLineItem>
        columns={columns}
        data={activeItems}
        emptyMessage="No line items."
      />

      {/* Footer total */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t">
        <span className="text-sm text-muted-foreground">Total Budget:</span>
        <span className="text-lg font-bold font-mono">{formatCurrency(totalBudget)}</span>
      </div>
    </div>
  );
}
