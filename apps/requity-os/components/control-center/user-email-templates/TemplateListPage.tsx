"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showSuccess, showError } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import type { UserEmailTemplate } from "@/lib/types/user-email-templates";
import { USER_TEMPLATE_CATEGORIES } from "@/lib/types/user-email-templates";
import {
  deleteUserEmailTemplateAction,
  toggleUserEmailTemplateActiveAction,
  duplicateUserEmailTemplateAction,
} from "@/app/(authenticated)/control-center/user-email-templates/actions";

interface TemplateListPageProps {
  initialTemplates: UserEmailTemplate[];
}

const categoryColors: Record<string, string> = {
  lending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  investor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  servicing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  closing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  general: "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground",
};

export function UserEmailTemplateListPage({
  initialTemplates,
}: TemplateListPageProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [templates, setTemplates] = useState(initialTemplates);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered =
    activeCategory === "all"
      ? templates
      : templates.filter((t) => t.category === activeCategory);

  async function handleToggleActive(id: string, currentActive: boolean) {
    setActionLoading(id);
    const result = await toggleUserEmailTemplateActiveAction(id, !currentActive);
    if ("error" in result) {
      showError("Could not update template", result.error);
    } else {
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_active: !currentActive } : t))
      );
      showSuccess(currentActive ? "Template deactivated" : "Template activated");
    }
    setActionLoading(null);
  }

  async function handleDuplicate(id: string) {
    setActionLoading(id);
    const result = await duplicateUserEmailTemplateAction(id);
    if ("error" in result) {
      showError("Could not duplicate template", result.error);
    } else {
      setTemplates((prev) => [...prev, result.template]);
      showSuccess("Template duplicated");
    }
    setActionLoading(null);
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: "Delete template?",
      description:
        "This action cannot be undone. The template and all its version history will be permanently deleted.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    setActionLoading(id);
    const result = await deleteUserEmailTemplateAction(id);
    if ("error" in result) {
      showError("Could not delete template", result.error);
    } else {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      showSuccess("Template deleted");
    }
    setActionLoading(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">User Email Templates</h2>
          <p className="text-sm text-muted-foreground">
            Reusable templates for team-composed emails with merge fields.
          </p>
        </div>
        <Link href="/control-center/user-email-templates/new">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </Link>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            activeCategory === "all"
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All ({templates.length})
        </button>
        {USER_TEMPLATE_CATEGORIES.map((cat) => {
          const count = templates.filter((t) => t.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                activeCategory === cat
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Templates table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground text-sm">
            No templates found. Create your first template to get started.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Context</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((template) => (
                <TableRow
                  key={template.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() =>
                    router.push(
                      `/control-center/user-email-templates/${template.id}`
                    )
                  }
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{template.name}</p>
                      {template.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {template.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${categoryColors[template.category] ?? categoryColors.general}`}
                    >
                      {template.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground capitalize">
                      {template.context}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={template.is_active ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      v{template.version}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(template.updated_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/control-center/user-email-templates/${template.id}`
                            );
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(template.id);
                          }}
                          disabled={actionLoading === template.id}
                        >
                          <Copy className="h-3.5 w-3.5 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive(template.id, template.is_active);
                          }}
                          disabled={actionLoading === template.id}
                        >
                          {template.is_active ? (
                            <ToggleLeft className="h-3.5 w-3.5 mr-2" />
                          ) : (
                            <ToggleRight className="h-3.5 w-3.5 mr-2" />
                          )}
                          {template.is_active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(template.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
