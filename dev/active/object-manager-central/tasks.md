# Object Manager Central - Tasks

## Phase 1: Delete old managers + update nav
- [ ] Delete field-manager route files
- [ ] Delete page-manager route files
- [ ] Update nav.ts to remove old entries
- [ ] Verify no other imports reference deleted files

## Phase 2: Port server actions
- [ ] Add updateSection action to object-manager/actions.ts
- [ ] Add addSection action
- [ ] Add deleteSection action
- [ ] Add reorderSections action
- [ ] Update revalidation paths

## Phase 3: Wire up Layout tab UI
- [ ] Add sidebar indicator + system type to SectionConfigPanel
- [ ] Wire onChange handlers for visibility, collapsed, section_type toggles
- [ ] Wire "Add Section" button in LayoutTab
- [ ] Wire delete button in SectionConfigPanel
- [ ] Add success/error feedback (toast)

## Phase 4: Build + verify
- [ ] pnpm build passes
- [ ] Manual verification checklist

## Last Updated: 2026-03-10
