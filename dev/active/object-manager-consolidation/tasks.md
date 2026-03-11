# Object Manager Consolidation - Tasks

## Phase 1: Wire Layout Tab Stubs
- [x] Add addTab, updateTab, deleteTab server actions to actions.ts
- [x] Wire "Add Section" button with dialog in LayoutTab
- [x] Wire "Add Tab" button with dialog in LayoutTab
- [x] Enable section name editing in SectionConfigPanel (debounced save)
- [x] Wire TabConfigPanel controls (label, icon, locked, add section to tab, remove tab)
- [x] Pass pageType and onUpdated props from ObjectManagerView to TabConfigPanel

## Phase 2: Clean Up Dev Docs
- [x] Move dev/active/object-manager/ to dev/completed/
- [x] Move dev/active/object-manager-revamp/ to dev/completed/
- [x] Move dev/active/object-manager-central/ to dev/completed/
- [x] Create dev/active/object-manager-consolidation/ with plan, context, tasks

## Phase 3: Verification
- [ ] pnpm build passes
- [ ] Commit and push

## Future (Separate Tasks)
- [ ] Wire visibility-engine.ts into pipeline deal rendering
- [ ] Create Form layout editor
- [ ] Table View layout editor
- [ ] Formula evaluation at runtime
- [ ] Intake form UI

## Blockers
- None

## Last Updated: 2026-03-11
