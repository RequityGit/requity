"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Save, X, Plus, Loader2, Network } from "lucide-react";
import { toast } from "sonner";
import { useInlineLayout } from "./InlineLayoutContext";
import { TabManager } from "./TabManager";
import { InlineRelationshipDialog } from "./InlineRelationshipDialog";
import {
  reorderLayoutSections,
  reorderLayoutFields,
  addFieldToLayout,
  removeLayoutField,
  updateLayoutFieldSpan,
  addSection,
} from "@/app/(authenticated)/control-center/object-manager/actions";
import type { DealLayoutTab } from "@/hooks/useDealLayout";

interface InlineLayoutToolbarProps {
  onSaveComplete: () => void;
  tabs?: DealLayoutTab[];
  pageType?: string;
}

export function InlineLayoutToolbar({ onSaveComplete, tabs, pageType = "deal_detail" }: InlineLayoutToolbarProps) {
  const { state, cancelEditing, getPendingChanges, addNewSection, activeTabKey } = useInlineLayout();
  const [saving, startSave] = useTransition();
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState("");

  if (!state.isEditing) return null;

  function handleCancel() {
    cancelEditing();
  }

  function handleSave() {
    startSave(async () => {
      try {
        const changes = getPendingChanges();
        const promises: Promise<unknown>[] = [];

        // 1. Add new sections first (so they get real IDs)
        for (const sec of changes.addedSections) {
          promises.push(
            addSection({
              page_type: sec.page_type,
              section_key: sec.section_key,
              section_label: sec.section_label,
              sidebar: false,
              section_type: "fields",
              tab_key: sec.tab_key === "overview" ? undefined : sec.tab_key,
              tab_label: sec.tab_label,
            })
          );
        }
        if (promises.length > 0) {
          await Promise.all(promises);
          promises.length = 0;
        }

        // 2. Remove fields
        for (const id of changes.removedFieldIds) {
          promises.push(removeLayoutField(id));
        }
        if (promises.length > 0) {
          await Promise.all(promises);
          promises.length = 0;
        }

        // 3. Add new fields
        for (const field of changes.addedFields) {
          promises.push(
            addFieldToLayout({
              section_id: field.section_id,
              field_config_id: field.field_config_id,
              field_key: field.field_key,
              display_order: field.display_order,
              column_span: field.column_span,
            })
          );
        }
        if (promises.length > 0) {
          await Promise.all(promises);
          promises.length = 0;
        }

        // 4. Update field spans
        for (const { id, column_span } of changes.updatedSpans) {
          promises.push(updateLayoutFieldSpan(id, column_span));
        }
        if (promises.length > 0) {
          await Promise.all(promises);
          promises.length = 0;
        }

        // 5. Reorder sections
        if (changes.reorderedSections.length > 0) {
          await reorderLayoutSections(changes.reorderedSections);
        }

        // 6. Reorder fields
        if (changes.reorderedFields.length > 0) {
          await reorderLayoutFields(changes.reorderedFields);
        }

        toast.success("Layout saved");
        cancelEditing();
        onSaveComplete();
      } catch (err) {
        toast.error(`Failed to save layout: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  }

  function handleAddSection() {
    if (!newSectionLabel.trim()) return;
    addNewSection(activeTabKey, newSectionLabel.trim());
    setNewSectionLabel("");
    setAddSectionOpen(false);
    toast.success(`Section "${newSectionLabel.trim()}" added`);
  }

  return (
    <>
      <div className="sticky top-0 z-50 mb-4 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2 flex-1">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">Editing Layout</span>
          {state.hasChanges && (
            <span className="text-xs text-muted-foreground">(unsaved changes)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {tabs && (
            <TabManager
              tabs={tabs}
              pageType={pageType}
              onTabsChanged={onSaveComplete}
            />
          )}
          <InlineRelationshipDialog pageType={pageType}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
            >
              <Network className="h-3 w-3" />
              Relationships
            </Button>
          </InlineRelationshipDialog>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setAddSectionOpen(true)}
          >
            <Plus className="h-3 w-3" />
            Section
          </Button>
          <div className="w-px h-5 bg-border" />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleCancel}
            disabled={saving}
          >
            <X className="h-3 w-3" />
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleSave}
            disabled={saving || !state.hasChanges}
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            Save Layout
          </Button>
        </div>
      </div>

      <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Section</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium mb-1.5 block">Section Name</label>
            <Input
              value={newSectionLabel}
              onChange={(e) => setNewSectionLabel(e.target.value)}
              placeholder="e.g. Loan Terms"
              onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSectionOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSection} disabled={!newSectionLabel.trim()}>
              Add Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
