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
import type { Database } from "@/lib/supabase/types";
import {
  OPPORTUNITY_STAGE_LABELS,
  APPROVAL_STATUS_COLORS,
  LOSS_REASONS,
} from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import {
  moveOpportunityStageAction,
  moveLoanStageAction,
} from "@/app/(authenticated)/admin/pipeline/actions";
import {
  GripVertical,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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

// Opportunity phase stages — cards from the opportunities table
const OPPORTUNITY_PHASES = ["awaiting_info", "quoting", "uw", "offer_placed"];
// Loan phase stages — cards from the loans table
const LOAN_PHASES = [
  "application",
  "processing",
  "underwriting",
  "approved",
  "clear_to_close",
  "funded",
];

export function DebtKanban({
  stageConfigs,
  opportunities,
  loans,
  view,
}: DebtKanbanProps) {
  const [oppData, setOppData] = useState(opportunities);
  const [loanData, setLoanData] = useState(loans);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<"opp" | "loan" | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [lossDialog, setLossDialog] = useState<{
    open: boolean;
    id: string;
    source: "opp" | "loan";
  }>({ open: false, id: "", source: "opp" });
  const [lossReason, setLossReason] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const nonTerminalStages = stageConfigs.filter((s) => !s.is_terminal);
  const allStageKeys = nonTerminalStages.map((s) => s.stage_key);

  function getDaysInStage(changedAt: string | null): number {
    if (!changedAt) return 0;
    const diff = Date.now() - new Date(changedAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  function getDaysColor(days: number): string {
    if (days <= 3) return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300";
    if (days <= 7) return "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
    return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300";
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

  // ── Drag & Drop ───────────────────────────────────────────────────

  function handleDragStart(
    e: React.DragEvent,
    id: string,
    source: "opp" | "loan"
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

    const isOppPhase = OPPORTUNITY_PHASES.includes(stageKey);
    const isLoanPhase = LOAN_PHASES.includes(stageKey);

    // Don't allow moving opportunity cards to loan-phase columns or vice versa
    if (dragSource === "opp" && !isOppPhase && stageKey !== "closed_lost") {
      toast({
        title: "Cannot move to loan phase",
        description:
          "Opportunity deals must be converted to loans before entering active loan stages.",
        variant: "destructive",
      });
      setDraggedId(null);
      setDragSource(null);
      return;
    }
    if (dragSource === "loan" && !isLoanPhase && stageKey !== "closed_lost") {
      toast({
        title: "Cannot move to opportunity phase",
        description: "Active loans cannot be moved back to opportunity stages.",
        variant: "destructive",
      });
      setDraggedId(null);
      setDragSource(null);
      return;
    }

    if (dragSource === "opp") {
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
      setLossDialog({ open: true, id: oppId, source: "opp" });
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
            ? { ...o, stage: newStage, stage_changed_at: new Date().toISOString() }
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
    if (!loan || loan.stage === newStage) return;

    setMovingId(loanId);
    const result = await moveLoanStageAction(loanId, newStage as Database["public"]["Enums"]["loan_status"]);
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
                stage: newStage,
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

    if (lossDialog.source === "opp") {
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
    setLossDialog({ open: false, id: "", source: "opp" });
    setLossReason("");
  }

  // ── List View ─────────────────────────────────────────────────────

  if (view === "list") {
    const allItems = [
      ...oppData.map((o) => ({
        id: o.id,
        type: "opportunity" as const,
        name: o.deal_name || o.property_address || "Untitled",
        stage: o.stage,
        amount: o.proposed_loan_amount,
        loanType: o.loan_type,
        assignee: o.originator_name,
        daysInStage: getDaysInStage(o.stage_changed_at),
        createdAt: o.created_at,
        address: [o.property_city, o.property_state]
          .filter(Boolean)
          .join(", "),
      })),
      ...loanData.map((l) => ({
        id: l.id,
        type: "loan" as const,
        name: l.borrower_name || l.property_address || "Untitled",
        stage: l.stage,
        amount: l.loan_amount,
        loanType: l.loan_type,
        assignee: l.originator_name,
        daysInStage: getDaysInStage(l.stage_updated_at),
        createdAt: l.created_at,
        address: [l.property_city, l.property_state]
          .filter(Boolean)
          .join(", "),
      })),
    ];

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
                  Location
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
                const stageLabel =
                  nonTerminalStages.find((s) => s.stage_key === item.stage)
                    ?.label ?? item.stage;
                const stageColor =
                  nonTerminalStages.find((s) => s.stage_key === item.stage)
                    ?.color ?? "bg-slate-100 text-slate-800";
                return (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() =>
                      router.push(
                        item.type === "opportunity"
                          ? `/admin/originations/${item.id}`
                          : `/admin/loans/${item.id}`
                      )
                    }
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground truncate max-w-[200px]">
                        {item.name}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${stageColor}`}
                      >
                        {stageLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatLoanType(item.loanType)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[150px]">
                      {item.address || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.assignee || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${getDaysColor(item.daysInStage)}`}
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

  // Determine the divider index — where opportunity phases end and loan phases begin
  const oppPhaseConfigs = nonTerminalStages.filter((s) =>
    OPPORTUNITY_PHASES.includes(s.stage_key)
  );
  const loanPhaseConfigs = nonTerminalStages.filter((s) =>
    LOAN_PHASES.includes(s.stage_key)
  );

  return (
    <>
      <div className="overflow-x-auto pb-4">
        <div
          className="flex gap-3"
          style={{
            minWidth: `${nonTerminalStages.length * 240 + 40}px`,
          }}
        >
          {/* Opportunity Phase Columns */}
          {oppPhaseConfigs.map((config) => {
            const stageOpps = oppData.filter(
              (o) => o.stage === config.stage_key
            );
            const totalVolume = stageOpps.reduce(
              (sum, o) => sum + (o.proposed_loan_amount || 0),
              0
            );
            const stageIdx = allStageKeys.indexOf(config.stage_key);

            return (
              <div
                key={config.stage_key}
                className="flex-1 min-w-[230px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, config.stage_key)}
              >
                <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3">
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">
                        {config.label}
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
                  <div className="space-y-2 min-h-[100px]">
                    {stageOpps.map((opp) => {
                      const days = getDaysInStage(opp.stage_changed_at);
                      const isMoving = movingId === opp.id;
                      const oppStages = oppPhaseConfigs.map((s) => s.stage_key);
                      const oppIdx = oppStages.indexOf(opp.stage);

                      return (
                        <Card
                          key={opp.id}
                          className={`cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all ${isMoving ? "opacity-50" : ""}`}
                          draggable
                          onDragStart={(e) =>
                            handleDragStart(e, opp.id, "opp")
                          }
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-1">
                              <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() =>
                                  router.push(
                                    `/admin/originations/${opp.id}`
                                  )
                                }
                              >
                                <p className="text-sm font-medium text-foreground truncate">
                                  {opp.deal_name ||
                                    opp.property_address ||
                                    "Untitled Deal"}
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs font-semibold text-foreground">
                                    {formatCurrency(opp.proposed_loan_amount)}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {opp.loan_type && (
                                      <span className="text-[10px] text-muted-foreground">
                                        {formatLoanType(opp.loan_type)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {opp.borrower_name && (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {opp.borrower_name}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span
                                    className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${getDaysColor(days)}`}
                                  >
                                    <Clock className="h-2.5 w-2.5" />
                                    {days}d
                                  </span>
                                  {getApprovalBadge(opp.approval_status)}
                                </div>
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
                            <div className="flex justify-between mt-2 pt-2 border-t">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={oppIdx <= 0 || isMoving}
                                onClick={() =>
                                  moveOppToStage(
                                    opp.id,
                                    oppStages[oppIdx - 1]
                                  )
                                }
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={
                                  oppIdx >= oppStages.length - 1 || isMoving
                                }
                                onClick={() =>
                                  moveOppToStage(
                                    opp.id,
                                    oppStages[oppIdx + 1]
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

          {/* Phase Divider */}
          {oppPhaseConfigs.length > 0 && loanPhaseConfigs.length > 0 && (
            <div className="flex flex-col items-center justify-start pt-8 px-1">
              <div className="w-px h-16 bg-border" />
              <div className="text-[10px] text-muted-foreground font-medium whitespace-nowrap rotate-0 my-2 px-1">
                Originations | Active Loans
              </div>
              <div className="w-px flex-1 bg-border" />
            </div>
          )}

          {/* Loan Phase Columns */}
          {loanPhaseConfigs.map((config) => {
            const stageLoans = loanData.filter(
              (l) => l.stage === config.stage_key
            );
            const totalVolume = stageLoans.reduce(
              (sum, l) => sum + (l.loan_amount || 0),
              0
            );

            return (
              <div
                key={config.stage_key}
                className="flex-1 min-w-[230px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, config.stage_key)}
              >
                <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3">
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">
                        {config.label}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {stageLoans.length}
                      </Badge>
                    </div>
                    {stageLoans.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatCurrency(totalVolume)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 min-h-[100px]">
                    {stageLoans.map((loan) => {
                      const days = getDaysInStage(loan.stage_updated_at);
                      const isMoving = movingId === loan.id;
                      const loanStages = loanPhaseConfigs.map(
                        (s) => s.stage_key
                      );
                      const loanIdx = loanStages.indexOf(loan.stage);
                      const conditionPct =
                        loan.total_conditions > 0
                          ? Math.round(
                              (loan.approved_conditions /
                                loan.total_conditions) *
                                100
                            )
                          : 0;

                      return (
                        <Card
                          key={loan.id}
                          className={`cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all ${isMoving ? "opacity-50" : ""}`}
                          draggable
                          onDragStart={(e) =>
                            handleDragStart(e, loan.id, "loan")
                          }
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-1">
                              <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() =>
                                  router.push(`/admin/loans/${loan.id}`)
                                }
                              >
                                <p className="text-sm font-medium text-foreground truncate">
                                  {loan.borrower_name || "Untitled Loan"}
                                </p>
                                {loan.property_address && (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {loan.property_address}
                                  </p>
                                )}
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs font-semibold text-foreground">
                                    {formatCurrency(loan.loan_amount)}
                                  </span>
                                  {loan.loan_type && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {formatLoanType(loan.loan_type)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span
                                    className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${getDaysColor(days)}`}
                                  >
                                    <Clock className="h-2.5 w-2.5" />
                                    {days}d
                                  </span>
                                  {loan.total_conditions > 0 && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                      {loan.approved_conditions}/
                                      {loan.total_conditions}
                                    </span>
                                  )}
                                </div>
                                {/* Condition progress bar */}
                                {loan.total_conditions > 0 && (
                                  <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary rounded-full transition-all"
                                      style={{
                                        width: `${conditionPct}%`,
                                      }}
                                    />
                                  </div>
                                )}
                                {loan.originator_name && (
                                  <div className="flex items-center gap-1 mt-1.5">
                                    <User className="h-2.5 w-2.5 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground truncate">
                                      {loan.originator_name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between mt-2 pt-2 border-t">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={loanIdx <= 0 || isMoving}
                                onClick={() =>
                                  moveLoanToStage(
                                    loan.id,
                                    loanStages[loanIdx - 1]
                                  )
                                }
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={
                                  loanIdx >= loanStages.length - 1 || isMoving
                                }
                                onClick={() =>
                                  moveLoanToStage(
                                    loan.id,
                                    loanStages[loanIdx + 1]
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
            setLossDialog({ open: false, id: "", source: "opp" });
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
                setLossDialog({ open: false, id: "", source: "opp" });
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
