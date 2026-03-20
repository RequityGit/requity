"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Plus,
  CheckCircle2,
  XCircle,
  Trash2,
  FileText,
} from "lucide-react";
import type {
  ConstructionBudget,
  BudgetLineItem,
  BudgetChangeRequest,
  BudgetChangeRequestLineItem,
} from "./types";

interface ChangeOrdersSubTabProps {
  loanId: string;
  budget: ConstructionBudget | null;
  budgetLineItems: BudgetLineItem[];
  changeRequests: BudgetChangeRequest[];
  changeRequestLineItems: BudgetChangeRequestLineItem[];
  currentUserId: string;
  onRefresh: () => void;
}

export function ChangeOrdersSubTab({
  loanId,
  budget,
  budgetLineItems,
  changeRequests,
  changeRequestLineItems,
  currentUserId,
  onRefresh,
}: ChangeOrdersSubTabProps) {
  const [showCreateCO, setShowCreateCO] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedCO, setSelectedCO] = useState<BudgetChangeRequest | null>(null);

  const budgetIsActive = budget?.status === "active";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {changeRequests.length} change order{changeRequests.length !== 1 ? "s" : ""}
        </h3>
        {budgetIsActive && (
          <Button
            size="sm"
            onClick={() => setShowCreateCO(true)}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Submit Change Order
          </Button>
        )}
      </div>

      <ChangeOrdersList
        changeRequests={changeRequests}
        changeRequestLineItems={changeRequestLineItems}
        budgetLineItems={budgetLineItems}
        onApprove={(co) => {
          setSelectedCO(co);
          setShowApproveDialog(true);
        }}
        onReject={(co) => {
          setSelectedCO(co);
          setShowRejectDialog(true);
        }}
      />

      {showCreateCO && budget && (
        <CreateChangeOrderDialog
          open={showCreateCO}
          onOpenChange={setShowCreateCO}
          loanId={loanId}
          budget={budget}
          budgetLineItems={budgetLineItems}
          changeRequests={changeRequests}
          currentUserId={currentUserId}
          onRefresh={onRefresh}
        />
      )}

      {showApproveDialog && selectedCO && (
        <ApproveChangeOrderDialog
          co={selectedCO}
          coLineItems={changeRequestLineItems.filter(
            (li) => li.budget_change_request_id === selectedCO.id
          )}
          budgetLineItems={budgetLineItems}
          budget={budget!}
          open={showApproveDialog}
          onOpenChange={(v) => {
            setShowApproveDialog(v);
            if (!v) setSelectedCO(null);
          }}
          currentUserId={currentUserId}
          onRefresh={onRefresh}
        />
      )}

      {showRejectDialog && selectedCO && (
        <RejectChangeOrderDialog
          co={selectedCO}
          open={showRejectDialog}
          onOpenChange={(v) => {
            setShowRejectDialog(v);
            if (!v) setSelectedCO(null);
          }}
          currentUserId={currentUserId}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

function ChangeOrdersList({
  changeRequests,
  changeRequestLineItems,
  budgetLineItems,
  onApprove,
  onReject,
}: {
  changeRequests: BudgetChangeRequest[];
  changeRequestLineItems: BudgetChangeRequestLineItem[];
  budgetLineItems: BudgetLineItem[];
  onApprove: (co: BudgetChangeRequest) => void;
  onReject: (co: BudgetChangeRequest) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const columns: Column<BudgetChangeRequest>[] = [
    {
      key: "request_number",
      header: "CO #",
      cell: (row) => (
        <span className="num font-medium">
          {row.request_number || `CO-${changeRequests.indexOf(row) + 1}`}
        </span>
      ),
    },
    {
      key: "request_date",
      header: "Date",
      cell: (row) => formatDate(row.request_date || row.created_at),
    },
    {
      key: "reason",
      header: "Reason",
      cell: (row) => (
        <span className="text-sm max-w-[200px] truncate block">
          {row.reason || "—"}
        </span>
      ),
    },
    {
      key: "net_budget_change",
      header: "Net Change",
      cell: (row) => (
        <span
          className={`num text-sm ${
            row.net_budget_change > 0
              ? "text-red-600"
              : row.net_budget_change < 0
              ? "text-green-600"
              : ""
          }`}
        >
          {row.net_budget_change > 0 ? "+" : ""}
          {formatCurrency(row.net_budget_change)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "",
      cell: (row) => {
        if (row.status !== "pending") return null;
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-green-700 hover:text-green-800"
              onClick={(e) => {
                e.stopPropagation();
                onApprove(row);
              }}
            >
              <CheckCircle2 className="h-3 w-3" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-red-700 hover:text-red-800"
              onClick={(e) => {
                e.stopPropagation();
                onReject(row);
              }}
            >
              <XCircle className="h-3 w-3" />
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-2">
      <DataTable<BudgetChangeRequest>
        columns={columns}
        data={changeRequests}
        emptyMessage="No change orders for this loan."
        onRowClick={(row) =>
          setExpanded(expanded === row.id ? null : row.id)
        }
      />

      {/* Expanded detail */}
      {expanded && (
        <Card>
          <CardContent className="pt-3 pb-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Line Item Changes
            </p>
            <div className="rounded-md border text-sm">
              <div className="grid grid-cols-[1fr_100px_100px_100px_80px] gap-1 p-2 bg-muted text-[11px] font-medium text-muted-foreground">
                <span>Line Item</span>
                <span>Current</span>
                <span>Proposed</span>
                <span>Delta</span>
                <span>Action</span>
              </div>
              {changeRequestLineItems
                .filter((li) => li.budget_change_request_id === expanded)
                .map((li) => {
                  const bli = budgetLineItems.find(
                    (b) => b.id === li.budget_line_item_id
                  );
                  return (
                    <div
                      key={li.id}
                      className="grid grid-cols-[1fr_100px_100px_100px_80px] gap-1 p-2 border-t items-center"
                    >
                      <span className="text-xs">
                        {bli?.category || li.category || "New Item"}
                      </span>
                      <span className="text-xs num">
                        {formatCurrency(li.current_amount)}
                      </span>
                      <span className="text-xs num">
                        {formatCurrency(li.proposed_amount)}
                      </span>
                      <span
                        className={`text-xs num ${
                          li.delta_amount > 0
                            ? "text-red-600"
                            : li.delta_amount < 0
                            ? "text-green-600"
                            : ""
                        }`}
                      >
                        {li.delta_amount > 0 ? "+" : ""}
                        {formatCurrency(li.delta_amount)}
                      </span>
                      <StatusBadge status={li.change_action} />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Create Change Order Dialog ──────────────────────────────────────────

interface COLineItemDraft {
  lineItemId: string;
  changeAction: "increase" | "decrease" | "add" | "remove";
  proposedAmount: string;
  category: string;
  description: string;
}

function CreateChangeOrderDialog({
  open,
  onOpenChange,
  loanId,
  budget,
  budgetLineItems,
  changeRequests,
  currentUserId,
  onRefresh,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loanId: string;
  budget: ConstructionBudget;
  budgetLineItems: BudgetLineItem[];
  changeRequests: BudgetChangeRequest[];
  currentUserId: string;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [lineItems, setLineItems] = useState<COLineItemDraft[]>([
    {
      lineItemId: "",
      changeAction: "increase",
      proposedAmount: "",
      category: "",
      description: "",
    },
  ]);

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      {
        lineItemId: "",
        changeAction: "increase",
        proposedAmount: "",
        category: "",
        description: "",
      },
    ]);
  }

  function removeLineItem(idx: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateLineItem(
    idx: number,
    field: keyof COLineItemDraft,
    value: string
  ) {
    setLineItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  const netChange = lineItems.reduce((sum, li) => {
    const proposed = parseFloat(li.proposedAmount);
    if (isNaN(proposed)) return sum;
    if (li.changeAction === "add") return sum + proposed;
    if (li.changeAction === "remove") {
      const bli = budgetLineItems.find((b) => b.id === li.lineItemId);
      return sum - (bli?.revised_amount || 0);
    }
    const bli = budgetLineItems.find((b) => b.id === li.lineItemId);
    const current = bli?.revised_amount || bli?.budgeted_amount || 0;
    return sum + (proposed - current);
  }, 0);

  async function handleSubmit() {
    if (!reason.trim()) {
      toast({ title: "Reason is required", variant: "destructive" });
      return;
    }

    const validItems = lineItems.filter(
      (li) => li.changeAction === "add"
        ? li.category && parseFloat(li.proposedAmount) > 0
        : li.lineItemId
    );

    if (validItems.length === 0) {
      toast({ title: "At least one line item change is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const nextNumber = changeRequests.length + 1;

      const { data: coData, error: coError } = await supabase
        .from("budget_change_requests")
        .insert({
          construction_budget_id: budget.id,
          loan_id: loanId,
          request_number: `CO-${nextNumber}`,
          requested_by: currentUserId,
          request_date: new Date().toISOString().split("T")[0],
          status: "pending" as any,
          reason,
          net_budget_change: netChange,
        } as any)
        .select("id")
        .single();

      if (coError) throw coError;

      const coLineItems = validItems.map((li) => {
        const bli = budgetLineItems.find((b) => b.id === li.lineItemId);
        const current = bli?.revised_amount || bli?.budgeted_amount || 0;
        const proposed = li.changeAction === "remove" ? 0 : parseFloat(li.proposedAmount) || 0;
        return {
          budget_change_request_id: coData.id,
          budget_line_item_id: li.changeAction === "add" ? null : li.lineItemId || null,
          change_action: li.changeAction,
          current_amount: li.changeAction === "add" ? 0 : current,
          proposed_amount: proposed,
          delta_amount: proposed - (li.changeAction === "add" ? 0 : current),
          category: li.changeAction === "add" ? li.category : bli?.category || null,
          description: li.description || null,
        };
      });

      const { error: liError } = await supabase
        .from("budget_change_request_line_items")
        .insert(coLineItems as any);

      if (liError) throw liError;

      toast({ title: "Change order submitted" });
      onOpenChange(false);
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error creating change order", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Change Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Reason for Change (required)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the reason for the budget change..."
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <Label>Line Item Modifications</Label>
            {lineItems.map((li, idx) => (
              <div key={idx} className="border rounded-md p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={li.changeAction}
                    onValueChange={(v) =>
                      updateLineItem(
                        idx,
                        "changeAction",
                        v as COLineItemDraft["changeAction"]
                      )
                    }
                  >
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="increase">Increase</SelectItem>
                      <SelectItem value="decrease">Decrease</SelectItem>
                      <SelectItem value="add">Add New</SelectItem>
                      <SelectItem value="remove">Remove</SelectItem>
                    </SelectContent>
                  </Select>

                  {li.changeAction !== "add" ? (
                    <Select
                      value={li.lineItemId}
                      onValueChange={(v) =>
                        updateLineItem(idx, "lineItemId", v)
                      }
                    >
                      <SelectTrigger className="flex-1 h-8">
                        <SelectValue placeholder="Select line item" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetLineItems
                          .filter((b) => b.is_active)
                          .map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.category} ({formatCurrency(b.revised_amount || b.budgeted_amount)})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={li.category}
                      onChange={(e) =>
                        updateLineItem(idx, "category", e.target.value)
                      }
                      placeholder="New category name"
                      className="flex-1 h-8 text-sm"
                    />
                  )}

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

                {li.changeAction !== "remove" && (
                  <div className="flex items-center gap-2">
                    {li.lineItemId && li.changeAction !== "add" && (
                      <div className="text-xs text-muted-foreground">
                        Current:{" "}
                        <span className="num">
                          {formatCurrency(
                            budgetLineItems.find((b) => b.id === li.lineItemId)
                              ?.revised_amount || 0
                          )}
                        </span>
                      </div>
                    )}
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={li.proposedAmount}
                      onChange={(e) =>
                        updateLineItem(idx, "proposedAmount", e.target.value)
                      }
                      placeholder="Proposed amount"
                      className="w-36 h-8 text-sm num"
                    />
                  </div>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLineItem}
              className="gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Line Item Change
            </Button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">Net Budget Change:</span>
            <span
              className={`text-lg font-bold num ${
                netChange > 0 ? "text-red-600" : netChange < 0 ? "text-green-600" : ""
              }`}
            >
              {netChange > 0 ? "+" : ""}
              {formatCurrency(netChange)}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Change Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Approve Change Order ────────────────────────────────────────────────

function ApproveChangeOrderDialog({
  co,
  coLineItems,
  budgetLineItems,
  budget,
  open,
  onOpenChange,
  currentUserId,
  onRefresh,
}: {
  co: BudgetChangeRequest;
  coLineItems: BudgetChangeRequestLineItem[];
  budgetLineItems: BudgetLineItem[];
  budget: ConstructionBudget;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentUserId: string;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  async function handleApprove() {
    setLoading(true);
    try {
      const supabase = createClient();

      // Update change request status
      const { error: coError } = await supabase
        .from("budget_change_requests")
        .update({
          status: "approved" as any,
          reviewed_by: currentUserId,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq("id", co.id);

      if (coError) throw coError;

      // Apply changes to budget line items
      for (const li of coLineItems) {
        if (li.change_action === "add") {
          // Add new line item
          const maxSort = Math.max(
            ...budgetLineItems.map((b) => b.sort_order),
            0
          );
          const { error } = await supabase.from("budget_line_items").insert({
            construction_budget_id: budget.id,
            loan_id: co.loan_id,
            category: li.category || "New Item",
            description: li.description || null,
            budgeted_amount: li.proposed_amount,
            revised_amount: li.proposed_amount,
            drawn_amount: 0,
            percent_complete: 0,
            is_active: true,
            sort_order: maxSort + 1,
          });
          if (error) throw error;
        } else if (li.change_action === "remove" && li.budget_line_item_id) {
          const { error } = await supabase
            .from("budget_line_items")
            .update({
              is_active: false,
              revised_amount: 0,
              updated_at: new Date().toISOString(),
            })
            .eq("id", li.budget_line_item_id);
          if (error) throw error;
        } else if (li.budget_line_item_id) {
          // Increase or decrease
          const { error } = await supabase
            .from("budget_line_items")
            .update({
              revised_amount: li.proposed_amount,
              updated_at: new Date().toISOString(),
            })
            .eq("id", li.budget_line_item_id);
          if (error) throw error;

          // Log history
          const bli = budgetLineItems.find(
            (b) => b.id === li.budget_line_item_id
          );
          await supabase.from("budget_line_item_history").insert({
            budget_line_item_id: li.budget_line_item_id,
            construction_budget_id: budget.id,
            change_type: "amount_revised" as any,
            previous_amount: li.current_amount,
            new_amount: li.proposed_amount,
            change_reason: co.reason,
            changed_by: currentUserId,
            changed_at: new Date().toISOString(),
            budget_change_request_id: co.id,
          } as any);
        }
      }

      // Update total budget
      const newTotalBudget = budget.total_budget + co.net_budget_change;
      await supabase
        .from("construction_budgets")
        .update({
          total_budget: newTotalBudget,
          updated_at: new Date().toISOString(),
        })
        .eq("id", budget.id);

      toast({ title: "Change order approved and applied" });
      onOpenChange(false);
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error approving change order", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Approve Change Order {co.request_number}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will apply {coLineItems.length} line item change
            {coLineItems.length !== 1 ? "s" : ""} with a net budget change of{" "}
            <span className="num font-bold">
              {co.net_budget_change > 0 ? "+" : ""}
              {formatCurrency(co.net_budget_change)}
            </span>
            .
          </p>
          <div className="space-y-2">
            <Label>Review Notes (optional)</Label>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? "Approving..." : "Approve & Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Reject Change Order ─────────────────────────────────────────────────

function RejectChangeOrderDialog({
  co,
  open,
  onOpenChange,
  currentUserId,
  onRefresh,
}: {
  co: BudgetChangeRequest;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentUserId: string;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  async function handleReject() {
    if (!reviewNotes.trim()) {
      toast({ title: "Review notes are required for rejection", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("budget_change_requests")
        .update({
          status: "rejected" as any,
          reviewed_by: currentUserId,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
        })
        .eq("id", co.id);

      if (error) throw error;

      toast({ title: "Change order rejected" });
      onOpenChange(false);
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error rejecting change order", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Reject Change Order {co.request_number}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Review Notes (required)</Label>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Reason for rejecting this change order..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            disabled={loading || !reviewNotes.trim()}
            variant="destructive"
          >
            {loading ? "Rejecting..." : "Reject Change Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
