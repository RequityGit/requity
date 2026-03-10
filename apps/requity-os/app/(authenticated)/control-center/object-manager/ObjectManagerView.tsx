"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SlidersHorizontal,
  Search,
  Check,
  Type,
  Network,
  LayoutGrid,
  Settings2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@repo/lib";
import type {
  ObjectDefinition,
  FieldConfig,
  ObjectRelationship,
  RelationshipRole,
  PageSection,
  PageField,
} from "./actions";
import {
  fetchObjectFields,
  fetchObjectRelationships,
  fetchObjectLayout,
  fetchFieldsForModules,
} from "./actions";
import { getObjectIcon } from "./_components/constants";
import { FieldsTab } from "./_components/FieldsTab";
import { RelationshipsTab } from "./_components/RelationshipsTab";
import { LayoutTab } from "./_components/LayoutTab";
import { FieldConfigPanel } from "./_components/FieldConfigPanel";
import { RelationshipConfigPanel } from "./_components/RelationshipConfigPanel";
import { SectionConfigPanel } from "./_components/SectionConfigPanel";
import { TabConfigPanel } from "./_components/TabConfigPanel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActiveTab = "fields" | "relationships" | "layout";

export interface TabInfo {
  id: string;
  label: string;
  icon: string;
  locked: boolean;
  sections: PageSection[];
}

// ---------------------------------------------------------------------------
// Object Manager View
// ---------------------------------------------------------------------------

interface Props {
  objects: ObjectDefinition[];
  fieldCounts: Record<string, number>;
  relationshipCounts: Record<string, number>;
}

// Module mapping: object_key -> field_configurations module(s)
const OBJECT_MODULE_MAP: Record<string, string> = {
  contact: "contact_profile",
  company: "company_info",
  borrower_entity: "borrower_entity",
  property: "uw_property",
  loan: "loan_details",
  borrower: "borrower_profile",
  investor: "investor_profile",
  unified_deal: "uw_deal",
};

// Page type mapping: object_key -> page_layout page_type
const OBJECT_PAGE_TYPE_MAP: Record<string, string> = {
  contact: "contact_detail",
  company: "company_detail",
  loan: "loan_detail",
  property: "property_detail",
};

export function ObjectManagerView({ objects, fieldCounts, relationshipCounts }: Props) {
  const [selectedObjectKey, setSelectedObjectKey] = useState(objects[0]?.object_key || "");
  const [activeTab, setActiveTab] = useState<ActiveTab>("fields");
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [relationships, setRelationships] = useState<ObjectRelationship[]>([]);
  const [roles, setRoles] = useState<RelationshipRole[]>([]);
  const [layoutSections, setLayoutSections] = useState<PageSection[]>([]);
  const [layoutFields, setLayoutFields] = useState<PageField[]>([]);
  const [relatedFields, setRelatedFields] = useState<Record<string, FieldConfig[]>>({});
  const [loading, setLoading] = useState(false);

  // Selection states
  const [selectedField, setSelectedField] = useState<FieldConfig | null>(null);
  const [selectedRel, setSelectedRel] = useState<ObjectRelationship | null>(null);
  const [selectedSection, setSelectedSection] = useState<PageSection | null>(null);
  const [selectedLayoutTab, setSelectedLayoutTab] = useState<TabInfo | null>(null);

  const selectedObject = objects.find((o) => o.object_key === selectedObjectKey);

  const clearSelection = useCallback(() => {
    setSelectedField(null);
    setSelectedRel(null);
    setSelectedSection(null);
    setSelectedLayoutTab(null);
  }, []);

  // Load data when object or tab changes
  const loadData = useCallback(async () => {
    if (!selectedObjectKey) return;
    setLoading(true);

    try {
      if (activeTab === "fields") {
        const fieldModule = OBJECT_MODULE_MAP[selectedObjectKey] || selectedObjectKey;
        const result = await fetchObjectFields(fieldModule);
        if (result.data) setFields(result.data);
      } else if (activeTab === "relationships") {
        const result = await fetchObjectRelationships(selectedObjectKey);
        if (result.relationships) setRelationships(result.relationships);
        if (result.roles) setRoles(result.roles);
      } else if (activeTab === "layout") {
        const pageType = OBJECT_PAGE_TYPE_MAP[selectedObjectKey];
        const fieldModule = OBJECT_MODULE_MAP[selectedObjectKey] || selectedObjectKey;

        // Fetch layout, native fields, and relationships in parallel
        const [layoutResult, fieldsResult, relsResult] = await Promise.all([
          pageType
            ? fetchObjectLayout(pageType)
            : Promise.resolve({ sections: [] as PageSection[], fields: [] as PageField[] }),
          fetchObjectFields(fieldModule),
          fetchObjectRelationships(selectedObjectKey),
        ]);

        setLayoutSections(layoutResult.sections ?? []);
        setLayoutFields(layoutResult.fields ?? []);
        if (fieldsResult.data) setFields(fieldsResult.data);
        const rels = relsResult.relationships ?? [];
        if (relsResult.relationships) setRelationships(rels);

        // Fetch fields for all related entities
        const relObjectKeys = rels.map((r) =>
          r.parent_object_key === selectedObjectKey
            ? r.child_object_key
            : r.parent_object_key
        );
        const uniqueModules = Array.from(
          new Set(relObjectKeys.map((k) => OBJECT_MODULE_MAP[k] || k))
        );

        if (uniqueModules.length > 0) {
          const relFieldsResult = await fetchFieldsForModules(uniqueModules);
          if (relFieldsResult.data) {
            const grouped: Record<string, FieldConfig[]> = {};
            for (const key of relObjectKeys) {
              const mod = OBJECT_MODULE_MAP[key] || key;
              grouped[key] = (relFieldsResult.data || []).filter(
                (f) => f.module === mod
              );
            }
            setRelatedFields(grouped);
          }
        } else {
          setRelatedFields({});
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selectedObjectKey, activeTab]);

  useEffect(() => {
    clearSelection();
    loadData();
  }, [loadData, clearSelection]);

  const handleObjectSelect = (key: string) => {
    setSelectedObjectKey(key);
    clearSelection();
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    clearSelection();
  };

  const filteredObjects = objects.filter((o) =>
    o.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs: { key: ActiveTab; label: string; icon: typeof Type; count: number; color: string }[] = [
    {
      key: "fields",
      label: "Fields",
      icon: Type,
      count: fieldCounts[OBJECT_MODULE_MAP[selectedObjectKey] || selectedObjectKey] || 0,
      color: "border-blue-500",
    },
    {
      key: "relationships",
      label: "Relationships",
      icon: Network,
      count: relationshipCounts[selectedObjectKey] || 0,
      color: "border-purple-500",
    },
    {
      key: "layout",
      label: "Page Layout",
      icon: LayoutGrid,
      count: layoutSections.length,
      color: "border-green-500",
    },
  ];

  // Show right panel?
  const showRightPanel =
    (activeTab === "fields" && selectedField) ||
    (activeTab === "relationships" && selectedRel) ||
    (activeTab === "layout" && (selectedSection || selectedLayoutTab));

  return (
    <div className="flex h-[calc(100vh-48px)] overflow-hidden">
      {/* LEFT SIDEBAR */}
      <div className="w-[220px] shrink-0 border-r border-border bg-card flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
              <SlidersHorizontal size={13} className="text-muted-foreground" />
            </div>
            <span className="font-bold text-sm">Object Manager</span>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-1.5">
          {filteredObjects.map((obj) => {
            const isActive = obj.object_key === selectedObjectKey;
            const ObjIcon = getObjectIcon(obj.icon);
            const fieldModule = OBJECT_MODULE_MAP[obj.object_key] || obj.object_key;
            const fc = fieldCounts[fieldModule] || 0;
            const rc = relationshipCounts[obj.object_key] || 0;

            return (
              <button
                key={obj.object_key}
                onClick={() => handleObjectSelect(obj.object_key)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-2 rounded-md text-left mb-0.5 transition-colors",
                  isActive
                    ? "bg-muted"
                    : "hover:bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
                    isActive ? "bg-muted" : "bg-muted/50"
                  )}
                  style={{ backgroundColor: isActive ? `${obj.color}18` : undefined }}
                >
                  <ObjIcon size={13} style={{ color: obj.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "text-xs font-medium truncate",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {obj.label}
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">
                    {fc} fields · {rc} rels
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CENTER PANEL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-3.5 py-2 border-b border-border flex items-center gap-2">
          {selectedObject && (
            <>
              {(() => {
                const OI = getObjectIcon(selectedObject.icon);
                return <OI size={15} style={{ color: selectedObject.color }} />;
              })()}
              <span className="font-bold text-sm">{selectedObject.label}</span>
              <span className="text-xs text-muted-foreground ml-0.5">
                {selectedObject.description}
              </span>
            </>
          )}
          <div className="flex-1" />
          <Button size="sm" className="h-8 gap-1.5">
            <Check size={13} />
            Publish
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-3.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium transition-colors border-b-2",
                  isActive
                    ? `text-foreground ${tab.color}`
                    : "text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                <TabIcon size={13} />
                {tab.label}
                <span
                  className={cn(
                    "text-[9px] font-semibold px-1.5 rounded-full",
                    isActive ? "bg-muted text-muted-foreground" : ""
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "fields" && (
            <FieldsTab
              fields={fields}
              selectedFieldId={selectedField?.id ?? null}
              onSelectField={(f) => {
                clearSelection();
                setSelectedField(f);
              }}
              loading={loading}
              objectKey={selectedObjectKey}
              onFieldsChange={loadData}
            />
          )}
          {activeTab === "relationships" && (
            <RelationshipsTab
              objectKey={selectedObjectKey}
              relationships={relationships}
              roles={roles}
              objects={objects}
              selectedRelId={selectedRel?.id ?? null}
              onSelectRel={(r) => {
                clearSelection();
                setSelectedRel(r);
              }}
              loading={loading}
            />
          )}
          {activeTab === "layout" && (
            <LayoutTab
              objectKey={selectedObjectKey}
              sections={layoutSections}
              layoutFields={layoutFields}
              fields={fields}
              relationships={relationships}
              relatedFields={relatedFields}
              objects={objects}
              onSelectSection={(s) => {
                setSelectedSection(s);
                setSelectedLayoutTab(null);
              }}
              onSelectTab={(t) => {
                setSelectedLayoutTab(t);
                setSelectedSection(null);
              }}
              onLayoutChange={loadData}
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        className={cn(
          "shrink-0 border-l border-border bg-card flex flex-col overflow-hidden transition-all duration-150",
          showRightPanel ? "w-[310px]" : "w-0 border-l-0"
        )}
      >
        {activeTab === "fields" && selectedField && (
          <FieldConfigPanel
            field={selectedField}
            onClose={clearSelection}
            onUpdate={(updated) => {
              setSelectedField(updated);
              loadData();
            }}
          />
        )}
        {activeTab === "relationships" && selectedRel && (
          <RelationshipConfigPanel
            relationship={selectedRel}
            roles={roles.filter((r) => r.relationship_id === selectedRel.id)}
            objects={objects}
            onClose={clearSelection}
            onUpdate={loadData}
          />
        )}
        {activeTab === "layout" && selectedSection && (
          <SectionConfigPanel
            section={selectedSection}
            onClose={clearSelection}
            onUpdated={() => {
              loadData();
            }}
          />
        )}
        {activeTab === "layout" && selectedLayoutTab && (
          <TabConfigPanel
            tab={selectedLayoutTab}
            onClose={clearSelection}
          />
        )}
        {!showRightPanel && (
          <div className="flex flex-col items-center justify-center p-7 gap-2 h-full">
            <Settings2 size={32} className="text-muted-foreground" strokeWidth={1} />
            <span className="font-semibold text-sm">Configuration</span>
            <span className="text-xs text-muted-foreground text-center leading-relaxed">
              {activeTab === "fields" && "Select a field to configure type, validation, permissions, logic, and stage gating."}
              {activeTab === "relationships" && "Select a relationship to configure roles, inherited fields, quick-create, and schema."}
              {activeTab === "layout" && "Click a section or tab to configure display settings, fields, and column layout."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
