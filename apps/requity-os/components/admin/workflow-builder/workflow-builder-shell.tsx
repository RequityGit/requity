"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Plus, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/shared/page-header";
import { WorkflowEditor } from "./workflow-editor";
import { NewWorkflowDialog } from "./new-workflow-dialog";
import type {
  WorkflowDefinition,
  WorkflowStage,
  WorkflowRule,
} from "./types";

interface WorkflowBuilderShellProps {
  initialWorkflows: WorkflowDefinition[];
  initialStages: WorkflowStage[];
  initialRules: WorkflowRule[];
}

export function WorkflowBuilderShell({
  initialWorkflows,
  initialStages,
  initialRules,
}: WorkflowBuilderShellProps) {
  const [workflows, setWorkflows] =
    useState<WorkflowDefinition[]>(initialWorkflows);
  const [stages, setStages] = useState<WorkflowStage[]>(initialStages);
  const [rules, setRules] = useState<WorkflowRule[]>(initialRules);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialWorkflows[0]?.id ?? null
  );
  const [showNewDialog, setShowNewDialog] = useState(false);
  const { toast } = useToast();

  const selectedWorkflow = workflows.find((w) => w.id === selectedId) ?? null;
  const workflowStages = stages
    .filter((s) => s.workflow_id === selectedId)
    .sort((a, b) => a.position - b.position);
  const workflowRules = rules.filter((r) => r.workflow_id === selectedId);

  const handleToggleActive = useCallback(
    async (workflowId: string, active: boolean) => {
      const supabase = createClient();
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === workflowId ? { ...w, is_active: active } : w
        )
      );
      const { error } = await supabase
        .from("workflow_definitions")
        .update({ is_active: active, updated_at: new Date().toISOString() })
        .eq("id", workflowId);
      if (error) {
        setWorkflows((prev) =>
          prev.map((w) =>
            w.id === workflowId ? { ...w, is_active: !active } : w
          )
        );
        toast({
          title: "Failed to update workflow",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const handleWorkflowCreated = useCallback(
    (workflow: WorkflowDefinition) => {
      setWorkflows((prev) => [...prev, workflow]);
      setSelectedId(workflow.id);
      setShowNewDialog(false);
    },
    []
  );

  const handleStagesChanged = useCallback(
    (newStages: WorkflowStage[]) => {
      setStages((prev) => {
        const otherStages = prev.filter(
          (s) => s.workflow_id !== selectedId
        );
        return [...otherStages, ...newStages];
      });
    },
    [selectedId]
  );

  const handleRulesChanged = useCallback(
    (newRules: WorkflowRule[]) => {
      setRules((prev) => {
        const otherRules = prev.filter(
          (r) => r.workflow_id !== selectedId
        );
        return [...otherRules, ...newRules];
      });
    },
    [selectedId]
  );

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="Workflow Builder"
        description="Configure deal pipeline workflows, stages, and automation rules."
      />

      <div className="flex gap-6 min-h-[calc(100vh-200px)]">
        {/* Left panel: workflow list */}
        <div className="w-[260px] shrink-0 border border-border rounded-xl bg-card">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Workflows
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setShowNewDialog(true)}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Button>
          </div>
          <div className="p-1.5 space-y-0.5">
            {workflows.length === 0 && (
              <div className="py-8 text-center">
                <Workflow className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-sm text-muted-foreground/60">
                  No workflows yet
                </p>
              </div>
            )}
            {workflows.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedId(w.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors",
                  selectedId === w.id
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate">{w.name}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">
                    {w.entity_type}
                  </p>
                </div>
                <Switch
                  checked={w.is_active ?? true}
                  onCheckedChange={(checked) =>
                    handleToggleActive(w.id, checked)
                  }
                  className="shrink-0"
                  onClick={(e) => e.stopPropagation()}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right panel: editor */}
        <div className="flex-1 min-w-0">
          {selectedWorkflow ? (
            <WorkflowEditor
              workflow={selectedWorkflow}
              stages={workflowStages}
              rules={workflowRules}
              onStagesChanged={handleStagesChanged}
              onRulesChanged={handleRulesChanged}
            />
          ) : (
            <div className="flex items-center justify-center h-full border border-dashed border-border rounded-xl">
              <div className="text-center">
                <Workflow
                  className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3"
                  strokeWidth={1.5}
                />
                <p className="text-sm text-muted-foreground">
                  Select a workflow to edit its stages and rules.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <NewWorkflowDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onCreated={handleWorkflowCreated}
      />
    </div>
  );
}
