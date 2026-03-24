# Email-to-Deal Routing - Implementation Plan

## Objective
Extend the email intake system so forwarded emails can be intelligently routed to existing deals (not just create new intake items), with dual document storage (Supabase + Google Drive), merge safeguards, and AI-generated activity notes.

## Scope
- IN: Enhanced matching engine, auto-match to existing deals, merge safeguards with conflict detection, dual storage (Supabase Storage + Google Drive folders per deal), email attachment auto-filing, AI summary notes on merge
- OUT: Real-time email push (staying with 2-min polling), email sending/reply from RequityOS, Google Drive migration of existing documents

## Approach

### Phase 1: Enhanced Matching Engine
- Upgrade `process-intake-email` edge function to score matches against existing `unified_deals`
- Match by: sender email -> contact -> deal, property address, deal name, borrower name
- Add `auto_matched_deal_id` and `match_confidence` to `intake_items`
- If confidence > 0.8, mark as `auto_matched` status instead of `pending`

### Phase 2: Merge Safeguards
- Add `deal_id` column to `documents` table
- Create merge review UI showing side-by-side diff (current deal vs incoming data)
- Three field states: auto-fill (deal field empty), skip (values match), conflict (both have different values)
- All changes logged to `unified_deal_activity` with before/after in metadata
- AI summary note inserted into `notes` table on merge completion

### Phase 3: Dual Storage (Google Drive + Supabase)
- Add `google_drive_folder_id` and `google_drive_folder_url` to `unified_deals`
- Create `create-deal-drive-folder` edge function using Google Drive API
- On deal creation or first document upload, auto-create GDrive folder
- Document uploads go to both Supabase Storage and Google Drive
- GDrive shareable link visible on deal detail page
- Requires: Google Drive API enabled, service account with domain-wide delegation OR OAuth with drive scope

### Phase 4: Email Attachment Auto-Filing
- When intake is matched/merged to a deal, download attachments via Gmail API
- Upload to both storage layers under the deal's folder
- Create `documents` records linked to the deal
- AI categorizes document type (term sheet, insurance, appraisal, etc.)

## Files to Modify

### Database
- Migration: add `auto_matched_deal_id`, `match_confidence` to `intake_items`
- Migration: add `deal_id` to `documents`
- Migration: add `google_drive_folder_id`, `google_drive_folder_url` to `unified_deals`

### Edge Functions
- `packages/db/supabase/functions/process-intake-email/index.ts` - enhanced matching
- `packages/db/supabase/functions/fetch-intake-emails/index.ts` - attachment download
- NEW: `packages/db/supabase/functions/create-deal-drive-folder/index.ts`

### UI Components
- `apps/requity-os/components/pipeline-v2/IntakeReviewSheet.tsx` - merge diff view
- `apps/requity-os/app/(authenticated)/admin/pipeline-v2/actions.ts` - merge action with safeguards
- Deal detail page - GDrive folder link

## Risks
- Google Drive API quota limits (mitigated by batching)
- AI matching false positives routing to wrong deal (mitigated by confidence threshold + human review)
- Merge conflicts silently overwriting data (mitigated by never-overwrite-only-fill-gaps + conflict flagging)

## Success Criteria
- Forwarded emails about existing deals auto-match and show suggested deal
- Merge review shows clear diff with conflict highlighting
- Every merge creates an audit trail + AI summary note
- Each deal has a Google Drive folder with shareable link
- Attachments auto-filed to correct deal folder in both storage layers
