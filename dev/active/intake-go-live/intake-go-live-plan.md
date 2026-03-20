# Email Intake Go-Live - Implementation Plan

## Objective
Fix all critical bugs preventing the email intake pipeline from working end-to-end, then harden the system so no data is ever lost when broker emails are forwarded to intake@requitygroup.com.

## Scope
- IN: Bug fixes in edge functions, storage bucket alignment, Gmail pagination, UI hardening (editable UW fields, catch-all notes, raw email visibility)
- OUT: New intake_items kanban integration, Google Drive sync, Make.com webhook path, auto-deal-creation without human review

## Approach

### Phase 1: Fix Critical Bugs
1. New migration: Expand intake_items status CHECK to include 'auto_matched' and 'merged'
2. Fix storage bucket: Change fetch-intake-emails to upload to 'loan-documents' (matching resolveIntakeItemAction)
3. Add Gmail pagination loop with nextPageToken handling

### Phase 2: Verify Deployment
1. Check edge function secrets
2. Verify cron job is active
3. Check storage bucket exists
4. Verify unified_card_types has rows

### Phase 3: Harden "Nothing Gets Lost"
1. Make UW fields editable in IntakeReviewSheet
2. Add catch-all notes on deal creation (dump all extracted fields not mapped to deal columns)
3. Surface attachment upload failures in the UI

## Files to Modify
- packages/db/supabase/functions/fetch-intake-emails/index.ts (bucket fix, pagination)
- packages/db/supabase/functions/process-intake-email/index.ts (no changes needed after migration)
- packages/db/supabase/migrations/NEW_expand_intake_status.sql
- apps/requity-os/components/pipeline/IntakeReviewSheet.tsx (editable UW fields)
- apps/requity-os/app/(authenticated)/(admin)/pipeline/actions.ts (catch-all notes)

## Risks
- Gmail OAuth token may need re-auth if expired
- Storage bucket 'loan-documents' may not exist (need to verify)
- unified_card_types having 0 rows blocks deal creation

## Success Criteria
- Forward email to intake@ -> appears in queue within 2 minutes
- All attachments stored and downloadable
- All extracted fields visible and editable
- Deal creation works with documents linked
- Unmapped fields dumped into deal notes
