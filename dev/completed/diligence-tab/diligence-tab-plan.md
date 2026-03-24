# Diligence Tab - Implementation Plan

## Objective
Merge the existing Documents tab and Conditions tab into a single "Diligence" tab on the pipeline deal detail page. The new tab features a compact, collapsible document list with archive support, conditions with progress tracking, document-to-condition linking, and pinned notes per condition. All existing features from both tabs are preserved.

## Scope
- IN: New DiligenceTab component replacing both DocumentsTab and ConditionsTab
- IN: Compact document list grouped by collapsible categories with search and archive toggle
- IN: Conditions section with all existing features (status updates, note threads, uploads, AI review)
- IN: New features: document-to-condition linking, archive/unarchive docs, pinned condition notes
- IN: DealDetailPage tab array update (remove "Conditions" and "Documents", add "Diligence")
- OUT: Right sidebar (Tasks + Notes) - future task
- OUT: Activity feed relocation to Overview - future task
- OUT: Tab count reduction beyond replacing 2 tabs with 1

## Approach

### Phase 1: DiligenceTab Component Shell + Compact Document List
Create the new `DiligenceTab.tsx` component in `components/pipeline/tabs/`.
- Port all DocumentsTab functionality into the Documents section:
  - Upload (drag-drop, file input)
  - Visibility toggle (internal/external)
  - AI document review integration
  - Delete, download, preview
  - Google Drive folder link
- Restyle to compact collapsible-category layout from concept JSX
- Add search bar for filtering documents
- Add archive toggle with `archived` field on `unified_deal_documents`

### Phase 2: Port Conditions Section
Bring all ConditionsTab functionality into the lower half of DiligenceTab:
- Phase filters (Processing / Post-Closing)
- Collapsible category groups with progress counters
- Status update workflow (pending, submitted, under_review, approved, waived, rejected, etc.)
- Condition note threads (ConditionNoteThread with mentions)
- Upload documents to conditions
- View/download condition documents
- Borrower assignment
- Critical path item badges
- Status icons and badges

### Phase 3: New Features
- **Archive**: Add `archived_at` column to `unified_deal_documents` (or use existing soft-delete `deleted_at` pattern). Toggle via action. Archived docs hidden by default, shown with muted styling when toggled.
- **Doc-to-condition linking**: Use existing `condition_id` on `unified_deal_documents` to link/unlink. Searchable dropdown popover on each condition row. Multiple docs per condition supported. Unlink removes `condition_id` without deleting doc.
- **Pinned notes**: Use existing `notes` column on conditions (or `internal_description`). Inline edit with save/cancel. Amber-tinted preview when note exists.

### Phase 4: Wire into DealDetailPage
- Update `UNIVERSAL_TABS` array: remove "Conditions" and "Documents", add "Diligence" (position after "Borrower")
- Update tab content rendering to use new DiligenceTab
- Pass combined props (documents + conditions + dealId)
- Handle backward compatibility for URL ?tab= params

### Phase 5: Build Check + Self-Review
- Run `pnpm build` to catch TypeScript errors
- Verify all imports are clean
- Check dark/light mode
- Verify no regressions on deal detail page

## Files to Modify

### New Files
- `apps/requity-os/components/pipeline/tabs/DiligenceTab.tsx` - Main new component

### Modified Files
- `apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage.tsx` - Tab array, imports, content area
- `apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/actions.ts` - Add archiveDocument, linkDocToCondition actions if needed

### Database Changes
- Add `archived_at` (timestamptz, nullable) column to `unified_deal_documents` table (migration)
- Verify `condition_id` column exists on `unified_deal_documents` (it does per research)

### Files Referenced (not modified)
- `apps/requity-os/components/pipeline/tabs/DocumentsTab.tsx` - Source for document features
- `apps/requity-os/components/pipeline/tabs/ConditionsTab.tsx` - Source for condition features
- `apps/requity-os/components/pipeline/DocumentReviewPanel.tsx` - AI review panel (reused)
- `apps/requity-os/hooks/useDocumentReviewStatus.ts` - Review polling (reused)
- `apps/requity-os/lib/document-upload-utils.ts` - Upload utilities (reused)

## Risks
- Component size: merging two large tabs could create a 1000+ line component. Mitigate by extracting sub-components (DocumentsSection, ConditionsSection).
- Archive migration: adding a column requires a migration push. Low risk since it's nullable.
- Backward compat: existing ?tab=conditions or ?tab=documents URLs need redirect to ?tab=diligence.

## Success Criteria
- [ ] Single "Diligence" tab replaces both Documents and Conditions tabs
- [ ] All existing document features work (upload, delete, AI review, visibility, preview)
- [ ] All existing condition features work (status updates, note threads, uploads, borrower assignment)
- [ ] Compact document list with collapsible categories renders correctly
- [ ] Archive toggle shows/hides archived documents
- [ ] Document-to-condition linking works via searchable dropdown
- [ ] Pinned notes editable inline on condition rows
- [ ] Progress bar and stats render for conditions
- [ ] `pnpm build` passes clean
- [ ] Light and dark mode both work
