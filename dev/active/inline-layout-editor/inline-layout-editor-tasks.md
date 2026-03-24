# Inline Layout Editor - Tasks

## Phase 1: Core Inline Editor
- [x] Create InlineLayoutContext (edit mode state, local layout copy, save/cancel)
- [x] Create InlineLayoutToolbar (floating bar with Save, Cancel, Add Section, Add Field)
- [x] Create EditableSection wrapper (drag handle, section controls)
- [x] Create EditableFieldSlot wrapper (drag handle, remove, span control)
- [x] Create FieldPicker (popover with grouped available fields by object)
- [x] Add refetch to useDealLayout hook
- [x] Integrate into EditableOverview with DnD context
- [x] Add Edit Layout toggle to DealDetailPage header (super_admin only)
- [x] Pass isSuperAdmin from server page to client component
- [x] Wrap DealDetailPage with InlineLayoutProvider
- [x] Run typecheck (0 errors)

## Phase 2: Cross-Object Field Support
- [x] Field picker grouped by object (Deal, Property, Borrower) with lazy loading
- [x] Integrate inline editor into PropertyTab (EditableSection + EditableFieldSlot)
- [x] PropertyTab DnD context for field/section reordering
- [x] Run typecheck (0 errors)

## Remaining (manual testing needed)
- [ ] Test drag-and-drop reorder fields on live deal page
- [ ] Test drag-and-drop reorder sections on live deal page
- [ ] Test add/remove fields via FieldPicker
- [ ] Test save/cancel flow (verify DB persistence)
- [ ] Test PropertyTab inline editing
- [ ] Test cross-object fields on Overview tab (add property field to deal overview)

## Blockers
- None

## Last Updated: 2026-03-14
