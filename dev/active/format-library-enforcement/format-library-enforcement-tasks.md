# Format Library Enforcement - Tasks

## Step 1: Expand lib/format.ts
- [x] Add `formatDateShort`, `formatDateTime`, `formatTime`, `formatRatio`
- [x] Add tests for new functions (45 tests passing)
- [x] Build check

## Step 2: Kill duplicate formatDate definitions (12 files)
- [x] SOPCard.tsx, SOPVersionHistory.tsx
- [x] ConditionsTab.tsx, DocumentsTab.tsx, DiligenceTab.tsx
- [x] uw-editor-client.tsx, rent-roll-version-history.tsx
- [x] models/[type]/page.tsx, scenarios/page.tsx, scenario-header.tsx
- [x] sop-detail-client.tsx, sop-admin-client.tsx
- [x] Build check

## Step 3: Consolidate pipeline-types.ts
- [x] Re-export formatCurrency/formatPercent/formatRatio from lib/format
- [x] Update getCardMetricValue to use formatCompactCurrency
- [x] Update PipelineKanban.tsx column header
- [x] Fix formatRatio to use em dash
- [x] Build check

## Step 4: Replace inline .toLocaleDateString() (~40 call sites)
- [x] components/tasks/ (7 files)
- [x] components/admin/ (7 files)
- [x] components/pipeline/ (4 files)
- [x] components/documents/ (2 files)
- [x] components/operations/ (2 files)
- [x] components/shared/, dialer/, public/, approvals/, crm/ (7 files)
- [x] Second pass: forms pages, DealDetailPage, lending-pipeline-table, etc. (11 more files)
- [x] Build check

## Step 5: Replace duplicate currency formatters
- [x] FieldMergeRow.tsx (replaced Intl.NumberFormat with formatCurrency)
- [x] Build check
- Skipped (justified): UwField.tsx, shared-field-renderer.tsx, IntakeReviewModal.tsx, apply/page.tsx — these are input display formatters that format WITHOUT $ prefix or are string-to-string formatters

## Step 6: Update CLAUDE.md
- [x] Add formatting rule #13

## Step 7: Final verification
- [x] pnpm typecheck passes (0 errors, fresh build)
- [x] pnpm test passes (45 format tests)
- [x] Grep verification complete

## Remaining toLocaleDateString calls (justified exceptions)
- lib/format.ts — source of truth
- lib/comment-utils.ts, lib/notifications.ts, lib/emails/ — server-side/email contexts
- components/documents/actions.ts — uses month: "long" for document merge fields
- components/admin/commercial-uw/historicals-tab.tsx — fiscal period labels (month: "short", year: "2-digit")
- components/admin/commercial-uw/commercial-uw-client.tsx — period labels
- components/tasks/template-sheet.tsx — uses weekday: "short"
- app/(public)/upload/[token]/SecureUploadClient.tsx — public upload page
- components/pipeline/DealMessagesPanel.tsx — message-specific Today/Yesterday logic

## Last Updated: 2026-03-21
