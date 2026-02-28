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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { OperationsStats } from "./OperationsStats";
import { MultiSelectFilter } from "./MultiSelectFilter";
import { ProjectCard, type OpsProject, type OpsTask } from "./ProjectCard";
import { TaskList } from "./TaskList";
import { TaskBoard } from "./TaskBoard";

interface OperationsViewProps {
  projects: OpsProject[];
  tasks: OpsTask[];
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

export function OperationsView({ projects, tasks }: OperationsViewProps) {
  const router = useRouter();
  const supabase = createClient();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [ownerFilter, setOwnerFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

  // Task view mode
  const [taskView, setTaskView] = useState<"list" | "board">("list");

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
  }, [tasks, statusFilter, ownerFilter, priorityFilter, categoryFilter]);

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
        if (!map[t.project_id]) map[t.project_id] = [];
        map[t.project_id].push(t);
      }
    });
    return map;
  }, [tasks]);

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

    const recurringTasks = tasks.filter((t) => t.is_recurring).length;

    return { activeProjects, criticalTasks, dueThisWeek, recurringTasks };
  }, [projects, tasks]);

  // Toggle task complete/incomplete
  async function handleToggleTask(taskId: string, complete: boolean) {
    const update: Record<string, unknown> = {
      status: complete ? "Complete" : "To Do",
      completed_at: complete ? new Date().toISOString() : null,
    };

    await (supabase.from as Function)("ops_tasks").update(update).eq("id", taskId);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations"
        description="Manage projects and tasks across the organization."
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
                className="gap-1 text-surface-muted"
              >
                <X className="h-3 w-3" />
                Clear filters
              </Button>
            )}
          </div>

          {/* Project Cards */}
          {filteredProjects.length === 0 ? (
            <div className="rounded-md border bg-navy-mid p-8 text-center text-surface-muted">
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
                  className="gap-1 text-surface-muted"
                >
                  <X className="h-3 w-3" />
                  Clear filters
                </Button>
              )}
            </div>

            <div className="flex items-center rounded-md border bg-navy-mid p-0.5">
              <button
                type="button"
                onClick={() => setTaskView("list")}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  taskView === "list"
                    ? "bg-navy-mid text-foreground"
                    : "text-surface-muted hover:text-foreground"
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
                    ? "bg-navy-mid text-foreground"
                    : "text-surface-muted hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Board
              </button>
            </div>
          </div>

          {/* Task Views */}
          {taskView === "list" ? (
            <TaskList
              tasks={filteredTasks}
              projectNames={projectNames}
              onToggleTask={handleToggleTask}
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
