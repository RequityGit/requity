"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  ChevronDown,
  Zap,
  Variable,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { WorkflowStage, WorkflowRule } from "./types";
import {
  TRIGGER_TYPES,
  ACTION_TYPES,
  ASSIGNEE_ROLES,
  TEMPLATE_VARIABLES,
} from "./types";

interface RulesTabProps {
  workflowId: string;
  stages: WorkflowStage[];
  rules: WorkflowRule[];
  onRulesChanged: (rules: WorkflowRule[]) => void;
}

export function RulesTab({
  workflowId,
  stages,
  rules,
  onRulesChanged,
}: RulesTabProps) {
  const { toast } = useToast();

  // Group rules by stage
  const globalRules = rules.filter((r) => !r.trigger_stage_id);
  const stageGroups = stages.map((stage) => ({
    stage,
    rules: rules
      .filter((r) => r.trigger_stage_id === stage.id)
      .sort((a, b) => (a.execution_order ?? 0) - (b.execution_order ?? 0)),
  }));

  const handleUpdateField = useCallback(
    async (
      ruleId: string,
      field: string,
      value: string | number | boolean | null | string[]
    ) => {
      const supabase = createClient();

      // Optimistic update
      onRulesChanged(
        rules.map((r) =>
          r.id === ruleId ? { ...r, [field]: value } : r
        )
      );

      const { error } = await supabase
        .from("workflow_rules")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", ruleId);

      if (error) {
        onRulesChanged(rules);
        toast({
          title: "Failed to update rule",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    [rules, onRulesChanged, toast]
  );

  const handleAddRule = useCallback(
    async (stageId: string | null) => {
      const supabase = createClient();
      const stageRules = rules.filter((r) => r.trigger_stage_id === stageId);
      const executionOrder =
        stageRules.length > 0
          ? Math.max(...stageRules.map((r) => r.execution_order ?? 0)) + 1
          : 1;

      const { data, error } = await supabase
        .from("workflow_rules")
        .insert({
          workflow_id: workflowId,
          name: "New rule",
          trigger_type: "stage_enter",
          trigger_stage_id: stageId,
          action_type: "create_task",
          task_priority: "high",
          execution_order: executionOrder,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Failed to add rule",
          description: error.message,
          variant: "destructive",
        });
      } else if (data) {
        onRulesChanged([...rules, data as unknown as WorkflowRule]);
      }
    },
    [workflowId, rules, onRulesChanged, toast]
  );

  const handleDeleteRule = useCallback(
    async (ruleId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("workflow_rules")
        .delete()
        .eq("id", ruleId);

      if (error) {
        toast({
          title: "Failed to delete rule",
          description: error.message,
          variant: "destructive",
        });
      } else {
        onRulesChanged(rules.filter((r) => r.id !== ruleId));
      }
    },
    [rules, onRulesChanged, toast]
  );

  return (
    <div className="space-y-3">
      {/* Stage-grouped accordion sections */}
      {stageGroups.map(({ stage, rules: stageRules }) => (
        <RuleAccordion
          key={stage.id}
          label={stage.name}
          count={stageRules.length}
          rules={stageRules}
          stages={stages}
          onUpdateField={handleUpdateField}
          onAddRule={() => handleAddRule(stage.id)}
          onDeleteRule={handleDeleteRule}
        />
      ))}

      {/* Global rules section */}
      <RuleAccordion
        label="Global Rules"
        count={globalRules.length}
        rules={globalRules}
        stages={stages}
        onUpdateField={handleUpdateField}
        onAddRule={() => handleAddRule(null)}
        onDeleteRule={handleDeleteRule}
      />
    </div>
  );
}

// ── Accordion section ─────────────────────────────────────────────────────

function RuleAccordion({
  label,
  count,
  rules,
  stages,
  onUpdateField,
  onAddRule,
  onDeleteRule,
}: {
  label: string;
  count: number;
  rules: WorkflowRule[];
  stages: WorkflowStage[];
  onUpdateField: (
    ruleId: string,
    field: string,
    value: string | number | boolean | null | string[]
  ) => void;
  onAddRule: () => void;
  onDeleteRule: (ruleId: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-accent/50 hover:bg-accent transition-colors text-left">
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform",
              !open && "-rotate-90"
            )}
            strokeWidth={1.5}
          />
          <Zap className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-[13px] font-semibold flex-1">{label}</span>
          <span className="text-[11px] text-muted-foreground num">
            {count} rule{count !== 1 ? "s" : ""}
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 pt-2 pl-2">
          {rules.length === 0 && (
            <p className="text-[12px] text-muted-foreground py-2 pl-3">
              No rules for this stage.
            </p>
          )}
          {rules.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              stages={stages}
              onUpdateField={onUpdateField}
              onDelete={onDeleteRule}
            />
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] text-muted-foreground"
            onClick={onAddRule}
          >
            <Plus className="h-3 w-3 mr-1" strokeWidth={1.5} />
            Add Rule
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── Rule row ──────────────────────────────────────────────────────────────

function RuleRow({
  rule,
  stages,
  onUpdateField,
  onDelete,
}: {
  rule: WorkflowRule;
  stages: WorkflowStage[];
  onUpdateField: (
    ruleId: string,
    field: string,
    value: string | number | boolean | null | string[]
  ) => void;
  onDelete: (ruleId: string) => void;
}) {
  return (
    <div className="border border-border rounded-lg p-3 bg-background space-y-3">
      {/* Row 1: Name + active toggle + delete */}
      <div className="flex items-center gap-2">
        <Input
          value={rule.name}
          onChange={(e) => onUpdateField(rule.id, "name", e.target.value)}
          className="h-7 text-[12px] font-medium flex-1"
          placeholder="Rule name"
        />
        <Switch
          checked={rule.is_active ?? true}
          onCheckedChange={(v) => onUpdateField(rule.id, "is_active", v)}
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Trash2
                className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive"
                strokeWidth={1.5}
              />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete rule</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &ldquo;{rule.name}&rdquo;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(rule.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Row 2: Trigger + Action */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">
            Trigger
          </span>
          <Select
            value={rule.trigger_type}
            onValueChange={(v) =>
              onUpdateField(rule.id, "trigger_type", v)
            }
          >
            <SelectTrigger className="h-7 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRIGGER_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">
            Action
          </span>
          <Select
            value={rule.action_type}
            onValueChange={(v) =>
              onUpdateField(rule.id, "action_type", v)
            }
          >
            <SelectTrigger className="h-7 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 3: Title template with variable picker */}
      {(rule.action_type === "create_task" ||
        rule.action_type === "create_approval") && (
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">
            Title Template
          </span>
          <div className="flex items-center gap-1">
            <Input
              value={rule.task_title_template ?? ""}
              onChange={(e) =>
                onUpdateField(rule.id, "task_title_template", e.target.value)
              }
              className="h-7 text-[11px] flex-1"
              placeholder="e.g., Review {{borrower_name}} — {{property_address}}"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Variable
                    className="h-3.5 w-3.5 text-muted-foreground"
                    strokeWidth={1.5}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="end">
                {TEMPLATE_VARIABLES.map((v) => (
                  <button
                    key={v}
                    onClick={() =>
                      onUpdateField(
                        rule.id,
                        "task_title_template",
                        (rule.task_title_template ?? "") + v
                      )
                    }
                    className="w-full text-left px-2 py-1.5 text-[11px] font-mono rounded hover:bg-accent transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* Row 4: Assignment + Due + Blocking */}
      {(rule.action_type === "create_task" ||
        rule.action_type === "create_approval") && (
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
              Assign to
            </span>
            <Select
              value={rule.assign_to_role ?? "none"}
              onValueChange={(v) =>
                onUpdateField(
                  rule.id,
                  "assign_to_role",
                  v === "none" ? null : v
                )
              }
            >
              <SelectTrigger className="h-7 text-[11px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {ASSIGNEE_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
              Due (days)
            </span>
            <Input
              type="number"
              value={rule.due_days_offset ?? ""}
              onChange={(e) =>
                onUpdateField(
                  rule.id,
                  "due_days_offset",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className="h-7 text-[11px] num"
              placeholder="—"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
              Blocking
            </span>
            <div className="flex items-center h-7">
              <Switch
                checked={rule.is_blocking ?? false}
                onCheckedChange={(v) =>
                  onUpdateField(rule.id, "is_blocking", v)
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Trigger days for days_in_stage */}
      {rule.trigger_type === "days_in_stage" && (
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">
            After days
          </span>
          <Input
            type="number"
            value={rule.trigger_days ?? ""}
            onChange={(e) =>
              onUpdateField(
                rule.id,
                "trigger_days",
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            className="h-7 w-24 text-[11px] num"
          />
        </div>
      )}
    </div>
  );
}
