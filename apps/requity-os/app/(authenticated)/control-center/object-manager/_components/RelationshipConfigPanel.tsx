"use client";

import { useState } from "react";
import {
  Settings2,
  User,
  CornerDownRight,
  PlusCircle,
  Database,
  X,
  Plus,
  ArrowLeftRight,
  ArrowRight,
  Eye,
  Network,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@repo/lib";
import type {
  ObjectDefinition,
  ObjectRelationship,
  RelationshipRole,
} from "../actions";
import { getObjectIcon } from "./constants";

interface Props {
  relationship: ObjectRelationship;
  roles: RelationshipRole[];
  objects: ObjectDefinition[];
  onClose: () => void;
  onUpdate: () => void;
}

type SubTab = "config" | "roles" | "fields" | "create" | "schema";

const SUB_TABS: { key: SubTab; label: string; icon: typeof Settings2 }[] = [
  { key: "config", label: "Config", icon: Settings2 },
  { key: "roles", label: "Roles", icon: User },
  { key: "fields", label: "Fields", icon: CornerDownRight },
  { key: "create", label: "Create", icon: PlusCircle },
  { key: "schema", label: "Schema", icon: Database },
];

export function RelationshipConfigPanel({
  relationship,
  roles,
  objects,
  onClose,
}: Props) {
  const [subTab, setSubTab] = useState<SubTab>("config");
  const parent = objects.find((o) => o.object_key === relationship.parent_object_key);
  const child = objects.find((o) => o.object_key === relationship.child_object_key);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
        <div className="w-[26px] h-[26px] rounded-md bg-purple-500/10 flex items-center justify-center">
          <Network size={13} className="text-purple-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate">
            {parent?.label} → {child?.label}
          </div>
          <div className="text-[9px] font-mono text-muted-foreground">
            {relationship.junction_table || relationship.fk_column || "direct"}
          </div>
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
                  ? "text-foreground border-purple-500"
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
        {subTab === "config" && (
          <div className="space-y-3">
            {/* Cardinality */}
            <div>
              <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Cardinality
              </label>
              {["one_to_one", "one_to_many", "many_to_many"].map((v) => (
                <div
                  key={v}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded border mb-0.5 cursor-pointer text-xs",
                    relationship.cardinality === v
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-border"
                  )}
                >
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full border-2 flex items-center justify-center",
                      relationship.cardinality === v
                        ? "border-purple-500"
                        : "border-border"
                    )}
                  >
                    {relationship.cardinality === v && (
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    )}
                  </div>
                  {v.replace(/_/g, " ")}
                </div>
              ))}
            </div>

            {/* Sync Direction */}
            <div>
              <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Sync
              </label>
              {[
                { v: "bidirectional", l: "Bidirectional", cl: "text-green-600 border-green-600", icon: ArrowLeftRight },
                { v: "parent_to_child", l: "Parent to Child", cl: "text-blue-500 border-blue-500", icon: ArrowRight },
                { v: "read_only", l: "Read Only", cl: "text-yellow-600 border-yellow-600", icon: Eye },
              ].map((s) => {
                const SI = s.icon;
                return (
                  <div
                    key={s.v}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1.5 rounded border mb-0.5 cursor-pointer text-xs",
                      relationship.sync_direction === s.v
                        ? `${s.cl} bg-opacity-10`
                        : "border-border"
                    )}
                    style={
                      relationship.sync_direction === s.v
                        ? { borderColor: undefined }
                        : undefined
                    }
                  >
                    <SI size={12} className={relationship.sync_direction === s.v ? "" : "text-muted-foreground"} />
                    {s.l}
                  </div>
                );
              })}
            </div>

            {/* Quick Create */}
            <div className="flex items-center justify-between">
              <span className="text-xs">Quick-Create</span>
              <Switch checked={relationship.allow_quick_create} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Cascade Delete</span>
              <Switch checked={relationship.cascade_delete} />
            </div>
          </div>
        )}

        {subTab === "roles" && (
          <div>
            <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Roles ({roles.length})
            </label>
            {roles.map((role) => (
              <div
                key={role.id}
                className="p-2 rounded border border-border bg-muted mb-1.5"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className="w-[7px] h-[7px] rounded-full"
                    style={{ backgroundColor: role.color }}
                  />
                  <span className="text-xs font-semibold flex-1">{role.label}</span>
                  <Badge variant="outline" className="text-[9px] h-4 px-1 font-mono">
                    {role.role_key}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <span className="text-[9px] text-muted-foreground">Name</span>
                    <Input value={role.label} className="h-7 text-[10px]" readOnly />
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground">Max</span>
                    <Input
                      value={role.max_count ?? ""}
                      placeholder="No limit"
                      className="h-7 text-[10px]"
                      readOnly
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground">Required</span>
                  <Switch checked={role.is_required} className="scale-75" />
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1">
              <Plus size={10} />
              Add Role
            </Button>
          </div>
        )}

        {subTab === "fields" && (
          <div>
            <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Inherited from {child?.label}
            </label>
            <p className="text-[10px] text-muted-foreground mb-2">
              These fields from {child?.label} are surfaced on {parent?.label} detail pages.
            </p>
            <div className="border border-border rounded overflow-hidden">
              {(Array.isArray(relationship.inherited_fields) ? relationship.inherited_fields : []).map(
                (fieldKey, i, arr) => (
                  <div
                    key={fieldKey}
                    className="flex items-center gap-1.5 px-2 py-1.5 bg-green-500/5 text-xs"
                    style={{
                      borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div className="w-3.5 h-3.5 rounded-sm border border-green-600 bg-green-600 flex items-center justify-center">
                      <Check size={9} className="text-white" />
                    </div>
                    <span className="flex-1">{fieldKey}</span>
                    <span className="text-[8px] font-mono text-muted-foreground">
                      {fieldKey}
                    </span>
                  </div>
                )
              )}
              {(!relationship.inherited_fields || relationship.inherited_fields.length === 0) && (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No inherited fields configured
                </div>
              )}
            </div>
          </div>
        )}

        {subTab === "create" && (
          <div>
            <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Quick-Create Modal
            </label>
            <p className="text-[10px] text-muted-foreground mb-2">
              The quick-create modal appears when linking a new {child?.label} from {parent?.label}.
            </p>
            <div className="border border-border rounded bg-muted overflow-hidden">
              <div className="px-2 py-1.5 border-b border-border bg-card flex items-center gap-1.5">
                <PlusCircle size={11} className="text-purple-500" />
                <span className="text-xs font-semibold">New {child?.label}</span>
              </div>
              <div className="p-2 space-y-1.5">
                <div>
                  <label className="text-[9px] text-muted-foreground">Name <span className="text-destructive">*</span></label>
                  <div className="h-7 rounded border border-border bg-card" />
                </div>
                <div className="flex gap-1.5 justify-end mt-1.5">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]">Cancel</Button>
                  <Button size="sm" className="h-6 text-[10px]">Create & Link</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {subTab === "schema" && (
          <div>
            <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Junction Table
            </label>
            <div className="p-1.5 rounded border border-border bg-muted font-mono text-[10px] text-blue-500 mb-2">
              {relationship.junction_table || "None (direct FK)"}
            </div>

            {relationship.junction_table && (
              <>
                <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Columns
                </label>
                <div className="border border-border rounded overflow-hidden">
                  {[
                    { n: "id", tp: "uuid", tg: "PK" },
                    { n: `${relationship.parent_object_key}_id`, tp: "uuid", tg: "FK" },
                    { n: `${relationship.child_object_key}_id`, tp: "uuid", tg: "FK" },
                    { n: "role", tp: "text", tg: "" },
                    { n: "display_order", tp: "int4", tg: "" },
                    { n: "is_primary", tp: "bool", tg: "" },
                    { n: "linked_at", tp: "timestamptz", tg: "" },
                  ].map((col) => (
                    <div
                      key={col.n}
                      className="flex items-center gap-1.5 px-2 py-1 border-b border-border text-[10px]"
                    >
                      {col.tg && (
                        <span
                          className={cn(
                            "text-[7px] font-bold",
                            col.tg === "PK" ? "text-yellow-600" : "text-purple-500"
                          )}
                        >
                          {col.tg}
                        </span>
                      )}
                      <span className="font-mono flex-1">{col.n}</span>
                      <span className="font-mono text-muted-foreground">{col.tp}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {relationship.fk_column && (
              <>
                <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1 mt-3">
                  Foreign Key Column
                </label>
                <div className="p-1.5 rounded border border-border bg-muted font-mono text-[10px] text-purple-500">
                  {relationship.fk_column}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
