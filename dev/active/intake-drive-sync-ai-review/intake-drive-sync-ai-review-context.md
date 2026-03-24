# Intake Drive Sync + AI Review - Context

## Key Files
- `apps/requity-os/app/(authenticated)/(admin)/pipeline/actions.ts` - resolveIntakeItemAction (lines 1050-1266)
- `apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/actions.ts` - saveDealDocumentRecord (lines 430-489)
- `packages/db/supabase/functions/create-deal-drive-folder/index.ts` - Edge function for folder creation
- `packages/db/supabase/functions/sync-document-to-drive/index.ts` - Edge function for doc sync
- `apps/requity-os/components/pipeline/tabs/DiligenceTab.tsx` - Document UI with AI review buttons
- `apps/requity-os/components/pipeline/ReviewStatusBadge.tsx` - Badge rendering (returns null for null status)

## Decisions Made
- Backfill approach: call sync-document-to-drive for each doc (reuses existing logic, no new code paths)
- review_status: set to "pending" at insert time (matches pattern used by saveDealDocumentRecord)

## Gotchas Discovered
- review_status defaults to NULL in DB, not "pending"
- ReviewStatusBadge returns null for null status, so no UI renders at all
- sync-document-to-drive is only called from saveDealDocumentRecord, never from intake flow

## Last Updated: 2026-03-20
## Next Steps: Implement both fixes
