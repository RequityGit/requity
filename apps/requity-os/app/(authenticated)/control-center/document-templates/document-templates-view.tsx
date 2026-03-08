"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  MoreHorizontal,
  Copy,
  Pencil,
  Trash2,
  Check,
  X,
  FileEdit,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  toggleTemplateActive,
  duplicateTemplate,
  deleteTemplate,
} from "./actions";
import { TemplateSheet } from "./template-sheet";

// Type badge colors by template_type
const TYPE_COLORS: Record<string, string> = {
  nda: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  broker_agreement:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  term_sheet:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  loan_agreement:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  investor_agreement:
    "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const TYPE_LABELS: Record<string, string> = {
  nda: "NDA",
  broker_agreement: "Broker Agreement",
  term_sheet: "Term Sheet",
  loan_agreement: "Loan Agreement",
  investor_agreement: "Investor Agreement",
  other: "Other",
};

const RECORD_TYPE_LABELS: Record<string, string> = {
  loan: "Loan",
  contact: "Contact",
  deal: "Deal",
  company: "Company",
};

interface Template {
  id: string;
  name: string;
  template_type: string;
  record_type: string;
  description: string | null;
  gdrive_file_id: string;
  gdrive_folder_id: string | null;
  merge_fields: Array<{
    key: string;
    label: string;
    source: string;
    column: string;
    format?: string | null;
  }>;
  version: number;
  is_active: boolean;
  requires_signature: boolean;
  signature_roles: Array<{
    role: string;
    name_source: string;
    email_source: string;
    order: number;
  }> | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  templates: Template[];
}

export function DocumentTemplatesView({ templates }: Props) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  function handleEdit(template: Template) {
    setEditingTemplate(template);
    setSheetOpen(true);
  }

  function handleNew() {
    setEditingTemplate(null);
    setSheetOpen(true);
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    setLoading(id);
    const result = await toggleTemplateActive(id, !currentActive);
    if (result.error) {
      toast.error(`Failed to update template: ${result.error}`);
    } else {
      toast.success(currentActive ? "Template deactivated" : "Template activated");
      router.refresh();
    }
    setLoading(null);
  }

  async function handleDuplicate(id: string) {
    setLoading(id);
    const result = await duplicateTemplate(id);
    if (result.error) {
      toast.error(`Failed to duplicate: ${result.error}`);
    } else {
      toast.success("Template duplicated");
      router.refresh();
    }
    setLoading(null);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setLoading(deleteId);
    const result = await deleteTemplate(deleteId);
    if (result.error) {
      toast.error(`Failed to delete: ${result.error}`);
    } else {
      toast.success("Template deleted");
      router.refresh();
    }
    setLoading(null);
    setDeleteId(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Document Templates</h2>
          <p className="text-sm text-muted-foreground">
            Manage document templates for agreements, term sheets, and other
            generated documents.
          </p>
        </div>
        <Button size="sm" onClick={handleNew}>
          <Plus size={14} className="mr-1.5" />
          New Template
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Record Type</th>
                <th className="px-4 py-3 font-medium">Fields</th>
                <th className="px-4 py-3 font-medium">Signature</th>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium w-[60px]" />
              </tr>
            </thead>
            <tbody>
              {templates.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    <FileText
                      size={32}
                      className="mx-auto mb-2 opacity-40"
                    />
                    No templates yet. Create your first template to get started.
                  </td>
                </tr>
              )}
              {templates.map((t) => {
                const fieldCount = Array.isArray(t.merge_fields)
                  ? t.merge_fields.length
                  : 0;
                return (
                  <tr
                    key={t.id}
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {t.name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={TYPE_COLORS[t.template_type] ?? TYPE_COLORS.other}
                      >
                        {TYPE_LABELS[t.template_type] ?? t.template_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {RECORD_TYPE_LABELS[t.record_type] ?? t.record_type}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {fieldCount} field{fieldCount !== 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-3">
                      {t.requires_signature ? (
                        <Check size={14} className="text-green-600" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground num">
                      v{t.version}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={t.is_active ? "default" : "secondary"}
                        className={
                          t.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-gray-100 text-gray-500"
                        }
                      >
                        {t.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={loading === t.id}
                          >
                            <MoreHorizontal size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(t)}>
                            <Pencil size={14} className="mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/control-center/document-templates/editor/${t.id}`
                              )
                            }
                          >
                            <FileEdit size={14} className="mr-2" />
                            Open Editor
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(t.id)}
                          >
                            <Copy size={14} className="mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleActive(t.id, t.is_active)
                            }
                          >
                            {t.is_active ? (
                              <>
                                <X size={14} className="mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Check size={14} className="mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(t.id)}
                          >
                            <Trash2 size={14} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Create Sheet */}
      <TemplateSheet
        key={editingTemplate?.id ?? "new"}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        template={editingTemplate}
        onSuccess={() => {
          setSheetOpen(false);
          setEditingTemplate(null);
          router.refresh();
        }}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this template. Generated documents
              that used this template will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
