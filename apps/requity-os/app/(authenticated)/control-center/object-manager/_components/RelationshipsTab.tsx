"use client";

import {
  Plus,
  Boxes,
  CornerDownRight,
  ArrowLeftRight,
  ArrowRight,
  Eye,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@repo/lib";
import type {
  ObjectDefinition,
  ObjectRelationship,
  RelationshipRole,
} from "../actions";
import { getObjectIcon } from "./constants";

interface Props {
  objectKey: string;
  relationships: ObjectRelationship[];
  roles: RelationshipRole[];
  objects: ObjectDefinition[];
  selectedRelId: string | null;
  onSelectRel: (rel: ObjectRelationship) => void;
  onAddRelationship: () => void;
  loading: boolean;
}

export function RelationshipsTab({
  objectKey,
  relationships,
  roles,
  objects,
  selectedRelId,
  onSelectRel,
  onAddRelationship,
  loading,
}: Props) {
  const parentRels = relationships.filter((r) => r.parent_object_key === objectKey);
  const childRels = relationships.filter((r) => r.child_object_key === objectKey);

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-3.5 py-2 border-b border-border flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">
          {parentRels.length} parent · {childRels.length} child
        </span>
        <div className="flex-1" />
        <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={onAddRelationship}>
          <Plus size={12} />
          Add Relationship
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3.5">
        {parentRels.length > 0 && (
          <div className="mb-4">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <Boxes size={10} />
              As Parent ({parentRels.length})
            </div>
            {parentRels.map((rel) => (
              <RelCard
                key={rel.id}
                rel={rel}
                roles={roles.filter((r) => r.relationship_id === rel.id)}
                objects={objects}
                isActive={selectedRelId === rel.id}
                onSelect={() => onSelectRel(rel)}
              />
            ))}
          </div>
        )}

        {childRels.length > 0 && (
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <CornerDownRight size={10} />
              As Child ({childRels.length})
            </div>
            {childRels.map((rel) => (
              <RelCard
                key={rel.id}
                rel={rel}
                roles={roles.filter((r) => r.relationship_id === rel.id)}
                objects={objects}
                isActive={selectedRelId === rel.id}
                onSelect={() => onSelectRel(rel)}
              />
            ))}
          </div>
        )}

        {parentRels.length === 0 && childRels.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Link2 size={24} className="text-muted-foreground" strokeWidth={1} />
            <span className="text-xs text-muted-foreground">No relationships defined</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Relationship Card
// ---------------------------------------------------------------------------

function RelCard({
  rel,
  roles,
  objects,
  isActive,
  onSelect,
}: {
  rel: ObjectRelationship;
  roles: RelationshipRole[];
  objects: ObjectDefinition[];
  isActive: boolean;
  onSelect: () => void;
}) {
  const parent = objects.find((o) => o.object_key === rel.parent_object_key);
  const child = objects.find((o) => o.object_key === rel.child_object_key);
  const ParentIcon = getObjectIcon(parent?.icon || "database");
  const ChildIcon = getObjectIcon(child?.icon || "database");

  const SyncIcon =
    rel.sync_direction === "bidirectional"
      ? ArrowLeftRight
      : rel.sync_direction === "read_only"
        ? Eye
        : ArrowRight;

  const inheritedCount = Array.isArray(rel.inherited_fields) ? rel.inherited_fields.length : 0;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "p-3 rounded-lg mb-1.5 cursor-pointer border transition-colors",
        isActive
          ? "border-purple-500 bg-purple-500/5"
          : "border-border bg-card hover:border-border/80"
      )}
    >
      {/* Object badges */}
      <div className="flex items-center gap-1.5 mb-2">
        <div
          className="flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold"
          style={{
            backgroundColor: `${parent?.color || "#2E6EA6"}12`,
            borderColor: `${parent?.color || "#2E6EA6"}25`,
          }}
        >
          <ParentIcon size={11} style={{ color: parent?.color }} />
          {parent?.label}
        </div>
        <SyncIcon size={12} className="text-green-600" />
        <div
          className="flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold"
          style={{
            backgroundColor: `${child?.color || "#2E6EA6"}12`,
            borderColor: `${child?.color || "#2E6EA6"}25`,
          }}
        >
          <ChildIcon size={11} style={{ color: child?.color }} />
          {child?.label}
        </div>
      </div>

      {/* Roles */}
      <div className="flex flex-wrap gap-1 mb-1.5">
        {roles.map((role) => (
          <Badge
            key={role.id}
            variant="outline"
            className="text-[9px] h-4 px-1.5 font-medium"
            style={{ borderColor: `${role.color}40`, color: role.color }}
          >
            {role.label}
            {role.is_required && <span className="text-destructive ml-0.5">*</span>}
          </Badge>
        ))}
      </div>

      {/* Meta */}
      <div className="flex gap-2 text-[9px] text-muted-foreground">
        {rel.junction_table && (
          <span className="font-mono">{rel.junction_table}</span>
        )}
        <span>{inheritedCount} fields</span>
        {rel.allow_quick_create && (
          <span className="text-green-600">Quick-create</span>
        )}
      </div>
    </div>
  );
}
