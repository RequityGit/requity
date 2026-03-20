"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import type { FieldConfig, PageSection, PageField } from "../actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DraftChangeType = "field_update" | "field_create" | "field_archive" | "section_update" | "section_create" | "section_delete" | "layout_field_add" | "layout_field_remove" | "layout_field_reorder" | "layout_field_update" | "section_reorder";

export interface DraftChange {
  id: string; // unique change id
  type: DraftChangeType;
  entityId: string; // the id of the field/section/etc being changed
  entityLabel: string; // human-readable label
  timestamp: number;
  /** For field_update: the partial updates applied */
  updates?: Partial<FieldConfig>;
  /** For field_create: the full new field data */
  newEntity?: Partial<FieldConfig>;
  /** For layout mutations: relevant metadata */
  meta?: Record<string, unknown>;
  /** Snapshot of original state before change (for diff display) */
  originalSnapshot?: Partial<FieldConfig>;
}

export interface DraftState {
  /** All pending changes keyed by entityId for quick lookup */
  changesByEntity: Map<string, DraftChange[]>;
  /** Ordered list of all changes */
  changeLog: DraftChange[];
  /** Number of entities with pending changes */
  dirtyCount: number;
}

// ---------------------------------------------------------------------------
// Helper: generate unique id
// ---------------------------------------------------------------------------

let _changeCounter = 0;
function nextChangeId(): string {
  return `draft_${Date.now()}_${++_changeCounter}`;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDraftState() {
  const [changeLog, setChangeLog] = useState<DraftChange[]>([]);

  // Keep a map of the original field snapshots (before any draft edits)
  // Key: entityId, Value: original FieldConfig as loaded from DB
  const originalFieldSnapshots = useRef<Map<string, FieldConfig>>(new Map());

  // Store draft-modified fields: entityId -> accumulated updates
  const [draftFieldOverrides, setDraftFieldOverrides] = useState<
    Map<string, Partial<FieldConfig>>
  >(new Map());

  // Track new fields created in draft
  const [draftNewFields, setDraftNewFields] = useState<Map<string, Partial<FieldConfig>>>(new Map());

  // Track archived field IDs in draft
  const [draftArchivedFieldIds, setDraftArchivedFieldIds] = useState<Set<string>>(new Set());

  // Track layout changes (already saved to DB, but tracked for dirty count & diff)
  const [draftLayoutChanges, setDraftLayoutChanges] = useState<
    { id: string; type: DraftChangeType; label: string; description: string }[]
  >([]);

  // ---------------------------------------------------------------------------
  // Record a field update (accumulate changes)
  // ---------------------------------------------------------------------------
  const draftFieldUpdate = useCallback(
    (field: FieldConfig, updates: Partial<FieldConfig>) => {
      // Store original snapshot if this is the first edit to this field
      if (!originalFieldSnapshots.current.has(field.id)) {
        originalFieldSnapshots.current.set(field.id, { ...field });
      }

      // Accumulate overrides
      setDraftFieldOverrides((prev) => {
        const next = new Map(prev);
        const existing = next.get(field.id) || {};
        next.set(field.id, { ...existing, ...updates });
        return next;
      });

      // Add to change log
      const change: DraftChange = {
        id: nextChangeId(),
        type: "field_update",
        entityId: field.id,
        entityLabel: field.field_label,
        timestamp: Date.now(),
        updates,
        originalSnapshot: originalFieldSnapshots.current.get(field.id),
      };
      setChangeLog((prev) => [...prev, change]);
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Record a new field creation
  // ---------------------------------------------------------------------------
  const draftFieldCreate = useCallback(
    (tempId: string, data: Partial<FieldConfig>) => {
      setDraftNewFields((prev) => {
        const next = new Map(prev);
        next.set(tempId, data);
        return next;
      });

      const change: DraftChange = {
        id: nextChangeId(),
        type: "field_create",
        entityId: tempId,
        entityLabel: data.field_label || "New Field",
        timestamp: Date.now(),
        newEntity: data,
      };
      setChangeLog((prev) => [...prev, change]);
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Record a field archive
  // ---------------------------------------------------------------------------
  const draftFieldArchive = useCallback(
    (field: FieldConfig) => {
      // Store snapshot
      if (!originalFieldSnapshots.current.has(field.id)) {
        originalFieldSnapshots.current.set(field.id, { ...field });
      }

      setDraftArchivedFieldIds((prev) => new Set(prev).add(field.id));

      const change: DraftChange = {
        id: nextChangeId(),
        type: "field_archive",
        entityId: field.id,
        entityLabel: field.field_label,
        timestamp: Date.now(),
        originalSnapshot: { ...field },
      };
      setChangeLog((prev) => [...prev, change]);
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Record a layout change (already persisted to DB, tracked for dirty state)
  // ---------------------------------------------------------------------------
  const draftLayoutChange = useCallback(
    (type: DraftChangeType, label: string, description: string) => {
      const changeId = nextChangeId();

      setDraftLayoutChanges((prev) => [
        ...prev,
        { id: changeId, type, label, description },
      ]);

      const change: DraftChange = {
        id: changeId,
        type,
        entityId: changeId,
        entityLabel: label,
        timestamp: Date.now(),
        meta: { description },
      };
      setChangeLog((prev) => [...prev, change]);
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Apply draft overrides to a field list (for display)
  // ---------------------------------------------------------------------------
  const applyDraftToFields = useCallback(
    (fields: FieldConfig[]): FieldConfig[] => {
      // Start with DB fields, apply overrides, filter archived
      let result = fields.map((f) => {
        const overrides = draftFieldOverrides.get(f.id);
        if (overrides) {
          return { ...f, ...overrides };
        }
        return f;
      });

      // Filter out draft-archived fields
      result = result.filter((f) => !draftArchivedFieldIds.has(f.id));

      // Append draft-created fields (with temp IDs)
      for (const [tempId, data] of Array.from(draftNewFields.entries())) {
        result.push({
          id: tempId,
          module: "",
          field_key: data.field_key || "",
          field_label: data.field_label || "",
          field_type: data.field_type || "text",
          is_visible: true,
          is_locked: false,
          is_admin_created: true,
          is_archived: false,
          dropdown_options: data.dropdown_options || null,
          formula_expression: null,
          formula_source_fields: null,
          formula_output_format: null,
          formula_decimal_places: 2,
          is_required: data.is_required || false,
          is_unique: false,
          is_read_only: false,
          is_searchable: false,
          is_filterable: false,
          is_sortable: false,
          track_changes: false,
          is_system: false,
          type_config: {},
          default_value: null,
          validation_message: null,
          validation_regex: null,
          conditional_rules: [],
          required_at_stage: null,
          blocks_stage_progression: false,
          permissions: {},
          help_text: null,
          display_order: 9999,
          section_group: null,
          column_span: "half",
          visibility_condition: null,
          ...data,
        } as FieldConfig);
      }

      return result;
    },
    [draftFieldOverrides, draftNewFields, draftArchivedFieldIds]
  );

  // ---------------------------------------------------------------------------
  // Check if a field has draft changes
  // ---------------------------------------------------------------------------
  const isFieldDirty = useCallback(
    (fieldId: string): boolean => {
      return (
        draftFieldOverrides.has(fieldId) ||
        draftNewFields.has(fieldId) ||
        draftArchivedFieldIds.has(fieldId)
      );
    },
    [draftFieldOverrides, draftNewFields, draftArchivedFieldIds]
  );

  const isFieldNew = useCallback(
    (fieldId: string): boolean => draftNewFields.has(fieldId),
    [draftNewFields]
  );

  const isFieldArchived = useCallback(
    (fieldId: string): boolean => draftArchivedFieldIds.has(fieldId),
    [draftArchivedFieldIds]
  );

  // ---------------------------------------------------------------------------
  // Get summary of all pending changes (for diff review)
  // ---------------------------------------------------------------------------
  const getDiffSummary = useCallback(() => {
    const updates: {
      fieldId: string;
      label: string;
      changes: { key: string; from: unknown; to: unknown }[];
    }[] = [];

    for (const [fieldId, overrides] of Array.from(draftFieldOverrides.entries())) {
      const original = originalFieldSnapshots.current.get(fieldId);
      if (!original) continue;

      const changes: { key: string; from: unknown; to: unknown }[] = [];
      for (const [key, value] of Object.entries(overrides)) {
        const origVal = (original as unknown as Record<string, unknown>)[key];
        if (JSON.stringify(origVal) !== JSON.stringify(value)) {
          changes.push({ key, from: origVal, to: value });
        }
      }

      if (changes.length > 0) {
        updates.push({
          fieldId,
          label: original.field_label,
          changes,
        });
      }
    }

    const creates = Array.from(draftNewFields.entries()).map(([id, data]) => ({
      fieldId: id,
      label: data.field_label || "New Field",
      data,
    }));

    const archives = Array.from(draftArchivedFieldIds).map((id) => {
      const original = originalFieldSnapshots.current.get(id);
      return {
        fieldId: id,
        label: original?.field_label || "Unknown",
      };
    });

    const layoutChanges = draftLayoutChanges.map((lc) => ({
      id: lc.id,
      type: lc.type,
      label: lc.label,
      description: lc.description,
    }));

    return { updates, creates, archives, layoutChanges };
  }, [draftFieldOverrides, draftNewFields, draftArchivedFieldIds, draftLayoutChanges]);

  // ---------------------------------------------------------------------------
  // Get publishable payload
  // ---------------------------------------------------------------------------
  const getPublishPayload = useCallback(() => {
    const fieldUpdates: { id: string; updates: Partial<FieldConfig> }[] = [];

    for (const [fieldId, overrides] of Array.from(draftFieldOverrides.entries())) {
      const original = originalFieldSnapshots.current.get(fieldId);
      if (!original) continue;

      // Only include actually changed values
      const filtered: Partial<FieldConfig> = {};
      for (const [key, value] of Object.entries(overrides)) {
        const origVal = (original as unknown as Record<string, unknown>)[key];
        if (JSON.stringify(origVal) !== JSON.stringify(value)) {
          (filtered as unknown as Record<string, unknown>)[key] = value;
        }
      }

      if (Object.keys(filtered).length > 0) {
        fieldUpdates.push({ id: fieldId, updates: filtered });
      }
    }

    const fieldCreates = Array.from(draftNewFields.values());
    const fieldArchiveIds = Array.from(draftArchivedFieldIds);

    return { fieldUpdates, fieldCreates, fieldArchiveIds };
  }, [draftFieldOverrides, draftNewFields, draftArchivedFieldIds]);

  // ---------------------------------------------------------------------------
  // Discard all changes
  // ---------------------------------------------------------------------------
  const discardAll = useCallback(() => {
    setChangeLog([]);
    setDraftFieldOverrides(new Map());
    setDraftNewFields(new Map());
    setDraftArchivedFieldIds(new Set());
    setDraftLayoutChanges([]);
    originalFieldSnapshots.current.clear();
  }, []);

  // ---------------------------------------------------------------------------
  // Clear after successful publish
  // ---------------------------------------------------------------------------
  const clearAfterPublish = useCallback(() => {
    discardAll();
  }, [discardAll]);

  // ---------------------------------------------------------------------------
  // Computed state
  // ---------------------------------------------------------------------------
  const dirtyCount = useMemo(() => {
    const entityIds = new Set<string>();
    Array.from(draftFieldOverrides.keys()).forEach((id) => entityIds.add(id));
    Array.from(draftNewFields.keys()).forEach((id) => entityIds.add(id));
    Array.from(draftArchivedFieldIds).forEach((id) => entityIds.add(id));
    draftLayoutChanges.forEach((lc) => entityIds.add(lc.id));
    return entityIds.size;
  }, [draftFieldOverrides, draftNewFields, draftArchivedFieldIds, draftLayoutChanges]);

  const hasChanges = dirtyCount > 0;

  return {
    // State
    changeLog,
    dirtyCount,
    hasChanges,

    // Mutations
    draftFieldUpdate,
    draftFieldCreate,
    draftFieldArchive,
    draftLayoutChange,

    // Queries
    applyDraftToFields,
    isFieldDirty,
    isFieldNew,
    isFieldArchived,
    getDiffSummary,
    getPublishPayload,

    // Actions
    discardAll,
    clearAfterPublish,
  };
}
