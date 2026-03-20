# Intake Drive Sync + AI Review - Implementation Plan

## Objective
Fix two bugs: (1) intake documents not syncing to Google Drive when folder is created, and (2) AI review buttons not appearing for intake documents.

## Scope
- IN: Fix intake doc Drive sync backfill, fix review_status on intake doc insert
- OUT: No UI changes, no schema changes, no new edge functions

## Approach

### Phase 1: Set review_status on intake documents
- In `resolveIntakeItemAction` (pipeline/actions.ts), add `review_status: "pending"` to the `unified_deal_documents` insert for intake attachments
- This ensures the AI Review button renders in DiligenceTab

### Phase 2: Backfill docs to Drive on folder creation
- In `create-deal-drive-folder` edge function, after successfully creating a new folder, query all `unified_deal_documents` for that deal where `google_drive_file_id IS NULL`
- For each, call `sync-document-to-drive` (fire-and-forget) to upload them to the new Drive folder
- This covers intake docs and any other pre-existing docs

## Files to Modify
- `apps/requity-os/app/(authenticated)/(admin)/pipeline/actions.ts` (add review_status to intake insert)
- `packages/db/supabase/functions/create-deal-drive-folder/index.ts` (add backfill step)

## Database Changes
None - review_status column already exists on unified_deal_documents

## Risks
- Backfill could be slow if many docs exist (mitigated: fire-and-forget, non-blocking)
- Edge function timeout if too many docs (mitigated: each sync is a separate call)

## Success Criteria
- Intake documents show AI Review button in DiligenceTab
- Creating a Google Drive folder syncs all existing documents to it
