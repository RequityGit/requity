# Borrower Diligence Portal - Tasks

## Phase 1: Live Status Dashboard
- [x] Update validate API to return document details (names, timestamps) per condition
- [x] Add progress bar component to SecureUploadClient
- [x] Add status badges per condition card
- [x] Show uploaded file history with timestamps
- [x] Smart sort conditions: needs-action first, completed collapsed at bottom
- [x] Add auto-refresh polling (60s)
- [x] Build and verify

## Phase 2: Revision Feedback Loop
- [x] Migration: add borrower_feedback + feedback_updated_at to unified_deal_conditions
- [x] Add "Request Revision" action to DiligenceTab (condition row, expanded row, doc preview modal)
- [x] Wire borrower_feedback display on upload link page
- [x] Enable re-upload on revision-requested conditions
- [x] Update pipeline-types.ts with new fields
- [x] Label changes: "Rejected"/"Denied" to "Revision Requested"/"Revision Needed"
- [x] Build and verify

## Phase 3: Automated Email Notifications
- [x] Create revision-requested email template (lib/emails/condition-notifications.ts)
- [x] Fire-and-forget email on revision request (wired into requestConditionRevision action)
- [ ] Add stale condition reminder logic (future)

## Phase 4: Staged Upload / Batch Submission
- [x] Migration: add submission_status to unified_deal_documents, borrower_comment to unified_deal_conditions
- [x] Update upload API to accept staged flag, skip auto-submit and notifications for staged
- [x] Create /api/upload-link/submit endpoint for batch submission
- [x] Update validate API to return staged docs separately (with submission_status, doc id)
- [x] Rewrite SecureUploadClient with staged upload UX (queue files, remove staged, comment, submit)
- [x] Add DELETE handler to upload route for removing staged docs
- [x] Surface borrower_comment in admin Diligence tab (expanded row, blue "Borrower Note" card)
- [x] Typecheck all changes - clean

## Blockers
- None

## Last Updated: 2026-03-15
