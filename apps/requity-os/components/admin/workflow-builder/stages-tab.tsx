"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { showError } from "@/lib/toast";
import { Plus, GripVertical, Trash2, Flag, Workflow } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import type { WorkflowStage } from "./types";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

interface StagesTabProps {
  workflowId: string;
  stages: WorkflowStage[];
  onStagesChanged: (stages: WorkflowStage[]) => void;
}

export function StagesTab({
  workflowId,
  stages,
  onStagesChanged,
}: StagesTabProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const confirm = useConfirm();

  const handleAddStage = useCallback(async () => {
    if (!newName.trim()) return;
    setAdding(true);
    const supabase = createClient();
    const position = stages.length + 1;
    const slug = slugify(newName.trim());

    const { data, error } = await supabase
      .from("workflow_stages")
      .insert({
        workflow_id: workflowId,
        name: newName.trim(),
        slug,
        position,
        is_terminal: false,
      })
      .select()
      .single();

    if (error) {
      showError("Could not add stage", error.message);
    } else if (data) {
      onStagesChanged([...stages, data as unknown as WorkflowStage]);
      setNewName("");
    }
    setAdding(false);
  }, [newName, stages, workflowId, onStagesChanged]);

  const handleUpdateField = useCallback(
    async (
      stageId: string,
      field: string,
      value: string | number | boolean | null
    ) => {
      const supabase = createClient();

      // Optimistic update
      onStagesChanged(
        stages.map((s) =>
          s.id === stageId ? { ...s, [field]: value } : s
        )
      );

      const { error } = await supabase
        .from("workflow_stages")
        .update({ [field]: value })
        .eq("id", stageId);

      if (error) {
        // Rollback
        onStagesChanged(stages);
        showError("Could not update stage", error.message);
      }
    },
    [stages, onStagesChanged]
  );

  const handleDeleteStage = useCallback(
    async (stageId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("workflow_stages")
        .delete()
        .eq("id", stageId);

      if (error) {
        showError("Could not delete stage", error.message);
      } else {
        onStagesChanged(stages.filter((s) => s.id !== stageId));
      }
    },
    [stages, onStagesChanged]
  );

  return (
    <div className="space-y-2">
      {stages.length === 0 && (
        <EmptyState icon={Workflow} title="No stages defined" description="Add your first stage below." compact />
      )}

      {stages.map((stage, idx) => (
        <div
          key={stage.id}
          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background"
        >
          <GripVertical
            className="h-4 w-4 text-muted-foreground/40 shrink-0 cursor-grab"
            strokeWidth={1.5}
          />
          <span className="text-[11px] font-bold text-muted-foreground/60 num w-6">
            {idx + 1}
          </span>

          {/* Name */}
          <Input
            value={stage.name}
            onChange={(e) =>
              handleUpdateField(stage.id, "name", e.target.value)
            }
            onBlur={() =>
              handleUpdateField(stage.id, "slug", slugify(stage.name))
            }
            className="h-8 text-[13px] font-medium flex-1 min-w-[140px]"
          />

          {/* Warn days */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              Warn
            </span>
            <Input
              type="number"
              value={stage.warn_after_days ?? ""}
              onChange={(e) =>
                handleUpdateField(
                  stage.id,
                  "warn_after_days",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className="h-8 w-14 text-[12px] num"
              placeholder="—"
            />
          </div>

          {/* Alert days */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              Alert
            </span>
            <Input
              type="number"
              value={stage.alert_after_days ?? ""}
              onChange={(e) =>
                handleUpdateField(
                  stage.id,
                  "alert_after_days",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className="h-8 w-14 text-[12px] num"
              placeholder="—"
            />
          </div>

          {/* Terminal toggle */}
          <div className="flex items-center gap-1.5">
            <Flag
              className="h-3.5 w-3.5 text-muted-foreground"
              strokeWidth={1.5}
            />
            <Switch
              checked={stage.is_terminal ?? false}
              onCheckedChange={(checked) =>
                handleUpdateField(stage.id, "is_terminal", checked)
              }
            />
          </div>

          {/* Delete */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={async () => {
              const ok = await confirm({
                title: "Delete stage",
                description: `This will delete \u201c${stage.name}\u201d and any rules that reference it. This cannot be undone.`,
                confirmLabel: "Delete",
                destructive: true,
              });
              if (!ok) return;
              handleDeleteStage(stage.id);
            }}
          >
            <Trash2
              className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive"
              strokeWidth={1.5}
            />
          </Button>
        </div>
      ))}

      {/* Add stage */}
      <div className="flex items-center gap-2 pt-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New stage name..."
          className="h-8 text-[13px] flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleAddStage()}
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={handleAddStage}
          disabled={!newName.trim() || adding}
        >
          <Plus className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
          {adding ? "Adding..." : "Add Stage"}
        </Button>
      </div>
    </div>
  );
}
