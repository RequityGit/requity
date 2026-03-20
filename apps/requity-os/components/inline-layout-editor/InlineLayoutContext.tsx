"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import type { LayoutSection, LayoutField, DealLayoutTab } from "@/hooks/useDealLayout";

// ── Types ──

export interface InlineLayoutState {
  isEditing: boolean;
  sections: LayoutSection[];
  fields: LayoutField[];
  fieldsBySectionId: Record<string, LayoutField[]>;
  hasChanges: boolean;
}

interface InlineLayoutContextValue {
  state: InlineLayoutState;
  startEditing: (sections: LayoutSection[], fields: LayoutField[]) => void;
  cancelEditing: () => void;
  /** Move a field within or between sections */
  moveField: (fieldId: string, toSectionId: string, toIndex: number) => void;
  /** Swap a field with its neighbor by direction within a section (up/down = list order, left/right = grid position) */
  nudgeField: (fieldId: string, sectionId: string, direction: "up" | "down" | "left" | "right") => void;
  /** Whether the field can nudge left/right in the grid (for disabling buttons) */
  getNudgeAvailability: (sectionId: string, fieldId: string) => { canLeft: boolean; canRight: boolean };
  /** Reorder sections within a tab */
  moveSection: (sectionId: string, toIndex: number) => void;
  /** Remove a field from the layout */
  removeField: (fieldId: string) => void;
  /** Add a field to a section */
  addField: (sectionId: string, fieldKey: string, fieldConfigId: string, sourceObjectKey: string | null) => void;
  /** Update field column span */
  updateFieldSpan: (fieldId: string, span: string) => void;
  /** Add a new section */
  addNewSection: (tabKey: string, label: string) => void;
  /** Delete a section from local state */
  deleteSection: (sectionId: string) => void;
  /** Update section label and icon in local state */
  updateSectionConfig: (sectionId: string, label: string, icon: string) => void;
  /** Toggle section visibility in local state */
  toggleSectionVisibility: (sectionId: string, visible: boolean) => void;
  /** Get pending changes for save */
  getPendingChanges: () => PendingChanges;
  /** Active tab filter for field picker */
  activeTabKey: string;
  setActiveTabKey: (key: string) => void;
}

export interface PendingChanges {
  reorderedSections: { id: string; display_order: number }[];
  reorderedFields: { id: string; display_order: number; section_id?: string }[];
  addedFields: { section_id: string; field_config_id: string; field_key: string; display_order: number; column_span: string; source_object_key: string | null }[];
  removedFieldIds: string[];
  updatedSpans: { id: string; column_span: string }[];
  addedSections: { page_type: string; section_key: string; section_label: string; tab_key: string; tab_label: string }[];
}

const InlineLayoutContext = createContext<InlineLayoutContextValue | null>(null);

// ── Helper: column span to grid columns (must match EditableOverview SPAN_CLASS) ──

const COL_SPAN_TO_COLS: Record<string, number> = {
  full: 12,
  half: 6,
  third: 4,
  quarter: 3,
};

function getCols(columnSpan: string): number {
  return COL_SPAN_TO_COLS[columnSpan] ?? 6;
}

/** Compute (row, colStart) for each field in a 12-col grid; sectionFields must be sorted by display_order */
function computeGridPositions(sectionFields: LayoutField[]): { fieldId: string; row: number; colStart: number; colEnd: number }[] {
  const result: { fieldId: string; row: number; colStart: number; colEnd: number }[] = [];
  let row = 0;
  let col = 0;
  for (const f of sectionFields) {
    const span = getCols(f.column_span || "half");
    if (col + span > 12) {
      row++;
      col = 0;
    }
    result.push({ fieldId: f.id, row, colStart: col, colEnd: col + span });
    col += span;
  }
  return result;
}

/** Whether this field has a left/right neighbor in the grid (for nudge buttons) */
export function getNudgeAvailabilityHelper(
  sectionFields: LayoutField[],
  fieldId: string
): { canLeft: boolean; canRight: boolean } {
  const positions = computeGridPositions(sectionFields);
  const current = positions.find(p => p.fieldId === fieldId);
  if (!current) return { canLeft: false, canRight: false };
  const canLeft = positions.some(
    p => p.fieldId !== fieldId && p.row === current.row && p.colEnd === current.colStart
  );
  const canRight = positions.some(
    p => p.fieldId !== fieldId && p.row === current.row && p.colStart === current.colEnd
  );
  return { canLeft, canRight };
}

/** Re-export for callers that have section fields in hand */
export const getNudgeAvailability = getNudgeAvailabilityHelper;

// ── Helper: group fields by section ──

function groupFieldsBySection(fields: LayoutField[]): Record<string, LayoutField[]> {
  const map: Record<string, LayoutField[]> = {};
  for (const f of fields) {
    if (!map[f.section_id]) map[f.section_id] = [];
    map[f.section_id].push(f);
  }
  // Sort each group by display_order
  for (const key of Object.keys(map)) {
    map[key].sort((a, b) => a.display_order - b.display_order);
  }
  return map;
}

// ── Provider ──

export function InlineLayoutProvider({ pageType = "deal_detail", children }: { pageType?: string; children: React.ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [sections, setSections] = useState<LayoutSection[]>([]);
  const [fields, setFields] = useState<LayoutField[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState("overview");

  // Track original state for change detection
  const originalRef = useRef<{ sections: LayoutSection[]; fields: LayoutField[] }>({ sections: [], fields: [] });
  // Track mutations for save
  const addedFieldsRef = useRef<PendingChanges["addedFields"]>([]);
  const removedFieldIdsRef = useRef<string[]>([]);
  const updatedSpansRef = useRef<PendingChanges["updatedSpans"]>([]);
  const addedSectionsRef = useRef<PendingChanges["addedSections"]>([]);
  let tempIdCounter = useRef(0);

  const fieldsBySectionId = React.useMemo(() => groupFieldsBySection(fields), [fields]);

  const startEditing = useCallback((secs: LayoutSection[], flds: LayoutField[]) => {
    // Deep clone everything so we never mutate the originals
    originalRef.current = {
      sections: secs.map(s => ({ ...s })),
      fields: flds.map(f => ({ ...f })),
    };
    setSections(secs.map(s => ({ ...s })));

    // Normalize display_order per section so each field has a unique sequential order.
    // This prevents bugs where DB fields have duplicate or gapped display_order values.
    // We sort each section's fields by current display_order, then assign 0, 1, 2, ...
    const clonedFields = flds.map(f => ({ ...f }));
    const sectionIdList = Array.from(new Map(clonedFields.map(f => [f.section_id, true])).keys());
    for (let si = 0; si < sectionIdList.length; si++) {
      const secId = sectionIdList[si];
      const indices: number[] = [];
      clonedFields.forEach((f, i) => { if (f.section_id === secId) indices.push(i); });
      // Sort indices by the field's current display_order
      indices.sort((a, b) => clonedFields[a].display_order - clonedFields[b].display_order);
      // Assign sequential orders
      indices.forEach((fieldIndex, newOrder) => {
        clonedFields[fieldIndex] = { ...clonedFields[fieldIndex], display_order: newOrder };
      });
    }
    setFields(clonedFields);

    setIsEditing(true);
    setHasChanges(false);
    addedFieldsRef.current = [];
    removedFieldIdsRef.current = [];
    updatedSpansRef.current = [];
    addedSectionsRef.current = [];
    tempIdCounter.current = 0;
  }, []);

  const cancelEditing = useCallback(() => {
    setSections(originalRef.current.sections);
    setFields(originalRef.current.fields);
    setIsEditing(false);
    setHasChanges(false);
    addedFieldsRef.current = [];
    removedFieldIdsRef.current = [];
    updatedSpansRef.current = [];
    addedSectionsRef.current = [];
  }, []);

  const moveField = useCallback((fieldId: string, toSectionId: string, toIndex: number) => {
    setFields(prev => {
      const updated = [...prev];
      const fieldIdx = updated.findIndex(f => f.id === fieldId);
      if (fieldIdx === -1) return prev;

      const field = { ...updated[fieldIdx], section_id: toSectionId };
      updated.splice(fieldIdx, 1);

      // Get fields in target section, find insert position
      const targetFields = updated.filter(f => f.section_id === toSectionId);
      let insertAt: number;
      if (toIndex >= targetFields.length) {
        // Insert at end
        const lastField = targetFields[targetFields.length - 1];
        insertAt = lastField ? updated.indexOf(lastField) + 1 : updated.length;
      } else {
        insertAt = updated.indexOf(targetFields[toIndex]);
      }

      updated.splice(insertAt, 0, field);

      // Renumber display_order for affected sections
      const affectedSections: string[] = [field.section_id];
      if (prev[fieldIdx].section_id !== toSectionId && !affectedSections.includes(prev[fieldIdx].section_id)) {
        affectedSections.push(prev[fieldIdx].section_id);
      }
      for (const secId of affectedSections) {
        let order = 0;
        for (const f of updated) {
          if (f.section_id === secId) {
            f.display_order = order++;
          }
        }
      }

      return updated;
    });
    setHasChanges(true);
  }, []);

  /** Swap field with neighbor: up/down = list order, left/right = grid position in 12-col layout */
  const nudgeField = useCallback((fieldId: string, sectionId: string, direction: "up" | "down" | "left" | "right") => {
    setFields(prev => {
      const sectionFields = prev
        .filter(f => f.section_id === sectionId)
        .sort((a, b) => a.display_order - b.display_order);

      const currentIdx = sectionFields.findIndex(f => f.id === fieldId);
      if (currentIdx === -1) return prev;

      let swapIdx: number;
      if (direction === "up" || direction === "down") {
        swapIdx = direction === "up" ? currentIdx - 1 : currentIdx + 1;
      } else {
        const positions = computeGridPositions(sectionFields);
        const currentPos = positions.find(p => p.fieldId === fieldId);
        if (!currentPos) return prev;
        const neighbor = positions.find(
          p =>
            p.fieldId !== fieldId &&
            p.row === currentPos.row &&
            (direction === "left" ? p.colEnd === currentPos.colStart : p.colStart === currentPos.colEnd)
        );
        if (!neighbor) return prev;
        swapIdx = sectionFields.findIndex(f => f.id === neighbor.fieldId);
        if (swapIdx === -1) return prev;
      }

      if (swapIdx < 0 || swapIdx >= sectionFields.length) return prev;

      // Swap the two fields in the sorted array, then reassign sequential display_order
      // to ALL fields in this section. This is more robust than swapping display_order
      // values, which fails if two fields have the same value.
      const reordered = [...sectionFields];
      const tmp = reordered[currentIdx];
      reordered[currentIdx] = reordered[swapIdx];
      reordered[swapIdx] = tmp;

      // Build a map: fieldId -> new display_order
      const newOrders = new Map<string, number>();
      reordered.forEach((f, i) => newOrders.set(f.id, i));

      return prev.map(f => {
        const newOrder = newOrders.get(f.id);
        if (newOrder !== undefined) return { ...f, display_order: newOrder };
        return f;
      });
    });
    setHasChanges(true);
  }, []);

  /** Move section up or down by swapping with neighbor in same tab */
  const moveSection = useCallback((sectionId: string, toIndex: number) => {
    setSections(prev => {
      const section = prev.find(s => s.id === sectionId);
      if (!section) return prev;

      const tabKey = section.tab_key || "overview";
      const tabSections = prev
        .filter(s => (s.tab_key || "overview") === tabKey && s.section_type === "fields")
        .sort((a, b) => a.display_order - b.display_order);

      const currentIdx = tabSections.findIndex(s => s.id === sectionId);
      if (currentIdx === -1) return prev;
      if (toIndex < 0 || toIndex >= tabSections.length || toIndex === currentIdx) return prev;

      // Simple swap with the neighbor
      const swapSection = tabSections[toIndex];
      if (!swapSection) return prev;

      return prev.map(s => {
        if (s.id === section.id) return { ...s, display_order: swapSection.display_order };
        if (s.id === swapSection.id) return { ...s, display_order: section.display_order };
        return s;
      });
    });
    setHasChanges(true);
  }, []);

  const removeField = useCallback((fieldId: string) => {
    setFields(prev => {
      const field = prev.find(f => f.id === fieldId);
      if (!field) return prev;

      // Track removal (only for real DB fields, not temp ones)
      if (!fieldId.startsWith("temp_")) {
        removedFieldIdsRef.current.push(fieldId);
      } else {
        // Remove from added fields
        addedFieldsRef.current = addedFieldsRef.current.filter(
          f => !(f.field_key === field.field_key && f.section_id === field.section_id)
        );
      }

      const updated = prev.filter(f => f.id !== fieldId);
      // Renumber display_order
      let order = 0;
      for (const f of updated) {
        if (f.section_id === field.section_id) {
          f.display_order = order++;
        }
      }
      return updated;
    });
    setHasChanges(true);
  }, []);

  const addField = useCallback((sectionId: string, fieldKey: string, fieldConfigId: string, sourceObjectKey: string | null) => {
    const tempId = `temp_${++tempIdCounter.current}`;
    const existingInSection = fields.filter(f => f.section_id === sectionId);
    const displayOrder = existingInSection.length;

    const newField: LayoutField = {
      id: tempId,
      section_id: sectionId,
      field_config_id: fieldConfigId,
      field_key: fieldKey,
      display_order: displayOrder,
      column_position: "left",
      is_visible: true,
      source: "native",
      source_object_key: sourceObjectKey,
      column_span: "half",
    };

    setFields(prev => [...prev, newField]);
    addedFieldsRef.current.push({
      section_id: sectionId,
      field_config_id: fieldConfigId,
      field_key: fieldKey,
      display_order: displayOrder,
      column_span: "half",
      source_object_key: sourceObjectKey,
    });
    setHasChanges(true);
  }, [fields]);

  const updateFieldSpan = useCallback((fieldId: string, span: string) => {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, column_span: span } : f));
    if (!fieldId.startsWith("temp_")) {
      const existing = updatedSpansRef.current.findIndex(u => u.id === fieldId);
      if (existing >= 0) {
        updatedSpansRef.current[existing].column_span = span;
      } else {
        updatedSpansRef.current.push({ id: fieldId, column_span: span });
      }
    } else {
      // Update in addedFields
      const field = fields.find(f => f.id === fieldId);
      if (field) {
        const added = addedFieldsRef.current.find(
          a => a.field_key === field.field_key && a.section_id === field.section_id
        );
        if (added) added.column_span = span;
      }
    }
    setHasChanges(true);
  }, [fields]);

  const addNewSection = useCallback((tabKey: string, label: string) => {
    const tempId = `temp_section_${++tempIdCounter.current}`;
    const tabSections = sections.filter(s => (s.tab_key || "overview") === tabKey);
    const maxOrder = tabSections.reduce((max, s) => Math.max(max, s.display_order), -1);
    const tabSection = tabSections[0];

    const newSection: LayoutSection = {
      id: tempId,
      page_type: pageType,
      section_key: label.toLowerCase().replace(/\s+/g, "_"),
      section_label: label,
      section_icon: "LayoutGrid",
      display_order: maxOrder + 1,
      is_visible: true,
      is_locked: false,
      sidebar: false,
      section_type: "fields",
      tab_key: tabKey === "overview" ? null : tabKey,
      tab_label: tabSection?.tab_label ?? tabKey,
      tab_icon: tabSection?.tab_icon ?? null,
      tab_order: tabSection?.tab_order ?? 0,
      tab_locked: false,
      card_type_id: null,
    };

    setSections(prev => [...prev, newSection]);
    addedSectionsRef.current.push({
      page_type: pageType,
      section_key: newSection.section_key,
      section_label: label,
      tab_key: tabKey,
      tab_label: tabSection?.tab_label ?? tabKey,
    });
    setHasChanges(true);
  }, [sections, pageType]);

  /** Delete section from local state (DB delete is handled by SectionConfigPopover) */
  const deleteSectionFromState = useCallback((sectionId: string) => {
    // Remove section
    setSections(prev => prev.filter(s => s.id !== sectionId));
    // Remove all fields in section
    setFields(prev => prev.filter(f => f.section_id !== sectionId));
    // Clean up tracking refs for temp sections
    if (sectionId.startsWith("temp_")) {
      addedSectionsRef.current = addedSectionsRef.current.filter(
        s => s.section_key !== sectionId.replace("temp_section_", "")
      );
    }
    setHasChanges(true);
  }, []);

  /** Update section label/icon in local state (DB update is handled by SectionConfigPopover) */
  const updateSectionConfig = useCallback((sectionId: string, label: string, icon: string) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, section_label: label, section_icon: icon } : s
    ));
  }, []);

  /** Toggle section visibility in local state (DB update is handled by SectionConfigPopover) */
  const toggleSectionVisibility = useCallback((sectionId: string, visible: boolean) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, is_visible: visible } : s
    ));
    setHasChanges(true);
  }, []);

  const getPendingChanges = useCallback((): PendingChanges => {
    // Build reordered sections (all non-temp sections with current order)
    const reorderedSections = sections
      .filter(s => !s.id.startsWith("temp_"))
      .map(s => ({ id: s.id, display_order: s.display_order }));

    // Build reordered fields (all non-temp, non-removed fields)
    const reorderedFields = fields
      .filter(f => !f.id.startsWith("temp_") && !removedFieldIdsRef.current.includes(f.id))
      .map(f => ({ id: f.id, display_order: f.display_order, section_id: f.section_id }));

    return {
      reorderedSections,
      reorderedFields,
      addedFields: [...addedFieldsRef.current],
      removedFieldIds: [...removedFieldIdsRef.current],
      updatedSpans: [...updatedSpansRef.current],
      addedSections: [...addedSectionsRef.current],
    };
  }, [sections, fields]);

  const getNudgeAvailability = useCallback(
    (sectionId: string, fieldId: string) => getNudgeAvailabilityHelper(fieldsBySectionId[sectionId] ?? [], fieldId),
    [fieldsBySectionId]
  );

  const state: InlineLayoutState = {
    isEditing,
    sections,
    fields,
    fieldsBySectionId,
    hasChanges,
  };

  return (
    <InlineLayoutContext.Provider
      value={{
        state,
        startEditing,
        cancelEditing,
        moveField,
        nudgeField,
        getNudgeAvailability,
        moveSection,
        removeField,
        addField,
        updateFieldSpan,
        addNewSection,
        deleteSection: deleteSectionFromState,
        updateSectionConfig,
        toggleSectionVisibility,
        getPendingChanges,
        activeTabKey,
        setActiveTabKey,
      }}
    >
      {children}
    </InlineLayoutContext.Provider>
  );
}

export function useInlineLayout() {
  const ctx = useContext(InlineLayoutContext);
  if (!ctx) throw new Error("useInlineLayout must be used within InlineLayoutProvider");
  return ctx;
}

/** Use when the component may render outside InlineLayoutProvider. Returns null when not inside provider. */
export function useOptionalInlineLayout(): InlineLayoutContextValue | null {
  return useContext(InlineLayoutContext);
}
