"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { ChevronDown, ChevronRight, ClipboardCheck, Link2, Loader2, Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { RailConditionItem } from "./RailConditionItem";
import { ConditionDetailPanel } from "./ConditionDetailPanel";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { SecureUploadLinkDialog } from "@/components/pipeline/SecureUploadLinkDialog";
import type { DealCondition } from "@/components/pipeline/pipeline-types";
import type {
  DealConditionRow,
  ConditionDocument,
  ConditionProfile,
} from "./useActionCenterData";

// ── Stage filter constants (5 deal stages from kanban) ──

const DEAL_STAGES = [
  { key: "lead", label: "Intake" },
  { key: "analysis", label: "Analysis" },
  { key: "negotiation", label: "Negotiation" },
  { key: "execution", label: "Execution" },
  { key: "closed", label: "Closed" },
] as const;

const STAGE_KEYS = DEAL_STAGES.map((s) => s.key);

// ── Category labels (matches SecureUploadLinkDialog) ──

const CATEGORY_LABELS: Record<string, string> = {
  borrower_documents: "Borrower Documents",
  non_us_citizen: "Non-US Citizen",
  entity_documents: "Entity Documents",
  deal_level_items: "Deal Level Items",
  appraisal_request: "Appraisal",
  insurance_request: "Insurance",
  title_request: "Title",
  title_fraud_protection: "Title / Fraud Protection",
  fundraising: "Fundraising",
  prior_to_funding: "Prior to Funding",
  closing_prep: "Closing Prep",
  lender_package: "Lender Package",
  prior_to_approval: "Prior to Approval",
  post_closing_items: "Post Closing",
  note_sell_process: "Note Sell",
  post_loan_payoff: "Post Loan Payoff",
};

function isConditionCleared(status: string): boolean {
  return status === "approved" || status === "waived" || status === "not_applicable";
}

/** Default to ALL stages so the full condition picture is always visible. */
function getDefaultStages(_dealStage: string): Set<string> {
  return new Set(STAGE_KEYS);
}

interface ActionCenterRailProps {
  conditions: DealConditionRow[];
  conditionDocs: ConditionDocument[];
  conditionProfiles: Record<string, ConditionProfile>;
  loading: boolean;
  dealId: string;
  dealStage: string;
  onConditionStatusChange: (conditionId: string, newStatus: string) => void;
  onConditionAdded?: () => void;
}

export function ActionCenterRail({
  conditions,
  conditionDocs,
  conditionProfiles,
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

  // ── Stage filter (multi-select) ──
  const [selectedStages, setSelectedStages] = useState<Set<string>>(
    () => getDefaultStages(dealStage)
  );

  const toggleStage = useCallback((stageKey: string) => {
    setSelectedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageKey)) {
        next.delete(stageKey);
        if (next.size === 0) return prev; // prevent empty selection
      } else {
        next.add(stageKey);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedStages((prev) => {
      if (prev.size === DEAL_STAGES.length) {
        return getDefaultStages(dealStage);
      }
      return new Set(STAGE_KEYS);
    });
  }, [dealStage]);

  const triggerLabel = useMemo(() => {
    if (selectedStages.size === DEAL_STAGES.length) return "All stages";
    if (selectedStages.size === 1) {
      const key = Array.from(selectedStages)[0];
      return DEAL_STAGES.find((s) => s.key === key)?.label ?? "1 stage";
    }
    return `${selectedStages.size} stages`;
  }, [selectedStages]);

  const filteredConditions = useMemo(() => {
    if (selectedStages.size === DEAL_STAGES.length) return conditions;
    return conditions.filter((c) => selectedStages.has(c.required_stage));
  }, [conditions, selectedStages]);

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
    () => filteredConditions.filter((c) => isConditionCleared(c.status)).length,
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
        className="flex flex-col h-full w-full md:w-[520px] md:shrink-0 rounded-xl border bg-card overflow-hidden"
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
                <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
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
                {/* Stage filter dropdown (multi-select) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 h-6 rounded-md border border-border bg-transparent px-2 text-[10px] font-medium text-muted-foreground hover:bg-muted/40 rq-transition"
                    >
                      {triggerLabel}
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuCheckboxItem
                      checked={selectedStages.size === DEAL_STAGES.length}
                      onCheckedChange={toggleAll}
                      className="text-xs"
                    >
                      All stages
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    {DEAL_STAGES.map((stage) => (
                      <DropdownMenuCheckboxItem
                        key={stage.key}
                        checked={selectedStages.has(stage.key)}
                        onCheckedChange={() => toggleStage(stage.key)}
                        className="text-xs"
                      >
                        {stage.label}
                        {stage.key === dealStage && (
                          <span className="ml-1 text-muted-foreground/60">
                            current
                          </span>
                        )}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Upload Links button */}
                <SecureUploadLinkDialog
                  dealId={dealId}
                  conditions={conditions.map((c) => ({
                    ...c,
                    template_id: null,
                    is_borrower_facing: true,
                    critical_path_item: c.critical_path_item ?? false,
                    requires_approval: c.requires_approval ?? false,
                    is_required: c.is_required ?? true,
                    sort_order: c.sort_order ?? 0,
                  } as DealCondition))}
                  trigger={
                    <button
                      type="button"
                      className="flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 rq-transition"
                      title="Upload Links"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                    </button>
                  }
                />

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

            {/* Scrollable list grouped by category */}
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
                        selectedStages.size < DEAL_STAGES.length
                          ? "Try selecting more stages"
                          : undefined
                      }
                      compact
                    />
                  ) : (
                    <ConditionCategoryAccordion
                      conditions={filteredConditions}
                      conditionDocs={conditionDocs}
                      conditionProfiles={conditionProfiles}
                      dealId={dealId}
                      onStatusChange={onConditionStatusChange}
                      onOpenDetail={handleConditionClick}
                    />
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

// ── Condition Category Accordion ──

interface ConditionCategoryAccordionProps {
  conditions: DealConditionRow[];
  conditionDocs: ConditionDocument[];
  conditionProfiles: Record<string, ConditionProfile>;
  dealId: string;
  onStatusChange: (conditionId: string, newStatus: string) => void;
  onOpenDetail: (conditionId: string) => void;
}

function ConditionCategoryAccordion({
  conditions,
  conditionDocs,
  conditionProfiles,
  dealId,
  onStatusChange,
  onOpenDetail,
}: ConditionCategoryAccordionProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Group conditions by category, preserving sort_order within each group
  const grouped = useMemo(() => {
    const map = new Map<string, DealConditionRow[]>();
    for (const c of conditions) {
      const cat = c.category || "other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(c);
    }
    // Sort categories by their first condition's sort_order
    return Array.from(map.entries()).sort((a, b) => {
      const aFirst = a[1][0]?.sort_order ?? 0;
      const bFirst = b[1][0]?.sort_order ?? 0;
      return aFirst - bFirst;
    });
  }, [conditions]);

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }, []);

  return (
    <div>
      {grouped.map(([category, items]) => {
        const cleared = items.filter((c) => isConditionCleared(c.status)).length;
        const total = items.length;
        const isExpanded = expandedCategories.has(category);
        const allCleared = cleared === total;
        const label = CATEGORY_LABELS[category] ?? category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

        return (
          <div key={category}>
            {/* Category header */}
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="flex w-full items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border/50 hover:bg-muted/50 rq-transition cursor-pointer"
            >
              <ChevronRight
                className={`h-3 w-3 shrink-0 text-muted-foreground/60 rq-transition-transform ${isExpanded ? "rotate-90" : ""}`}
              />
              <span className="text-[11px] font-semibold text-foreground flex-1 text-left truncate">
                {label}
              </span>
              <span className={`text-[10px] font-medium tabular-nums shrink-0 ${allCleared ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                {cleared}/{total}
              </span>
              {/* Mini progress bar */}
              <div className="w-8 h-1 rounded-full bg-border overflow-hidden shrink-0">
                <div
                  className={`h-full rounded-full transition-all duration-normal ${allCleared ? "bg-emerald-500" : "bg-primary/50"}`}
                  style={{ width: total > 0 ? `${Math.round((cleared / total) * 100)}%` : "0%" }}
                />
              </div>
            </button>

            {/* Expanded condition items */}
            {isExpanded && items.map((c) => (
              <RailConditionItem
                key={c.id}
                condition={c}
                documents={conditionDocs}
                dealId={dealId}
                onStatusChange={onStatusChange}
                onOpenDetail={onOpenDetail}
                assignedProfile={c.assigned_to ? conditionProfiles[c.assigned_to] ?? null : null}
                approverProfile={c.approver_id ? conditionProfiles[c.approver_id] ?? null : null}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
