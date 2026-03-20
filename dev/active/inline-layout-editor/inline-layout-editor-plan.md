# Inline Layout Editor - Implementation Plan

## Objective
Add an inline "Edit Layout" mode directly on the deal detail page so admins can rearrange fields, add/remove fields, reorder sections, and manage cross-object fields without leaving the page they're editing.

## Scope
- IN: Inline layout editor overlay on deal detail page (all field-type tabs: Overview, Property, Underwriting, Borrower)
- IN: Drag-and-drop reordering of fields within sections
- IN: Drag-and-drop reordering of sections within tabs
- IN: Add field picker grouped by object (deal, property, borrower)
- IN: Remove field from section
- IN: Change field column span (full/half/third/quarter)
- IN: Add new section to a tab
- IN: Cross-object field support (show property fields on overview tab, etc.)
- OUT: Creating new field definitions (stays in Object Manager)
- OUT: Condition Matrix editing (stays in Object Manager)
- OUT: Formula field creation (stays in Object Manager)
- OUT: Contact/Company/Loan detail pages (future phases)

## Approach

### Phase 1: Core Inline Editor
1. Create `InlineLayoutEditor` context provider that wraps deal detail content
2. Add "Edit Layout" toggle button in deal header (super_admin only)
3. When active, overlay drag handles on existing sections and fields
4. Add field picker sidebar/popover grouped by module
5. Wire save to existing Object Manager server actions (reorderLayoutSections, reorderLayoutFields, addFieldToLayout, removeLayoutField, updateLayoutFieldSpan, addSection)
6. Add visual indicators: dashed borders on sections, drag handles, remove buttons, span controls

### Phase 2: Cross-Object Field Support
1. Field picker shows fields grouped by object: "Deal Fields", "Property Fields", "Borrower Fields"
2. When adding a cross-object field, set source_object_key appropriately
3. PropertyTab and other tabs use the same inline editor overlay
4. Tab-aware editing: field picker filters to relevant module based on active tab

## Files to Modify
- `DealDetailPage.tsx` - Add edit mode toggle, wrap with context provider
- `EditableOverview.tsx` - Add edit mode overlay (drag handles, controls)
- `components/pipeline/tabs/PropertyTab.tsx` - Add edit mode overlay
- NEW: `components/inline-layout-editor/InlineLayoutContext.tsx` - Context + state
- NEW: `components/inline-layout-editor/InlineLayoutToolbar.tsx` - Top bar with save/cancel
- NEW: `components/inline-layout-editor/FieldPicker.tsx` - Field picker popover
- NEW: `components/inline-layout-editor/EditableSection.tsx` - Section wrapper with controls
- NEW: `components/inline-layout-editor/EditableFieldSlot.tsx` - Field wrapper with controls
- `hooks/useDealLayout.ts` - Add refetch capability

## Database Changes
None. Uses existing page_layout_sections and page_layout_fields tables via existing server actions.

## Risks
- DnD complexity: dnd-kit is already in the project, reuse patterns from LayoutTab.tsx
- Performance: editing overlay adds DOM, but only when edit mode is active
- Concurrent edits: unlikely given super_admin only, but worth noting

## Success Criteria
- Admin can toggle edit mode on deal detail page
- Can drag fields to reorder within a section
- Can drag sections to reorder within a tab
- Can add fields from picker (grouped by object)
- Can remove fields
- Can change field span
- Can add new sections
- Save persists to DB and renders immediately
- Cancel discards unsaved changes
- Non-edit mode is completely unaffected (zero visual/performance impact)
