"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ListChecks, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { WorkflowTaskCard } from "./workflow-task-card";
import type { WorkflowTask, TaskProfile } from "@/lib/workflow-tasks";
import {
  getColumnForStatus,
  sortWorkflowTasks,
  submitApprovalDecision,
  updateWorkflowTaskStatus,
} from "@/lib/workflow-tasks";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const COLUMNS = [
  { id: "To Do", label: "To Do" },
  { id: "In Progress", label: "In Progress" },
  { id: "Complete", label: "Complete" },
] as const;

const COMPLETED_SHOW_COUNT = 5;

interface WorkflowTaskBoardProps {
  initialTasks: WorkflowTask[];
  profiles: TaskProfile[];
  currentUserId: string;
}

type TypeFilter = "all" | "task" | "approval";

const TYPE_TABS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "task", label: "Tasks" },
  { value: "approval", label: "Approvals" },
];

export function WorkflowTaskBoard({
  initialTasks,
  profiles,
  currentUserId,
}: WorkflowTaskBoardProps) {
  const [tasks, setTasks] = useState<WorkflowTask[]>(initialTasks);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();

  // Decision dialog state
  const [decisionDialog, setDecisionDialog] = useState<{
    open: boolean;
    taskId: string;
    decision: "approve" | "reject" | "resubmit";
  }>({ open: false, taskId: "", decision: "approve" });
  const [decisionNote, setDecisionNote] = useState("");
  const [deciding, setDeciding] = useState(false);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("workflow_tasks_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTasks((prev) => {
              if (prev.some((t) => t.id === (payload.new as WorkflowTask).id))
                return prev;
              return [...prev, payload.new as WorkflowTask];
            });
          } else if (payload.eventType === "UPDATE") {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === (payload.new as WorkflowTask).id
                  ? (payload.new as WorkflowTask)
                  : t
              )
            );
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) =>
              prev.filter(
                (t) => t.id !== (payload.old as { id: string }).id
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      return true;
    });
  }, [tasks, typeFilter, priorityFilter, categoryFilter]);

  // Group by column
  const columnTasks = useMemo(() => {
    const grouped: Record<string, WorkflowTask[]> = {
      "To Do": [],
      "In Progress": [],
      Complete: [],
    };
    for (const task of filteredTasks) {
      const col = getColumnForStatus(task.status);
      grouped[col]?.push(task);
    }
    // Sort within each column
    for (const col of Object.keys(grouped)) {
      grouped[col] = sortWorkflowTasks(grouped[col]);
    }
    return grouped;
  }, [filteredTasks]);

  // Handlers
  const handleComplete = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: "completed", completed_at: new Date().toISOString() }
            : t
        )
      );

      const result = await updateWorkflowTaskStatus(taskId, "completed");
      if (!result.success) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
        toast({
          title: "Failed to complete task",
          description: result.error ?? "Unknown error",
          variant: "destructive",
        });
      }
    },
    [tasks, toast]
  );

  const openDecisionDialog = useCallback(
    (taskId: string, decision: "approve" | "reject" | "resubmit") => {
      setDecisionDialog({ open: true, taskId, decision });
      setDecisionNote("");
    },
    []
  );

  const handleDecisionSubmit = useCallback(async () => {
    const { taskId, decision } = decisionDialog;
    setDeciding(true);

    const result = await submitApprovalDecision(
      taskId,
      decision,
      currentUserId,
      decisionNote || undefined
    );

    if (!result.success) {
      toast({
        title: `Failed to ${decision}`,
        description: result.error ?? "Unknown error",
        variant: "destructive",
      });
    } else {
      toast({
        title:
          decision === "approve"
            ? "Approved"
            : decision === "reject"
              ? "Rejected"
              : "Resubmitted",
        description: `Task has been ${decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "resubmitted"}.`,
      });
      // Refresh tasks
      const supabase = createClient();
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .or(
          `assignee_user_id.eq.${currentUserId},and(active_party.eq.requestor,requestor_user_id.eq.${currentUserId})`
        )
        .order("created_at", { ascending: false });
      if (data) setTasks(data as unknown as WorkflowTask[]);
    }

    setDeciding(false);
    setDecisionDialog({ open: false, taskId: "", decision: "approve" });
  }, [decisionDialog, decisionNote, currentUserId, toast]);

  const handleTaskClick = useCallback((_task: WorkflowTask) => {
    // Future: open task detail sheet
  }, []);

  // Count per type for badge display
  const typeCounts = useMemo(() => {
    const counts = { all: tasks.length, task: 0, approval: 0 };
    for (const t of tasks) {
      if (t.type === "task") counts.task++;
      else if (t.type === "approval") counts.approval++;
    }
    return counts;
  }, [tasks]);

  return (
    <div>
      <div className="border-b border-border px-6 md:px-8 pt-6">
        <PageHeader
          title="Tasks"
          description="Track workflow tasks, approvals, and deal operations."
        />
        <div className="flex items-center gap-4">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTypeFilter(tab.value)}
              className={cn(
                "pb-2.5 text-[13px] font-medium border-b-2 transition-colors",
                typeFilter === tab.value
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {typeCounts[tab.value] > 0 && (
                <span className="ml-1.5 text-[11px] text-muted-foreground num">
                  {typeCounts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 md:p-8">
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5">
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px] h-8 text-[12px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px] h-8 text-[12px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="underwriting">Underwriting</SelectItem>
            <SelectItem value="documentation">Documentation</SelectItem>
            <SelectItem value="communication">Communication</SelectItem>
            <SelectItem value="third_party">Third Party</SelectItem>
            <SelectItem value="financial">Financial</SelectItem>
            <SelectItem value="approval">Approval</SelectItem>
            <SelectItem value="servicing">Servicing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-6">
        {COLUMNS.map((col) => {
          const colTasks = columnTasks[col.id] ?? [];
          return (
            <WorkflowColumn
              key={col.id}
              label={col.label}
              tasks={colTasks}
              profiles={profiles}
              currentUserId={currentUserId}
              isComplete={col.id === "Complete"}
              onComplete={handleComplete}
              onApprove={(id) => openDecisionDialog(id, "approve")}
              onReject={(id) => openDecisionDialog(id, "reject")}
              onResubmit={(id) => openDecisionDialog(id, "resubmit")}
              onTaskClick={handleTaskClick}
            />
          );
        })}
      </div>

      {/* Decision dialog */}
      <Dialog
        open={decisionDialog.open}
        onOpenChange={(open) => {
          if (!open)
            setDecisionDialog({ open: false, taskId: "", decision: "approve" });
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold capitalize">
              {decisionDialog.decision} task
            </DialogTitle>
            <DialogDescription className="text-[13px]">
              {decisionDialog.decision === "approve"
                ? "Confirm approval of this task."
                : decisionDialog.decision === "reject"
                  ? "Provide a reason for rejection. The requestor will be notified."
                  : "Resubmit this task for another review."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Note {decisionDialog.decision === "reject" ? "(required)" : "(optional)"}
              </Label>
              <Textarea
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder={
                  decisionDialog.decision === "reject"
                    ? "Reason for rejection..."
                    : "Add a note..."
                }
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDecisionDialog({ open: false, taskId: "", decision: "approve" })
                }
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={
                  deciding ||
                  (decisionDialog.decision === "reject" && !decisionNote.trim())
                }
                className={cn(
                  decisionDialog.decision === "approve" &&
                    "bg-green-600 hover:bg-green-700 text-white",
                  decisionDialog.decision === "reject" &&
                    "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                )}
                onClick={handleDecisionSubmit}
              >
                {deciding
                  ? "Submitting..."
                  : decisionDialog.decision === "approve"
                    ? "Approve"
                    : decisionDialog.decision === "reject"
                      ? "Reject"
                      : "Resubmit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

// ── Column component ──────────────────────────────────────────────────────

function WorkflowColumn({
  label,
  tasks,
  profiles,
  currentUserId,
  isComplete,
  onComplete,
  onApprove,
  onReject,
  onResubmit,
  onTaskClick,
}: {
  label: string;
  tasks: WorkflowTask[];
  profiles: TaskProfile[];
  currentUserId: string;
  isComplete: boolean;
  onComplete: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onResubmit: (id: string) => void;
  onTaskClick: (task: WorkflowTask) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleTasks =
    isComplete && !showAll ? tasks.slice(0, COMPLETED_SHOW_COUNT) : tasks;
  const hiddenCount = isComplete
    ? tasks.length - COMPLETED_SHOW_COUNT
    : 0;

  return (
    <div className="flex-1 min-w-[280px] max-w-[440px] flex flex-col">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground/60 num">
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-1.5 rounded-lg p-1 min-h-[60px]">
        {visibleTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ListChecks
              className="h-8 w-8 text-muted-foreground/30 mb-2"
              strokeWidth={1.5}
            />
            <p className="text-sm text-muted-foreground/60">
              {isComplete ? "No completed tasks" : "No tasks"}
            </p>
          </div>
        )}

        {visibleTasks.map((task) => (
          <WorkflowTaskCard
            key={task.id}
            task={task}
            profiles={profiles}
            currentUserId={currentUserId}
            onApprove={onApprove}
            onReject={onReject}
            onResubmit={onResubmit}
            onComplete={onComplete}
            onClick={onTaskClick}
          />
        ))}

        {isComplete && hiddenCount > 0 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="flex items-center justify-center gap-1.5 py-2.5 mt-1 rounded-lg border border-dashed border-border text-[12px] font-medium text-muted-foreground hover:border-ring/50 hover:text-foreground transition-colors"
          >
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
            View all {tasks.length} completed
          </button>
        )}
      </div>
    </div>
  );
}
