# Inline Editor V2 - Context

## Key Files
- `components/inline-layout-editor/InlineLayoutContext.tsx` - Central state management
- `components/inline-layout-editor/InlineLayoutToolbar.tsx` - Toolbar with save/cancel
- `components/inline-layout-editor/EditableSection.tsx` - Section wrapper with move arrows
- `components/inline-layout-editor/EditableFieldSlot.tsx` - Field wrapper with controls
- `components/inline-layout-editor/FieldPicker.tsx` - Add existing field popover
- `app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage.tsx` - Deal page with tab bar
- `app/(authenticated)/control-center/object-manager/actions.ts` - All server actions (reused)
- `app/(authenticated)/control-center/object-manager/_components/constants.ts` - FIELD_TYPES

## Server Actions Available (from object-manager/actions.ts)
- `updateSection(sectionId, updates)` - rename, icon, visibility, etc.
- `deleteSection(sectionId)` - delete section + cascade fields
- `addTab({ page_type, tab_key, tab_label, tab_icon })` - create tab
- `updateTab(pageType, tabKey, { tab_label, tab_icon, tab_locked })` - rename/icon
- `deleteTab(pageType, tabKey)` - delete tab + cascade sections
- `createField({ module, field_key, field_label, field_type, ... })` - new field
- `updateFieldConfig(fieldId, updates)` - edit field properties
- All layout actions already used by toolbar (reorder, add, remove, span)

## Decisions Made
- Section config uses Popover (not modal) for quick inline editing
- Field config uses Popover on field label click
- Tab management integrates into the toolbar area + tab bar itself
- Create Field uses Dialog (more fields to fill)
- Changes to section/field config are saved IMMEDIATELY (not batched) since they affect global definitions
- Layout changes (position, span, add/remove) remain batched as today

## Last Updated: 2026-03-14
## Next Steps: Build Phase 1 (section config popover)
