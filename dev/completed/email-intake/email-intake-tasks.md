# Email Intake - Tasks

## Phase 1: Database
- [x] Create migration for `email_intake_queue` table with RLS
- [x] Push migration to Supabase
- [x] Regenerate types

## Phase 2: Gmail Sync Extension
- [x] Add `isIntakeEmail()` function
- [x] Add `downloadGmailAttachment()` helper
- [x] Add `processIntakeEmail()` function
- [x] Modify `processMessage()` to bypass external match for intake emails
- [x] Add `GmailMessagePart` attachment fields to type

## Phase 3: AI Extraction API
- [x] Create `/api/intake/process` route
- [x] Email body extraction prompt
- [x] Attachment extraction (reuse extract-from-document pattern)
- [x] Result merging logic
- [x] Card type auto-detection
- [x] Contact matching

## Phase 4: UI
- [x] Intake queue page
- [x] IntakeQueue list component
- [x] IntakeReviewSheet component
- [x] Sidebar nav item with badge

## Phase 5: Deal Resolution
- [x] `resolveIntakeItemAction` server action
- [x] Create deal flow
- [x] Attach to existing deal flow
- [x] Dismiss flow

## Phase 6: Verification
- [x] Build passes
- [x] Code shipped (merged via PRs #567, #568, #571, #577)
- [ ] Manual test flow (pending: Gmail sync cron must run to pick up intake emails)

## Phase 7: Make.com Fixes (added 2026-03-08)
- [x] Diagnose Deal Intake scenario (4578762) failures
- [x] Fix filename truncation in module 90 (Google Drive upload)
- [x] Fix JSON parsing in module 3 (robust extraction from first { to last })
- [x] Strengthen Claude system prompt for JSON-only output
- [x] Activate Deal Intake scenario
- [x] Diagnose Inbox Machine scenario (4579661) failures
- [x] Fix JSON parsing in Inbox Machine module 9
- [x] Activate Inbox Machine scenario
- [ ] Verify 772 Humble Camp deal processes through Deal Intake (post-deploy)

## Last Updated: 2026-03-09 (audit cleanup)
