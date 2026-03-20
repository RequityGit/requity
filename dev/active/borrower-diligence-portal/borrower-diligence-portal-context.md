# Borrower Diligence Portal - Context

## Key Files

| File | Purpose |
|------|---------|
| `app/(public)/upload/[token]/SecureUploadClient.tsx` | Main borrower-facing upload page (completely rewritten with staged upload UX) |
| `app/(public)/upload/[token]/page.tsx` | Server route wrapper for upload page |
| `app/api/upload-link/validate/route.ts` | Validates token, returns link config + conditions with doc details and staged counts |
| `app/api/upload-link/upload/route.ts` | Handles file upload (POST) and staged doc removal (DELETE) |
| `app/api/upload-link/submit/route.ts` | NEW: Batch-submits staged documents for a condition |
| `components/pipeline/SecureUploadLinkDialog.tsx` | Admin UI for creating/managing upload links |
| `app/(authenticated)/(admin)/pipeline/[id]/actions.ts` | Server actions including requestConditionRevision |
| `components/pipeline/tabs/DiligenceTab.tsx` | Admin diligence tab with Request Revision flow + borrower comment display |
| `components/pipeline/pipeline-types.ts` | DealCondition interface (includes borrower_feedback, feedback_updated_at, borrower_comment) |
| `lib/constants/db-enums.ts` | CONDITION_STATUSES array ("rejected" labeled "Revision Requested") |
| `lib/emails/condition-notifications.ts` | Nodemailer-based revision request email to borrowers |

## Current Flow
1. Admin creates upload link via SecureUploadLinkDialog (checklist or general mode)
2. Link generates token-based URL: `/upload/{token}`
3. Borrower visits URL, client calls `/api/upload-link/validate` with token
4. Validate API returns: link validity, deal name, mode, conditions with full doc details (name, timestamp, staged boolean, id), staged counts, borrower_feedback
5. Borrower uploads files as "staged" (queued but not submitted)
6. Borrower can remove staged files before submission (DELETE /api/upload-link/upload)
7. Borrower clicks "Submit for Review" with optional comment, calls /api/upload-link/submit
8. Submit API: finalizes staged docs, sets condition to "submitted", saves borrower_comment, notifies deal team
9. Admin reviews in DiligenceTab, can Request Revision (sets condition to "rejected" with borrower_feedback, sends email)
10. Borrower sees revision feedback on their dashboard, re-uploads revised docs
11. 60s auto-refresh keeps borrower dashboard live

## Condition Statuses (from db-enums.ts)
pending, submitted, under_review, approved, waived, not_applicable, rejected
- "rejected" displays as "Revision Requested" (admin) / "Needs Revision" (borrower)
Legacy (not shown in UI): not_requested, requested, received

## Document submission_status
- "staged": uploaded but not yet submitted (visible only to borrower in amber cards)
- "final": submitted/default (visible to admin team)

## Decisions Made
- Staged upload model: files upload as "staged", borrower queues multiple, adds comment, then batch-submits
- Auto-refresh via polling (60s) rather than websockets
- Smart sorting: action_needed (pending/rejected) first, then in_progress (submitted/under_review), then cleared (approved/waived/not_applicable)
- Request Revision accessible from 3 entry points: doc preview modal, condition row hover, expanded row
- Fire-and-forget emails via Nodemailer (no blocking)
- Label softening: "Rejected"/"Denied" replaced with "Revision Requested"/"Revision Needed"/"Needs Revision"

## Gotchas Discovered
- Supabase generated types don't know about new columns (submission_status, borrower_comment, borrower_feedback) until types are regenerated. Use `as never` casts to bypass.
- Document approval (condition_approval_status on docs) is separate from condition status. Request Revision sets BOTH.
- pnpm not available in VM; use `npx tsc --noEmit --project apps/requity-os/tsconfig.json` for typechecking.
- Upload count on secure_upload_links tracks total uploads; DELETE handler decrements it.

## Migrations Applied
1. `add_borrower_feedback_to_conditions`: borrower_feedback text, feedback_updated_at timestamptz on unified_deal_conditions; default_borrower_feedback on loan_condition_templates
2. `add_submission_status_to_documents`: submission_status text NOT NULL DEFAULT 'final' on unified_deal_documents; borrower_comment text on unified_deal_conditions

## Dependencies
- All phases complete. Stale condition reminders are future work.

## Last Updated: 2026-03-15
## Next Steps: All core functionality complete. Test end-to-end flow. Consider stale condition reminders as future enhancement.
