# Format Library Enforcement - Tasks

## Step 1: Expand lib/format.ts
- [ ] Add `formatDateShort`, `formatDateTime`, `formatTime`, `formatRatio`
- [ ] Add tests for new functions
- [ ] Build check

## Step 2: Kill duplicate formatDate definitions (12 files)
- [ ] SOPCard.tsx, SOPVersionHistory.tsx
- [ ] ConditionsTab.tsx, DocumentsTab.tsx, DiligenceTab.tsx
- [ ] uw-editor-client.tsx, rent-roll-version-history.tsx
- [ ] models/[type]/page.tsx, scenarios/page.tsx, scenario-header.tsx
- [ ] sop-detail-client.tsx, sop-admin-client.tsx
- [ ] Build check

## Step 3: Consolidate pipeline-types.ts
- [ ] Re-export formatCurrency/formatPercent from lib/format
- [ ] Update getCardMetricValue to use formatCompactCurrency
- [ ] Update PipelineKanban.tsx column header
- [ ] Fix formatRatio to use em dash
- [ ] Build check

## Step 4: Replace inline .toLocaleDateString() (~30 call sites)
- [ ] components/tasks/ (6 files)
- [ ] components/admin/ (7 files)
- [ ] components/pipeline/ (3 files)
- [ ] components/documents/ (3 files)
- [ ] components/operations/ (2 files)
- [ ] components/shared/, dialer/, public/, approvals/ (5 files)
- [ ] Build check

## Step 5: Replace duplicate currency formatters
- [ ] UwField.tsx, shared-field-renderer.tsx, FieldMergeRow.tsx, apply/page.tsx
- [ ] Build check

## Step 6: Update CLAUDE.md
- [ ] Add formatting rule #13

## Step 7: Final verification
- [ ] pnpm build passes
- [ ] pnpm test passes
- [ ] Grep for remaining violations

## Last Updated: 2026-03-21
