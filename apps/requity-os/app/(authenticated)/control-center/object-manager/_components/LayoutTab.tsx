"use client";

import { useState, useMemo } from "react";
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
import { getObjectIcon, getFieldType } from "./constants";
import type { TabInfo } from "../ObjectManagerView";

interface Props {
  objectKey: string;
  sections: PageSection[];
  layoutFields: PageField[];
  fields: FieldConfig[];
  relationships: ObjectRelationship[];
  objects: ObjectDefinition[];
  onSelectSection: (section: PageSection) => void;
  onSelectTab: (tab: TabInfo) => void;
  loading: boolean;
}

export function LayoutTab({
  objectKey,
  sections,
  layoutFields,
  fields,
  relationships,
  objects,
  onSelectSection,
  onSelectTab,
  loading,
}: Props) {
  const [activeView, setActiveView] = useState("detail");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Group sections by tab
  const tabs = useMemo(() => {
    const tabMap = new Map<string, TabInfo>();

    // If sections have tab_key, group by it; otherwise create a default tab
    for (const section of sections) {
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

    // If no tabs exist, create a default one
    if (tabMap.size === 0 && sections.length > 0) {
      tabMap.set("overview", {
        id: "overview",
        label: "Overview",
        icon: "panel-right",
        locked: true,
        sections,
      });
    }

    return Array.from(tabMap.values()).sort(
      (a, b) => (a.sections[0]?.tab_order || 0) - (b.sections[0]?.tab_order || 0)
    );
  }, [sections]);

  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id || "");
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const toggle = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const spanClass = (span: string) => {
    switch (span) {
      case "full": return "col-span-12";
      case "third": return "col-span-4";
      default: return "col-span-6";
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  // No layout state
  if (sections.length === 0) {
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
                {activeTab?.sections.map((section) => {
                  const isCol = collapsed[section.id];
                  const isRel = section.section_type === "relationship";
                  const isComputed = section.section_type === "computed";
                  const isProforma = section.section_type === "proforma";
                  const isSystem = section.section_type === "system";

                  const sectionFields = layoutFields.filter(
                    (f) => f.section_id === section.id
                  );

                  return (
                    <div
                      key={section.id}
                      onClick={() => onSelectSection(section)}
                      className="mb-2.5 rounded-lg border border-border bg-card overflow-hidden hover:border-border/80 transition-colors cursor-pointer"
                    >
                      {/* Section Header */}
                      <div
                        className={cn(
                          "px-2.5 py-2 flex items-center gap-1.5 cursor-pointer select-none",
                          !isCol && "border-b border-border"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle(section.id);
                        }}
                      >
                        <GripVertical size={12} className="text-muted-foreground cursor-grab" />
                        {isCol ? (
                          <ChevronRight size={13} className="text-muted-foreground" />
                        ) : (
                          <ChevronDown size={13} className="text-muted-foreground" />
                        )}
                        {isRel && <span className="w-[5px] h-[5px] rounded-full bg-purple-500" />}
                        {isComputed && <span className="w-[5px] h-[5px] rounded-full bg-yellow-600" />}
                        {isProforma && <span className="w-[5px] h-[5px] rounded-full bg-cyan-500" />}
                        {isSystem && <span className="w-[5px] h-[5px] rounded-full bg-muted-foreground" />}
                        <span className="font-semibold text-xs flex-1">{section.section_label}</span>
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
                        <span className="text-[10px] text-muted-foreground">
                          {sectionFields.length || "\u2014"}
                        </span>
                      </div>

                      {/* Section Body */}
                      {!isCol && (
                        <div className="p-2.5">
                          {/* Fields grid */}
                          {(section.section_type === "fields" || isRel) && sectionFields.length > 0 && (
                            <div className="grid grid-cols-12 gap-1.5">
                              {sectionFields.map((lf) => {
                                const fieldConfig = fields.find(
                                  (f) => f.id === lf.field_config_id || f.field_key === lf.field_key
                                );
                                const isInh = lf.source === "inherited";
                                const ft = getFieldType(fieldConfig?.field_type || "text");
                                const FI = ft.icon;

                                return (
                                  <div
                                    key={lf.id}
                                    className={cn(
                                      "flex items-center gap-1.5 px-2 py-1.5 rounded border border-dashed min-h-[34px]",
                                      spanClass(lf.column_span),
                                      isInh
                                        ? "border-purple-500/40 bg-purple-500/5"
                                        : "border-border bg-muted"
                                    )}
                                  >
                                    <GripVertical size={10} className="text-muted-foreground shrink-0" />
                                    <FI size={11} style={{ color: ft.color }} className="shrink-0" />
                                    <span className="text-[11px] flex-1 truncate">
                                      {fieldConfig?.field_label || lf.field_key}
                                    </span>
                                    {isInh && (
                                      <ExternalLink size={9} className="text-purple-500 shrink-0" />
                                    )}
                                    {fieldConfig?.is_required && (
                                      <span className="w-1 h-1 rounded-full bg-destructive shrink-0" />
                                    )}
                                    <span className="text-[8px] text-muted-foreground shrink-0">
                                      {lf.column_span === "full" ? "12" : lf.column_span === "third" ? "4" : "6"}
                                    </span>
                                  </div>
                                );
                              })}
                              <div className="col-span-12 flex justify-center py-1">
                                <button className="flex items-center gap-1 px-2.5 py-0.5 rounded border border-dashed border-border text-muted-foreground text-[10px] hover:text-foreground hover:border-border/80 transition-colors">
                                  <Plus size={10} />
                                  Drop field
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Empty field sections */}
                          {(section.section_type === "fields" || isRel) && sectionFields.length === 0 && (
                            <div className="flex justify-center py-4">
                              <button className="flex items-center gap-1 px-3 py-1.5 rounded border border-dashed border-border text-muted-foreground text-xs hover:text-foreground hover:border-border/80 transition-colors">
                                <Plus size={12} />
                                Add fields to this section
                              </button>
                            </div>
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
                        </div>
                      )}
                    </div>
                  );
                })}

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
            {fields
              .filter((f) => !f.is_archived && f.is_visible)
              .map((f) => {
                const ft = getFieldType(f.field_type);
                const FI = ft.icon;
                return (
                  <div
                    key={f.id}
                    className="flex items-center gap-1.5 px-1.5 py-1 rounded text-xs text-muted-foreground hover:bg-muted hover:text-foreground cursor-grab mb-px"
                  >
                    <Grip size={9} className="text-muted-foreground" />
                    <FI size={10} style={{ color: ft.color }} />
                    <span className="flex-1 truncate">{f.field_label}</span>
                  </div>
                );
              })}

            {/* Relationship fields */}
            {relationships
              .filter((r) => r.parent_object_key === objectKey)
              .map((rel) => {
                const child = objects.find((o) => o.object_key === rel.child_object_key);
                const inherited = Array.isArray(rel.inherited_fields) ? rel.inherited_fields : [];
                if (inherited.length === 0) return null;

                return (
                  <div key={rel.id} className="mt-2.5">
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground px-1.5 mb-1 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-purple-500" />
                      {child?.label}
                    </div>
                    {inherited.map((fieldKey) => (
                      <div
                        key={fieldKey}
                        className="flex items-center gap-1.5 px-1.5 py-1 rounded text-xs text-muted-foreground hover:bg-purple-500/10 hover:text-foreground cursor-grab mb-px border-l-2 border-purple-500/20"
                      >
                        <Grip size={9} className="text-muted-foreground" />
                        <span className="flex-1 truncate">{fieldKey}</span>
                        <ExternalLink size={8} className="text-purple-500 shrink-0" />
                      </div>
                    ))}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
