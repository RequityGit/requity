# Object Manager Consolidation - Plan

## Objective
Merge three overlapping Object Manager efforts (original, revamp, central) into one coherent system that powers field_configurations at runtime. Remove dead code and clean up stale dev docs.

## Scope
- IN: Wire remaining Layout tab UI stubs, complete TabConfigPanel, enable section name editing, add tab CRUD server actions, archive old dev docs
- OUT: Runtime visibility wiring (separate task), Card Types (separate system), Create/Table layout editors, formula evaluation, intake form UI

## Approach
1. Add missing tab mutation server actions (addTab, updateTab, deleteTab)
2. Wire Add Section and Add Tab buttons with dialogs
3. Enable section name editing in SectionConfigPanel
4. Complete TabConfigPanel with all interactive controls
5. Move three old dev doc folders to dev/completed/
6. Build verification

## Files Modified
- `apps/requity-os/app/(authenticated)/control-center/object-manager/actions.ts` - Added 3 tab server actions
- `apps/requity-os/app/(authenticated)/control-center/object-manager/_components/LayoutTab.tsx` - Wired Add Section + Add Tab buttons with dialogs
- `apps/requity-os/app/(authenticated)/control-center/object-manager/_components/SectionConfigPanel.tsx` - Section name now editable with debounced save
- `apps/requity-os/app/(authenticated)/control-center/object-manager/_components/TabConfigPanel.tsx` - All controls now interactive (label, icon, locked, add section, remove tab)
- `apps/requity-os/app/(authenticated)/control-center/object-manager/ObjectManagerView.tsx` - Pass pageType and onUpdated to TabConfigPanel

## Success Criteria
- pnpm build passes
- All Layout tab buttons functional
- TabConfigPanel fully interactive
- Three old dev doc folders archived
