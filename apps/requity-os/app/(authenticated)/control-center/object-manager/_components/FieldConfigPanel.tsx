"use client";

import { useState, useCallback } from "react";
import {
  Settings2,
  Shield,
  Lock,
  GitBranch,
  Workflow,
  X,
  Plus,
  GripVertical,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@repo/lib";
import type { FieldConfig } from "../actions";
import { updateFieldConfig } from "../actions";
import { FIELD_TYPES, getFieldType } from "./constants";

interface Props {
  field: FieldConfig;
  onClose: () => void;
  onUpdate: (updated: FieldConfig) => void;
}

type SubTab = "type" | "valid" | "access" | "logic" | "stage";

const SUB_TABS: { key: SubTab; label: string; icon: typeof Settings2 }[] = [
  { key: "type", label: "Type", icon: Settings2 },
  { key: "valid", label: "Validate", icon: Shield },
  { key: "access", label: "Access", icon: Lock },
  { key: "logic", label: "Logic", icon: GitBranch },
  { key: "stage", label: "Stage", icon: Workflow },
];

const ROLES = ["Super Admin", "Admin", "Team", "Investor", "Borrower"];

export function FieldConfigPanel({ field, onClose, onUpdate }: Props) {
  const [subTab, setSubTab] = useState<SubTab>("type");
  const [saving, setSaving] = useState(false);
  const ft = getFieldType(field.field_type);
  const FieldIcon = ft.icon;

  const handleUpdate = useCallback(
    async (updates: Partial<FieldConfig>) => {
      setSaving(true);
      try {
        const result = await updateFieldConfig(field.id, updates);
        if (!result.error) {
          onUpdate({ ...field, ...updates });
        }
      } finally {
        setSaving(false);
      }
    },
    [field, onUpdate]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
        <div
          className="w-[26px] h-[26px] rounded-md flex items-center justify-center"
          style={{ backgroundColor: `${ft.color}18` }}
        >
          <FieldIcon size={13} style={{ color: ft.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate">{field.field_label}</div>
          <div className="text-[9px] font-mono text-muted-foreground">{field.field_key}</div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={13} />
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-border">
        {SUB_TABS.map((tab) => {
          const isActive = subTab === tab.key;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              className={cn(
                "flex items-center gap-1 px-2 py-2 text-[9px] font-medium border-b-2 transition-colors",
                isActive
                  ? "text-foreground border-blue-500"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              <TabIcon size={10} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {subTab === "type" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Name
                </label>
                <Input
                  value={field.field_label}
                  onChange={(e) => handleUpdate({ field_label: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Key
                </label>
                <Input
                  value={field.field_key}
                  disabled={field.is_system}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Type
              </label>
              <Select
                value={field.field_type}
                onValueChange={(val) => handleUpdate({ field_type: val })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((ftype) => (
                    <SelectItem key={ftype.key} value={ftype.key}>
                      {ftype.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dropdown options */}
            {field.field_type === "dropdown" && field.dropdown_options && (
              <div>
                <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Options
                </label>
                {field.dropdown_options.map((opt, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-1.5 py-1 rounded bg-muted border border-border text-xs mb-1"
                  >
                    <GripVertical size={10} className="text-muted-foreground" />
                    <span className="flex-1">{opt}</span>
                    <X size={9} className="text-muted-foreground cursor-pointer" />
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 mt-1">
                  <Plus size={10} />
                  Add
                </Button>
              </div>
            )}

            {/* Formula */}
            {field.field_type === "formula" && field.formula_expression && (
              <div>
                <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Formula
                </label>
                <div className="p-1.5 rounded border border-border bg-muted font-mono text-[10px] text-blue-500">
                  {field.formula_expression}
                </div>
              </div>
            )}

            <div className="border-t border-border pt-3">
              <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Default Value
              </label>
              <Input
                value={field.default_value || ""}
                onChange={(e) => handleUpdate({ default_value: e.target.value || null })}
                placeholder="None"
                className="h-8 text-xs"
              />
            </div>
          </div>
        )}

        {subTab === "valid" && (
          <div className="space-y-3">
            {[
              { label: "Required", desc: "Must be filled", key: "is_required" as const, value: field.is_required },
              { label: "Unique", desc: "No duplicates", key: "is_unique" as const, value: field.is_unique },
              { label: "Read Only", desc: "View only", key: "is_read_only" as const, value: field.is_read_only },
              { label: "Searchable", desc: "In global search", key: "is_searchable" as const, value: field.is_searchable },
              { label: "Filterable", desc: "Table filters", key: "is_filterable" as const, value: field.is_filterable },
              { label: "Sortable", desc: "Column sort", key: "is_sortable" as const, value: field.is_sortable },
              { label: "Track Changes", desc: "Audit log", key: "track_changes" as const, value: field.track_changes },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <span className="text-xs">{item.label}</span>
                  <br />
                  <span className="text-[9px] text-muted-foreground">{item.desc}</span>
                </div>
                <Switch
                  checked={item.value}
                  onCheckedChange={(checked) =>
                    handleUpdate({ [item.key]: checked })
                  }
                />
              </div>
            ))}

            <div className="border-t border-border pt-3">
              <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Validation Message
              </label>
              <Input
                value={field.validation_message || ""}
                onChange={(e) => handleUpdate({ validation_message: e.target.value || null })}
                placeholder="Custom error message..."
                className="h-8 text-xs"
              />
            </div>
          </div>
        )}

        {subTab === "access" && (
          <div>
            <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Role Access
            </label>
            <div className="grid grid-cols-[1fr_44px_44px_44px] gap-0 text-[9px] font-semibold text-muted-foreground uppercase pb-1.5 border-b border-border">
              <span>Role</span>
              <span className="text-center">See</span>
              <span className="text-center">Edit</span>
              <span className="text-center">New</span>
            </div>
            {ROLES.map((role, i) => {
              const permissions = (field.permissions as Record<string, Record<string, boolean>>) || {};
              const roleKey = role.toLowerCase().replace(/ /g, "_");
              const rolePerms = permissions[roleKey] || { view: true, edit: i < 3, create: i < 2 };

              return (
                <div
                  key={role}
                  className="grid grid-cols-[1fr_44px_44px_44px] items-center py-1.5 border-b border-border"
                >
                  <span className="text-xs">{role}</span>
                  {(["view", "edit", "create"] as const).map((perm) => (
                    <div key={perm} className="flex justify-center">
                      <Switch
                        checked={rolePerms[perm] ?? false}
                        onCheckedChange={(checked) => {
                          const newPerms = {
                            ...permissions,
                            [roleKey]: { ...rolePerms, [perm]: checked },
                          };
                          handleUpdate({ permissions: newPerms });
                        }}
                        className="scale-75"
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {subTab === "logic" && (
          <div>
            <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Conditional Logic
            </label>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
              Show, hide, require, or set value based on other fields.
            </p>

            {/* Example rule */}
            <div className="p-2 rounded border border-border bg-muted mb-1.5">
              <div className="flex items-center gap-1 mb-1.5">
                <Zap size={10} className="text-yellow-600" />
                <span className="text-[9px] font-semibold text-muted-foreground uppercase">
                  Rule 1
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                <Select defaultValue="stage">
                  <SelectTrigger className="h-7 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stage">stage</SelectItem>
                    <SelectItem value="loan_type">loan_type</SelectItem>
                    <SelectItem value="source">source</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="equals">
                  <SelectTrigger className="h-7 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">equals</SelectItem>
                    <SelectItem value="not_equals">not equals</SelectItem>
                    <SelectItem value="contains">contains</SelectItem>
                    <SelectItem value="is_empty">is empty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input defaultValue="Underwriting" className="h-7 text-[10px]" />
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] text-muted-foreground">Then</span>
                <Select defaultValue="require">
                  <SelectTrigger className="h-7 text-[10px] w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="show">Show</SelectItem>
                    <SelectItem value="hide">Hide</SelectItem>
                    <SelectItem value="require">Require</SelectItem>
                    <SelectItem value="set">Set value</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1">
              <Plus size={10} />
              Add Rule
            </Button>
          </div>
        )}

        {subTab === "stage" && (
          <div>
            <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Stage Gating
            </label>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
              Block pipeline progression without this field.
            </p>
            <Select
              value={field.required_at_stage || ""}
              onValueChange={(val) =>
                handleUpdate({ required_at_stage: val || null })
              }
            >
              <SelectTrigger className="h-8 text-xs mb-2">
                <SelectValue placeholder="Select stage..." />
              </SelectTrigger>
              <SelectContent>
                {["Lead", "Application", "Underwriting", "Approved", "Closing", "Funded"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs">Blocks Progression</span>
                <br />
                <span className="text-[9px] text-muted-foreground">
                  Cannot advance past stage
                </span>
              </div>
              <Switch
                checked={field.blocks_stage_progression}
                onCheckedChange={(checked) =>
                  handleUpdate({ blocks_stage_progression: checked })
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="px-3 py-1.5 border-t border-border text-[10px] text-muted-foreground">
          Saving...
        </div>
      )}
    </div>
  );
}
