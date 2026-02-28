"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import {
  FolderKanban,
  ListTodo,
  LayoutGrid,
  TableIcon,
  X,
  History,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { OperationsStats } from "./OperationsStats";
import { MultiSelectFilter } from "./MultiSelectFilter";
import { ProjectCard, type OpsProject, type OpsTask } from "./ProjectCard";
import { TaskList } from "./TaskList";
import { TaskBoard } from "./TaskBoard";
import { AddProjectDialog } from "./AddProjectDialog";
import { AddTaskDialog } from "./AddTaskDialog";

export interface TeamMember {
  id: string;
  full_name: string;
}

interface OperationsViewProps {
  projects: OpsProject[];
  tasks: OpsTask[];
  teamMembers: TeamMember[];
}

const priorityOrder: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

function getUniqueValues(items: (string | null)[]): string[] {
  return Array.from(new Set(items.filter((v): v is string => v != null))).sort();
}

export function OperationsView({ projects, tasks, teamMembers }: OperationsViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [ownerFilter, setOwnerFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

  // Task view mode
  const [taskView, setTaskView] = useState<"list" | "board">("list");

  // Toggle to show/hide completed recurring task instances
  const [showCompletedRecurring, setShowCompletedRecurring] = useState(false);

  // Compute filter options
  const projectStatuses = useMemo(
    () => getUniqueValues(projects.map((p) => p.status)),
    [projects]
  );
  const projectOwners = useMemo(
    () => getUniqueValues(projects.map((p) => p.owner)),
    [projects]
  );
  const projectPriorities = useMemo(
    () => getUniqueValues(projects.map((p) => p.priority)),
    [projects]
  );
  const projectCategories = useMemo(
    () => getUniqueValues(projects.map((p) => p.category)),
    [projects]
  );

  const taskStatuses = useMemo(
    () => getUniqueValues(tasks.map((t) => t.status)),
    [tasks]
  );
  const taskAssignees = useMemo(
    () => getUniqueValues(tasks.map((t) => t.assigned_to_name)),
    [tasks]
  );
  const taskPriorities = useMemo(
    () => getUniqueValues(tasks.map((t) => t.priority)),
    [tasks]
  );
  const taskCategories = useMemo(
    () => getUniqueValues(tasks.map((t) => t.category)),
    [tasks]
  );

  const hasFilters =
    statusFilter.length > 0 ||
    ownerFilter.length > 0 ||
    priorityFilter.length > 0 ||
    categoryFilter.length > 0;

  function clearFilters() {
    setStatusFilter([]);
    setOwnerFilter([]);
    setPriorityFilter([]);
    setCategoryFilter([]);
  }

  // Filtered projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];
    if (statusFilter.length > 0) {
      result = result.filter((p) => p.status && statusFilter.includes(p.status));
    }
    if (ownerFilter.length > 0) {
      result = result.filter((p) => p.owner && ownerFilter.includes(p.owner));
    }
    if (priorityFilter.length > 0) {
      result = result.filter(
        (p) => p.priority && priorityFilter.includes(p.priority)
      );
    }
    if (categoryFilter.length > 0) {
      result = result.filter(
        (p) => p.category && categoryFilter.includes(p.category)
      );
    }
    // Sort by priority
    result.sort(
      (a, b) =>
        (priorityOrder[a.priority ?? ""] ?? 99) -
        (priorityOrder[b.priority ?? ""] ?? 99)
    );
    return result;
  }, [projects, statusFilter, ownerFilter, priorityFilter, categoryFilter]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    // Hide completed recurring series instances by default
    if (!showCompletedRecurring) {
      result = result.filter((t) => {
        if (t.status !== "Complete") return true;
        if (!t.is_recurring || !t.recurring_series_id) return true;
        return false;
      });
    }
    if (statusFilter.length > 0) {
      result = result.filter((t) => statusFilter.includes(t.status));
    }
    if (ownerFilter.length > 0) {
      result = result.filter(
        (t) => t.assigned_to_name && ownerFilter.includes(t.assigned_to_name)
      );
    }
    if (priorityFilter.length > 0) {
      result = result.filter((t) => priorityFilter.includes(t.priority));
    }
    if (categoryFilter.length > 0) {
      result = result.filter(
        (t) => t.category && categoryFilter.includes(t.category)
      );
    }
    return result;
  }, [tasks, statusFilter, ownerFilter, priorityFilter, categoryFilter, showCompletedRecurring]);

  // Project name lookup for tasks
  const projectNames = useMemo(() => {
    const map: Record<string, string> = {};
    projects.forEach((p) => {
      map[p.id] = p.project_name;
    });
    return map;
  }, [projects]);

  // Tasks grouped by project
  const tasksByProject = useMemo(() => {
    const map: Record<string, OpsTask[]> = {};
    tasks.forEach((t) => {
      if (t.project_id) {
        // Hide completed recurring instances in project view
        if (!showCompletedRecurring && t.status === "Complete" && t.is_recurring && t.recurring_series_id) {
          return;
        }
        if (!map[t.project_id]) map[t.project_id] = [];
        map[t.project_id].push(t);
      }
    });
    return map;
  }, [tasks, showCompletedRecurring]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

    const activeProjects = projects.filter(
      (p) => p.status && !["Completed", "Cancelled"].includes(p.status)
    ).length;

    const criticalTasks = tasks.filter(
      (t) => t.priority === "Critical" && t.status !== "Complete"
    ).length;

    const dueThisWeek = tasks.filter((t) => {
      if (!t.due_date || t.status === "Complete") return false;
      const due = new Date(t.due_date);
      due.setHours(0, 0, 0, 0);
      return due >= now && due <= endOfWeek;
    }).length;

    // Count unique active recurring series (not all historical instances)
    const recurringTasks = new Set(
      tasks
        .filter((t) => t.is_recurring && t.is_active_recurrence && t.status !== "Complete")
        .map((t) => t.recurring_series_id ?? t.id)
    ).size;

    return { activeProjects, criticalTasks, dueThisWeek, recurringTasks };
  }, [projects, tasks]);

  // Toggle task complete/incomplete
  async function handleToggleTask(taskId: string, complete: boolean) {
    await supabase.from("ops_tasks").update({
      status: complete ? "Complete" : "To Do",
      completed_at: complete ? new Date().toISOString() : null,
    }).eq("id", taskId);

    // If completing a recurring task, generate the next occurrence via RPC
    if (complete) {
      const task = tasks.find((t) => t.id === taskId);
      if (task?.is_recurring && task?.is_active_recurrence) {
        const { data, error: rpcError } = await supabase.rpc(
          "generate_next_recurring_task",
          { task_id: taskId }
        );

        if (rpcError) {
          toast({
            title: "Task completed",
            description: "Could not generate next occurrence.",
          });
        } else if (data?.success) {
          toast({
            title: "Task completed",
            description: `Next occurrence scheduled for ${new Date(data.next_due_date as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
          });
        } else if (data?.skipped) {
          toast({
            title: "Task completed",
            description: data.reason === "Past recurrence end date"
              ? "Recurring series has ended."
              : "Next task already exists.",
          });
        }
      }
    }

    router.refresh();
  }

  // Delete a task
  async function handleDeleteTask(taskId: string) {
    const { error } = await supabase.from("ops_tasks").delete().eq("id", taskId);
    if (error) {
      toast({ title: "Error", description: "Could not delete task.", variant: "destructive" });
      return;
    }
    toast({ title: "Task deleted" });
    router.refresh();
  }

  // Delete a project (nulls out project_id on linked tasks first to avoid FK violation)
  async function handleDeleteProject(projectId: string) {
    await supabase.from("ops_tasks").update({ project_id: null }).eq("project_id", projectId);
    const { error } = await supabase.from("ops_projects").delete().eq("id", projectId);
    if (error) {
      toast({ title: "Error", description: "Could not delete project.", variant: "destructive" });
      return;
    }
    toast({ title: "Project deleted" });
    router.refresh();
  }

  // Stop a recurring series from generating future tasks
  async function handleStopRecurrence(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);

    await supabase.from("ops_tasks")
      .update({ is_active_recurrence: false })
      .eq("id", taskId);

    // Also stop recurrence on all future pending tasks in the same series
    if (task?.recurring_series_id) {
      await supabase.from("ops_tasks")
        .update({ is_active_recurrence: false })
        .eq("recurring_series_id", task.recurring_series_id)
        .neq("status", "Complete");
    }

    toast({ title: "Recurrence stopped", description: "No further tasks will be generated." });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations"
        description="Manage projects and tasks across the organization."
        action={
          <div className="flex items-center gap-2">
            <AddTaskDialog projects={projects} teamMembers={teamMembers} />
            <AddProjectDialog teamMembers={teamMembers} />
          </div>
        }
      />

      <OperationsStats {...stats} />

      <Tabs defaultValue="projects">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="projects" className="gap-1.5">
              <FolderKanban className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1.5">
              <ListTodo className="h-4 w-4" />
              Tasks
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Projects Tab */}
        <TabsContent value="projects" className="mt-4 space-y-4">
          {/* Project Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <MultiSelectFilter
              label="Status"
              options={projectStatuses}
              selected={statusFilter}
              onChange={setStatusFilter}
            />
            <MultiSelectFilter
              label="Owner"
              options={projectOwners}
              selected={ownerFilter}
              onChange={setOwnerFilter}
            />
            <MultiSelectFilter
              label="Priority"
              options={projectPriorities}
              selected={priorityFilter}
              onChange={setPriorityFilter}
            />
            <MultiSelectFilter
              label="Category"
              options={projectCategories}
              selected={categoryFilter}
              onChange={setCategoryFilter}
            />
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1 text-muted-foreground"
              >
                <X className="h-3 w-3" />
                Clear filters
              </Button>
            )}
          </div>

          {/* Project Cards */}
          {filteredProjects.length === 0 ? (
            <div className="rounded-md border bg-white p-8 text-center text-muted-foreground">
              No projects found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  tasks={tasksByProject[project.id] ?? []}
                  onToggleTask={handleToggleTask}
                  onStopRecurrence={handleStopRecurrence}
                  onDeleteTask={handleDeleteTask}
                  onDeleteProject={handleDeleteProject}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-4 space-y-4">
          {/* Task Filters + View Toggle */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <MultiSelectFilter
                label="Status"
                options={taskStatuses}
                selected={statusFilter}
                onChange={setStatusFilter}
              />
              <MultiSelectFilter
                label="Assignee"
                options={taskAssignees}
                selected={ownerFilter}
                onChange={setOwnerFilter}
              />
              <MultiSelectFilter
                label="Priority"
                options={taskPriorities}
                selected={priorityFilter}
                onChange={setPriorityFilter}
              />
              <MultiSelectFilter
                label="Category"
                options={taskCategories}
                selected={categoryFilter}
                onChange={setCategoryFilter}
              />
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-1 text-muted-foreground"
                >
                  <X className="h-3 w-3" />
                  Clear filters
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowCompletedRecurring(!showCompletedRecurring)}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  showCompletedRecurring
                    ? "text-purple-700"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <History className="h-3.5 w-3.5" />
                {showCompletedRecurring ? "Hide" : "Show"} history
              </button>

              <div className="flex items-center rounded-md border bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setTaskView("list")}
                  className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                    taskView === "list"
                      ? "bg-slate-100 text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <TableIcon className="h-4 w-4" />
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setTaskView("board")}
                  className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                    taskView === "board"
                      ? "bg-slate-100 text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Board
                </button>
              </div>
            </div>
          </div>

          {/* Task Views */}
          {taskView === "list" ? (
            <TaskList
              tasks={filteredTasks}
              projectNames={projectNames}
              onToggleTask={handleToggleTask}
              onStopRecurrence={handleStopRecurrence}
              onDeleteTask={handleDeleteTask}
            />
          ) : (
            <TaskBoard
              tasks={filteredTasks}
              projectNames={projectNames}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
