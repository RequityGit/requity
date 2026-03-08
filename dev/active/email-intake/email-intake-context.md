# Email Intake - Context

## Key Files
- `apps/requity-os/lib/gmail-sync.ts` - Gmail sync engine, `processMessage()` at line 374
- `apps/requity-os/app/api/deals/extract-from-document/route.ts` - Claude extraction pattern
- `apps/requity-os/components/pipeline-v2/NewDealDialog.tsx` - UI pattern for extracted fields review
- `apps/requity-os/app/(authenticated)/admin/pipeline-v2/actions.ts` - Server actions for deal creation
- `apps/requity-os/lib/document-upload-utils.ts` - File validation utilities
- `apps/requity-os/components/layout/sidebar.tsx` - Navigation sidebar
- `apps/requity-os/app/api/intake/process/route.ts` - AI extraction endpoint
- `apps/requity-os/app/(authenticated)/admin/pipeline/intake/page.tsx` - Intake queue page
- `apps/requity-os/components/pipeline-v2/IntakeQueue.tsx` - Queue list component
- `apps/requity-os/components/pipeline-v2/IntakeReviewSheet.tsx` - Review sheet
- `apps/requity-os/netlify/functions/gmail-sync-cron.mts` - 5-min cron trigger
- `packages/db/supabase/migrations/20260308950000_create_email_intake_queue.sql` - DB migration

## Decisions Made
- Use Gmail sync extension (not Make.com) for simplicity
- `intake@requitygroup.com` as alias on Dylan's Gmail
- Extract from both attachments AND email body
- No sender restriction - any forwarded email gets queued
- Reuse `loan-documents` bucket with `email-intake/` prefix
- Keep Make.com Deal Intake scenario as parallel path (mailhook-based)
- Fixed Make.com scenarios as backup while portal-native system deploys

## Gotchas Discovered
- Make.com Deal Intake scenario (4578762) fails on long filenames (Google Drive 255 char limit) - fixed with substring truncation to 200 chars
- Make.com Inbox Machine (4579661) fails on Claude JSON parsing despite system prompt - fixed with substring/indexOf extraction from first { to last }
- Make.com scenario marked `isinvalid: true` even after blueprint update and activation - may need manual validation in Make.com UI
- The mailhook address `tezcebq9i1e9vu928wayv27crwzfwx4o@hook.us1.make.com` is separate from `intake@requitygroup.com` - they serve different purposes (Make.com uses uw@requitygroup.com alias)

## Dependencies
- Gmail sync cron must be running (Netlify scheduled function, every 5 min)
- `intake@requitygroup.com` alias must be created in Google Workspace
- Environment variables on Netlify: CRON_SECRET, ANTHROPIC_API_KEY, NEXT_PUBLIC_APP_URL
- Supabase `email_intake_queue` table (already migrated)

## Last Updated: 2026-03-08T23:20Z
## Next Steps:
- Verify 772 Humble Camp processes through Make.com Deal Intake (queued item)
- Verify Gmail sync cron picks up intake emails on next run
- Manual test of portal-native intake flow end-to-end
