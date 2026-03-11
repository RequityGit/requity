# Object Manager Central - Context

## Key Files
- `app/(authenticated)/control-center/object-manager/actions.ts` - Server actions (fields CRUD + layout read)
- `app/(authenticated)/control-center/object-manager/ObjectManagerView.tsx` - Main 3-panel view
- `app/(authenticated)/control-center/object-manager/_components/LayoutTab.tsx` - Layout canvas
- `app/(authenticated)/control-center/object-manager/_components/SectionConfigPanel.tsx` - Section config (read-only currently)
- `app/(authenticated)/control-center/page-manager/actions.ts` - HAS the publish/add/delete actions we need to port
- `app/(authenticated)/control-center/_config/nav.ts` - Control center sidebar nav

## Decisions Made
- Field Manager deleted: Object Manager Fields tab is a superset
- Page Manager deleted: Object Manager Layout tab will absorb all functionality
- Card Type Manager kept: separate concern, no overlap

## Gotchas Discovered
- SectionConfigPanel has no onChange handlers - all toggles are display-only
- LayoutTab "Add Section" and "Drop field" buttons have no onClick
- Page Manager's publishPageLayout does a full delete+reinsert of field assignments
- page_layout_sections has no section_type or tab columns in the migration - those were added later or are only in the Object Manager types

## Dependencies
- page_layout_sections + page_layout_fields tables (already exist)
- field_configurations table (already exists)
- Contact/company detail pages consume page_layout_sections for Overview tab rendering

## Last Updated: 2026-03-10
## Next Steps: Phase 1 - delete old managers and update nav
