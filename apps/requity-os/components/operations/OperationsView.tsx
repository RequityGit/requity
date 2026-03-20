"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FolderKanban,
  ListChecks,
  Shield,
  ChevronRight,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Search,
  ArrowRight,
  RotateCcw,
  Inbox,
  Loader2,
  Eye,
  Pause,
  Clock,
  Trash2,
  GripVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AddProjectDialog } from "./AddProjectDialog";
import { AddTaskDialog } from "./AddTaskDialog";
import { TaskDetailDrawer } from "./TaskDetailDrawer";
import type { OpsProject, OpsTask } from "./ProjectCard";

// Re-export types for external consumers
export type { OpsProject, OpsTask };

export interface TeamMember {
  id: string;
  full_name: string;
}

interface ApprovalRequest {
  id: string;
  entity_type: string;
  entity_id: string;
  status: string;
  priority: string;
  submitted_by: string;
  assigned_to: string;
  submission_notes: string | null;
  decision_notes: string | null;
  deal_snapshot: Record<string, unknown>;
  sla_deadline: string | null;
  sla_breached: boolean;
  created_at: string;
  submitter_name: string | null;
  approver_name: string | null;
}

interface OperationsViewProps {
  projects: OpsProject[];
  tasks: OpsTask[];
  teamMembers: TeamMember[];
  currentUserId: string;
  isSuperAdmin: boolean;
  taskCommentCounts: Record<string, number>;
  projectCommentCounts: Record<string, number>;
  approvals: ApprovalRequest[];
}

/* ── Status / Priority Config ── */
const STATUS_CFG: Record<string, { label: string; dotClass: string; bgClass: string }> = {
  "Not Started": { label: "Not Started", dotClass: "bg-[#8B8B8B]", bgClass: "bg-[#8B8B8B]/[0.07] text-[#8B8B8B]" },
  "Planning": { label: "Planning", dotClass: "bg-[#8B5CF6]", bgClass: "bg-[#8B5CF6]/[0.07] text-[#8B5CF6]" },
  "To Do": { label: "To Do", dotClass: "bg-[#8B8B8B]", bgClass: "bg-[#8B8B8B]/[0.07] text-[#8B8B8B]" },
  "In Progress": { label: "In Progress", dotClass: "bg-[#3B82F6]", bgClass: "bg-[#3B82F6]/[0.07] text-[#3B82F6]" },
  "Blocked": { label: "Blocked", dotClass: "bg-[#E5453D]", bgClass: "bg-[#E5453D]/[0.07] text-[#E5453D]" },
  "In Review": { label: "In Review", dotClass: "bg-[#E5930E]", bgClass: "bg-[#E5930E]/[0.07] text-[#E5930E]" },
  "On Hold": { label: "On Hold", dotClass: "bg-[#8B8B8B]", bgClass: "bg-[#8B8B8B]/[0.07] text-[#8B8B8B]" },
  "Complete": { label: "Complete", dotClass: "bg-[#22A861]", bgClass: "bg-[#22A861]/[0.07] text-[#22A861]" },
};

const PRIORITY_CFG: Record<string, { label: string; dotClass: string; bgClass: string }> = {
  "Critical": { label: "Critical", dotClass: "bg-[#E5453D]", bgClass: "bg-[#E5453D]/[0.07] text-[#E5453D]" },
  "High": { label: "High", dotClass: "bg-[#E5930E]", bgClass: "bg-[#E5930E]/[0.07] text-[#E5930E]" },
  "Medium": { label: "Medium", dotClass: "bg-[#3B82F6]", bgClass: "bg-[#3B82F6]/[0.07] text-[#3B82F6]" },
  "Low": { label: "Low", dotClass: "bg-[#8B8B8B]", bgClass: "bg-[#8B8B8B]/[0.07] text-[#8B8B8B]" },
};

const CATEGORY_LABELS: Record<string, string> = {
  "Engineering": "Engineering",
  "Marketing": "Marketing",
  "Finance": "Finance",
  "Operations": "Operations",
  "Compliance": "Compliance",
  "Legal": "Legal",
  "Sales": "Sales",
  "HR": "HR",
  "Underwriting": "Underwriting",
  "Servicing": "Servicing",
  "Capital Markets": "Capital Markets",
  "IT": "IT",
  "General": "General",
  "Lending Ops": "Lending Ops",
  "Investments": "Investments",
  "Tech/Infrastructure": "Tech/Infrastructure",
  "Investor Relations": "Investor Relations",
  "Marketing/Website": "Marketing/Website",
  "Finance/Accounting": "Finance/Accounting",
  "Acquisitions": "Acquisitions",
  "Asset Management": "Asset Management",
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  loan: "Loan",
  draw_request: "Draw Request",
  payoff: "Payoff",
  exception: "Exception",
  investor_distribution: "Distribution",
  opportunity: "Deal",
};

const priorityOrder: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

/* ── Helpers ── */
function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0]?.toUpperCase() ?? "?";
}

function formatDateShort(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntil(d: string | null): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - new Date().getTime()) / 86400000);
}

function isOverdue(d: string | null, status: string): boolean {
  if (!d || status === "Complete") return false;
  return new Date(d) < new Date();
}

/* ── Primitives ── */
function Dot({ label, dotClass, bgClass }: { label: string; dotClass: string; bgClass: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium", bgClass)}>
      <span className={cn("w-[7px] h-[7px] rounded-full shrink-0", dotClass)} />
      {label}
    </span>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span className="px-2.5 py-0.5 rounded-full border border-border text-xs font-medium text-muted-foreground">
      {label}
    </span>
  );
}

function Av({ text, size = 28 }: { text: string; size?: number }) {
  return (
    <div
      className="rounded-[7px] bg-foreground/[0.06] border border-foreground/[0.08] flex items-center justify-center font-semibold text-foreground shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {text}
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const colorClass = pct === 100 ? "bg-[#22A861]" : pct > 60 ? "bg-[#3B82F6]" : pct > 30 ? "bg-[#E5930E]" : "bg-[#8B8B8B]";
  return (
    <div className="h-[5px] bg-muted rounded-full overflow-hidden w-full">
      <div className={cn("h-full rounded-full transition-all duration-400", colorClass)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── Filter Dropdown ── */
function FilterDrop({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "text-xs font-medium bg-card border border-border rounded-lg px-3 py-1.5 cursor-pointer appearance-none",
        "bg-[length:10px_6px] bg-no-repeat bg-[right_10px_center]",
        "focus:outline-none focus:ring-1 focus:ring-foreground/20",
        value === "all" ? "text-muted-foreground" : "text-foreground"
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%238B8B8B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        paddingRight: 28,
      }}
    >
      <option value="all">{label}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

/* ── Task Row ── */
function TaskRow({
  task,
  isLast,
  onToggle,
  onOpenTask,
  onStopRecurrence,
  onDeleteTask,
  sortable = false,
}: {
  task: OpsTask;
  isLast: boolean;
  onToggle: (taskId: string, complete: boolean) => void;
  onOpenTask: (task: OpsTask) => void;
  onStopRecurrence: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  sortable?: boolean;
}) {
  const st = STATUS_CFG[task.status] ?? STATUS_CFG["To Do"];
  const overdue = isOverdue(task.due_date, task.status);
  const isComplete = task.status === "Complete";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !sortable });

  const style = sortable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
      }
    : undefined;

  return (
    <div
      ref={sortable ? setNodeRef : undefined}
      style={style}
      className={cn(
        "flex items-center gap-3.5 py-2.5 px-5 pl-[40px]",
        !isLast && "border-b border-muted",
        isComplete && "bg-muted/50",
        isDragging && "opacity-50 bg-muted z-10 relative"
      )}
    >
      {sortable && (
        <button
          type="button"
          className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id, !isComplete);
        }}
        className="shrink-0"
      >
        {isComplete ? (
          <CheckCircle2 size={16} className="text-[#22A861]" />
        ) : (
          <Circle size={16} className="text-border" />
        )}
      </button>
      <button
        type="button"
        onClick={() => onOpenTask(task)}
        className={cn(
          "flex-1 min-w-0 text-left text-[13px] font-medium text-foreground hover:underline truncate",
          isComplete && "line-through opacity-50"
        )}
      >
        {task.title}
      </button>
      {task.priority === "Critical" && (
        <Dot label="Critical" dotClass="bg-[#E5453D]" bgClass="bg-[#E5453D]/[0.07] text-[#E5453D]" />
      )}
      <Dot label={st.label} dotClass={st.dotClass} bgClass={st.bgClass} />
      {task.assigned_to_name && (
        <div className="flex items-center gap-1.5 min-w-[100px]">
          <Av text={getInitials(task.assigned_to_name)} size={22} />
          <span className="text-xs text-muted-foreground truncate">{task.assigned_to_name.split(" ")[0]}</span>
        </div>
      )}
      <span
        className={cn(
          "num text-[11px] min-w-[70px] text-right shrink-0",
          overdue ? "text-[#E5453D] font-semibold" : "text-muted-foreground"
        )}
      >
        {formatDateShort(task.due_date)}{overdue ? " !" : ""}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground"
          >
            <MoreHorizontal size={14} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {task.is_recurring && task.is_active_recurrence && (
            <DropdownMenuItem onClick={() => onStopRecurrence(task.id)}>
              <Pause className="h-3.5 w-3.5 mr-2" />
              Stop recurrence
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => onDeleteTask(task.id)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Delete task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* ── Project Row ── */
function ProjectRow({
  project,
  tasks,
  expanded,
  onToggle,
  onToggleTask,
  onStopRecurrence,
  onDeleteTask,
  onDeleteProject,
  onOpenTask,
  onAddTask,
  onReorderTasks,
}: {
  project: OpsProject;
  tasks: OpsTask[];
  expanded: boolean;
  onToggle: () => void;
  onToggleTask: (taskId: string, complete: boolean) => void;
  onStopRecurrence: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onOpenTask: (task: OpsTask) => void;
  onAddTask: () => void;
  onReorderTasks: (projectId: string, taskIds: string[]) => void;
}) {
  const st = STATUS_CFG[project.status ?? "Not Started"] ?? STATUS_CFG["Not Started"];
  const pr = PRIORITY_CFG[project.priority ?? "Medium"] ?? PRIORITY_CFG["Medium"];
  const cat = CATEGORY_LABELS[project.category ?? ""] ?? project.category ?? "—";
  const tasksDone = tasks.filter((t) => t.status === "Complete").length;
  const tasksTotal = tasks.length;
  const progress = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
  const overdue = isOverdue(project.due_date, project.status ?? "");
  const dLeft = daysUntil(project.due_date);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const taskSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleTaskDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...tasks];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorderTasks(project.id, reordered.map((t) => t.id));
  }

  const taskIds = tasks.map((t) => t.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card rounded-xl border border-border overflow-hidden transition-shadow",
        isDragging && "opacity-50 z-10 relative shadow-lg"
      )}
    >
      {/* Project Header */}
      <div
        onClick={onToggle}
        className="flex items-center gap-3.5 px-5 py-4 cursor-pointer select-none"
      >
        <button
          type="button"
          className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
        <div
          className={cn(
            "shrink-0 text-muted-foreground transition-transform duration-150",
            expanded && "rotate-90"
          )}
        >
          <ChevronRight size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{project.project_name}</span>
            <Dot label={pr.label} dotClass={pr.dotClass} bgClass={pr.bgClass} />
            <Dot label={st.label} dotClass={st.dotClass} bgClass={st.bgClass} />
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            {project.owner && (
              <div className="flex items-center gap-1.5">
                <Av text={getInitials(project.owner)} size={22} />
                <span className="text-xs text-muted-foreground">{project.owner}</span>
              </div>
            )}
            <Pill label={cat} />
          </div>
        </div>
        {/* Right side: progress + due date */}
        <div className="flex flex-col items-end gap-2 shrink-0 min-w-[160px]">
          <div className="flex items-center gap-2.5 w-full">
            <div className="flex-1">
              <ProgressBar pct={progress} />
            </div>
            <span className="num text-[11px] text-muted-foreground min-w-[36px] text-right">
              {progress}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {tasksDone}/{tasksTotal} tasks
            </span>
            <span
              className={cn(
                "num text-[11px]",
                (project.status ?? "") === "Complete"
                  ? "text-[#22A861]"
                  : overdue
                    ? "text-[#E5453D] font-semibold"
                    : dLeft != null && dLeft <= 7
                      ? "text-[#E5930E]"
                      : "text-muted-foreground"
              )}
            >
              {(project.status ?? "") === "Complete"
                ? "Done"
                : overdue
                  ? "Overdue"
                  : dLeft != null
                    ? `${dLeft}d left`
                    : "—"}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 p-1 rounded-md hover:bg-muted text-muted-foreground"
            >
              <MoreHorizontal size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => onDeleteProject(project.id)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-muted">
          {project.description && (
            <div className="px-5 py-3 pl-[52px] border-b border-muted">
              <span className="text-[13px] text-muted-foreground leading-relaxed">{project.description}</span>
            </div>
          )}
          <DndContext
            sensors={taskSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleTaskDragEnd}
          >
            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
              {tasks.map((task, i) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isLast={i === tasks.length - 1}
                  onToggle={onToggleTask}
                  onOpenTask={onOpenTask}
                  onStopRecurrence={onStopRecurrence}
                  onDeleteTask={onDeleteTask}
                  sortable
                />
              ))}
            </SortableContext>
          </DndContext>
          <div className="px-5 py-2.5 pl-[52px]">
            <button
              type="button"
              onClick={onAddTask}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus size={13} />
              Add Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── All Tasks View ── */
function AllTasksView({
  tasks,
  projectNames,
  statusFilter,
  ownerFilter,
  priorityFilter,
  categoryFilter,
  onToggleTask,
  onOpenTask,
  onStopRecurrence,
  onDeleteTask,
}: {
  tasks: OpsTask[];
  projectNames: Record<string, string>;
  statusFilter: string;
  ownerFilter: string;
  priorityFilter: string;
  categoryFilter: string;
  onToggleTask: (taskId: string, complete: boolean) => void;
  onOpenTask: (task: OpsTask) => void;
  onStopRecurrence: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.status === "Complete" && b.status !== "Complete") return 1;
      if (a.status !== "Complete" && b.status === "Complete") return -1;
      const aDate = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const bDate = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      return aDate - bDate;
    });
  }, [tasks]);

  const filtered = sortedTasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (ownerFilter !== "all" && t.assigned_to_name !== ownerFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    return true;
  });

  const grouped: Record<string, OpsTask[]> = {};
  filtered.forEach((t) => {
    const key = t.project_id ? (projectNames[t.project_id] ?? "Unlinked") : "No Project";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });

  if (Object.keys(grouped).length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border py-12 px-5 text-center">
        <Inbox size={36} className="mx-auto text-muted-foreground" />
        <div className="text-[15px] font-semibold text-foreground mt-3">No tasks match filters</div>
        <div className="text-[13px] text-muted-foreground mt-1">Try adjusting your filters to see more results.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {Object.entries(grouped).map(([projName, groupTasks]) => (
        <div key={projName} className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-muted">
            <FolderKanban size={16} className="text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">{projName}</span>
          </div>
          <div>
            {groupTasks.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                isLast={i === groupTasks.length - 1}
                onToggle={onToggleTask}
                onOpenTask={onOpenTask}
                onStopRecurrence={onStopRecurrence}
                onDeleteTask={onDeleteTask}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Approvals View ── */
function ApprovalsView({
  approvals,
  onNavigateToApproval,
}: {
  approvals: ApprovalRequest[];
  onNavigateToApproval: (id: string) => void;
}) {
  const pending = approvals.filter((a) => a.status === "pending");

  if (pending.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border py-12 px-5 text-center">
        <Shield size={36} className="mx-auto text-muted-foreground" />
        <div className="text-[15px] font-semibold text-foreground mt-3">No pending approvals</div>
        <div className="text-[13px] text-muted-foreground mt-1">All caught up. New approval requests will appear here.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pending.map((ap) => {
        const snapshot = ap.deal_snapshot as Record<string, unknown>;
        const borrowerName = (snapshot?.borrower_name as string) || "";
        const propertyAddress = (snapshot?.property_address as string) || "";
        const dealLabel = [borrowerName, propertyAddress].filter(Boolean).join(" — ") || "—";
        const entityLabel = ENTITY_TYPE_LABELS[ap.entity_type] ?? ap.entity_type;
        const slaInfo = getSlaLabel(ap.sla_deadline, ap.sla_breached);

        return (
          <div key={ap.id} className="bg-card rounded-xl border border-border p-[18px_20px]">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#E5930E]/[0.07] flex items-center justify-center shrink-0 mt-0.5">
                <Shield size={18} className="text-[#E5930E]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{entityLabel}</span>
                  <Dot label="Pending" dotClass="bg-[#E5930E]" bgClass="bg-[#E5930E]/[0.07] text-[#E5930E]" />
                  {slaInfo && (
                    <span className={cn("text-xs font-medium flex items-center gap-1", slaInfo.className)}>
                      <Clock size={11} />
                      {slaInfo.label}
                    </span>
                  )}
                </div>
                <div className="text-[13px] text-muted-foreground mt-1">{dealLabel}</div>
                {(snapshot?.from_stage != null || snapshot?.to_stage != null) ? (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Pill label={String(snapshot.from_stage ?? "—")} />
                    <ArrowRight size={14} className="text-muted-foreground" />
                    <Pill label={String(snapshot.to_stage ?? "—")} />
                  </div>
                ) : null}
                {ap.submission_notes && (
                  <div className="text-[13px] text-foreground leading-relaxed mt-2.5 p-3 bg-muted/50 rounded-lg">
                    {ap.submission_notes}
                  </div>
                )}
                <div className="flex items-center gap-2.5 mt-3">
                  <Av text={getInitials(ap.submitter_name)} size={22} />
                  <span className="text-xs text-muted-foreground">
                    {ap.submitter_name ?? "Unknown"} · {formatDateShort(ap.created_at)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 mt-0.5">
                <button
                  type="button"
                  onClick={() => onNavigateToApproval(ap.id)}
                  className="text-xs font-medium text-foreground bg-transparent border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors"
                >
                  Review
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getSlaLabel(deadline: string | null, breached: boolean): { label: string; className: string } | null {
  if (breached) return { label: "SLA Breached", className: "text-[#E5453D]" };
  if (!deadline) return null;
  const hours = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hours <= 0) return { label: "Overdue", className: "text-[#E5453D]" };
  if (hours <= 4) return { label: `${Math.ceil(hours)}h left`, className: "text-[#E5930E]" };
  if (hours <= 12) return { label: `${Math.ceil(hours)}h left`, className: "text-[#E5930E]" };
  return null;
}

/* ── Main Component ── */
export function OperationsView({
  projects: rawProjects,
  tasks,
  teamMembers,
  currentUserId,
  isSuperAdmin,
  taskCommentCounts,
  projectCommentCounts,
  approvals,
}: OperationsViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [view, setView] = useState<"projects" | "tasks" | "approvals">("projects");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addTaskProjectId, setAddTaskProjectId] = useState<string | undefined>(undefined);

  // Task detail drawer
  const [selectedTask, setSelectedTask] = useState<OpsTask | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleOpenTask(task: OpsTask) {
    setSelectedTask(task);
    setDrawerOpen(true);
  }

  const toggleExpand = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const hasFilters = statusFilter !== "all" || ownerFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all" || search.length > 0;

  function clearFilters() {
    setStatusFilter("all");
    setOwnerFilter("all");
    setPriorityFilter("all");
    setCategoryFilter("all");
    setSearch("");
  }

  // Local order state for optimistic reordering
  const [projectOrder, setProjectOrder] = useState<string[] | null>(null);
  const [taskOrderByProject, setTaskOrderByProject] = useState<Record<string, string[]>>({});

  // Normalize project statuses
  const projects = useMemo(() => rawProjects.map((p) => ({
    ...p,
    status: normalizeStatus(p.status),
  })), [rawProjects]);

  // Project name lookup
  const projectNames = useMemo(() => {
    const map: Record<string, string> = {};
    projects.forEach((p) => { map[p.id] = p.project_name; });
    return map;
  }, [projects]);

  // Tasks grouped by project
  const tasksByProject = useMemo(() => {
    const map: Record<string, OpsTask[]> = {};
    tasks.forEach((t) => {
      if (t.project_id) {
        if (!map[t.project_id]) map[t.project_id] = [];
        map[t.project_id].push(t);
      }
    });
    // Apply local task ordering if present
    Object.keys(taskOrderByProject).forEach((projectId) => {
      if (map[projectId]) {
        const order = taskOrderByProject[projectId];
        const taskMap = new Map(map[projectId].map((t) => [t.id, t]));
        map[projectId] = order
          .map((id) => taskMap.get(id))
          .filter((t): t is OpsTask => !!t);
      }
    });
    return map;
  }, [tasks, taskOrderByProject]);

  // Unique filter options
  const ownerOptions = useMemo(() => {
    const names = new Set<string>();
    projects.forEach((p) => { if (p.owner) names.add(p.owner); });
    tasks.forEach((t) => { if (t.assigned_to_name) names.add(t.assigned_to_name); });
    return Array.from(names).sort();
  }, [projects, tasks]);

  const categoryOptions = useMemo(() => {
    const cats = new Set<string>();
    projects.forEach((p) => { if (p.category) cats.add(p.category); });
    tasks.forEach((t) => { if (t.category) cats.add(t.category); });
    return Array.from(cats).sort();
  }, [projects, tasks]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];
    // Apply local project order if present
    if (projectOrder) {
      const orderMap = new Map(projectOrder.map((id, i) => [id, i]));
      result.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
    }
    if (statusFilter !== "all") result = result.filter((p) => p.status === statusFilter);
    if (ownerFilter !== "all") result = result.filter((p) => p.owner === ownerFilter);
    if (priorityFilter !== "all") result = result.filter((p) => p.priority === priorityFilter);
    if (categoryFilter !== "all") result = result.filter((p) => p.category === categoryFilter);
    if (search) result = result.filter((p) => p.project_name.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [projects, projectOrder, statusFilter, ownerFilter, priorityFilter, categoryFilter, search]);

  // Toggle task complete/incomplete
  async function handleToggleTask(taskId: string, complete: boolean) {
    const { error: toggleError } = await supabase.from("ops_tasks").update({
      status: complete ? "Complete" : "To Do",
      completed_at: complete ? new Date().toISOString() : null,
    }).eq("id", taskId);

    if (toggleError) {
      console.error("Failed to update task status:", toggleError);
      toast({ title: "Error", description: "Failed to update task status. Please try again.", variant: "destructive" });
      return;
    }

    if (complete) {
      const task = tasks.find((t) => t.id === taskId);
      if (task?.is_recurring && task?.is_active_recurrence) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error: rpcError } = await (supabase as any).rpc(
          "generate_next_recurring_task",
          { task_id: taskId }
        );

        if (rpcError) {
          toast({ title: "Task completed", description: "Could not generate next occurrence." });
        } else if ((data as Record<string, unknown>)?.success) {
          toast({
            title: "Task completed",
            description: `Next occurrence scheduled for ${new Date((data as Record<string, unknown>).next_due_date as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
          });
        }
      }
    }
    router.refresh();
  }

  async function handleDeleteTask(taskId: string) {
    const { error } = await supabase.from("ops_tasks").delete().eq("id", taskId);
    if (error) {
      const description = error.message?.includes("foreign key constraint")
        ? "Failed to delete task. It has related records that must be removed first."
        : "Could not delete task.";
      toast({ title: "Failed to delete task", description, variant: "destructive" });
      return;
    }
    toast({ title: "Task deleted" });
    router.refresh();
  }

  async function handleDeleteProject(projectId: string) {
    const { error: unlinkError } = await supabase.from("ops_tasks").update({ project_id: null }).eq("project_id", projectId);
    if (unlinkError) {
      console.error("Failed to unlink tasks from project:", unlinkError);
      toast({ title: "Error", description: "Failed to unlink tasks from project. Please try again.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("ops_projects").delete().eq("id", projectId);
    if (error) {
      toast({ title: "Error", description: "Could not delete project.", variant: "destructive" });
      return;
    }
    toast({ title: "Project deleted" });
    router.refresh();
  }

  async function handleStopRecurrence(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    const { error: stopError } = await supabase.from("ops_tasks").update({ is_active_recurrence: false }).eq("id", taskId);
    if (stopError) {
      console.error("Failed to stop recurrence:", stopError);
      toast({ title: "Error", description: "Failed to stop recurrence. Please try again.", variant: "destructive" });
      return;
    }
    if (task?.recurring_series_id) {
      const { error: seriesError } = await supabase.from("ops_tasks")
        .update({ is_active_recurrence: false })
        .eq("recurring_series_id", task.recurring_series_id)
        .neq("status", "Complete");
      if (seriesError) {
        console.error("Failed to stop series recurrence:", seriesError);
        toast({ title: "Warning", description: "Recurrence stopped for this task but failed for related tasks.", variant: "destructive" });
        router.refresh();
        return;
      }
    }
    toast({ title: "Recurrence stopped", description: "No further tasks will be generated." });
    router.refresh();
  }

  // DnD sensors for projects
  const projectSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Persist sort_order updates to Supabase
  const persistProjectOrder = useCallback(async (orderedIds: string[]) => {
    try {
      const updates = orderedIds.map((id, i) =>
        supabase.from("ops_projects").update({ sort_order: i }).eq("id", id)
      );
      const results = await Promise.all(updates);
      const failed = results.filter((r) => r.error);
      if (failed.length > 0) {
        console.error("Failed to persist project order:", failed.map((r) => r.error));
        toast({ title: "Error", description: "Failed to save project order. Please refresh and try again.", variant: "destructive" });
      }
    } catch (err) {
      console.error("Failed to persist project order:", err);
      toast({ title: "Error", description: "Failed to save project order.", variant: "destructive" });
    }
  }, [supabase, toast]);

  const persistTaskOrder = useCallback(async (taskIds: string[]) => {
    try {
      const updates = taskIds.map((id, i) =>
        supabase.from("ops_tasks").update({ sort_order: i }).eq("id", id)
      );
      const results = await Promise.all(updates);
      const failed = results.filter((r) => r.error);
      if (failed.length > 0) {
        console.error("Failed to persist task order:", failed.map((r) => r.error));
        toast({ title: "Error", description: "Failed to save task order. Please refresh and try again.", variant: "destructive" });
      }
    } catch (err) {
      console.error("Failed to persist task order:", err);
      toast({ title: "Error", description: "Failed to save task order.", variant: "destructive" });
    }
  }, [supabase, toast]);

  function handleProjectDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const currentOrder = projectOrder ?? filteredProjects.map((p) => p.id);
    const oldIndex = currentOrder.indexOf(active.id as string);
    const newIndex = currentOrder.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = [...currentOrder];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);
    setProjectOrder(newOrder);
    persistProjectOrder(newOrder);
  }

  function handleReorderTasks(projectId: string, taskIds: string[]) {
    setTaskOrderByProject((prev) => ({ ...prev, [projectId]: taskIds }));
    persistTaskOrder(taskIds);
  }

  // Status filter options depend on the active view
  const statusOptions = view === "tasks"
    ? [
        { value: "To Do", label: "To Do" },
        { value: "In Progress", label: "In Progress" },
        { value: "In Review", label: "In Review" },
        { value: "Blocked", label: "Blocked" },
        { value: "Complete", label: "Complete" },
      ]
    : [
        { value: "Not Started", label: "Not Started" },
        { value: "Planning", label: "Planning" },
        { value: "In Progress", label: "In Progress" },
        { value: "Blocked", label: "Blocked" },
        { value: "On Hold", label: "On Hold" },
        { value: "Complete", label: "Complete" },
      ];

  // Count for result text
  const resultText = view === "projects"
    ? `${filteredProjects.length} project${filteredProjects.length !== 1 ? "s" : ""}`
    : view === "tasks"
      ? `${tasks.length} tasks across ${projects.length} projects`
      : `${approvals.filter((a) => a.status === "pending").length} pending approvals`;

  const pendingApprovalCount = approvals.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[22px] font-bold text-foreground">Operations</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Manage projects and tasks across the organization.
          </p>
        </div>
        <div className="flex gap-2">
          <AddTaskDialog projects={rawProjects} teamMembers={teamMembers} />
          <AddProjectDialog teamMembers={teamMembers} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-card rounded-xl border border-border px-5 py-3 flex items-center gap-3 flex-wrap">
        {/* View Toggle */}
        <div className="inline-flex rounded-lg border border-border overflow-hidden">
          {([
            { key: "projects" as const, label: "Projects", icon: FolderKanban },
            { key: "tasks" as const, label: "Tasks", icon: ListChecks },
            { key: "approvals" as const, label: "Approvals", icon: Shield, count: pendingApprovalCount },
          ]).map((v, i, arr) => (
            <div key={v.key} className="flex items-center">
              {i > 0 && view !== v.key && view !== arr[i - 1].key && (
                <div className="w-px h-4 bg-border" />
              )}
              <button
                type="button"
                onClick={() => setView(v.key)}
                className={cn(
                  "text-xs font-medium px-3.5 py-1.5 flex items-center gap-1.5 transition-colors",
                  view === v.key
                    ? "bg-foreground text-background"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <v.icon size={13} />
                {v.label}
                {v.count != null && v.count > 0 && view !== v.key && (
                  <span className="ml-1 bg-[#E5930E]/20 text-[#E5930E] text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                    {v.count}
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-border" />

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full text-xs text-foreground border border-border rounded-lg py-1.5 pl-8 pr-3 bg-muted/50 focus:outline-none focus:ring-1 focus:ring-foreground/20 placeholder:text-muted-foreground"
          />
        </div>

        {/* Filters */}
        <FilterDrop
          label="All Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
        />
        <FilterDrop
          label="All Owner"
          value={ownerFilter}
          onChange={setOwnerFilter}
          options={ownerOptions.map((n) => ({ value: n, label: n }))}
        />
        <FilterDrop
          label="All Priority"
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={[
            { value: "Critical", label: "Critical" },
            { value: "High", label: "High" },
            { value: "Medium", label: "Medium" },
            { value: "Low", label: "Low" },
          ]}
        />
        <FilterDrop
          label="All Category"
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categoryOptions.map((c) => ({ value: c, label: CATEGORY_LABELS[c] ?? c }))}
        />

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-[11px] font-medium text-[#E5453D] flex items-center gap-1 hover:underline"
          >
            <RotateCcw size={11} />
            Clear
          </button>
        )}
      </div>

      {/* Result Count */}
      <div className="text-xs text-muted-foreground">
        {resultText}
      </div>

      {/* Content */}
      {view === "projects" && (
        <DndContext
          sensors={projectSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleProjectDragEnd}
        >
          <SortableContext
            items={filteredProjects.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {filteredProjects.length === 0 ? (
                <div className="bg-card rounded-xl border border-border py-12 px-5 text-center">
                  <Inbox size={36} className="mx-auto text-muted-foreground" />
                  <div className="text-[15px] font-semibold text-foreground mt-3">No projects match filters</div>
                  <div className="text-[13px] text-muted-foreground mt-1">Try adjusting your filters or create a new project.</div>
                </div>
              ) : (
                filteredProjects.map((p) => (
                  <ProjectRow
                    key={p.id}
                    project={p}
                    tasks={tasksByProject[p.id] ?? []}
                    expanded={!!expanded[p.id]}
                    onToggle={() => toggleExpand(p.id)}
                    onToggleTask={handleToggleTask}
                    onStopRecurrence={handleStopRecurrence}
                    onDeleteTask={handleDeleteTask}
                    onDeleteProject={handleDeleteProject}
                    onOpenTask={handleOpenTask}
                    onAddTask={() => { setAddTaskProjectId(p.id); setAddTaskOpen(true); }}
                    onReorderTasks={handleReorderTasks}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {view === "tasks" && (
        <AllTasksView
          tasks={tasks}
          projectNames={projectNames}
          statusFilter={statusFilter}
          ownerFilter={ownerFilter}
          priorityFilter={priorityFilter}
          categoryFilter={categoryFilter}
          onToggleTask={handleToggleTask}
          onOpenTask={handleOpenTask}
          onStopRecurrence={handleStopRecurrence}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {view === "approvals" && (
        <ApprovalsView
          approvals={approvals}
          onNavigateToApproval={(id) => router.push(`/tasks/approvals/${id}`)}
        />
      )}

      {/* Inline Add Task Dialog (for project-level "Add Task" button) */}
      <AddTaskDialog
        projects={rawProjects}
        teamMembers={teamMembers}
        externalOpen={addTaskOpen}
        onExternalOpenChange={(v) => {
          setAddTaskOpen(v);
          if (!v) setAddTaskProjectId(undefined);
        }}
        defaultProjectId={addTaskProjectId}
      />

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        projectName={selectedTask?.project_id ? projectNames[selectedTask.project_id] ?? null : null}
        currentUserId={currentUserId}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}

/* ── Status normalization ── */
const statusDisplayMap: Record<string, string> = {
  "not started": "Not Started",
  not_started: "Not Started",
  planning: "Planning",
  "in progress": "In Progress",
  in_progress: "In Progress",
  active: "In Progress",
  blocked: "Blocked",
  on_hold: "On Hold",
  "on hold": "On Hold",
  complete: "Complete",
  completed: "Complete",
  cancelled: "Complete",
};

function normalizeStatus(status: string | null): string {
  if (!status) return "Not Started";
  return statusDisplayMap[status.toLowerCase()] ?? status;
}
