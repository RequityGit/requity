"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { LOAN_STAGES, LOAN_STAGE_LABELS, LoanStage } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import {
  ChevronRight,
  ChevronLeft,
  GripVertical,
} from "lucide-react";

interface LoanRow {
  id: string;
  loan_number: string | null;
  property_address: string | null;
  borrower_name: string;
  loan_amount: number;
  stage: string;
  created_at: string;
}

interface LoanKanbanProps {
  data: LoanRow[];
}

// Only show pipeline stages in kanban (exclude terminal states)
const KANBAN_STAGES = LOAN_STAGES.filter(
  (s) => !["payoff", "default", "reo", "paid_off"].includes(s)
);

export function LoanKanban({ data }: LoanKanbanProps) {
  const [loans, setLoans] = useState(data);
  const [draggedLoan, setDraggedLoan] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  function getDaysInStage(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  async function moveToStage(loanId: string, newStage: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("loans")
      .update({ stage: newStage, stage_updated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", loanId);

    if (error) {
      toast({
        title: "Error moving loan",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, stage: newStage } : l))
    );
    toast({ title: `Loan moved to ${LOAN_STAGE_LABELS[newStage as LoanStage] || newStage}` });
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
    return (KANBAN_STAGES as readonly string[]).indexOf(stage);
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-[1200px]">
        {KANBAN_STAGES.map((stage) => {
          const stageLoans = loans.filter((l) => l.stage === stage);
          return (
            <div
              key={stage}
              className="flex-1 min-w-[220px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <div className="bg-slate-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#1a2b4a]">
                    {LOAN_STAGE_LABELS[stage]}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {stageLoans.length}
                  </Badge>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {stageLoans.map((loan) => {
                    const stageIdx = getStageIndex(loan.stage);
                    const canMoveLeft = stageIdx > 0;
                    const canMoveRight = stageIdx < KANBAN_STAGES.length - 1;

                    return (
                      <Card
                        key={loan.id}
                        className="cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow"
                        draggable
                        onDragStart={(e) => handleDragStart(e, loan.id)}
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
                              <p className="text-sm font-medium text-[#1a2b4a] truncate">
                                {loan.property_address ?? "—"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {loan.borrower_name}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs font-medium">
                                  {formatCurrency(loan.loan_amount)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {getDaysInStage(loan.created_at)}d
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* Stage move buttons */}
                          <div className="flex justify-between mt-2 pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              disabled={!canMoveLeft}
                              onClick={() =>
                                moveToStage(
                                  loan.id,
                                  KANBAN_STAGES[stageIdx - 1]
                                )
                              }
                            >
                              <ChevronLeft className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              disabled={!canMoveRight}
                              onClick={() =>
                                moveToStage(
                                  loan.id,
                                  KANBAN_STAGES[stageIdx + 1]
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
