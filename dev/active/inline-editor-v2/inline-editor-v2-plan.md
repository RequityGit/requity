# Inline Editor V2 - Object Manager Replacement

## Objective
Extend the inline layout editor on deal detail pages to cover the most-used Object Manager capabilities: tab management, section configuration, inline field property editing, and quick field creation. This makes the inline editor the primary admin tool, relegating Object Manager to rare power-user tasks.

## Scope
- IN: Tab CRUD (add/rename/delete), section config (rename/icon/delete), inline field config (label/type/dropdown options), quick "Create Field" flow, updated toolbar
- OUT: Relationships, formula editor, condition matrix, stage gating, role permissions, deep validation rules (stay in Object Manager)

## Approach

### Phase 1: Section Config Panel (inline)
- When in edit mode, clicking a section label opens a small popover/panel to rename, change icon, or delete the section
- Uses existing `updateSection` and `deleteSection` server actions
- Track section renames/deletes in context for batch save

### Phase 2: Tab Management
- Add a "Manage Tabs" button to the toolbar (or show tab controls when editing)
- Tabs get rename (click label), add new tab, delete tab (non-locked), reorder
- Uses existing `addTab`, `updateTab`, `deleteTab` server actions

### Phase 3: Inline Field Config
- When in edit mode, clicking a field label opens a compact popover to edit:
  - Field label, field type, dropdown options (if dropdown), help text
- Uses existing `updateFieldConfig` server action
- Track field config changes in context for save

### Phase 4: Quick Create Field
- Enhance FieldPicker with a "+ Create New Field" button at the bottom
- Opens inline dialog: label, auto-key, type, module (deal/property/borrower)
- Creates field_configuration AND places it in the section in one flow
- Uses existing `createField` + `addFieldToLayout` server actions

## Files to Modify
- `InlineLayoutContext.tsx` - Add section rename/delete/icon tracking, tab operations, field config tracking
- `InlineLayoutToolbar.tsx` - Add tab management controls, update save logic
- `EditableSection.tsx` - Add section config popover (rename, icon, delete)
- `EditableFieldSlot.tsx` - Add field config click handler
- `FieldPicker.tsx` - Add "Create New Field" flow
- `DealDetailPage.tsx` - Add tab editing UI when in edit mode

### New Files
- `SectionConfigPopover.tsx` - Inline section editor
- `FieldConfigPopover.tsx` - Inline field property editor
- `CreateFieldDialog.tsx` - Quick field creation dialog
- `TabManager.tsx` - Tab add/rename/delete/reorder UI

## Database Changes
None - all operations use existing tables and server actions

## Risks
- Tab deletion cascades to sections/fields - need confirmation dialog
- Section deletion cascades to field placements - need confirmation
- Field label changes affect all layouts globally - need warning

## Success Criteria
- Can add/rename/delete tabs without leaving the deal page
- Can rename sections and change their icons inline
- Can edit field label, type, dropdown options by clicking the field
- Can create a brand new field and place it in one flow
- All changes persist correctly via existing server actions
- TypeScript compiles with zero errors
