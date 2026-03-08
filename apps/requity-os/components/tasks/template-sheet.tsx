"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Repeat2, Zap, CalendarDays, Minus, Plus } from "lucide-react";
import type { Profile } from "@/lib/tasks";
import { TASK_CATEGORIES, TASK_PRIORITIES } from "@/lib/tasks";
import type {
  RecurringTaskTemplate,
  RecurrenceType,
  MonthlyMode,
} from "@/lib/recurring-templates";
import {
  WEEKDAY_LABELS,
  WEEKDAY_FULL,
  MONTH_LABELS,
  NTH_LABELS,
  getNextDueDates,
  calculateInitialDueDate,
} from "@/lib/recurring-templates";

interface TemplateSheetProps {
  open: boolean;
  template: RecurringTaskTemplate | null;
  profiles: Profile[];
  currentUserId: string;
  onClose: () => void;
  onSaved: (template: RecurringTaskTemplate) => void;
}

export function TemplateSheet({
  open,
  template,
  profiles,
  currentUserId,
  onClose,
  onSaved,
}: TemplateSheetProps) {
  const isNew = !template;
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("monthly");
  const [monthlyMode, setMonthlyMode] = useState<MonthlyMode>("date");
  const [anchorDay, setAnchorDay] = useState(1);
  const [anchorDayOfWeek, setAnchorDayOfWeek] = useState(1);
  const [anchorMonth, setAnchorMonth] = useState(1);
  const [everyXMonths, setEveryXMonths] = useState(1);
  const [nthOccurrence, setNthOccurrence] = useState(1);
  const [nthWeekday, setNthWeekday] = useState(2);
  const [leadDays, setLeadDays] = useState(10);

  // Reset form when template changes
  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setDescription(template.description ?? "");
      setCategory(template.category);
      setPriority(template.priority);
      setAssignedTo(template.assigned_to ?? "");
      setRecurrenceType(template.recurrence_type);
      setMonthlyMode(template.monthly_mode ?? "date");
      setAnchorDay(template.anchor_day ?? 1);
      setAnchorMonth(template.anchor_month ?? 1);
      setEveryXMonths(template.every_x_months ?? 1);
      setNthOccurrence(template.nth_occurrence ?? 1);
      setNthWeekday(template.nth_weekday ?? 2);
      setLeadDays(template.lead_days);
      // For weekly, anchor_day is day of week
      if (template.recurrence_type === "weekly") {
        setAnchorDayOfWeek(template.anchor_day ?? 1);
      }
    } else {
      setTitle("");
      setDescription("");
      setCategory("");
      setPriority("Medium");
      setAssignedTo("");
      setRecurrenceType("monthly");
      setMonthlyMode("date");
      setAnchorDay(1);
      setAnchorDayOfWeek(1);
      setAnchorMonth(1);
      setEveryXMonths(1);
      setNthOccurrence(1);
      setNthWeekday(2);
      setLeadDays(10);
    }
  }, [template, open]);

  // Smart lead days default
  useEffect(() => {
    if (isNew) {
      if (recurrenceType === "daily") setLeadDays(0);
      else if (recurrenceType === "weekly") setLeadDays(0);
      else if (recurrenceType === "monthly") setLeadDays(10);
      else if (recurrenceType === "annually") setLeadDays(14);
    }
  }, [recurrenceType, isNew]);

  // Next 3 dates preview
  const nextDates = useMemo(() => {
    const effectiveAnchorDay =
      recurrenceType === "weekly" ? anchorDayOfWeek : anchorDay;
    return getNextDueDates(
      recurrenceType,
      effectiveAnchorDay,
      anchorMonth,
      everyXMonths,
      monthlyMode,
      nthOccurrence,
      nthWeekday,
      3
    );
  }, [
    recurrenceType,
    anchorDay,
    anchorDayOfWeek,
    anchorMonth,
    everyXMonths,
    monthlyMode,
    nthOccurrence,
    nthWeekday,
  ]);

  const everyXLabel = useMemo(() => {
    if (everyXMonths === 1) return "month";
    if (everyXMonths === 2) return "Bimonthly";
    if (everyXMonths === 3) return "Quarterly";
    if (everyXMonths === 6) return "Semi-annually";
    return `Every ${everyXMonths} months`;
  }, [everyXMonths]);

  const handleSave = async () => {
    if (!title.trim() || !category) return;
    setSaving(true);

    const supabase = createClient();
    const effectiveAnchorDay =
      recurrenceType === "weekly" ? anchorDayOfWeek : anchorDay;

    // Calculate initial due date
    const nextDueDate = calculateInitialDueDate(
      recurrenceType,
      effectiveAnchorDay,
      anchorMonth,
      everyXMonths,
      monthlyMode,
      nthOccurrence,
      nthWeekday
    );

    // Calculate generation date
    const dueObj = new Date(nextDueDate + "T00:00:00");
    dueObj.setDate(dueObj.getDate() - leadDays);
    const nextGenDate = dueObj.toISOString().split("T")[0];

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      priority,
      assigned_to: assignedTo || null,
      recurrence_type: recurrenceType,
      monthly_mode:
        recurrenceType === "monthly" ? monthlyMode : null,
      anchor_day: effectiveAnchorDay,
      anchor_month:
        recurrenceType === "annually" ? anchorMonth : null,
      every_x_months:
        recurrenceType === "monthly" ? everyXMonths : 1,
      nth_occurrence:
        recurrenceType === "monthly" && monthlyMode === "weekday"
          ? nthOccurrence
          : null,
      nth_weekday:
        recurrenceType === "monthly" && monthlyMode === "weekday"
          ? nthWeekday
          : null,
      lead_days: leadDays,
      next_due_date: nextDueDate,
      next_generation_date: nextGenDate,
    };

    try {
      if (isNew) {
        const { data, error } = await supabase
          .from("recurring_task_templates" as never)
          .insert({
            ...payload,
            created_by: currentUserId,
            is_active: true,
          } as never)
          .select()
          .single();

        if (error) throw error;
        if (data) onSaved(data as unknown as RecurringTaskTemplate);
      } else {
        const { data, error } = await supabase
          .from("recurring_task_templates" as never)
          .update(payload as never)
          .eq("id" as never, template.id as never)
          .select()
          .single();

        if (error) throw error;
        if (data) onSaved(data as unknown as RecurringTaskTemplate);
      }
      toast({
        title: isNew ? "Template created" : "Template updated",
        description: `"${title.trim()}" saved successfully.`,
      });
      onClose();
    } catch (err: unknown) {
      toast({
        title: "Failed to save template",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[560px] p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-4 pb-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
              <Repeat2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <DialogTitle className="text-sm font-bold tracking-tight">
              {isNew ? "New Recurring Template" : "Edit Template"}
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            {isNew ? "Create a recurring task template" : "Edit template details"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 pb-4 pt-3">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Title
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Bank account reconciliation"
                className="font-medium"
              />
            </div>

            {/* Category + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Category
                </Label>
                <Select value={category || "none"} onValueChange={(v) => setCategory(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select category</SelectItem>
                    {TASK_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Priority
                </Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assign To */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Assign To
              </Label>
              <Select value={assignedTo || "unassigned"} onValueChange={(v) => setAssignedTo(v === "unassigned" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recurrence Config Panel */}
            <div className="bg-secondary rounded-lg border border-border overflow-hidden">
              {/* Frequency pills */}
              <div className="p-4 pb-3">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Frequency
                </Label>
                <div className="flex rounded-md overflow-hidden border border-border">
                  {(["daily", "weekly", "monthly", "annually"] as RecurrenceType[]).map(
                    (f, i) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setRecurrenceType(f)}
                        className={cn(
                          "flex-1 py-1.5 text-[11px] font-semibold capitalize transition-colors",
                          recurrenceType === f
                            ? "bg-primary text-primary-foreground"
                            : "bg-transparent text-muted-foreground hover:bg-accent",
                          i < 3 && "border-r border-border"
                        )}
                      >
                        {f}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Anchor config */}
              <div className="p-4">
                {recurrenceType === "daily" && (
                  <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Generates every day — no anchor needed.
                  </div>
                )}

                {recurrenceType === "weekly" && (
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Repeats On
                    </Label>
                    <div className="flex gap-1">
                      {WEEKDAY_LABELS.map((d, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAnchorDayOfWeek(i)}
                          className={cn(
                            "w-9 h-9 rounded-lg text-xs font-semibold transition-all flex items-center justify-center",
                            anchorDayOfWeek === i
                              ? "bg-primary text-primary-foreground border-2 border-primary"
                              : "bg-card border border-border text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {d.charAt(0)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {recurrenceType === "annually" && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Month
                      </Label>
                      <div className="grid grid-cols-6 gap-1">
                        {MONTH_LABELS.map((m, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setAnchorMonth(i + 1)}
                            className={cn(
                              "py-1.5 rounded-md text-[11px] font-semibold transition-all",
                              anchorMonth === i + 1
                                ? "bg-primary text-primary-foreground border-2 border-primary"
                                : "bg-card border border-border text-muted-foreground hover:bg-accent"
                            )}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Day of Month
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={28}
                        value={anchorDay}
                        onChange={(e) =>
                          setAnchorDay(
                            Math.min(28, Math.max(1, parseInt(e.target.value) || 1))
                          )
                        }
                        className="w-20 text-center num font-semibold"
                      />
                    </div>
                  </div>
                )}

                {recurrenceType === "monthly" && (
                  <div className="space-y-3">
                    {/* Repeat Every */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Repeat Every
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg bg-card border border-border overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setEveryXMonths(Math.max(1, everyXMonths - 1))}
                            className="w-8 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                          <span className="w-9 text-center text-sm font-semibold num border-x border-border py-1.5">
                            {everyXMonths}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEveryXMonths(Math.min(12, everyXMonths + 1))}
                            className="w-8 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                        </div>
                        <span className="text-[13px] text-muted-foreground">
                          {everyXMonths === 1 ? "month" : "months"}
                        </span>
                        {everyXMonths > 1 && (
                          <span className="text-[11px] font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                            {everyXLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* On The: mode toggle */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        On The
                      </Label>
                      <div className="flex rounded-md overflow-hidden border border-border w-fit">
                        {(
                          [
                            { value: "date" as const, label: "Day of Month" },
                            { value: "weekday" as const, label: "Day of Week" },
                          ] as const
                        ).map((m, i) => (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => setMonthlyMode(m.value)}
                            className={cn(
                              "px-3.5 py-1.5 text-xs font-semibold transition-colors",
                              monthlyMode === m.value
                                ? "bg-primary text-primary-foreground"
                                : "bg-transparent text-muted-foreground hover:bg-accent",
                              i === 0 && "border-r border-border"
                            )}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>

                      {monthlyMode === "date" ? (
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            type="number"
                            min={1}
                            max={28}
                            value={anchorDay}
                            onChange={(e) =>
                              setAnchorDay(
                                Math.min(
                                  28,
                                  Math.max(1, parseInt(e.target.value) || 1)
                                )
                              )
                            }
                            className="w-16 text-center num font-semibold"
                          />
                          <span className="text-xs text-muted-foreground">
                            of {everyXMonths === 1 ? "each month" : `every ${everyXMonths} months`}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2 mt-2">
                          {/* Nth occurrence */}
                          <div className="flex gap-1">
                            {NTH_LABELS.map((label, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setNthOccurrence(i + 1)}
                                className={cn(
                                  "px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all",
                                  nthOccurrence === i + 1
                                    ? "bg-primary text-primary-foreground border-2 border-primary"
                                    : "bg-card border border-border text-muted-foreground hover:bg-accent"
                                )}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          {/* Weekday */}
                          <div className="flex gap-1">
                            {WEEKDAY_LABELS.map((d, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setNthWeekday(i)}
                                className={cn(
                                  "px-2 py-1.5 rounded-md text-[11px] font-semibold transition-all",
                                  nthWeekday === i
                                    ? "bg-primary text-primary-foreground border-2 border-primary"
                                    : "bg-card border border-border text-muted-foreground hover:bg-accent"
                                )}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                          {/* Summary */}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarDays className="h-3 w-3" strokeWidth={1.5} />
                            {NTH_LABELS[nthOccurrence - 1]}{" "}
                            {WEEKDAY_FULL[nthWeekday]} of{" "}
                            {everyXMonths === 1
                              ? "every month"
                              : `every ${everyXMonths} months`}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="h-px bg-border" />

              {/* Lead time */}
              <div className="p-4">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Lead Time
                </Label>
                <div className="flex items-center gap-2.5">
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={leadDays}
                    onChange={(e) =>
                      setLeadDays(
                        Math.min(30, Math.max(0, parseInt(e.target.value) || 0))
                      )
                    }
                    className="w-16 text-center num font-semibold"
                  />
                  <span className="text-xs text-muted-foreground">
                    {leadDays === 0
                      ? "Task appears on due date"
                      : `Task appears ${leadDays} ${leadDays === 1 ? "day" : "days"} before it's due`}
                  </span>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Next 3 instances preview */}
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Zap className="h-3 w-3 text-amber-400" strokeWidth={2} />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Next 3 Instances
                  </span>
                </div>
                <div className="space-y-0.5">
                  {nextDates.map((date, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          i === 0
                            ? "bg-green-400"
                            : i === 1
                            ? "bg-muted-foreground/50"
                            : "bg-border"
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs num",
                          i === 0 ? "font-medium" : "text-muted-foreground"
                        )}
                      >
                        {date.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {i === 0 && (
                        <span className="text-[10px] font-semibold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                          NEXT
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Description
                <span className="ml-1.5 normal-case tracking-normal font-normal text-muted-foreground/60">
                  optional
                </span>
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instructions for completing this task..."
                rows={2}
                className="resize-y"
              />
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3">
          <div className="flex items-center gap-1.5 text-[11px] text-blue-400 font-medium">
            <Repeat2 className="h-3 w-3" strokeWidth={1.5} />
            {recurrenceType === "monthly" && everyXMonths > 1
              ? `Every ${everyXMonths} months recurring template`
              : recurrenceType === "monthly" && monthlyMode === "weekday"
              ? `${NTH_LABELS[nthOccurrence - 1]} ${WEEKDAY_LABELS[nthWeekday]} of each month`
              : `${recurrenceType.charAt(0).toUpperCase() + recurrenceType.slice(1)} recurring template`}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!title.trim() || !category || saving}
            >
              {saving
                ? "Saving..."
                : isNew
                ? "Create Template"
                : "Save Template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
