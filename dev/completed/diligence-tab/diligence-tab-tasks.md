# Diligence Tab - Tasks

## Phase 1: DiligenceTab Shell + Compact Document List
- [x] Create `DiligenceTab.tsx` component with Documents section
- [x] Port upload functionality (drag-drop, file input, signed URLs)
- [x] Port document actions (delete, download, visibility toggle, AI review trigger)
- [x] Restyle to compact collapsible-category layout
- [x] Add search bar for document filtering
- [x] Add archive toggle (UI only, wire action in Phase 3)
- [x] Integrate DocumentReviewPanel and useDocumentReviewStatus

## Phase 2: Port Conditions Section
- [x] Port conditions rendering with collapsible category groups
- [x] Port status update workflow (select dropdown, transition)
- [x] Port ConditionNoteThread with mention support
- [x] Port condition document upload (upload to specific condition)
- [x] Port condition document view/download
- [x] Add progress bar + status stats (from concept JSX)
- [x] Port borrower assignment, critical path badges
- [x] Port phase filter (Processing / Post-Closing)

## Phase 3: New Features
- [x] Create migration: add `archived_at` to `unified_deal_documents`
- [x] Wire archive toggle to action (archive/unarchive documents via client supabase)
- [x] Build doc-to-condition linking UI (searchable dropdown on condition rows)
- [x] Build unlink UI (x button on linked doc chips)
- [x] Build pinned note editor (inline textarea with save/cancel/clear)
- [x] Wire pinned note to `internal_description` field on condition

## Phase 4: Wire into DealDetailPage
- [x] Update UNIVERSAL_TABS: remove "Conditions" and "Documents", add "Diligence"
- [x] Update imports in DealDetailPage
- [x] Update content area to render DiligenceTab
- [x] Add backward compat for ?tab=conditions and ?tab=documents -> ?tab=diligence
- [x] Pass combined props to DiligenceTab

## Phase 5: Build Check + Self-Review
- [x] Run tsc --noEmit - passes clean
- [x] Check for unused imports from old tabs - clean
- [x] Verify dark/light mode patterns (semantic colors only) - clean
- [x] Check error handling on all async operations - all have try/catch + toast
- [x] Verify no console.logs left - clean
- [x] Fix React hooks-in-loop violation (extracted ConditionRow component)

## Blockers
- None currently

## Last Updated: 2026-03-15
