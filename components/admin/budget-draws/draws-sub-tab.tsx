"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Plus,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Send,
  Banknote,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type {
  ConstructionBudget,
  BudgetLineItem,
  DrawRequest,
  DrawRequestLineItem,
} from "./types";

interface DrawsSubTabProps {
  loanId: string;
  budget: ConstructionBudget | null;
  budgetLineItems: BudgetLineItem[];
  drawRequests: DrawRequest[];
  drawRequestLineItems: DrawRequestLineItem[];
  currentUserId: string;
  onRefresh: () => void;
}

export function DrawsSubTab({
  loanId,
  budget,
  budgetLineItems,
  drawRequests,
  drawRequestLineItems,
  currentUserId,
  onRefresh,
}: DrawsSubTabProps) {
  const [showCreateDraw, setShowCreateDraw] = useState(false);
  const [selectedDraw, setSelectedDraw] = useState<DrawRequest | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showInspectionDialog, setShowInspectionDialog] = useState(false);
  const [showWireDialog, setShowWireDialog] = useState(false);

  const budgetIsActive = budget?.status === "active" || budget?.status === "completed";

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {drawRequests.length} draw request{drawRequests.length !== 1 ? "s" : ""}
        </h3>
        {budgetIsActive && (
          <Button
            size="sm"
            onClick={() => setShowCreateDraw(true)}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Draw Request
          </Button>
        )}
      </div>

      {/* Draw requests list */}
      <DrawRequestsList
        drawRequests={drawRequests}
        drawRequestLineItems={drawRequestLineItems}
        budgetLineItems={budgetLineItems}
        onViewDraw={setSelectedDraw}
      />

      {/* Create draw slide-over */}
      {showCreateDraw && budget && (
        <CreateDrawSheet
          open={showCreateDraw}
          onOpenChange={setShowCreateDraw}
          loanId={loanId}
          budget={budget}
          budgetLineItems={budgetLineItems}
          drawRequests={drawRequests}
          drawRequestLineItems={drawRequestLineItems}
          currentUserId={currentUserId}
          onRefresh={onRefresh}
        />
      )}

      {/* Draw detail slide-over */}
      {selectedDraw && (
        <DrawDetailSheet
          draw={selectedDraw}
          drawLineItems={drawRequestLineItems.filter(
            (li) => li.draw_request_id === selectedDraw.id
          )}
          budgetLineItems={budgetLineItems}
          open={!!selectedDraw}
          onOpenChange={(v) => !v && setSelectedDraw(null)}
          onApprove={() => setShowApproveDialog(true)}
          onReject={() => setShowRejectDialog(true)}
          onOrderInspection={() => setShowInspectionDialog(true)}
          onRecordWire={() => setShowWireDialog(true)}
        />
      )}

      {/* Approve Dialog */}
      {showApproveDialog && selectedDraw && (
        <ApproveDrawDialog
          draw={selectedDraw}
          drawLineItems={drawRequestLineItems.filter(
            (li) => li.draw_request_id === selectedDraw.id
          )}
          budgetLineItems={budgetLineItems}
          open={showApproveDialog}
          onOpenChange={setShowApproveDialog}
          currentUserId={currentUserId}
          onRefresh={() => {
            setSelectedDraw(null);
            setShowApproveDialog(false);
            onRefresh();
          }}
        />
      )}

      {/* Reject Dialog */}
      {showRejectDialog && selectedDraw && (
        <RejectDrawDialog
          draw={selectedDraw}
          open={showRejectDialog}
          onOpenChange={setShowRejectDialog}
          currentUserId={currentUserId}
          onRefresh={() => {
            setSelectedDraw(null);
            setShowRejectDialog(false);
            onRefresh();
          }}
        />
      )}

      {/* Inspection Dialog */}
      {showInspectionDialog && selectedDraw && (
        <OrderInspectionDialog
          draw={selectedDraw}
          open={showInspectionDialog}
          onOpenChange={setShowInspectionDialog}
          onRefresh={() => {
            setSelectedDraw(null);
            setShowInspectionDialog(false);
            onRefresh();
          }}
        />
      )}

      {/* Wire Dialog */}
      {showWireDialog && selectedDraw && (
        <RecordWireDialog
          draw={selectedDraw}
          open={showWireDialog}
          onOpenChange={setShowWireDialog}
          currentUserId={currentUserId}
          onRefresh={() => {
            setSelectedDraw(null);
            setShowWireDialog(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

// ── Draw Requests List ──────────────────────────────────────────────────

function DrawRequestsList({
  drawRequests,
  drawRequestLineItems,
  budgetLineItems,
  onViewDraw,
}: {
  drawRequests: DrawRequest[];
  drawRequestLineItems: DrawRequestLineItem[];
  budgetLineItems: BudgetLineItem[];
  onViewDraw: (draw: DrawRequest) => void;
}) {
  const columns: Column<DrawRequest>[] = [
    {
      key: "draw_number",
      header: "Draw #",
      cell: (row) => (
        <span className="num font-medium">{row.draw_number}</span>
      ),
    },
    {
      key: "request_date",
      header: "Request Date",
      cell: (row) => formatDate(row.request_date || row.created_at),
    },
    {
      key: "amount_requested",
      header: "Amount Requested",
      cell: (row) => (
        <span className="num">{formatCurrency(row.amount_requested)}</span>
      ),
    },
    {
      key: "amount_approved",
      header: "Amount Approved",
      cell: (row) =>
        row.amount_approved != null ? (
          <span className="num">{formatCurrency(row.amount_approved)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "inspection_date",
      header: "Inspection",
      cell: (row) =>
        row.inspection_date ? formatDate(row.inspection_date) : "—",
    },
    {
      key: "wire_date",
      header: "Wire Date",
      cell: (row) => (row.wire_date ? formatDate(row.wire_date) : "—"),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1"
          onClick={(e) => {
            e.stopPropagation();
            onViewDraw(row);
          }}
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </Button>
      ),
    },
  ];

  return (
    <DataTable<DrawRequest>
      columns={columns}
      data={drawRequests}
      emptyMessage="No draw requests for this loan."
      onRowClick={onViewDraw}
    />
  );
}

// ── Create Draw Sheet ──────────────────────────────────────────────────

function CreateDrawSheet({
  open,
  onOpenChange,
  loanId,
  budget,
  budgetLineItems,
  drawRequests,
  drawRequestLineItems,
  currentUserId,
  onRefresh,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loanId: string;
  budget: ConstructionBudget;
  budgetLineItems: BudgetLineItem[];
  drawRequests: DrawRequest[];
  drawRequestLineItems: DrawRequestLineItem[];
  currentUserId: string;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [requestedAmounts, setRequestedAmounts] = useState<Record<string, string>>({});
  const [lineNotes, setLineNotes] = useState<Record<string, string>>({});

  const nextDrawNumber =
    drawRequests.length > 0
      ? Math.max(...drawRequests.map((d) => d.draw_number)) + 1
      : 1;

  // Calculate previously drawn per line item
  const previouslyDrawn: Record<string, number> = {};
  for (const li of budgetLineItems) {
    const lineDrawItems = drawRequestLineItems.filter(
      (dli) => dli.budget_line_item_id === li.id
    );
    let drawn = 0;
    for (const dli of lineDrawItems) {
      const dr = drawRequests.find((d) => d.id === dli.draw_request_id);
      if (dr && (dr.status === "approved" || dr.status === "funded")) {
        drawn += dli.approved_amount ?? dli.requested_amount;
      }
    }
    previouslyDrawn[li.id] = drawn;
  }

  const activeItems = budgetLineItems.filter((li) => li.is_active);

  const totalRequested = Object.values(requestedAmounts).reduce((sum, val) => {
    const amt = parseFloat(val);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  function validateLineItem(liId: string, amount: string): string | null {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return null;
    const li = budgetLineItems.find((l) => l.id === liId);
    if (!li) return "Line item not found";
    const remaining = (li.revised_amount || li.budgeted_amount) - (previouslyDrawn[liId] || 0);
    if (amt > remaining) return `Exceeds remaining (${formatCurrency(remaining)})`;
    return null;
  }

  async function handleSubmit(asDraft: boolean) {
    if (totalRequested <= 0) {
      toast({ title: "Enter amounts for at least one line item", variant: "destructive" });
      return;
    }

    // Validate all line items
    for (const [liId, amount] of Object.entries(requestedAmounts)) {
      const error = validateLineItem(liId, amount);
      if (error) {
        const li = budgetLineItems.find((l) => l.id === liId);
        toast({
          title: `${li?.category}: ${error}`,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // Create draw request
      const { data: drawData, error: drawError } = await supabase
        .from("draw_requests")
        .insert({
          loan_id: loanId,
          construction_budget_id: budget.id,
          draw_number: nextDrawNumber,
          request_number: `D${nextDrawNumber}`,
          amount_requested: totalRequested,
          status: (asDraft ? "draft" : "submitted") as any,
          request_date: new Date().toISOString().split("T")[0],
          submitted_at: asDraft ? null : new Date().toISOString(),
          description: description || null,
          requested_by: currentUserId,
        } as any)
        .select("id")
        .single();

      if (drawError) throw drawError;

      // Create line items
      const lineItemInserts = Object.entries(requestedAmounts)
        .filter(([, val]) => parseFloat(val) > 0)
        .map(([liId, val]) => ({
          draw_request_id: drawData.id,
          budget_line_item_id: liId,
          requested_amount: parseFloat(val),
          notes: lineNotes[liId] || null,
          approval_status: "pending" as const,
        }));

      if (lineItemInserts.length > 0) {
        const { error: liError } = await supabase
          .from("draw_request_line_items")
          .insert(lineItemInserts as any);

        if (liError) throw liError;
      }

      toast({
        title: asDraft
          ? "Draw request saved as draft"
          : "Draw request submitted",
      });
      onOpenChange(false);
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error creating draw request", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Draw Request #{nextDrawNumber}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the work completed for this draw..."
              rows={2}
            />
          </div>

          {/* Line items table */}
          <div className="rounded-md border">
            <div className="grid grid-cols-[1fr_90px_90px_90px_100px] gap-1 p-2 bg-muted text-[11px] font-medium text-muted-foreground">
              <span>Line Item</span>
              <span>Budget</span>
              <span>Prev. Drawn</span>
              <span>Remaining</span>
              <span>This Request</span>
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              {activeItems.map((li) => {
                const prevDrawn = previouslyDrawn[li.id] || 0;
                const remaining = (li.revised_amount || li.budgeted_amount) - prevDrawn;
                const requestVal = requestedAmounts[li.id] || "";
                const error = requestVal ? validateLineItem(li.id, requestVal) : null;

                return (
                  <div
                    key={li.id}
                    className="grid grid-cols-[1fr_90px_90px_90px_100px] gap-1 p-2 border-t items-center"
                  >
                    <span className="text-xs">{li.category}</span>
                    <span className="text-xs num">
                      {formatCurrency(li.revised_amount || li.budgeted_amount)}
                    </span>
                    <span className="text-xs num">
                      {formatCurrency(prevDrawn)}
                    </span>
                    <span
                      className={`text-xs num ${remaining < 0 ? "text-red-600" : ""}`}
                    >
                      {formatCurrency(remaining)}
                    </span>
                    <div>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max={remaining}
                        value={requestVal}
                        onChange={(e) =>
                          setRequestedAmounts((prev) => ({
                            ...prev,
                            [li.id]: e.target.value,
                          }))
                        }
                        className={`h-7 text-xs num ${
                          error
                            ? "border-red-400 focus-visible:ring-red-400"
                            : "border-amber-300 focus-visible:ring-amber-400"
                        }`}
                        placeholder="0.00"
                      />
                      {error && (
                        <p className="text-[10px] text-red-500 mt-0.5">{error}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">Total Requested:</span>
            <span className="text-lg font-bold num">
              {formatCurrency(totalRequested)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="flex-1"
            >
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="flex-1 gap-1"
            >
              <Send className="h-3.5 w-3.5" />
              {loading ? "Submitting..." : "Submit Draw Request"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Draw Detail Sheet ──────────────────────────────────────────────────

function DrawDetailSheet({
  draw,
  drawLineItems,
  budgetLineItems,
  open,
  onOpenChange,
  onApprove,
  onReject,
  onOrderInspection,
  onRecordWire,
}: {
  draw: DrawRequest;
  drawLineItems: DrawRequestLineItem[];
  budgetLineItems: BudgetLineItem[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
  onOrderInspection: () => void;
  onRecordWire: () => void;
}) {
  const [showDetails, setShowDetails] = useState(true);

  const canApprove =
    draw.status === "submitted" ||
    draw.status === "under_review" ||
    draw.status === "inspection_complete";
  const canReject =
    draw.status === "submitted" || draw.status === "under_review";
  const canInspect =
    draw.status === "submitted" || draw.status === "under_review";
  const canWire = draw.status === "approved";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Draw Request #{draw.draw_number}
            <StatusBadge status={draw.status} />
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Summary */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Requested</span>
                  <p className="num font-bold">
                    {formatCurrency(draw.amount_requested)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Approved</span>
                  <p className="num font-bold">
                    {draw.amount_approved != null
                      ? formatCurrency(draw.amount_approved)
                      : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Request Date</span>
                  <p>{formatDate(draw.request_date || draw.created_at)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Submitted</span>
                  <p>{formatDate(draw.submitted_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {draw.description && (
            <div>
              <span className="text-xs text-muted-foreground">Description</span>
              <p className="text-sm mt-1">{draw.description}</p>
            </div>
          )}

          {/* Line item breakdown */}
          <div>
            <button
              className="flex items-center gap-1 text-sm font-medium mb-2"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              Line Item Breakdown ({drawLineItems.length})
            </button>
            {showDetails && drawLineItems.length > 0 && (
              <div className="rounded-md border text-sm">
                <div className="grid grid-cols-[1fr_90px_90px_90px] gap-1 p-2 bg-muted text-[11px] font-medium text-muted-foreground">
                  <span>Line Item</span>
                  <span>Requested</span>
                  <span>Approved</span>
                  <span>Status</span>
                </div>
                {drawLineItems.map((dli) => {
                  const bli = budgetLineItems.find(
                    (b) => b.id === dli.budget_line_item_id
                  );
                  return (
                    <div
                      key={dli.id}
                      className="grid grid-cols-[1fr_90px_90px_90px] gap-1 p-2 border-t items-center"
                    >
                      <span className="text-xs">{bli?.category ?? "—"}</span>
                      <span className="text-xs num">
                        {formatCurrency(dli.requested_amount)}
                      </span>
                      <span className="text-xs num">
                        {dli.approved_amount != null
                          ? formatCurrency(dli.approved_amount)
                          : "—"}
                      </span>
                      <StatusBadge status={dli.approval_status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Inspection info */}
          {(draw.inspection_date || draw.inspector_name) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Search className="h-3.5 w-3.5" />
                  Inspection
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">Inspector</span>
                    <p>{draw.inspector_name || "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Date</span>
                    <p>{formatDate(draw.inspection_date)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Completion %</span>
                    <p className="num">
                      {draw.completion_pct != null
                        ? `${draw.completion_pct}%`
                        : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wire info */}
          {draw.wire_date && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Banknote className="h-3.5 w-3.5" />
                  Wire Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">Wire Date</span>
                    <p>{formatDate(draw.wire_date)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Amount</span>
                    <p className="num">
                      {formatCurrency(draw.wire_amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Confirmation #
                    </span>
                    <p className="num text-xs">
                      {draw.wire_confirmation_number || "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {(draw.borrower_notes || draw.internal_notes || draw.reviewer_notes) && (
            <div className="space-y-2">
              {draw.borrower_notes && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    Borrower Notes
                  </span>
                  <p className="text-sm">{draw.borrower_notes}</p>
                </div>
              )}
              {draw.internal_notes && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    Internal Notes
                  </span>
                  <p className="text-sm">{draw.internal_notes}</p>
                </div>
              )}
              {draw.reviewer_notes && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    Reviewer Notes
                  </span>
                  <p className="text-sm">{draw.reviewer_notes}</p>
                </div>
              )}
              {draw.rejection_reason && (
                <div>
                  <span className="text-xs text-red-600">Rejection Reason</span>
                  <p className="text-sm text-red-700">{draw.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

          {/* Admin Actions */}
          {(canApprove || canReject || canInspect || canWire) && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Actions
              </p>
              <div className="flex flex-wrap gap-2">
                {canApprove && (
                  <Button
                    size="sm"
                    onClick={onApprove}
                    className="gap-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve Draw
                  </Button>
                )}
                {canReject && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onReject}
                    className="gap-1 text-red-700 hover:text-red-800"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject Draw
                  </Button>
                )}
                {canInspect && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onOrderInspection}
                    className="gap-1"
                  >
                    <Search className="h-3.5 w-3.5" />
                    Order Inspection
                  </Button>
                )}
                {canWire && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRecordWire}
                    className="gap-1"
                  >
                    <Banknote className="h-3.5 w-3.5" />
                    Record Wire
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Approve Draw Dialog ─────────────────────────────────────────────────

function ApproveDrawDialog({
  draw,
  drawLineItems,
  budgetLineItems,
  open,
  onOpenChange,
  currentUserId,
  onRefresh,
}: {
  draw: DrawRequest;
  drawLineItems: DrawRequestLineItem[];
  budgetLineItems: BudgetLineItem[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentUserId: string;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [approvedAmounts, setApprovedAmounts] = useState<Record<string, string>>(
    Object.fromEntries(
      drawLineItems.map((dli) => [dli.id, dli.requested_amount.toString()])
    )
  );
  const [reviewerNotes, setReviewerNotes] = useState("");

  const totalApproved = Object.values(approvedAmounts).reduce((sum, val) => {
    const amt = parseFloat(val);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  async function handleApprove() {
    setLoading(true);
    try {
      const supabase = createClient();

      // Update each line item
      for (const dli of drawLineItems) {
        const amt = parseFloat(approvedAmounts[dli.id] || "0");
        const { error } = await supabase
          .from("draw_request_line_items")
          .update({
            approved_amount: amt,
            approval_status: (amt > 0 ? "approved" : "rejected") as any,
          })
          .eq("id", dli.id);

        if (error) throw error;

        // Update budget line item drawn amount
        if (amt > 0) {
          const bli = budgetLineItems.find(
            (b) => b.id === dli.budget_line_item_id
          );
          if (bli) {
            const newDrawn = (bli.drawn_amount || 0) + amt;
            const revised = bli.revised_amount || bli.budgeted_amount;
            const pctComplete = revised > 0 ? (newDrawn / revised) * 100 : 0;

            const { error: bliError } = await supabase
              .from("budget_line_items")
              .update({
                drawn_amount: newDrawn,
                percent_complete: pctComplete,
                updated_at: new Date().toISOString(),
              })
              .eq("id", bli.id);

            if (bliError) throw bliError;
          }
        }
      }

      // Update draw request
      const isPartial = totalApproved < draw.amount_requested;
      const { error: drawError } = await supabase
        .from("draw_requests")
        .update({
          amount_approved: totalApproved,
          status: (isPartial ? "partially_approved" : "approved") as any,
          reviewed_at: new Date().toISOString(),
          reviewer_id: currentUserId,
          reviewer_notes: reviewerNotes || null,
        })
        .eq("id", draw.id);

      if (drawError) throw drawError;

      // Update construction budget totals
      if (draw.construction_budget_id) {
        const { data: allItems } = await supabase
          .from("budget_line_items")
          .select("drawn_amount")
          .eq("construction_budget_id", draw.construction_budget_id);

        const newTotalDrawn = (allItems || []).reduce(
          (sum, item) => sum + (item.drawn_amount || 0),
          0
        );

        await supabase
          .from("construction_budgets")
          .update({
            total_drawn: newTotalDrawn,
            updated_at: new Date().toISOString(),
          })
          .eq("id", draw.construction_budget_id);
      }

      toast({ title: "Draw request approved" });
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error approving draw", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Approve Draw #{draw.draw_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Review and set approved amounts for each line item.
          </p>

          <div className="rounded-md border">
            <div className="grid grid-cols-[1fr_100px_100px] gap-2 p-2 bg-muted text-[11px] font-medium text-muted-foreground">
              <span>Line Item</span>
              <span>Requested</span>
              <span>Approved</span>
            </div>
            {drawLineItems.map((dli) => {
              const bli = budgetLineItems.find(
                (b) => b.id === dli.budget_line_item_id
              );
              return (
                <div
                  key={dli.id}
                  className="grid grid-cols-[1fr_100px_100px] gap-2 p-2 border-t items-center"
                >
                  <span className="text-xs">{bli?.category ?? "—"}</span>
                  <span className="text-xs num">
                    {formatCurrency(dli.requested_amount)}
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={dli.requested_amount}
                    value={approvedAmounts[dli.id] || ""}
                    onChange={(e) =>
                      setApprovedAmounts((prev) => ({
                        ...prev,
                        [dli.id]: e.target.value,
                      }))
                    }
                    className="h-7 text-xs num border-green-300 focus-visible:ring-green-400"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2">
            <span className="text-sm text-muted-foreground">Total Approved:</span>
            <span className="text-lg font-bold num">
              {formatCurrency(totalApproved)}
            </span>
          </div>

          <div className="space-y-2">
            <Label>Reviewer Notes (optional)</Label>
            <Textarea
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
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
            {loading ? "Approving..." : "Approve Draw"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Reject Draw Dialog ─────────────────────────────────────────────────

function RejectDrawDialog({
  draw,
  open,
  onOpenChange,
  currentUserId,
  onRefresh,
}: {
  draw: DrawRequest;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentUserId: string;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  async function handleReject() {
    if (!reason.trim()) {
      toast({ title: "Rejection reason is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("draw_requests")
        .update({
          status: "rejected" as any,
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
          reviewer_id: currentUserId,
        })
        .eq("id", draw.id);

      if (error) throw error;

      toast({ title: "Draw request rejected" });
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error rejecting draw", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Draw #{draw.draw_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rejection Reason (required)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this draw request is being rejected..."
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
            disabled={loading || !reason.trim()}
            variant="destructive"
          >
            {loading ? "Rejecting..." : "Reject Draw"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Order Inspection Dialog ──────────────────────────────────────────────

function OrderInspectionDialog({
  draw,
  open,
  onOpenChange,
  onRefresh,
}: {
  draw: DrawRequest;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [inspectorName, setInspectorName] = useState("");
  const [inspectionDate, setInspectionDate] = useState("");

  async function handleSubmit() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("draw_requests")
        .update({
          status: "inspection_ordered" as any,
          inspector_name: inspectorName || null,
          inspection_ordered_date: new Date().toISOString(),
          inspection_date: inspectionDate || null,
        })
        .eq("id", draw.id);

      if (error) throw error;

      toast({ title: "Inspection ordered" });
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error ordering inspection", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order Inspection - Draw #{draw.draw_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Inspector Name</Label>
            <Input
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              placeholder="Inspector or company name"
            />
          </div>
          <div className="space-y-2">
            <Label>Inspection Date</Label>
            <Input
              type="date"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Ordering..." : "Order Inspection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Record Wire Dialog ──────────────────────────────────────────────────

function RecordWireDialog({
  draw,
  open,
  onOpenChange,
  currentUserId,
  onRefresh,
}: {
  draw: DrawRequest;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentUserId: string;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [wireDate, setWireDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [wireAmount, setWireAmount] = useState(
    (draw.amount_approved ?? draw.amount_requested).toString()
  );
  const [confirmationNumber, setConfirmationNumber] = useState("");

  async function handleSubmit() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("draw_requests")
        .update({
          status: "funded" as any,
          wire_date: wireDate,
          wire_amount: parseFloat(wireAmount),
          wire_confirmation_number: confirmationNumber || null,
          wire_initiated_by: currentUserId,
          funded_at: new Date().toISOString(),
        })
        .eq("id", draw.id);

      if (error) throw error;

      toast({ title: "Wire recorded — draw funded" });
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error recording wire", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Wire - Draw #{draw.draw_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Wire Date</Label>
              <Input
                type="date"
                value={wireDate}
                onChange={(e) => setWireDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Wire Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={wireAmount}
                onChange={(e) => setWireAmount(e.target.value)}
                className="num"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Confirmation Number</Label>
            <Input
              value={confirmationNumber}
              onChange={(e) => setConfirmationNumber(e.target.value)}
              placeholder="Wire confirmation #"
              className="num"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Recording..." : "Record Wire"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
