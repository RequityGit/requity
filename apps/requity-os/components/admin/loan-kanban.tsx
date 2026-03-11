"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import {
  PIPELINE_STAGES,
  LOAN_STAGE_LABELS,
  LoanStage,
  getDaysInStageBg,
  PRIORITY_COLORS,
  LoanPriority,
} from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import {
  ChevronRight,
  ChevronLeft,
  GripVertical,
  Clock,
  FileText,
  Flame,
  Pause,
  AlertCircle,
  User,
} from "lucide-react";

export interface PipelineLoanRow {
  id: string;
  loan_number: string | null;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  borrower_name: string;
  borrower_id: string;
  loan_amount: number;
  loan_type: string | null;
  stage: string;
  stage_updated_at: string;
  created_at: string;
  priority: string;
  next_action: string | null;
  originator_name: string | null;
  processor_name: string | null;
  document_count: number;
  total_conditions: number;
}

interface LoanKanbanProps {
  data: PipelineLoanRow[];
  currentUserId: string;
}

export function LoanKanban({ data, currentUserId }: LoanKanbanProps) {
  const [loans, setLoans] = useState(data);
  const [draggedLoan, setDraggedLoan] = useState<string | null>(null);
  const [movingLoanId, setMovingLoanId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  function getDaysInStage(stageUpdatedAt: string): number {
    const updated = new Date(stageUpdatedAt);
    const now = new Date();
    return Math.floor(
      (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  async function moveToStage(loanId: string, newStage: string) {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan || loan.stage === newStage) return;

    setMovingLoanId(loanId);
    const supabase = createClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("loans")
      .update({
        stage: newStage as any,
        stage_updated_at: now,
        updated_at: now,
      })
      .eq("id", loanId);

    if (error) {
      const isSchemaError = error.message?.includes("schema cache") || error.message?.includes("Could not find the");
      toast({
        title: "Error moving loan",
        description: isSchemaError
          ? "Database schema needs to be refreshed. Please contact your administrator to reload the Supabase schema cache."
          : error.message,
        variant: "destructive",
      });
      setMovingLoanId(null);
      return;
    }

    // Log the stage change
    await supabase.from("loan_activity_log").insert({
      loan_id: loanId,
      performed_by: currentUserId,
      action: "stage_change",
      description: `Moved from ${LOAN_STAGE_LABELS[loan.stage as LoanStage] || loan.stage} to ${LOAN_STAGE_LABELS[newStage as LoanStage] || newStage}`,
    });

    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? { ...l, stage: newStage, stage_updated_at: now }
          : l
      )
    );
    setMovingLoanId(null);
    toast({
      title: `Loan moved to ${LOAN_STAGE_LABELS[newStage as LoanStage] || newStage}`,
    });
  }

  function handleDragStart(e: React.DragEvent, loanId: string) {
    setDraggedLoan(loanId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, stage: string) {
    e.preventDefault();
    if (draggedLoan) {
      const loan = loans.find((l) => l.id === draggedLoan);
      if (loan && loan.stage !== stage) {
        moveToStage(draggedLoan, stage);
      }
    }
    setDraggedLoan(null);
  }

  function getStageIndex(stage: string): number {
    return (PIPELINE_STAGES as readonly string[]).indexOf(stage);
  }

  function getPriorityIcon(priority: string) {
    if (priority === "hot") return <Flame className="h-3 w-3 text-red-500" />;
    if (priority === "on_hold")
      return <Pause className="h-3 w-3 text-amber-500" />;
    return null;
  }

  function formatLoanType(type: string | null): string {
    if (!type) return "";
    return type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace("Dscr", "DSCR");
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-[1400px]">
        {PIPELINE_STAGES.map((stage) => {
          const stageLoans = loans.filter((l) => l.stage === stage);
          const totalVolume = stageLoans.reduce(
            (sum, l) => sum + l.loan_amount,
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
                      {LOAN_STAGE_LABELS[stage]}
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

                {/* Loan cards */}
                <div className="space-y-2 min-h-[100px]">
                  {stageLoans.map((loan) => {
                    const stageIdx = getStageIndex(loan.stage);
                    const canMoveLeft = stageIdx > 0;
                    const canMoveRight =
                      stageIdx < PIPELINE_STAGES.length - 1;
                    const days = getDaysInStage(loan.stage_updated_at);
                    const isMoving = movingLoanId === loan.id;

                    return (
                      <Card
                        key={loan.id}
                        className={`cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all ${
                          isMoving ? "opacity-50" : ""
                        } ${
                          loan.priority === "hot"
                            ? "border-l-2 border-l-red-400"
                            : loan.priority === "on_hold"
                              ? "border-l-2 border-l-amber-400"
                              : ""
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, loan.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-1">
                            <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() =>
                                router.push(`/admin/pipeline/${loan.id}`)
                              }
                            >
                              {/* Property address */}
                              <div className="flex items-center gap-1">
                                {getPriorityIcon(loan.priority)}
                                <p className="text-sm font-medium text-foreground truncate">
                                  {loan.property_address ?? "No address"}
                                </p>
                              </div>

                              {/* Borrower name */}
                              <p className="text-xs text-muted-foreground truncate">
                                {loan.borrower_name}
                              </p>

                              {/* Loan amount and type */}
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-xs font-semibold text-foreground">
                                  {formatCurrency(loan.loan_amount)}
                                </span>
                                {loan.loan_type && (
                                  <span className="text-[10px] text-muted-foreground truncate ml-1">
                                    {formatLoanType(loan.loan_type)}
                                  </span>
                                )}
                              </div>

                              {/* Days in stage + doc count */}
                              <div className="flex items-center gap-2 mt-1.5">
                                <span
                                  className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${getDaysInStageBg(days)}`}
                                >
                                  <Clock className="h-2.5 w-2.5" />
                                  {days}d
                                </span>
                                {loan.total_conditions > 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                    <FileText className="h-2.5 w-2.5" />
                                    {loan.document_count}/{loan.total_conditions}
                                  </span>
                                )}
                              </div>

                              {/* Assigned team member */}
                              {(loan.processor_name || loan.originator_name) && (
                                <div className="flex items-center gap-1 mt-1.5">
                                  <User className="h-2.5 w-2.5 text-muted-foreground" />
                                  <span className="text-[10px] text-muted-foreground truncate">
                                    {loan.processor_name || loan.originator_name}
                                  </span>
                                </div>
                              )}

                              {/* Next action / blocker */}
                              {loan.next_action && (
                                <div className="flex items-start gap-1 mt-1.5 bg-amber-50 rounded px-1.5 py-1">
                                  <AlertCircle className="h-2.5 w-2.5 text-amber-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-[10px] text-amber-700 line-clamp-2">
                                    {loan.next_action}
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
                                  loan.id,
                                  PIPELINE_STAGES[stageIdx - 1]
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
                                  loan.id,
                                  PIPELINE_STAGES[stageIdx + 1]
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
  );
}
