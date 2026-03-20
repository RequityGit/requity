"use client";

import { useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  MoreHorizontal,
  Repeat2,
  Pencil,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import { CategoryPill } from "./category-pill";
import type { Profile } from "@/lib/tasks";
import { getInitials, TASK_CATEGORIES } from "@/lib/tasks";
import type { RecurringTaskTemplate } from "@/lib/recurring-templates";
import {
  getFrequencyLabel,
  getAnchorLabel,
  FREQUENCY_LABELS,
} from "@/lib/recurring-templates";

const FREQUENCY_BADGE_COLORS: Record<
  string,
  { bg: string; text: string }
> = {
  Daily: {
    bg: "bg-blue-100 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-400",
  },
  Weekly: {
    bg: "bg-green-100 dark:bg-green-950/30",
    text: "text-green-700 dark:text-green-400",
  },
  Bimonthly: {
    bg: "bg-green-100 dark:bg-green-950/30",
    text: "text-green-700 dark:text-green-400",
  },
  Monthly: {
    bg: "bg-purple-100 dark:bg-purple-950/30",
    text: "text-purple-700 dark:text-purple-400",
  },
  Quarterly: {
    bg: "bg-amber-100 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
  },
  "Semi-annually": {
    bg: "bg-orange-100 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-400",
  },
  Annually: {
    bg: "bg-red-100 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-400",
  },
};

interface RecurringTemplatesTableProps {
  templates: RecurringTaskTemplate[];
  profiles: Profile[];
  onEdit: (template: RecurringTaskTemplate) => void;
  onTemplatesChange: (templates: RecurringTaskTemplate[]) => void;
}

export function RecurringTemplatesTable({
  templates,
  profiles,
  onEdit,
  onTemplatesChange,
}: RecurringTemplatesTableProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [frequencyFilter, setFrequencyFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<RecurringTaskTemplate | null>(null);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (assigneeFilter !== "all" && t.assigned_to !== assigneeFilter) return false;
      if (frequencyFilter !== "all") {
        const label = getFrequencyLabel(t);
        if (label !== frequencyFilter) return false;
      }
      return true;
    });
  }, [templates, search, categoryFilter, assigneeFilter, frequencyFilter]);

  const activeCount = templates.filter((t) => t.is_active).length;
  const pausedCount = templates.filter((t) => !t.is_active).length;

  const assigneeOptions = useMemo(() => {
    const seen = new Set<string>();
    return templates
      .filter((t) => t.assigned_to)
      .reduce<{ value: string; label: string }[]>((acc, t) => {
        if (t.assigned_to && !seen.has(t.assigned_to)) {
          seen.add(t.assigned_to);
          const profile = profiles.find((p) => p.id === t.assigned_to);
          acc.push({
            value: t.assigned_to,
            label: profile?.full_name ?? "Unknown",
          });
        }
        return acc;
      }, [])
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [templates, profiles]);

  const frequencyOptions = useMemo(() => {
    const seen = new Set<string>();
    return templates.reduce<string[]>((acc, t) => {
      const label = getFrequencyLabel(t);
      if (!seen.has(label)) {
        seen.add(label);
        acc.push(label);
      }
      return acc;
    }, []);
  }, [templates]);

  const handleToggleActive = useCallback(
    async (template: RecurringTaskTemplate) => {
      const supabase = createClient();
      const newActive = !template.is_active;

      const { error } = await supabase
        .from("recurring_task_templates" as never)
        .update({ is_active: newActive } as never)
        .eq("id" as never, template.id as never);

      if (error) {
        toast({
          title: "Failed to update template",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      onTemplatesChange(
        templates.map((t) =>
          t.id === template.id ? { ...t, is_active: newActive } : t
        )
      );
      toast({
        title: newActive ? "Template resumed" : "Template paused",
        description: `"${template.title}" is now ${newActive ? "active" : "paused"}.`,
      });
    },
    [templates, onTemplatesChange, toast]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const supabase = createClient();

    const { error } = await supabase
      .from("recurring_task_templates" as never)
      .update({ is_active: false } as never)
      .eq("id" as never, deleteTarget.id as never);

    if (error) {
      toast({
        title: "Failed to delete template",
        description: error.message,
        variant: "destructive",
      });
    } else {
      onTemplatesChange(templates.filter((t) => t.id !== deleteTarget.id));
      toast({
        title: "Template deleted",
        description: `"${deleteTarget.title}" has been removed.`,
      });
    }
    setDeleteTarget(null);
  }, [deleteTarget, templates, onTemplatesChange, toast]);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-60">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-[13px]"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px] h-9 text-[13px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {TASK_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[160px] h-9 text-[13px]">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              {assigneeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
            <SelectTrigger className="w-[150px] h-9 text-[13px]">
              <SelectValue placeholder="Frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All frequencies</SelectItem>
              {frequencyOptions.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="num">{activeCount} active</span>
          <span>·</span>
          <span className="num">{pausedCount} paused</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_110px_130px_90px_80px_80px_110px_40px] px-4 h-11 items-center border-b border-border">
          {["Task", "Category", "Assignee", "Frequency", "Anchor", "Lead", "Next Due", ""].map(
            (h, i) => (
              <span
                key={i}
                className={cn(
                  "text-[11px] font-medium text-muted-foreground",
                  i >= 4 && i <= 6 && "text-right",
                  i === 7 && "text-right"
                )}
              >
                {h}
              </span>
            )
          )}
        </div>

        {/* Rows */}
        {filteredTemplates.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No templates found.
          </div>
        ) : (
          filteredTemplates.map((t) => {
            const assignee = t.assigned_to
              ? profiles.find((p) => p.id === t.assigned_to)
              : null;
            const freqLabel = getFrequencyLabel(t);
            const anchorLabel = getAnchorLabel(t);
            const badgeColors =
              FREQUENCY_BADGE_COLORS[freqLabel] ?? FREQUENCY_BADGE_COLORS.Monthly;

            return (
              <div
                key={t.id}
                className={cn(
                  "grid grid-cols-[1fr_110px_130px_90px_80px_80px_110px_40px] px-4 h-12 items-center border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors",
                  !t.is_active && "opacity-50"
                )}
                onClick={() => onEdit(t)}
              >
                {/* Title + status */}
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      t.is_active ? "bg-green-500" : "bg-muted-foreground/40"
                    )}
                  />
                  <Repeat2
                    className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                    strokeWidth={1.5}
                  />
                  <span className="text-[13px] font-medium truncate">
                    {t.title}
                  </span>
                </div>

                {/* Category */}
                <CategoryPill category={t.category} />

                {/* Assignee */}
                <div className="flex items-center gap-1.5">
                  {assignee ? (
                    <>
                      <div className="w-5 h-5 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-semibold shrink-0">
                        {getInitials(assignee.full_name)}
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {assignee.full_name.split(" ")[0]}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>

                {/* Frequency */}
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-semibold border-0 px-2 py-0.5",
                    badgeColors.bg,
                    badgeColors.text
                  )}
                >
                  {freqLabel}
                </Badge>

                {/* Anchor */}
                <span className="text-xs text-muted-foreground text-right num">
                  {anchorLabel}
                </span>

                {/* Lead */}
                <span className="text-xs text-muted-foreground text-right num">
                  {t.lead_days}d lead
                </span>

                {/* Next Due */}
                <span className="text-xs font-medium text-right num">
                  {new Date(t.next_due_date + "T00:00:00").toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" }
                  )}
                </span>

                {/* Actions */}
                <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted transition-colors">
                        <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(t)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(t)}>
                        {t.is_active ? (
                          <>
                            <Pause className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} />
                            Resume
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(t)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            <span className="num">{filteredTemplates.length}</span> templates
          </span>
          <span className="text-[11px] text-muted-foreground/60">
            Cron runs daily at 6:00 AM ET
          </span>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate &ldquo;{deleteTarget?.title}&rdquo;. No new tasks will
              be generated, but existing instances remain completable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
