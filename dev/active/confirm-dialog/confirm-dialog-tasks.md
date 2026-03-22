# ConfirmDialog — Tasks

## Phase 1: Create Hook and Provider
- [ ] Create `components/shared/ConfirmDialog.tsx`
- [ ] Add `<ConfirmProvider>` to authenticated layout
- [ ] Run `pnpm build`

## Phase 2: Delete Standalone Dialog Components
- [ ] Find all imports of delete-contact-button, delete-company-button, document-delete-dialog, delete-confirm-dialog
- [ ] Delete 4 standalone files
- [ ] Update parent components to use useConfirm()
- [ ] Run `pnpm build`

## Phase 3: Replace Inline AlertDialogs — Destructive
- [ ] contacts-view.tsx, companies-view.tsx
- [ ] borrower-entity-list.tsx, quote-detail-client.tsx
- [ ] stages-tab.tsx, rules-tab.tsx
- [ ] condition-category-section.tsx, TemplateListPage.tsx, users-client.tsx
- [ ] DealTeamSection.tsx, SectionsEditor.tsx
- [ ] SectionConfigPopover.tsx, TabManager.tsx
- [ ] task-split-panel.tsx, task-sheet.tsx
- [ ] recurring-templates-table.tsx, routing-rules-manager.tsx
- [ ] Run `pnpm build`

## Phase 4: Replace Non-Destructive Confirmations
- [ ] email-composer-shell.tsx
- [ ] task-split-panel.tsx (submit for approval)
- [ ] task-sheet.tsx (submit for approval)
- [ ] approval-drawer.tsx
- [ ] approval-detail-view.tsx
- [ ] users-client.tsx (grant super admin)
- [ ] Run `pnpm build`

## Phase 5: Cleanup
- [ ] Update CLAUDE.md
- [ ] document-templates-view.tsx, template-editor-client.tsx (check if simple confirm)
- [ ] Final `pnpm build` + `pnpm lint`

## Blockers
- None

## Last Updated: 2026-03-21
