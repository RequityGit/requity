"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { CONDITION_CATEGORIES, CONDITION_STAGES } from "@/lib/constants";
import { ConditionCategorySection } from "./condition-category-section";
import { ConditionSlideOver } from "./condition-slide-over";
import type { ConditionFormData } from "@/app/(authenticated)/control-center/conditions/actions";
import {
  saveCondition,
  deactivateCondition,
  reactivateCondition,
  reorderConditions,
  updateConditionInline,
} from "@/app/(authenticated)/control-center/conditions/actions";

interface ConditionTemplate {
  id: string;
  condition_name: string;
  category: string;
  required_stage: string;
  applies_to_commercial: boolean | null;
  applies_to_rtl: boolean | null;
  applies_to_dscr: boolean | null;
  applies_to_guc: boolean | null;
  applies_to_transactional: boolean | null;
  internal_description: string | null;
  borrower_description: string | null;
  responsible_party: string | null;
  critical_path_item: boolean | null;
  is_borrower_facing?: boolean | null;
  requires_approval: boolean | null;
  per_borrower?: boolean | null;
  sort_order: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

interface ConditionsClientProps {
  templates: ConditionTemplate[];
}

const LOAN_TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "commercial", label: "COM" },
  { value: "rtl", label: "RTL" },
  { value: "dscr", label: "DSCR" },
  { value: "guc", label: "GUC" },
  { value: "transactional", label: "TRAN" },
] as const;

// Category display order per spec
const CATEGORY_ORDER = [
  "borrower_documents",
  "non_us_citizen",
  "entity_documents",
  "deal_level_items",
  "appraisal_request",
  "title_fraud_protection",
  "lender_package",
  "insurance_request",
  "title_request",
  "fundraising",
  "closing_prep",
  "prior_to_approval",
  "prior_to_funding",
  "post_closing_items",
  "note_sell_process",
  "post_loan_payoff",
];

const CATEGORY_LABELS: Record<string, string> = {};
CONDITION_CATEGORIES.forEach((c) => {
  CATEGORY_LABELS[c.value] = c.label;
});
// Override some labels per spec
CATEGORY_LABELS["title_fraud_protection"] = "Title & Fraud Protection";
CATEGORY_LABELS["post_closing_items"] = "Post Closing Items";

export function ConditionsClient({ templates }: ConditionsClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Optimistic local state — badges update instantly, server syncs in background
  const [localTemplates, setLocalTemplates] = useState(templates);
  const localTemplatesRef = useRef(localTemplates);
  localTemplatesRef.current = localTemplates;

  // Sync local state when server data changes (from router.refresh on save/deactivate/etc.)
  useEffect(() => {
    setLocalTemplates(templates);
  }, [templates]);

  const [loanTypeFilter, setLoanTypeFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showInactive, setShowInactive] = useState(false);

  // Slide-over
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [editingCondition, setEditingCondition] =
    useState<ConditionTemplate | null>(null);
  const [presetCategory, setPresetCategory] = useState<string | null>(null);

  // Expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CATEGORY_ORDER.slice(0, 3))
  );

  // Apply filters
  const filtered = useMemo(() => {
    return localTemplates.filter((t) => {
      // Active filter
      if (!showInactive && !t.is_active) return false;

      // Loan type filter
      if (loanTypeFilter !== "all") {
        const key = `applies_to_${loanTypeFilter}` as keyof ConditionTemplate;
        if (!t[key]) return false;
      }

      // Stage filter
      if (stageFilter !== "all" && t.required_stage !== stageFilter) return false;

      // Category filter
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;

      return true;
    });
  }, [localTemplates, loanTypeFilter, stageFilter, categoryFilter, showInactive]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, ConditionTemplate[]>();
    CATEGORY_ORDER.forEach((cat) => map.set(cat, []));

    filtered.forEach((t) => {
      const list = map.get(t.category);
      if (list) {
        list.push(t);
      } else {
        map.set(t.category, [t]);
      }
    });

    // Remove empty categories
    const result: { category: string; label: string; items: ConditionTemplate[] }[] =
      [];
    const entries = Array.from(map.entries());
    for (const [cat, catItems] of entries) {
      if (catItems.length > 0) {
        result.push({
          category: cat,
          label: CATEGORY_LABELS[cat] || cat,
          items: catItems.sort(
            (a: ConditionTemplate, b: ConditionTemplate) =>
              (a.sort_order ?? 999) - (b.sort_order ?? 999)
          ),
        });
      }
    }
    return result;
  }, [filtered]);

  const activeCount = localTemplates.filter((t) => t.is_active).length;
  const categoryCount = new Set(
    localTemplates.filter((t) => t.is_active).map((t) => t.category)
  ).size;

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function openAddForm(category?: string) {
    setEditingCondition(null);
    setPresetCategory(category || null);
    setSlideOverOpen(true);
  }

  function openEditForm(condition: ConditionTemplate) {
    setEditingCondition(condition);
    setPresetCategory(null);
    setSlideOverOpen(true);
  }

  async function handleSave(data: ConditionFormData) {
    const result = await saveCondition(data);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return false;
    }
    toast({ title: result.message || "Saved" });
    setSlideOverOpen(false);
    router.refresh();
    return true;
  }

  async function handleDeactivate(id: string) {
    const result = await deactivateCondition(id);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Condition deactivated" });
      router.refresh();
    }
  }

  async function handleReactivate(id: string) {
    const result = await reactivateCondition(id);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Condition reactivated" });
      router.refresh();
    }
  }

  const handleInlineUpdate = useCallback(
    async (
      id: string,
      fields: Partial<{
        condition_name: string;
        applies_to_commercial: boolean;
        applies_to_rtl: boolean;
        applies_to_dscr: boolean;
        applies_to_guc: boolean;
        applies_to_transactional: boolean;
      }>
    ): Promise<boolean> => {
      // Capture old state for revert on failure
      const oldTemplate = localTemplatesRef.current.find((t) => t.id === id);

      // Optimistic update — UI reflects the change instantly
      setLocalTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...fields } : t))
      );

      const result = await updateConditionInline(id, fields);
      if (result.error) {
        // Revert optimistic update on failure
        if (oldTemplate) {
          setLocalTemplates((prev) =>
            prev.map((t) => (t.id === id ? oldTemplate : t))
          );
        }
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return false;
      }
      // No router.refresh() needed — local state already reflects the change
      return true;
    },
    [toast]
  );

  const handleReorder = useCallback(
    async (categoryItems: ConditionTemplate[]) => {
      const updates = categoryItems.map((item, index) => ({
        id: item.id,
        sort_order: index + 1,
      }));
      const result = await reorderConditions(updates);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        router.refresh();
      }
    },
    [toast, router]
  );

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {activeCount} active templates across {categoryCount} categories
            </p>
          </div>
          <Button onClick={() => openAddForm()} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Condition
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Loan Type segmented control */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-muted-foreground mr-1">
              Loan Type:
            </span>
            <div className="inline-flex rounded-md border bg-card">
              {LOAN_TYPE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setLoanTypeFilter(f.value)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md",
                    loanTypeFilter === f.value
                      ? "bg-teal-600 text-white"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {CONDITION_STAGES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px] h-8 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CONDITION_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {CATEGORY_LABELS[c.value] || c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5 text-xs cursor-pointer">
            <Checkbox
              checked={showInactive}
              onCheckedChange={(v) => setShowInactive(!!v)}
            />
            <span>Show inactive</span>
          </div>
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-2">
        {grouped.map((group) => (
          <ConditionCategorySection
            key={group.category}
            category={group.category}
            label={group.label}
            items={group.items}
            expanded={expandedCategories.has(group.category)}
            onToggle={() => toggleCategory(group.category)}
            onAddToCategory={() => openAddForm(group.category)}
            onEdit={openEditForm}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
            onReorder={handleReorder}
            onInlineUpdate={handleInlineUpdate}
          />
        ))}
        {grouped.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No condition templates match your filters.
          </div>
        )}
      </div>

      {/* Slide-over Form */}
      <ConditionSlideOver
        open={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        condition={editingCondition}
        presetCategory={presetCategory}
        onSave={handleSave}
        templates={localTemplates}
      />
    </div>
  );
}
