"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { formatCurrency } from "@/lib/format";
import { formatCompactCurrency } from "@/lib/format";
import type { Database } from "@/lib/supabase/types";
import { LOSS_REASONS } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import {
  moveOpportunityStageAction,
  moveLoanStageAction,
} from "@/app/(authenticated)/admin/pipeline/actions";
import { PipelineCard } from "./pipeline-card";
import type { PipelineDeal } from "./pipeline-card";
import type { StageConfig, LoanRow } from "./unified-pipeline";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface OpportunityRow {
  id: string;
  deal_name: string | null;
  stage: string;
  loan_type: string | null;
  loan_purpose: string | null;
  funding_channel: string | null;
  proposed_loan_amount: number | null;
  proposed_ltv: number | null;
  approval_status: string | null;
  stage_changed_at: string | null;
  created_at: string;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  property_type: string | null;
  number_of_units: number | null;
  entity_name: string | null;
  borrower_name: string | null;
  borrower_count: number | null;
  originator_name: string | null;
  processor_name: string | null;
}

interface DebtKanbanProps {
  stageConfigs: StageConfig[];
  opportunities: OpportunityRow[];
  loans: LoanRow[];
  view: "board" | "list";
}

// Map loan_status enum values to unified pipeline stages
const LOAN_TO_PIPELINE_STAGE: Record<string, string> = {
  lead: "awaiting_info",
  application: "uw_needs_approval",
  processing: "processing",
  underwriting: "uw",
  approved: "offer_placed",
  clear_to_close: "processing",
  funded: "closed",
};

// Stages excluded from the pipeline view (post-close / terminal)
const EXCLUDED_LOAN_STAGES = [
  "servicing",
  "payoff",
  "default",
  "reo",
  "paid_off",
  "note_sold",
  "withdrawn",
  "denied",
];

function getDaysInStage(changedAt: string | null): number {
  if (!changedAt) return 0;
  const diff = Date.now() - new Date(changedAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function DebtKanban({
  stageConfigs,
  opportunities,
  loans,
  view,
}: DebtKanbanProps) {
  const [oppData, setOppData] = useState(opportunities);
  const [loanData, setLoanData] = useState(loans);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<"opportunity" | "loan" | null>(
    null
  );
  const [movingId, setMovingId] = useState<string | null>(null);
  const [lossDialog, setLossDialog] = useState<{
    open: boolean;
    id: string;
    source: "opportunity" | "loan";
  }>({ open: false, id: "", source: "opportunity" });
  const [lossReason, setLossReason] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const nonTerminalStages = stageConfigs.filter((s) => !s.is_terminal);
  const allStageKeys = nonTerminalStages.map((s) => s.stage_key);

  // ── Build unified deal list ─────────────────────────────────────

  const unifiedDeals: PipelineDeal[] = useMemo(() => {
    const oppDeals: PipelineDeal[] = oppData
      .filter((o) => !["closed_lost"].includes(o.stage))
      .map((o) => ({
        id: o.id,
        source: "opportunity" as const,
        dealName:
          o.deal_name || o.property_address || "Untitled Deal",
        companyName: o.entity_name,
        borrowerName: o.borrower_name,
        amount: o.proposed_loan_amount,
        loanType: o.loan_type,
        pipelineStage: o.stage,
        rawStage: o.stage,
        stageChangedAt: o.stage_changed_at,
        assignedName: o.originator_name,
        docsApproved: 0,
        docsTotal: 0,
      }));

    const loanDeals: PipelineDeal[] = loanData
      .filter((l) => !EXCLUDED_LOAN_STAGES.includes(l.stage))
      .filter((l) => LOAN_TO_PIPELINE_STAGE[l.stage] !== undefined)
      .map((l) => ({
        id: l.id,
        source: "loan" as const,
        dealName:
          l.borrower_name || l.property_address || "Untitled Loan",
        companyName: null,
        borrowerName: l.borrower_name || null,
        amount: l.loan_amount,
        loanType: l.loan_type,
        pipelineStage: LOAN_TO_PIPELINE_STAGE[l.stage] || l.stage,
        rawStage: l.stage,
        stageChangedAt: l.stage_updated_at,
        assignedName: l.originator_name,
        docsApproved: l.approved_conditions,
        docsTotal: l.total_conditions,
      }));

    return [...oppDeals, ...loanDeals];
  }, [oppData, loanData]);

  // ── Drag & Drop ───────────────────────────────────────────────────

  function handleDragStart(
    e: React.DragEvent,
    id: string,
    source: "opportunity" | "loan"
  ) {
    setDraggedId(id);
    setDragSource(source);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, stageKey: string) {
    e.preventDefault();
    if (!draggedId || !dragSource) return;

    if (dragSource === "opportunity") {
      moveOppToStage(draggedId, stageKey);
    } else {
      moveLoanToStage(draggedId, stageKey);
    }
    setDraggedId(null);
    setDragSource(null);
  }

  // ── Stage Moves ───────────────────────────────────────────────────

  async function moveOppToStage(oppId: string, newStage: string) {
    const opp = oppData.find((o) => o.id === oppId);
    if (!opp || opp.stage === newStage) return;

    if (newStage === "closed_lost") {
      setLossDialog({ open: true, id: oppId, source: "opportunity" });
      return;
    }

    setMovingId(oppId);
    const result = await moveOpportunityStageAction(oppId, newStage);
    if (result.error) {
      toast({
        title: "Error moving deal",
        description: result.error,
        variant: "destructive",
      });
    } else {
      setOppData((prev) =>
        prev.map((o) =>
          o.id === oppId
            ? {
                ...o,
                stage: newStage,
                stage_changed_at: new Date().toISOString(),
              }
            : o
        )
      );
      const label =
        nonTerminalStages.find((s) => s.stage_key === newStage)?.label ||
        newStage;
      toast({ title: `Deal moved to ${label}` });
    }
    setMovingId(null);
  }

  async function moveLoanToStage(loanId: string, newStage: string) {
    const loan = loanData.find((l) => l.id === loanId);
    if (!loan) return;

    // For loans, we need to reverse-map the pipeline stage to a loan_status
    // The loan stays with its real stage in the DB; we just update the display
    // For now, loans can only be moved if the target is a valid loan stage
    const reverseLoanStage = Object.entries(LOAN_TO_PIPELINE_STAGE).find(
      ([, pipelineStage]) => pipelineStage === newStage
    );

    if (!reverseLoanStage) {
      toast({
        title: "Cannot move loan to this stage",
        description: "This stage is not available for active loans.",
        variant: "destructive",
      });
      return;
    }

    const actualLoanStage = reverseLoanStage[0];
    if (loan.stage === actualLoanStage) return;

    setMovingId(loanId);
    const result = await moveLoanStageAction(
      loanId,
      actualLoanStage as Database["public"]["Enums"]["loan_status"]
    );
    if (result.error) {
      toast({
        title: "Error moving loan",
        description: result.error,
        variant: "destructive",
      });
    } else {
      setLoanData((prev) =>
        prev.map((l) =>
          l.id === loanId
            ? {
                ...l,
                stage: actualLoanStage,
                stage_updated_at: new Date().toISOString(),
              }
            : l
        )
      );
      const label =
        nonTerminalStages.find((s) => s.stage_key === newStage)?.label ||
        newStage;
      toast({ title: `Loan moved to ${label}` });
    }
    setMovingId(null);
  }

  async function handleCloseLost() {
    if (!lossReason) {
      toast({ title: "Loss reason required", variant: "destructive" });
      return;
    }
    setMovingId(lossDialog.id);

    if (lossDialog.source === "opportunity") {
      const result = await moveOpportunityStageAction(
        lossDialog.id,
        "closed_lost",
        lossReason
      );
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setOppData((prev) =>
          prev.map((o) =>
            o.id === lossDialog.id ? { ...o, stage: "closed_lost" } : o
          )
        );
        toast({ title: "Deal moved to Closed Lost" });
      }
    }
    setMovingId(null);
    setLossDialog({ open: false, id: "", source: "opportunity" });
    setLossReason("");
  }

  // ── List View ─────────────────────────────────────────────────────

  if (view === "list") {
    const allItems = unifiedDeals.map((d) => ({
      ...d,
      daysInStage: getDaysInStage(d.stageChangedAt),
    }));

    return (
      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Deal
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Stage
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Type
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Borrower
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Assigned
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Days
                </th>
              </tr>
            </thead>
            <tbody>
              {allItems.map((item) => {
                const stageConfig = nonTerminalStages.find(
                  (s) => s.stage_key === item.pipelineStage
                );
                const stageLabel = stageConfig?.label ?? item.pipelineStage;
                const dotColor = stageConfig?.color ?? "#9B9BA0";
                return (
                  <tr
                    key={`${item.source}-${item.id}`}
                    className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/loans/${item.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground truncate max-w-[200px]">
                        {item.dealName}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                        <span
                          className="inline-block rounded-full flex-shrink-0"
                          style={{
                            width: "7px",
                            height: "7px",
                            backgroundColor: dotColor,
                          }}
                        />
                        {stageLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground uppercase text-xs">
                      {item.loanType?.replace(/_/g, " ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[150px]">
                      {item.borrowerName || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.assignedName || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className="font-mono"
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: "5px",
                          color:
                            item.daysInStage >= 10
                              ? "#E5453D"
                              : item.daysInStage >= 5
                                ? "#D97706"
                                : "#9B9BA0",
                          backgroundColor:
                            item.daysInStage >= 10
                              ? "rgba(229,69,61,0.07)"
                              : item.daysInStage >= 5
                                ? "rgba(217,119,6,0.07)"
                                : "rgba(0,0,0,0.03)",
                        }}
                      >
                        {item.daysInStage}d
                      </span>
                    </td>
                  </tr>
                );
              })}
              {allItems.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No deals found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Board View ────────────────────────────────────────────────────

  return (
    <>
      <div className="overflow-x-auto" style={{ paddingBottom: "40px" }}>
        <div className="flex" style={{ gap: "10px" }}>
          {nonTerminalStages.map((config) => {
            const stageDeals = unifiedDeals.filter(
              (d) => d.pipelineStage === config.stage_key
            );
            const totalVolume = stageDeals.reduce(
              (sum, d) => sum + (d.amount || 0),
              0
            );
            const dotColor = config.color;

            return (
              <div
                key={config.stage_key}
                className="flex-shrink-0"
                style={{
                  minWidth: "264px",
                  maxWidth: "280px",
                  flex: "1 0 264px",
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, config.stage_key)}
              >
                {/* Column header */}
                <div
                  style={{
                    padding: "14px 4px",
                    marginBottom: "8px",
                    borderBottom: `2px solid ${dotColor}26`,
                  }}
                >
                  {/* Row 1: dot + label + count pill */}
                  <div className="flex items-center" style={{ gap: "8px" }}>
                    <span
                      className="flex-shrink-0 rounded-full"
                      style={{
                        width: "7px",
                        height: "7px",
                        backgroundColor: dotColor,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#1A1A1A",
                      }}
                    >
                      {config.label}
                    </span>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#9B9BA0",
                        backgroundColor: "#EFEFEF",
                        padding: "1px 7px",
                        borderRadius: "5px",
                      }}
                    >
                      {stageDeals.length}
                    </span>
                  </div>
                  {/* Row 2: dollar volume */}
                  <div
                    className="font-mono"
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#6B6B6F",
                      marginTop: "4px",
                      paddingLeft: "15px",
                    }}
                  >
                    {formatCompactCurrency(totalVolume)}
                  </div>
                </div>

                {/* Cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {stageDeals.length === 0 ? (
                    /* Empty state */
                    <div
                      style={{
                        border: "1px dashed #E5E5E7",
                        borderRadius: "10px",
                        backgroundColor: "rgba(0,0,0,0.01)",
                        padding: "24px 12px",
                        textAlign: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 450,
                          color: "#9B9BA0",
                        }}
                      >
                        No deals
                      </span>
                    </div>
                  ) : (
                    stageDeals.map((deal, cardIndex) => (
                      <div
                        key={`${deal.source}-${deal.id}`}
                        draggable
                        className="cursor-grab active:cursor-grabbing"
                        onDragStart={(e) =>
                          handleDragStart(e, deal.id, deal.source)
                        }
                      >
                        <PipelineCard
                          deal={deal}
                          index={cardIndex}
                          isDragging={movingId === deal.id}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Closed Lost Dialog */}
      <Dialog
        open={lossDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setLossDialog({ open: false, id: "", source: "opportunity" });
            setLossReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Deal as Lost</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Loss Reason *</label>
            <Select value={lossReason} onValueChange={setLossReason}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {LOSS_REASONS.map((r: { value: string; label: string }) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLossDialog({ open: false, id: "", source: "opportunity" });
                setLossReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCloseLost}
              disabled={!lossReason}
            >
              Close as Lost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
