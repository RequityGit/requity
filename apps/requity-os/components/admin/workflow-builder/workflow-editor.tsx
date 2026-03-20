"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { StagesTab } from "./stages-tab";
import { RulesTab } from "./rules-tab";
import type {
  WorkflowDefinition,
  WorkflowStage,
  WorkflowRule,
} from "./types";

interface WorkflowEditorProps {
  workflow: WorkflowDefinition;
  stages: WorkflowStage[];
  rules: WorkflowRule[];
  onStagesChanged: (stages: WorkflowStage[]) => void;
  onRulesChanged: (rules: WorkflowRule[]) => void;
}

export function WorkflowEditor({
  workflow,
  stages,
  rules,
  onStagesChanged,
  onRulesChanged,
}: WorkflowEditorProps) {
  const [tab, setTab] = useState<"stages" | "rules">("stages");

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-0 border-b border-border">
        <h2 className="text-[15px] font-bold tracking-tight mb-0.5">
          {workflow.name}
        </h2>
        <p className="text-[12px] text-muted-foreground mb-3 capitalize">
          {workflow.entity_type} workflow
        </p>

        {/* Tabs */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTab("stages")}
            className={cn(
              "pb-2.5 text-[13px] font-medium border-b-2 transition-colors",
              tab === "stages"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Stages
            <span className="ml-1.5 text-[11px] text-muted-foreground num">
              {stages.length}
            </span>
          </button>
          <button
            onClick={() => setTab("rules")}
            className={cn(
              "pb-2.5 text-[13px] font-medium border-b-2 transition-colors",
              tab === "rules"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Rules
            <span className="ml-1.5 text-[11px] text-muted-foreground num">
              {rules.length}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {tab === "stages" ? (
          <StagesTab
            workflowId={workflow.id}
            stages={stages}
            onStagesChanged={onStagesChanged}
          />
        ) : (
          <RulesTab
            workflowId={workflow.id}
            stages={stages}
            rules={rules}
            onRulesChanged={onRulesChanged}
          />
        )}
      </div>
    </div>
  );
}
