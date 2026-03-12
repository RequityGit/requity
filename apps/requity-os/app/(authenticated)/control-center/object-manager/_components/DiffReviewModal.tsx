"use client";

import { X, Plus, Trash2, PenLine, ArrowRight, Check, Loader2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@repo/lib";
import type { FieldConfig } from "../actions";
import type { DraftChangeType } from "../_hooks/useDraftState";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DiffSummary {
  updates: {
    fieldId: string;
    label: string;
    changes: { key: string; from: unknown; to: unknown }[];
  }[];
  creates: {
    fieldId: string;
    label: string;
    data: Partial<FieldConfig>;
  }[];
  archives: {
    fieldId: string;
    label: string;
  }[];
  layoutChanges?: {
    id: string;
    type: DraftChangeType;
    label: string;
    description: string;
  }[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onPublish: () => void;
  publishing: boolean;
  diffSummary: DiffSummary;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FRIENDLY_LABELS: Record<string, string> = {
  field_label: "Label",
  field_key: "Key",
  field_type: "Type",
  is_required: "Required",
  is_unique: "Unique",
  is_read_only: "Read Only",
  is_searchable: "Searchable",
  is_filterable: "Filterable",
  is_sortable: "Sortable",
  track_changes: "Track Changes",
  is_visible: "Visible",
  default_value: "Default Value",
  validation_message: "Validation Message",
  dropdown_options: "Dropdown Options",
  formula_expression: "Formula",
  permissions: "Permissions",
  conditional_rules: "Conditional Logic",
  required_at_stage: "Required at Stage",
  blocks_stage_progression: "Blocks Progression",
  visibility_condition: "Visibility Condition",
  help_text: "Help Text",
  section_group: "Section Group",
  column_span: "Column Span",
  display_order: "Display Order",
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value.join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DiffReviewModal({
  open,
  onClose,
  onPublish,
  publishing,
  diffSummary,
}: Props) {
  if (!open) return null;

  const { updates, creates, archives, layoutChanges = [] } = diffSummary;
  const totalChanges = updates.length + creates.length + archives.length + layoutChanges.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-lg shadow-xl w-[560px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold">Review Changes</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {totalChanges} {totalChanges === 1 ? "change" : "changes"} pending
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Updates */}
          {updates.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <PenLine size={12} className="text-blue-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Modified Fields ({updates.length})
                </span>
              </div>
              {updates.map((update) => (
                <div
                  key={update.fieldId}
                  className="rounded border border-blue-500/20 bg-blue-500/5 p-2.5 mb-2"
                >
                  <div className="text-xs font-medium mb-1.5">{update.label}</div>
                  <div className="space-y-1">
                    {update.changes.map((change) => (
                      <div key={change.key} className="flex items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground w-28 shrink-0">
                          {FRIENDLY_LABELS[change.key] || change.key}
                        </span>
                        <span className="text-red-400 line-through max-w-[120px] truncate">
                          {formatValue(change.from)}
                        </span>
                        <ArrowRight size={10} className="text-muted-foreground shrink-0" />
                        <span className="text-green-500 max-w-[120px] truncate">
                          {formatValue(change.to)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Creates */}
          {creates.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Plus size={12} className="text-green-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  New Fields ({creates.length})
                </span>
              </div>
              {creates.map((item) => (
                <div
                  key={item.fieldId}
                  className="rounded border border-green-500/20 bg-green-500/5 p-2.5 mb-2"
                >
                  <div className="text-xs font-medium">{item.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Type: {item.data.field_type} · Key: {item.data.field_key}
                    {item.data.is_required && " · Required"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Archives */}
          {archives.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Trash2 size={12} className="text-red-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Archived Fields ({archives.length})
                </span>
              </div>
              {archives.map((item) => (
                <div
                  key={item.fieldId}
                  className="rounded border border-red-500/20 bg-red-500/5 p-2.5 mb-2"
                >
                  <div className="text-xs font-medium text-red-400">{item.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Will be archived and hidden from all pages
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Layout Changes */}
          {layoutChanges.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <LayoutGrid size={12} className="text-emerald-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Layout Changes ({layoutChanges.length})
                </span>
              </div>
              {layoutChanges.map((item) => (
                <div
                  key={item.id}
                  className="rounded border border-emerald-500/20 bg-emerald-500/5 p-2.5 mb-2"
                >
                  <div className="text-xs font-medium">{item.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {item.description}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalChanges === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No pending changes</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={onPublish}
            disabled={publishing || totalChanges === 0}
          >
            {publishing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Check size={13} />
            )}
            {publishing ? "Publishing..." : `Publish ${totalChanges} Changes`}
          </Button>
        </div>
      </div>
    </div>
  );
}
