"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { ClipboardCheck, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { RailConditionItem } from "./RailConditionItem";
import { ConditionDetailPanel } from "./ConditionDetailPanel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addDealConditionAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
import { showSuccess, showError } from "@/lib/toast";
import type {
  DealConditionRow,
  ConditionDocument,
} from "./useActionCenterData";

// ── Stage filter constants (5 deal stages from kanban) ──

const DEAL_STAGES = [
  { key: "lead", label: "Lead" },
  { key: "analysis", label: "Analysis" },
  { key: "negotiation", label: "Negotiation" },
  { key: "execution", label: "Execution" },
  { key: "closed", label: "Closed" },
] as const;

/**
 * Maps each condition's required_stage to the deal stage it belongs to.
 * Conditions use granular stages (loan_intake, processing, etc.),
 * but we filter by the 5 deal stages.
 */
const CONDITION_STAGE_TO_DEAL_STAGE: Record<string, string> = {
  loan_intake: "lead",
  processing: "negotiation",
  closed_onboarding: "execution",
  note_sell_process: "closed",
  post_loan_payoff: "closed",
  prior_to_approval: "analysis",
  prior_to_funding: "execution",
  fundraising: "negotiation",
};

type StageFilter =
  | "lead"
  | "analysis"
  | "negotiation"
  | "execution"
  | "closed"
  | "all";

interface ActionCenterRailProps {
  conditions: DealConditionRow[];
  conditionDocs: ConditionDocument[];
  loading: boolean;
  dealId: string;
  dealStage: string;
  onConditionStatusChange: (conditionId: string, newStatus: string) => void;
  onConditionAdded?: () => void;
}

export function ActionCenterRail({
  conditions,
  conditionDocs,
  loading,
  dealId,
  dealStage,
  onConditionStatusChange,
  onConditionAdded,
}: ActionCenterRailProps) {
  const [selectedConditionId, setSelectedConditionId] = useState<string | null>(
    null
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedScrollTop = useRef(0);

  // ── Stage filter ──
  const [stageFilter, setStageFilter] = useState<StageFilter>(
    (dealStage as StageFilter) || "lead"
  );

  const filteredConditions = useMemo(() => {
    if (stageFilter === "all") return conditions;
    return conditions.filter((c) => {
      const mapped =
        CONDITION_STAGE_TO_DEAL_STAGE[c.required_stage] ?? "lead";
      return mapped === stageFilter;
    });
  }, [conditions, stageFilter]);

  const selectedCondition = useMemo(
    () => conditions.find((c) => c.id === selectedConditionId) ?? null,
    [conditions, selectedConditionId]
  );

  const handleConditionClick = useCallback((conditionId: string) => {
    if (scrollRef.current) {
      savedScrollTop.current = scrollRef.current.scrollTop;
    }
    setSelectedConditionId(conditionId);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedConditionId(null);
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = savedScrollTop.current;
      }
    });
  }, []);

  const clearedConditions = useMemo(
    () =>
      filteredConditions.filter(
        (c) =>
          c.status === "approved" ||
          c.status === "waived" ||
          c.status === "not_applicable"
      ).length,
    [filteredConditions]
  );

  // ── Add condition dialog ──
  const [addConditionOpen, setAddConditionOpen] = useState(false);
  const [newConditionName, setNewConditionName] = useState("");
  const [newConditionCategory, setNewConditionCategory] =
    useState("deal_level_items");
  const [newConditionStage, setNewConditionStage] = useState(
    dealStage || "lead"
  );
  const [addingCondition, setAddingCondition] = useState(false);

  const handleAddCondition = useCallback(async () => {
    if (!newConditionName.trim()) return;
    setAddingCondition(true);
    try {
      const result = await addDealConditionAction(
        dealId,
        newConditionName.trim(),
        newConditionCategory,
        newConditionStage
      );
      if ("error" in result) {
        showError("Could not add condition", result.error);
      } else {
        showSuccess("Condition added");
        setAddConditionOpen(false);
        setNewConditionName("");
        onConditionAdded?.();
      }
    } finally {
      setAddingCondition(false);
    }
  }, [
    dealId,
    newConditionName,
    newConditionCategory,
    newConditionStage,
    onConditionAdded,
  ]);

  return (
    <>
      <div
        className="flex flex-col h-full w-[520px] shrink-0 rounded-xl border bg-card overflow-hidden"
      >
        {selectedCondition ? (
          <ConditionDetailPanel
            condition={selectedCondition}
            dealId={dealId}
            onBack={handleBack}
            onStatusChange={onConditionStatusChange}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-semibold">Conditions</h3>
                <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                  {clearedConditions}/{filteredConditions.length}
                </span>
                <div className="w-12 h-1 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-normal"
                    style={{
                      width:
                        filteredConditions.length > 0
                          ? `${Math.round((clearedConditions / filteredConditions.length) * 100)}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Stage filter dropdown */}
                <Select
                  value={stageFilter}
                  onValueChange={(v) => setStageFilter(v as StageFilter)}
                >
                  <SelectTrigger className="h-6 w-auto min-w-0 gap-1 rounded-md border-border bg-transparent px-2 text-[10px] font-medium text-muted-foreground hover:bg-muted/40 focus:ring-0 focus:ring-offset-0 [&>svg]:h-3 [&>svg]:w-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {DEAL_STAGES.map((stage) => (
                      <SelectItem
                        key={stage.key}
                        value={stage.key}
                        className="text-xs"
                      >
                        {stage.label}
                        {stage.key === dealStage && (
                          <span className="ml-1 text-muted-foreground/60">
                            current
                          </span>
                        )}
                      </SelectItem>
                    ))}
                    <SelectItem value="all" className="text-xs">
                      All stages
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Add condition button */}
                <button
                  type="button"
                  onClick={() => setAddConditionOpen(true)}
                  className="flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 rq-transition"
                  title="Add condition"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable list */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div>
                  {filteredConditions.length === 0 ? (
                    <EmptyState
                      icon={ClipboardCheck}
                      title="No conditions"
                      description={
                        stageFilter !== "all"
                          ? "Try a different stage filter"
                          : undefined
                      }
                      compact
                    />
                  ) : (
                    filteredConditions.map((c) => (
                      <RailConditionItem
                        key={c.id}
                        condition={c}
                        documents={conditionDocs}
                        dealId={dealId}
                        onStatusChange={onConditionStatusChange}
                        onOpenDetail={handleConditionClick}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Condition Dialog */}
      <Dialog open={addConditionOpen} onOpenChange={setAddConditionOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Add Condition</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1">
              <span className="inline-field-label">Condition Name</span>
              <Input
                value={newConditionName}
                onChange={(e) => setNewConditionName(e.target.value)}
                placeholder="e.g. Phase I Environmental Report"
                className="text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newConditionName.trim()) {
                    handleAddCondition();
                  }
                }}
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <span className="inline-field-label">Category</span>
              <Select
                value={newConditionCategory}
                onValueChange={setNewConditionCategory}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="borrower_documents">
                    Borrower Documents
                  </SelectItem>
                  <SelectItem value="entity_documents">
                    Entity Documents
                  </SelectItem>
                  <SelectItem value="deal_level_items">
                    Deal Level Items
                  </SelectItem>
                  <SelectItem value="appraisal_request">Appraisal</SelectItem>
                  <SelectItem value="title_fraud_protection">
                    Title / Fraud
                  </SelectItem>
                  <SelectItem value="insurance_request">Insurance</SelectItem>
                  <SelectItem value="title_request">Title</SelectItem>
                  <SelectItem value="lender_package">Lender Package</SelectItem>
                  <SelectItem value="closing_prep">Closing Prep</SelectItem>
                  <SelectItem value="post_closing_items">
                    Post Closing
                  </SelectItem>
                  <SelectItem value="prior_to_approval">
                    Prior to Approval
                  </SelectItem>
                  <SelectItem value="prior_to_funding">
                    Prior to Funding
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Required Stage */}
            <div className="space-y-1">
              <span className="inline-field-label">Required Stage</span>
              <Select
                value={newConditionStage}
                onValueChange={setNewConditionStage}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_STAGES.map((stage) => (
                    <SelectItem key={stage.key} value={stage.key}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddConditionOpen(false)}
              disabled={addingCondition}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCondition}
              disabled={!newConditionName.trim() || addingCondition}
            >
              {addingCondition ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Condition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
