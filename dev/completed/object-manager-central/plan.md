# Object Manager as Central Source of Truth - Implementation Plan

## Objective
Make the Object Manager the single admin for objects, fields, relationships, and page layouts by deleting the redundant Field Manager and Page Manager, and wiring up the Layout tab to be fully functional.

## Scope
- IN: Delete Field Manager, delete Page Manager, wire up Layout tab save/publish, add sidebar indicators, update nav
- OUT: Card Type Manager (stays as-is), refactoring contact/company detail pages to be fully layout-driven (tabs are still hardcoded for now)

## Approach

### Phase 1: Delete old managers + update nav
- Remove field-manager route (3 files)
- Remove page-manager route (6 files + shared actions)
- Remove nav entries for field-manager, page-manager-contacts, page-manager-companies
- Remove unused imports from nav.ts

### Phase 2: Port server actions to Object Manager
- Add layout mutation actions to object-manager/actions.ts: updateSection, addSection, deleteSection, publishLayout, reorderSections
- Update revalidation paths to point to object-manager + detail pages

### Phase 3: Wire up Layout tab UI
- SectionConfigPanel: add sidebar indicator, section_type "system" option, wire onChange handlers for all toggles
- LayoutTab: wire "Add Section" button, section reordering
- Add save/auto-save pattern for section config changes

## Files to Modify
- DELETE: app/(authenticated)/control-center/field-manager/* (3 files)
- DELETE: app/(authenticated)/control-center/page-manager/* (6 files)
- EDIT: app/(authenticated)/control-center/_config/nav.ts
- EDIT: app/(authenticated)/control-center/object-manager/actions.ts
- EDIT: app/(authenticated)/control-center/object-manager/_components/SectionConfigPanel.tsx
- EDIT: app/(authenticated)/control-center/object-manager/_components/LayoutTab.tsx
- EDIT: app/(authenticated)/control-center/object-manager/ObjectManagerView.tsx

## Database Changes
None - using existing page_layout_sections + page_layout_fields tables.

## Risks
- Imports from deleted managers referenced elsewhere (unlikely, they're self-contained routes)
- Build errors from stale references

## Success Criteria
- Field Manager and Page Manager routes deleted
- Nav only shows Object Manager + Card Types in Page Layouts group
- Clicking a section in Layout tab shows sidebar/system indicators
- Config panel changes (visibility, collapsed, etc.) persist to database
- pnpm build passes cleanly
