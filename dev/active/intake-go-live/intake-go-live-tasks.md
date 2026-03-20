# Email Intake Go-Live - Tasks

## Phase 1: Fix Critical Bugs
- [x] Create migration to expand intake_items status CHECK constraint
- [x] Fix storage bucket mismatch (fetch-intake-emails: portal-documents -> loan-documents)
- [x] Add Gmail pagination (nextPageToken loop)
- [x] Deploy edge functions (fetch-intake-emails v24, process-intake-email v19)

## Phase 2: Verify Deployment
- [x] Check edge function secrets are set (Gmail/Anthropic keys are env vars)
- [x] Verify pg_cron job is active (job ID 5, every 2 minutes)
- [x] Verify storage buckets exist (loan-documents confirmed)
- [x] Check unified_card_types has rows (4 rows confirmed)

## Phase 3: Harden UI
- [x] Make UW fields editable in IntakeReviewSheet
- [x] Add catch-all notes on deal creation (all extracted fields dumped to notes table)
- [x] Surface attachment failure warnings (amber banner + per-file highlighting)
- [x] Collapsible raw email preview

## Phase 4: Test
- [x] Verify queue pickup (3 new emails picked up after v24/v19 deploy)
- [x] Verify process-intake-email creates intake_items (3 new items created)
- [ ] Create deal from intake UI (requires frontend deploy)
- [ ] Verify docs linked to deal (requires frontend deploy)

## Phase 5: Deploy Frontend
- [ ] Commit and push code changes (lock file issue in sandbox; commit from local)
- [ ] Deploy to production (Netlify/Vercel)
- [ ] End-to-end test: forward email -> queue pickup -> review -> create deal

## Blockers
- Git commit blocked by filesystem mount restrictions on lock file cleanup. Commit from local machine.

## Last Updated: 2026-03-20
