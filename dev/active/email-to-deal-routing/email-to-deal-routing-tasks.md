# Email-to-Deal Routing - Tasks

## Phase 1: Enhanced Matching Engine - COMPLETED
- [x] Add `auto_matched_deal_id`, `match_confidence`, `match_details` to `intake_items`
- [x] Update `process-intake-email` with enhanced `matchDeal` function
- [x] Match by: sender -> contact -> deal linkage
- [x] Match by: deal name in subject/body
- [x] Match by: deal number in subject/body
- [x] Score and rank matches, pick best above threshold (0.8 for auto_matched)
- [x] Update intake_items with match result and confidence
- [x] Deploy updated process-intake-email

## Phase 2: Merge Safeguards - COMPLETED
- [x] Add `deal_id`, `source`, `google_drive_file_id`, `google_drive_url` to `documents`
- [x] Add `google_drive_folder_id`, `google_drive_folder_url` to `unified_deals`
- [x] Create `previewMergeToDeal` action (compare incoming vs existing deal fields)
- [x] Implement three-state field comparison (auto_fill / skip / conflict / match)
- [x] Create `mergeToDealAction` with safeguarded merge (only accepted fields applied)
- [x] Update IntakeReviewSheet with "Attach to Deal" flow: deal search + diff view
- [x] Log all changes to `unified_deal_activity` with before/after metadata
- [x] Generate AI summary note on merge completion (insert into `notes`)
- [x] Move attachments to deal folder on merge

## Phase 3: Dual Storage (Google Drive) - IN PROGRESS
- [x] Schema: `google_drive_folder_id/url` added to `unified_deals`
- [x] Edge function `create-deal-drive-folder/index.ts` written
- [ ] Deploy edge function (blocked on GCP creds)
- [ ] Dylan: Create GCP service account + enable Drive API
- [ ] Dylan: Create parent folder, share with service account email
- [ ] Set GDRIVE_SERVICE_ACCOUNT_EMAIL, GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY, GDRIVE_PARENT_FOLDER_ID as edge function secrets
- [ ] Auto-create GDrive folder on deal creation (hook into createUnifiedDealAction)
- [ ] Update document upload flow to push to both Supabase Storage + GDrive
- [ ] Add GDrive folder link to deal detail page UI

## Phase 4: Email Attachment Auto-Filing - PENDING
- [ ] Add attachment download logic to fetch-intake-emails (Gmail API attachment endpoint)
- [ ] Upload downloaded attachments to Supabase Storage under deal folder
- [ ] Upload to Google Drive folder
- [ ] Create `documents` records with deal_id
- [ ] AI categorization of document type
- [ ] Deploy updated fetch-intake-emails

## Blockers
- Phase 3 requires: GCP service account, Drive API enabled, parent folder shared
- Phase 4 depends on Phase 3 completion

## Last Updated: 2026-03-13
