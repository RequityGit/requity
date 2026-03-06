"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { LoanTypeBadge } from "./loan-type-badge";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Archive,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConditionTemplate {
  id: string;
  condition_name: string;
  category: string;
  required_stage: string;
  applies_to_commercial: boolean | null;
  applies_to_rtl: boolean | null;
  applies_to_dscr: boolean | null;
  applies_to_guc: boolean | null;
  applies_to_transactional: boolean | null;
  internal_description: string | null;
  borrower_description: string | null;
  responsible_party: string | null;
  critical_path_item: boolean | null;
  sort_order: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

const RP_ABBREVIATIONS: Record<string, string> = {
  borrower: "Borr",
  broker: "Broker",
  title_company: "Title",
  insurance_agent: "Ins",
  internal: "Int",
  attorney: "Atty",
  other: "Other",
};

interface ConditionCategorySectionProps {
  category: string;
  label: string;
  items: ConditionTemplate[];
  expanded: boolean;
  onToggle: () => void;
  onAddToCategory: () => void;
  onEdit: (condition: ConditionTemplate) => void;
  onDeactivate: (id: string) => void;
  onReactivate: (id: string) => void;
  onReorder: (items: ConditionTemplate[]) => void;
  onInlineUpdate: (
    id: string,
    fields: Partial<{
      condition_name: string;
      applies_to_commercial: boolean;
      applies_to_rtl: boolean;
      applies_to_dscr: boolean;
      applies_to_guc: boolean;
      applies_to_transactional: boolean;
    }>
  ) => Promise<boolean>;
}

function InlineNameEditor({
  value,
  isActive,
  onSave,
}: {
  value: string;
  isActive: boolean;
  onSave: (newName: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setDraft(value);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="h-7 text-sm font-medium px-1.5 -mx-1.5"
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setEditing(true);
        }
      }}
      className={cn(
        "font-medium cursor-pointer rounded px-1.5 -mx-1.5 py-0.5 hover:bg-muted transition-colors",
        !isActive && "line-through text-muted-foreground"
      )}
      title="Click to edit name"
    >
      {value}
    </span>
  );
}

export function ConditionCategorySection({
  label,
  items,
  expanded,
  onToggle,
  onAddToCategory,
  onEdit,
  onDeactivate,
  onReactivate,
  onReorder,
  onInlineUpdate,
}: ConditionCategorySectionProps) {
  const [deactivateTarget, setDeactivateTarget] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  function moveItem(index: number, direction: "up" | "down") {
    const newItems = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    [newItems[index], newItems[targetIndex]] = [
      newItems[targetIndex],
      newItems[index],
    ];
    setReordering(true);
    onReorder(newItems);
    setTimeout(() => setReordering(false), 500);
  }

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium text-sm">{label}</span>
          <span className="text-xs text-muted-foreground">({items.length})</span>
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onAddToCategory();
          }}
          className="flex items-center"
        >
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="border-t">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-4 py-2 w-10">
                  #
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-2">
                  Condition Name
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-2 w-[200px]">
                  Loan Types
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-2 w-16">
                  RP
                </th>
                <th className="text-center font-medium text-muted-foreground px-4 py-2 w-10">
                  CP
                </th>
                <th className="text-right font-medium text-muted-foreground px-4 py-2 w-[140px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  className={cn(
                    "border-t hover:bg-muted/50 transition-colors",
                    !item.is_active && "opacity-50"
                  )}
                >
                  <td className="px-4 py-2 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="flex flex-col">
                        <button
                          onClick={() => moveItem(index, "up")}
                          disabled={index === 0 || reordering}
                          className="text-muted-foreground/50 hover:text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => moveItem(index, "down")}
                          disabled={index === items.length - 1 || reordering}
                          className="text-muted-foreground/50 hover:text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-xs">{item.sort_order ?? index + 1}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <InlineNameEditor
                      value={item.condition_name}
                      isActive={!!item.is_active}
                      onSave={(newName) =>
                        onInlineUpdate(item.id, { condition_name: newName })
                      }
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-0.5">
                      <LoanTypeBadge
                        type="commercial"
                        active={!!item.applies_to_commercial}
                        onClick={() =>
                          onInlineUpdate(item.id, {
                            applies_to_commercial: !item.applies_to_commercial,
                          })
                        }
                      />
                      <LoanTypeBadge
                        type="rtl"
                        active={!!item.applies_to_rtl}
                        onClick={() =>
                          onInlineUpdate(item.id, {
                            applies_to_rtl: !item.applies_to_rtl,
                          })
                        }
                      />
                      <LoanTypeBadge
                        type="dscr"
                        active={!!item.applies_to_dscr}
                        onClick={() =>
                          onInlineUpdate(item.id, {
                            applies_to_dscr: !item.applies_to_dscr,
                          })
                        }
                      />
                      <LoanTypeBadge
                        type="guc"
                        active={!!item.applies_to_guc}
                        onClick={() =>
                          onInlineUpdate(item.id, {
                            applies_to_guc: !item.applies_to_guc,
                          })
                        }
                      />
                      <LoanTypeBadge
                        type="transactional"
                        active={!!item.applies_to_transactional}
                        onClick={() =>
                          onInlineUpdate(item.id, {
                            applies_to_transactional:
                              !item.applies_to_transactional,
                          })
                        }
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {item.responsible_party
                      ? RP_ABBREVIATIONS[item.responsible_party] ||
                        item.responsible_party
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {item.critical_path_item && (
                      <AlertCircle className="h-3.5 w-3.5 text-red-500 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => onEdit(item)}
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {item.is_active ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                          onClick={() => setDeactivateTarget(item.id)}
                          title="Deactivate"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-teal-600 hover:text-teal-800"
                          onClick={() => onReactivate(item.id)}
                          title="Reactivate"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Deactivate Confirmation */}
      <AlertDialog
        open={!!deactivateTarget}
        onOpenChange={() => setDeactivateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Condition</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this condition from new loan checklists. Existing
              loan conditions will not be affected. You can reactivate it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deactivateTarget) onDeactivate(deactivateTarget);
                setDeactivateTarget(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
