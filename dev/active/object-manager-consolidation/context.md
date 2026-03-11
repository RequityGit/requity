# Object Manager Consolidation - Context

## Key Files
- `apps/requity-os/app/(authenticated)/control-center/object-manager/` - All Object Manager UI
- `apps/requity-os/app/(authenticated)/control-center/object-manager/actions.ts` - Server actions (1100+ lines)
- `apps/requity-os/lib/visibility-engine.ts` - Conditional visibility evaluator (not wired into runtime yet)
- `apps/requity-os/app/(authenticated)/control-center/card-types/` - Separate, no overlap

## Decisions Made
- Three efforts merged into one: Object Manager at /control-center/object-manager is the single system
- Field Manager and Page Manager were already deleted (by "central" effort)
- Card Types stays separate (different concern: pipeline UW vs detail page layouts)
- Tab mutations work by updating tab_* columns on page_layout_sections rows
- Adding a tab creates an initial "fields" section inside it

## Architecture
- Tabs are not their own DB rows; they are derived from tab_key/tab_label/tab_icon/tab_order/tab_locked columns on page_layout_sections
- updateTab() updates all sections with matching page_type + tab_key
- deleteTab() deletes all sections in that tab (cascade deletes field assignments via FK)

## Gotchas Discovered
- TabConfigPanel originally had no mutation props (onUpdated, pageType) - had to update ObjectManagerView to pass them
- Section name was readOnly - now uses debounced local state to save

## Dependencies
- page_layout_sections + page_layout_fields tables
- field_configurations table
- Detail pages consume page_layout_sections directly (not via hooks)

## Last Updated: 2026-03-11
## Next Steps: Runtime visibility wiring (separate task) - connect visibility-engine.ts to pipeline deal rendering
