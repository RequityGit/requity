"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmailTemplate } from "@/app/(authenticated)/(admin)/email-templates/types";
import { deleteTemplateAction } from "@/app/(authenticated)/(admin)/email-templates/actions-write";
import {
  duplicateTemplateAction,
  toggleTemplateActiveAction,
} from "@/app/(authenticated)/(admin)/email-templates/actions-extra";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { TemplateFilters } from "./template-filters";

interface TemplateListProps {
  templates: EmailTemplate[];
}

export function TemplateList({ templates: initial }: TemplateListProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initial);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = templates.filter((t) => {
    const matchesSearch =
      !search ||
      t.display_name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      t.subject_template.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  async function handleDuplicate(id: string) {
    const result = await duplicateTemplateAction(id);
    if ("success" in result) {
      setTemplates((prev) => [result.template, ...prev]);
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    const result = await toggleTemplateActiveAction(id, isActive);
    if ("success" in result) {
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_active: isActive } : t))
      );
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    const result = await deleteTemplateAction(deleteId);
    if ("success" in result) {
      setTemplates((prev) => prev.filter((t) => t.id !== deleteId));
    }
    setDeleteId(null);
  }

  return (
    <>
      <TemplateFilters
        search={search}
        onSearchChange={setSearch}
        category={categoryFilter}
        onCategoryChange={setCategoryFilter}
      />

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No templates found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow
                  key={t.id}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => router.push(`/control-center/email-templates/${t.id}`)}
                >
                  <TableCell className="font-medium">
                    {t.display_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[300px] truncate">
                    {t.subject_template || (
                      <span className="italic">No subject</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {t.category ?? "general"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(t.id, !t.is_active);
                      }}
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors",
                        t.is_active
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      )}
                    >
                      {t.is_active ? "Active" : "Inactive"}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(t.id);
                        }}
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(t.id);
                        }}
                        title="Delete"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
