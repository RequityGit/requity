"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Briefcase, UserPlus, Building2, ListTodo } from "lucide-react";
import { fetchQuickCreateData } from "@/app/(authenticated)/(admin)/actions/quick-create";
import { NewDealDialog } from "@/components/pipeline/NewDealDialog";
import { AddContactDialog } from "@/components/crm/add-contact-dialog";
import { AddCompanyDialog } from "@/components/crm/add-company-dialog";
import { TaskSheet } from "@/components/tasks/task-sheet";
import type { OpsTask } from "@/lib/tasks";

interface QuickCreateButtonProps {
  currentUserId: string;
  isSuperAdmin?: boolean;
}

export function QuickCreateButton({ currentUserId, isSuperAdmin }: QuickCreateButtonProps) {
  const router = useRouter();
  const [activeDialog, setActiveDialog] = useState<"deal" | "contact" | "company" | "task" | null>(null);
  const [data, setData] = useState<{
    teamMembers: { id: string; full_name: string; avatar_url: string | null }[];
    cardTypes: any[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const ensureData = useCallback(async () => {
    if (data) return data;
    setLoading(true);
    try {
      const result = await fetchQuickCreateData();
      setData(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, [data]);

  async function handleSelect(type: "deal" | "contact" | "company" | "task") {
    if (type === "company") {
      setActiveDialog("company");
      return;
    }
    await ensureData();
    setActiveDialog(type);
  }

  function closeDialog() {
    setActiveDialog(null);
  }

  function handleTaskSaved(_task: OpsTask) {
    closeDialog();
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center justify-center h-9 w-9 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none"
            aria-label="Create new"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => handleSelect("deal")}
            className="cursor-pointer gap-2"
            disabled={loading}
          >
            <Briefcase className="h-4 w-4" />
            New Deal
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleSelect("contact")}
            className="cursor-pointer gap-2"
            disabled={loading}
          >
            <UserPlus className="h-4 w-4" />
            New Contact
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleSelect("company")}
            className="cursor-pointer gap-2"
            disabled={loading}
          >
            <Building2 className="h-4 w-4" />
            New Company
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleSelect("task")}
            className="cursor-pointer gap-2"
            disabled={loading}
          >
            <ListTodo className="h-4 w-4" />
            New Task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {data && (
        <NewDealDialog
          open={activeDialog === "deal"}
          onOpenChange={(v) => { if (!v) closeDialog(); }}
          cardTypes={data.cardTypes}
          teamMembers={data.teamMembers}
          currentUserId={currentUserId}
        />
      )}

      {data && (
        <AddContactDialog
          open={activeDialog === "contact"}
          onOpenChange={(v) => { if (!v) closeDialog(); }}
          teamMembers={data.teamMembers}
          currentUserId={currentUserId}
          onSuccess={() => {
            closeDialog();
            router.refresh();
          }}
        />
      )}

      <AddCompanyDialog
        open={activeDialog === "company"}
        onOpenChange={(v) => { if (!v) closeDialog(); }}
      />

      {data && (
        <TaskSheet
          open={activeDialog === "task"}
          task={null}
          profiles={data.teamMembers}
          currentUserId={currentUserId}
          isSuperAdmin={isSuperAdmin}
          onClose={closeDialog}
          onSaved={handleTaskSaved}
          onDeleted={() => {
            closeDialog();
            router.refresh();
          }}
        />
      )}
    </>
  );
}
