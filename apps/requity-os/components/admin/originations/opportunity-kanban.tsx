"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  OPPORTUNITY_PIPELINE_STAGES,
  OPPORTUNITY_STAGE_LABELS,
  OPPORTUNITY_STAGE_COLORS,
  APPROVAL_STATUS_COLORS,
  LOSS_REASONS,
} from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import { moveOpportunityStageAction } from "@/app/(authenticated)/admin/originations/actions";
import {
  ChevronRight,
  ChevronLeft,
  GripVertical,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

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

export interface StageThreshold {
  stage_key: string;
  warn_days: number;
  alert_days: number;
}

interface OpportunityKanbanProps {
  data: OpportunityRow[];
  stageThresholds?: StageThreshold[];
}

export function OpportunityKanban({ data, stageThresholds = [] }: OpportunityKanbanProps) {
  const [opportunities, setOpportunities] = useState(data);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [lossDialog, setLossDialog] = useState<{
    open: boolean;
    oppId: string;
  }>({ open: false, oppId: "" });
  const [lossReason, setLossReason] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  // Filter quoting column — only show if brokered deals exist
  const hasBrokered = opportunities.some(
    (o) => o.funding_channel === "brokered"
  );
  const visibleStages = OPPORTUNITY_PIPELINE_STAGES.filter(
    (s) => s !== "quoting" || hasBrokered
  );

  function getDaysInStage(changedAt: string | null): number {
    if (!changedAt) return 0;
    const diff = Date.now() - new Date(changedAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  function getDaysColor(days: number, stageKey?: string): string {
    const threshold = stageThresholds.find((t) => t.stage_key === stageKey);
    const warnAt = threshold?.warn_days ?? 3;
    const alertAt = threshold?.alert_days ?? 7;

    if (days >= alertAt) return "bg-red-50 text-red-700";
    if (days >= warnAt) return "bg-amber-50 text-amber-700";
    return "bg-green-50 text-green-700";
  }

  async function moveToStage(oppId: string, newStage: string) {
    const opp = opportunities.find((o) => o.id === oppId);
    if (!opp || opp.stage === newStage) return;

    // If moving to closed_lost, show loss reason dialog
    if (newStage === "closed_lost") {
      setLossDialog({ open: true, oppId });
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
      setOpportunities((prev) =>
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
      toast({
        title: `Deal moved to ${OPPORTUNITY_STAGE_LABELS[newStage] || newStage}`,
      });
    }
    setMovingId(null);
  }

  async function handleCloseLost() {
    if (!lossReason) {
      toast({
        title: "Loss reason required",
        variant: "destructive",
      });
      return;
    }
    setMovingId(lossDialog.oppId);
    const result = await moveOpportunityStageAction(
      lossDialog.oppId,
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
      setOpportunities((prev) =>
        prev.map((o) =>
          o.id === lossDialog.oppId
            ? { ...o, stage: "closed_lost" }
            : o
        )
      );
      toast({ title: "Deal moved to Closed Lost" });
    }
    setMovingId(null);
    setLossDialog({ open: false, oppId: "" });
    setLossReason("");
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, stage: string) {
    e.preventDefault();
    if (draggedId) {
      moveToStage(draggedId, stage);
    }
    setDraggedId(null);
  }

  function formatLoanType(type: string | null): string {
    if (!type) return "";
    return type.toUpperCase() === "DSCR"
      ? "DSCR"
      : type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function getApprovalBadge(status: string | null) {
    if (!status || status === "not_required") return null;
    const colors = APPROVAL_STATUS_COLORS[status] || "";
    const icons: Record<string, React.ReactNode> = {
      pending: <AlertTriangle className="h-2.5 w-2.5" />,
      approved: <CheckCircle className="h-2.5 w-2.5" />,
      auto_approved: <CheckCircle className="h-2.5 w-2.5" />,
      denied: <XCircle className="h-2.5 w-2.5" />,
      auto_flagged: <AlertTriangle className="h-2.5 w-2.5" />,
    };
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${colors}`}
      >
        {icons[status]}
        {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
      </span>
    );
  }

  function getStageIndex(stage: string): number {
    return visibleStages.indexOf(stage as any);
  }

  return (
    <>
      <div className="overflow-x-auto pb-4">
        <div
          className="flex gap-3"
          style={{ minWidth: `${visibleStages.length * 240}px` }}
        >
          {visibleStages.map((stage) => {
            const stageOpps = opportunities.filter((o) => o.stage === stage);
            const totalVolume = stageOpps.reduce(
              (sum, o) => sum + (o.proposed_loan_amount || 0),
              0
            );

            return (
              <div
                key={stage}
                className="flex-1 min-w-[230px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
              >
                <div className="bg-slate-100 rounded-lg p-3">
                  {/* Column header */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">
                        {OPPORTUNITY_STAGE_LABELS[stage]}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {stageOpps.length}
                      </Badge>
                    </div>
                    {stageOpps.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatCurrency(totalVolume)}
                      </p>
                    )}
                  </div>

                  {/* Deal cards */}
                  <div className="space-y-2 min-h-[100px]">
                    {stageOpps.map((opp) => {
                      const stageIdx = getStageIndex(opp.stage);
                      const canMoveLeft = stageIdx > 0;
                      const canMoveRight = stageIdx < visibleStages.length - 1;
                      const days = getDaysInStage(opp.stage_changed_at);
                      const isMoving = movingId === opp.id;

                      return (
                        <Card
                          key={opp.id}
                          className={`cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all ${isMoving ? "opacity-50" : ""}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, opp.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-1">
                              <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() =>
                                  router.push(
                                    `/admin/pipeline/debt/${opp.id}`
                                  )
                                }
                              >
                                {/* Deal name / property address */}
                                <p className="text-sm font-medium text-foreground truncate">
                                  {opp.deal_name ||
                                    opp.property_address ||
                                    "Untitled Deal"}
                                </p>

                                {/* Loan type + amount + LTV */}
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs font-semibold text-foreground">
                                    {formatCurrency(
                                      opp.proposed_loan_amount
                                    )}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {opp.loan_type && (
                                      <span className="text-[10px] text-muted-foreground">
                                        {formatLoanType(opp.loan_type)}
                                      </span>
                                    )}
                                    {opp.proposed_ltv && (
                                      <span className="text-[10px] text-muted-foreground">
                                        {opp.proposed_ltv}%
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Borrower name */}
                                {opp.borrower_name && (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {opp.borrower_name}
                                  </p>
                                )}

                                {/* Days in stage + approval */}
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span
                                    className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${getDaysColor(days, opp.stage)}`}
                                  >
                                    <Clock className="h-2.5 w-2.5" />
                                    {days}d
                                  </span>
                                  {getApprovalBadge(opp.approval_status)}
                                </div>

                                {/* Originator */}
                                {opp.originator_name && (
                                  <div className="flex items-center gap-1 mt-1.5">
                                    <User className="h-2.5 w-2.5 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground truncate">
                                      {opp.originator_name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Stage move buttons */}
                            <div className="flex justify-between mt-2 pt-2 border-t">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={!canMoveLeft || isMoving}
                                onClick={() =>
                                  moveToStage(
                                    opp.id,
                                    visibleStages[stageIdx - 1]
                                  )
                                }
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={!canMoveRight || isMoving}
                                onClick={() =>
                                  moveToStage(
                                    opp.id,
                                    visibleStages[stageIdx + 1]
                                  )
                                }
                              >
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
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
            setLossDialog({ open: false, oppId: "" });
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
                {LOSS_REASONS.map((r) => (
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
                setLossDialog({ open: false, oppId: "" });
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
