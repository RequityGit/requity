"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  PanelRight,
  FormInput,
  List,
  Plus,
  Lock,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Link2,
  Calculator,
  TrendingUp,
  ExternalLink,
  LayoutGrid,
  Grip,
  Sparkles,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  useDraggable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@repo/lib";
import type {
  ObjectDefinition,
  ObjectRelationship,
  FieldConfig,
  PageSection,
  PageField,
} from "../actions";
import {
  reorderLayoutSections,
  reorderLayoutFields,
  addFieldToLayout,
} from "../actions";
import { getObjectIcon, getFieldType } from "./constants";
import type { TabInfo } from "../ObjectManagerView";

// ---------------------------------------------------------------------------
// Drag item type prefixes
// ---------------------------------------------------------------------------

const SECTION_PREFIX = "section:";
const FIELD_PREFIX = "field:";
const PALETTE_PREFIX = "palette:";
const DROP_ZONE_PREFIX = "dropzone:";

function isSectionId(id: string) {
  return id.startsWith(SECTION_PREFIX);
}
function isFieldId(id: string) {
  return id.startsWith(FIELD_PREFIX);
}
function isPaletteId(id: string) {
  return id.startsWith(PALETTE_PREFIX);
}

function rawId(id: string) {
  if (id.startsWith(SECTION_PREFIX)) return id.slice(SECTION_PREFIX.length);
  if (id.startsWith(FIELD_PREFIX)) return id.slice(FIELD_PREFIX.length);
  if (id.startsWith(PALETTE_PREFIX)) return id.slice(PALETTE_PREFIX.length);
  if (id.startsWith(DROP_ZONE_PREFIX)) return id.slice(DROP_ZONE_PREFIX.length);
  return id;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  objectKey: string;
  sections: PageSection[];
  layoutFields: PageField[];
  fields: FieldConfig[];
  relationships: ObjectRelationship[];
  relatedFields: Record<string, FieldConfig[]>;
  objects: ObjectDefinition[];
  onSelectSection: (section: PageSection) => void;
  onSelectTab: (tab: TabInfo) => void;
  onLayoutChange?: () => void;
  loading: boolean;
}

// ---------------------------------------------------------------------------
// Sortable Section
// ---------------------------------------------------------------------------

function SortableSection({
  section,
  isCollapsed,
  onToggle,
  onSelect,
  sectionFields,
  fields,
  children,
}: {
  section: PageSection;
  isCollapsed: boolean;
  onToggle: () => void;
  onSelect: () => void;
  sectionFields: PageField[];
  fields: FieldConfig[];
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${SECTION_PREFIX}${section.id}` });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? "none" : transition,
  };

  const isRel = section.section_type === "relationship";
  const isComputed = section.section_type === "computed";
  const isProforma = section.section_type === "proforma";
  const isSystem = section.section_type === "system";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "mb-2.5 rounded-lg border border-border bg-card overflow-hidden transition-all",
        isDragging && "opacity-50 shadow-lg z-50"
      )}
    >
      {/* Section Header */}
      <div
        className={cn(
          "px-2.5 py-2 flex items-center gap-1.5 select-none",
          !isCollapsed && "border-b border-border"
        )}
      >
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={12} />
        </button>
        <button
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {isCollapsed ? (
            <ChevronRight size={13} className="text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown size={13} className="text-muted-foreground shrink-0" />
          )}
          {isRel && <span className="w-[5px] h-[5px] rounded-full bg-purple-500 shrink-0" />}
          {isComputed && <span className="w-[5px] h-[5px] rounded-full bg-yellow-600 shrink-0" />}
          {isProforma && <span className="w-[5px] h-[5px] rounded-full bg-cyan-500 shrink-0" />}
          {isSystem && <span className="w-[5px] h-[5px] rounded-full bg-muted-foreground shrink-0" />}
          <span className="font-semibold text-xs flex-1 truncate">{section.section_label}</span>
        </button>
        <button
          className="shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {isRel && (
            <Badge variant="outline" className="text-[9px] gap-1 text-purple-500 border-purple-500/40">
              <Link2 size={8} />
              Relationship
            </Badge>
          )}
          {isComputed && (
            <Badge variant="outline" className="text-[9px] gap-1 text-yellow-600 border-yellow-600/40">
              <Calculator size={8} />
              Card Type
            </Badge>
          )}
          {isProforma && (
            <Badge variant="outline" className="text-[9px] gap-1 text-cyan-500 border-cyan-500/40">
              <TrendingUp size={8} />
              Pro Forma
            </Badge>
          )}
          {isSystem && (
            <Badge variant="outline" className="text-[9px] gap-1">
              <Lock size={8} />
              System
            </Badge>
          )}
        </button>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {sectionFields.length || "\u2014"}
        </span>
      </div>

      {/* Section Body */}
      {!isCollapsed && <div className="p-2.5">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sortable Field
// ---------------------------------------------------------------------------

function SortableField({
  layoutField,
  fieldConfig,
  spanClass,
}: {
  layoutField: PageField;
  fieldConfig: FieldConfig | undefined;
  spanClass: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${FIELD_PREFIX}${layoutField.id}` });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? "none" : transition,
  };

  const isInh = layoutField.source === "inherited";
  const ft = getFieldType(fieldConfig?.field_type || "text");
  const FI = ft.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1.5 rounded border border-dashed min-h-[34px] transition-all",
        spanClass,
        isDragging && "opacity-50 shadow-md z-50",
        isInh
          ? "border-purple-500/40 bg-purple-500/5"
          : "border-border bg-muted"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
      >
        <GripVertical size={10} />
      </button>
      <FI size={11} style={{ color: ft.color }} className="shrink-0" />
      <span className="text-[11px] flex-1 truncate">
        {fieldConfig?.field_label || layoutField.field_key}
      </span>
      {isInh && (
        <ExternalLink size={9} className="text-purple-500 shrink-0" />
      )}
      {fieldConfig?.is_required && (
        <span className="w-1 h-1 rounded-full bg-destructive shrink-0" />
      )}
      <span className="text-[8px] text-muted-foreground shrink-0">
        {layoutField.column_span === "full" ? "12" : layoutField.column_span === "third" ? "4" : "6"}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function LayoutTab({
  objectKey,
  sections: propSections,
  layoutFields: propLayoutFields,
  fields,
  relationships,
  relatedFields,
  objects,
  onSelectSection,
  onSelectTab,
  onLayoutChange,
  loading,
}: Props) {
  const [activeView, setActiveView] = useState("detail");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Optimistic local state for drag-and-drop
  const [localSections, setLocalSections] = useState<PageSection[]>(propSections);
  const [localFields, setLocalFields] = useState<PageField[]>(propLayoutFields);

  // Sync when props change (e.g. object switch)
  useEffect(() => {
    setLocalSections(propSections);
  }, [propSections]);
  useEffect(() => {
    setLocalFields(propLayoutFields);
  }, [propLayoutFields]);

  // Active drag state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Group sections by tab
  const tabs = useMemo(() => {
    const tabMap = new Map<string, TabInfo>();

    for (const section of localSections) {
      const key = section.tab_key || "overview";
      if (!tabMap.has(key)) {
        tabMap.set(key, {
          id: key,
          label: section.tab_label || "Overview",
          icon: section.tab_icon || "panel-right",
          locked: section.tab_locked || false,
          sections: [],
        });
      }
      tabMap.get(key)!.sections.push(section);
    }

    if (tabMap.size === 0 && localSections.length > 0) {
      tabMap.set("overview", {
        id: "overview",
        label: "Overview",
        icon: "panel-right",
        locked: true,
        sections: localSections,
      });
    }

    return Array.from(tabMap.values()).sort(
      (a, b) => (a.sections[0]?.tab_order || 0) - (b.sections[0]?.tab_order || 0)
    );
  }, [localSections]);

  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id || "");
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Refs for stable access inside handleDragEnd without stale closures
  const localFieldsRef = useRef(localFields);
  localFieldsRef.current = localFields;
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  // Reset active tab when tabs change
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find((t) => t.id === activeTabId)) {
      setActiveTabId(tabs[0].id);
    }
  }, [tabs, activeTabId]);

  const toggle = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getSpanClass = (span: string) => {
    switch (span) {
      case "full": return "col-span-12";
      case "third": return "col-span-4";
      default: return "col-span-6";
    }
  };

  // Fields already placed in a section (to filter palette)
  const placedFieldKeys = useMemo(() => {
    return new Set(localFields.map((f) => f.field_key));
  }, [localFields]);

  // Available palette fields (not yet placed)
  const paletteFields = useMemo(() => {
    return fields.filter((f) => !f.is_archived && !placedFieldKeys.has(f.field_key));
  }, [fields, placedFieldKeys]);

  // ---------------------------------------------------------------------------
  // Drag handlers
  // ---------------------------------------------------------------------------

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragId(null);

      if (!over) return;
      const activeId = active.id as string;
      const overId = over.id as string;
      if (activeId === overId) return;

      // --- Section reorder ---
      if (isSectionId(activeId) && isSectionId(overId)) {
        const activeSectionId = rawId(activeId);
        const overSectionId = rawId(overId);
        let sectionUpdates: { id: string; display_order: number }[] = [];

        setLocalSections((prev) => {
          const tabSections = activeTabRef.current?.sections.map((s) => s.id) || [];
          const currentOrder = prev
            .filter((s) => tabSections.includes(s.id))
            .sort((a, b) => a.display_order - b.display_order);

          const oldIdx = currentOrder.findIndex((s) => s.id === activeSectionId);
          const newIdx = currentOrder.findIndex((s) => s.id === overSectionId);
          if (oldIdx === -1 || newIdx === -1) return prev;

          const reordered = [...currentOrder];
          const [moved] = reordered.splice(oldIdx, 1);
          reordered.splice(newIdx, 0, moved);

          sectionUpdates = reordered.map((s, i) => ({ id: s.id, display_order: i }));
          const idToOrder = new Map(sectionUpdates.map((u) => [u.id, u.display_order]));

          return prev.map((s) =>
            idToOrder.has(s.id) ? { ...s, display_order: idToOrder.get(s.id)! } : s
          );
        });

        if (sectionUpdates.length > 0) {
          reorderLayoutSections(sectionUpdates).then(() => onLayoutChange?.());
        }
        return;
      }

      // --- Field reorder within/across sections ---
      if (isFieldId(activeId) && (isFieldId(overId) || overId.startsWith(DROP_ZONE_PREFIX))) {
        const activeFieldId = rawId(activeId);
        const currentFields = localFieldsRef.current;

        // Determine target section
        let targetSectionId: string;
        let insertIndex: number;

        if (overId.startsWith(DROP_ZONE_PREFIX)) {
          targetSectionId = rawId(overId);
          const sectionFields = currentFields
            .filter((f) => f.section_id === targetSectionId)
            .sort((a, b) => a.display_order - b.display_order);
          insertIndex = sectionFields.length;
        } else {
          const overFieldId = rawId(overId);
          const overField = currentFields.find((f) => f.id === overFieldId);
          if (!overField) return;
          targetSectionId = overField.section_id;
          const sectionFields = currentFields
            .filter((f) => f.section_id === targetSectionId)
            .sort((a, b) => a.display_order - b.display_order);
          insertIndex = sectionFields.findIndex((f) => f.id === overFieldId);
          if (insertIndex === -1) insertIndex = sectionFields.length;
        }

        let fieldUpdates: { id: string; display_order: number; section_id?: string }[] = [];

        setLocalFields((prev) => {
          const movingField = prev.find((f) => f.id === activeFieldId);
          if (!movingField) return prev;

          // Remove from old position
          const without = prev.filter((f) => f.id !== activeFieldId);

          // Get fields in target section (after removal)
          const targetFields = without
            .filter((f) => f.section_id === targetSectionId)
            .sort((a, b) => a.display_order - b.display_order);

          // Insert at position
          const clampedIdx = Math.min(insertIndex, targetFields.length);
          targetFields.splice(clampedIdx, 0, {
            ...movingField,
            section_id: targetSectionId,
          });

          // Recompute display_order for target section
          const updates: { id: string; display_order: number; section_id?: string }[] = [];
          targetFields.forEach((f, i) => {
            f.display_order = i;
            updates.push({
              id: f.id,
              display_order: i,
              section_id: f.id === activeFieldId ? targetSectionId : undefined,
            });
          });

          // Also recompute old section if different
          const oldSectionId = movingField.section_id;
          if (oldSectionId !== targetSectionId) {
            const oldFields = without
              .filter((f) => f.section_id === oldSectionId)
              .sort((a, b) => a.display_order - b.display_order);
            oldFields.forEach((f, i) => {
              f.display_order = i;
              updates.push({ id: f.id, display_order: i });
            });
          }

          fieldUpdates = updates;

          // Rebuild full list
          const otherFields = without.filter(
            (f) =>
              f.section_id !== targetSectionId &&
              f.section_id !== oldSectionId
          );
          const oldSectionFields =
            oldSectionId !== targetSectionId
              ? without
                  .filter((f) => f.section_id === oldSectionId)
                  .sort((a, b) => a.display_order - b.display_order)
              : [];

          return [...otherFields, ...targetFields, ...oldSectionFields];
        });

        if (fieldUpdates.length > 0) {
          reorderLayoutFields(fieldUpdates).then(() => onLayoutChange?.());
        }
        return;
      }

      // --- Palette field dropped into section ---
      if (isPaletteId(activeId) && (isFieldId(overId) || overId.startsWith(DROP_ZONE_PREFIX))) {
        const fieldConfigId = rawId(activeId);
        const fieldConfig = fields.find((f) => f.id === fieldConfigId);
        if (!fieldConfig) return;

        const currentFields = localFieldsRef.current;
        let targetSectionId: string;
        let insertOrder: number;

        if (overId.startsWith(DROP_ZONE_PREFIX)) {
          targetSectionId = rawId(overId);
          const sectionFields = currentFields
            .filter((f) => f.section_id === targetSectionId)
            .sort((a, b) => a.display_order - b.display_order);
          insertOrder = sectionFields.length;
        } else {
          const overFieldId = rawId(overId);
          const overField = currentFields.find((f) => f.id === overFieldId);
          if (!overField) return;
          targetSectionId = overField.section_id;
          const sectionFields = currentFields
            .filter((f) => f.section_id === targetSectionId)
            .sort((a, b) => a.display_order - b.display_order);
          insertOrder = sectionFields.findIndex((f) => f.id === overFieldId);
          if (insertOrder === -1) insertOrder = sectionFields.length;
        }

        // Persist and get the real row back
        const result = await addFieldToLayout({
          section_id: targetSectionId,
          field_config_id: fieldConfig.id,
          field_key: fieldConfig.field_key,
          display_order: insertOrder,
          column_span: "half",
        });

        if (result.data) {
          setLocalFields((prev) => [...prev, result.data!]);
          onLayoutChange?.();
        }
        return;
      }
    },
    [fields, onLayoutChange]
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
  }, []);

  // Determine what's being dragged for the overlay
  const activeDragField = useMemo(() => {
    if (!activeDragId) return null;
    if (isFieldId(activeDragId)) {
      const lf = localFields.find((f) => f.id === rawId(activeDragId));
      if (!lf) return null;
      const fc = fields.find(
        (f) => f.id === lf.field_config_id || f.field_key === lf.field_key
      );
      return { layoutField: lf, fieldConfig: fc };
    }
    if (isPaletteId(activeDragId)) {
      const fc = fields.find((f) => f.id === rawId(activeDragId));
      return fc ? { paletteField: fc } : null;
    }
    return null;
  }, [activeDragId, localFields, fields]);

  const activeDragSection = useMemo(() => {
    if (!activeDragId || !isSectionId(activeDragId)) return null;
    return localSections.find((s) => s.id === rawId(activeDragId)) || null;
  }, [activeDragId, localSections]);

  // Memoize sorted sections to avoid mutating sort in render
  const sortedSections = useMemo(() => {
    return [...(activeTab?.sections || [])].sort((a, b) => a.display_order - b.display_order);
  }, [activeTab?.sections]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (localSections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 p-10">
        <LayoutGrid size={32} className="text-muted-foreground" strokeWidth={1} />
        <span className="font-semibold text-sm">No Layout Configured</span>
        <span className="text-xs text-muted-foreground text-center">
          Create a page layout to control how this object renders.
        </span>
        <Button variant="outline" className="gap-1.5 mt-2">
          <Plus size={12} />
          Create Layout
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {/* Main Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* View Switcher */}
          <div className="px-3.5 py-1.5 border-b border-border flex items-center gap-1.5">
            {[
              { key: "detail", label: "Detail", icon: PanelRight },
              { key: "create", label: "Create", icon: FormInput },
              { key: "table", label: "Table", icon: List },
            ].map((v) => {
              const VI = v.icon;
              return (
                <button
                  key={v.key}
                  onClick={() => setActiveView(v.key)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors capitalize",
                    activeView === v.key
                      ? "bg-muted border border-border text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <VI size={11} />
                  {v.label}
                </button>
              );
            })}
            <div className="flex-1" />
            <Badge variant="outline" className="text-[9px] gap-1">
              <Sparkles size={9} />
              Live Preview
            </Badge>
          </div>

          {/* Coming Soon for create/table */}
          {activeView !== "detail" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <LayoutGrid size={32} strokeWidth={1} />
              <span className="text-sm font-medium">Coming Soon</span>
              <span className="text-xs">
                {activeView === "create" ? "Create Form" : "Table View"} layout editor is planned for a future release.
              </span>
            </div>
          )}

          {/* Detail View - Tab Bar */}
          {activeView === "detail" && (
            <>
              <div className="px-3.5 border-b border-border flex items-center gap-0 overflow-x-auto">
                {tabs.map((tab) => {
                  const isActive = activeTabId === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTabId(tab.id);
                        onSelectTab(tab);
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2",
                        isActive
                          ? "text-foreground border-blue-500"
                          : "text-muted-foreground border-transparent hover:text-foreground"
                      )}
                    >
                      {tab.label}
                      {tab.locked && <Lock size={9} className="text-muted-foreground" />}
                    </button>
                  );
                })}
                <button className="flex items-center gap-1 px-2.5 py-2.5 text-xs text-muted-foreground hover:text-foreground">
                  <Plus size={12} />
                  Add Tab
                </button>
              </div>

              {/* Canvas */}
              <div className="flex-1 overflow-y-auto p-4 bg-background">
                <div className="max-w-[880px] mx-auto">
                  <SortableContext
                    items={sortedSections.map((s) => `${SECTION_PREFIX}${s.id}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {sortedSections.map((section) => {
                        const isCol = collapsed[section.id];
                        const isRel = section.section_type === "relationship";
                        const isSystem = section.section_type === "system";
                        const isComputed = section.section_type === "computed";
                        const isProforma = section.section_type === "proforma";

                        const sectionFields = localFields
                          .filter((f) => f.section_id === section.id)
                          .sort((a, b) => a.display_order - b.display_order);

                        return (
                          <SortableSection
                            key={section.id}
                            section={section}
                            isCollapsed={isCol}
                            onToggle={() => toggle(section.id)}
                            onSelect={() => onSelectSection(section)}
                            sectionFields={sectionFields}
                            fields={fields}
                          >
                            {/* Fields grid */}
                            {(section.section_type === "fields" || isRel) && sectionFields.length > 0 && (
                              <SortableContext
                                items={sectionFields.map((f) => `${FIELD_PREFIX}${f.id}`)}
                                strategy={rectSortingStrategy}
                              >
                                <div className="grid grid-cols-12 gap-1.5">
                                  {sectionFields.map((lf) => {
                                    const fieldConfig = fields.find(
                                      (f) => f.id === lf.field_config_id || f.field_key === lf.field_key
                                    );
                                    return (
                                      <SortableField
                                        key={lf.id}
                                        layoutField={lf}
                                        fieldConfig={fieldConfig}
                                        spanClass={getSpanClass(lf.column_span)}
                                      />
                                    );
                                  })}
                                  <DropZone sectionId={section.id} />
                                </div>
                              </SortableContext>
                            )}

                            {/* Empty field sections with drop zone */}
                            {(section.section_type === "fields" || isRel) && sectionFields.length === 0 && (
                              <SortableContext items={[]} strategy={rectSortingStrategy}>
                                <div className="grid grid-cols-12 gap-1.5">
                                  <DropZone sectionId={section.id} isEmpty />
                                </div>
                              </SortableContext>
                            )}

                            {/* System section */}
                            {isSystem && (
                              <div className="flex items-center justify-center py-5 gap-2 text-muted-foreground text-xs">
                                <Lock size={12} />
                                System-managed section. Content rendered by dedicated components.
                              </div>
                            )}

                            {/* Computed section placeholder */}
                            {isComputed && (
                              <div className="flex items-center justify-center py-5 gap-2 text-muted-foreground text-xs">
                                <Calculator size={12} />
                                Card type computed outputs will render here.
                              </div>
                            )}

                            {/* Proforma section placeholder */}
                            {isProforma && (
                              <div className="flex items-center justify-center py-5 gap-2 text-muted-foreground text-xs">
                                <TrendingUp size={12} />
                                Pro forma grid will render here.
                              </div>
                            )}
                          </SortableSection>
                        );
                      })}
                  </SortableContext>

                  {/* Add Section */}
                  <div className="p-3 rounded-lg border border-dashed border-border flex items-center justify-center gap-1.5 cursor-pointer text-muted-foreground text-xs hover:text-foreground hover:border-border/80 transition-colors mt-1">
                    <Plus size={13} />
                    Add Section
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Field Palette */}
        {activeView === "detail" && (
          <div className="w-[200px] border-l border-border bg-card flex flex-col overflow-hidden shrink-0">
            <div className="px-2.5 py-2 border-b border-border text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
              Available Fields
            </div>
            <div className="flex-1 overflow-y-auto px-1.5 py-1.5">
              {/* Native fields */}
              <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground px-1.5 mb-1">
                Native
              </div>
              {paletteFields.map((f) => (
                <PaletteItem key={f.id} field={f} />
              ))}

              {/* Relationship fields (both parent and child directions) */}
              {relationships.map((rel) => {
                const isParent = rel.parent_object_key === objectKey;
                const relatedObjectKey = isParent
                  ? rel.child_object_key
                  : rel.parent_object_key;
                const relatedObject = objects.find(
                  (o) => o.object_key === relatedObjectKey
                );
                const entityFields = relatedFields[relatedObjectKey] || [];
                if (entityFields.length === 0) return null;

                return (
                  <div key={rel.id} className="mt-2.5">
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground px-1.5 mb-1 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-purple-500" />
                      <span className="truncate">{relatedObject?.label}</span>
                      <span className="ml-auto text-[8px] font-medium text-purple-400">
                        {isParent ? "child" : "parent"}
                      </span>
                    </div>
                    {entityFields.map((fieldConfig) => {
                      const ft = getFieldType(
                        fieldConfig.field_type || "text"
                      );
                      const FI = ft.icon;
                      return (
                        <div
                          key={fieldConfig.field_key}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded text-xs text-muted-foreground hover:bg-purple-500/10 hover:text-foreground cursor-grab mb-px border-l-2 border-purple-500/20"
                        >
                          <Grip size={9} className="text-muted-foreground" />
                          <FI size={10} style={{ color: ft.color }} />
                          <span className="flex-1 truncate">
                            {fieldConfig.field_label || fieldConfig.field_key}
                          </span>
                          <ExternalLink
                            size={8}
                            className="text-purple-500 shrink-0"
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={null}>
          {activeDragSection && (
            <div className="rounded-lg border border-border bg-card px-2.5 py-2 shadow-lg opacity-90">
              <div className="flex items-center gap-1.5">
                <GripVertical size={12} className="text-muted-foreground" />
                <span className="font-semibold text-xs">{activeDragSection.section_label}</span>
              </div>
            </div>
          )}
          {activeDragField && "layoutField" in activeDragField && activeDragField.layoutField && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-dashed border-border bg-muted shadow-lg opacity-90 min-h-[34px]">
              <GripVertical size={10} className="text-muted-foreground" />
              <span className="text-[11px] truncate">
                {activeDragField.fieldConfig?.field_label || activeDragField.layoutField.field_key}
              </span>
            </div>
          )}
          {activeDragField && "paletteField" in activeDragField && activeDragField.paletteField && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-dashed border-blue-500/50 bg-blue-500/10 shadow-lg opacity-90 min-h-[34px]">
              <GripVertical size={10} className="text-blue-500" />
              <span className="text-[11px] text-blue-500 truncate">
                {activeDragField.paletteField.field_label}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drop Zone (target for dropping fields into a section)
// ---------------------------------------------------------------------------

function DropZone({ sectionId, isEmpty }: { sectionId: string; isEmpty?: boolean }) {
  const { setNodeRef, isOver } = useSortable({
    id: `${DROP_ZONE_PREFIX}${sectionId}`,
    disabled: true,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "col-span-12 flex justify-center py-1 transition-colors rounded",
        isEmpty && "py-4",
        isOver && "bg-blue-500/10 border border-dashed border-blue-500/40"
      )}
    >
      <button className="flex items-center gap-1 px-2.5 py-0.5 rounded border border-dashed border-border text-muted-foreground text-[10px] hover:text-foreground hover:border-border/80 transition-colors">
        <Plus size={isEmpty ? 12 : 10} />
        {isEmpty ? "Add fields to this section" : "Drop field"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Palette Item (draggable from sidebar)
// ---------------------------------------------------------------------------

function PaletteItem({ field }: { field: FieldConfig }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${PALETTE_PREFIX}${field.id}`,
  });

  const ft = getFieldType(field.field_type);
  const FI = ft.icon;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "flex items-center gap-1.5 px-1.5 py-1 rounded text-xs text-muted-foreground hover:bg-muted hover:text-foreground cursor-grab mb-px",
        isDragging && "opacity-50"
      )}
    >
      <Grip size={9} className="text-muted-foreground" />
      <FI size={10} style={{ color: ft.color }} />
      <span className="flex-1 truncate">{field.field_label}</span>
    </div>
  );
}
