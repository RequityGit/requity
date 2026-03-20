# Email-to-Deal Routing - Context

## Key Files
- `packages/db/supabase/functions/process-intake-email/index.ts` - processes intake queue items, runs matching
- `packages/db/supabase/functions/fetch-intake-emails/index.ts` - polls Gmail, extracts with Claude, inserts queue
- `apps/requity-os/app/(authenticated)/admin/pipeline-v2/actions.ts` - resolveIntakeItemAction, processIntakeItemAction
- `apps/requity-os/components/pipeline-v2/IntakeReviewSheet.tsx` - intake review UI
- `apps/requity-os/lib/document-upload-utils.ts` - buildStoragePath helper

## Key Tables
- `email_intake_queue` - raw email data + extraction
- `intake_items` - structured parsed data + match results
- `unified_deals` - deal records (has `name`, `primary_contact_id`, `company_id`, `property_id`, `uw_data`)
- `unified_deal_activity` - activity log (deal_id, activity_type, title, description, metadata)
- `notes` - notes system (has `deal_id`, `body`, `author_id`, `is_internal`)
- `documents` - document metadata (has `loan_id` but needs `deal_id`)
- `crm_contacts` - contacts (matched by email)
- `crm_companies` - companies
- `properties` - properties (matched by address)

## Decisions Made
- Use same intake@ email for both new deals and existing deal updates
- Matching confidence threshold: 0.8 for auto-match, below that stays as pending intake
- Never overwrite existing deal data, only fill gaps. Conflicts require human confirmation.
- Dual storage: both Supabase Storage AND Google Drive for every document
- Google Drive folder created lazily (on first doc or when deal is created)

## Gotchas Discovered
- `documents` table has `loan_id` but no `deal_id` - need migration
- `unified_deals` has no Google Drive folder columns yet
- Edge function secrets use `GMAIL_REFRESH_TOKEN` (not `GMAIL_INTAKE_REFRESH_TOKEN`)
- Google Drive integration needs either service account or OAuth with drive.file scope

## Dependencies
- Depends on: working email intake system (completed)
- Google Drive API must be enabled in GCP project
- Google Drive credentials (service account or OAuth) needed for Phase 3

## Last Updated: 2026-03-13
## Next Steps: Start Phase 1 - enhanced matching in process-intake-email
