# Borrower Document Notify + Send Link by Email — Tasks

## Phase 1: Notify team when borrower uploads

- [x] In `app/api/upload-link/upload/route.ts`: import `nq` from `@/lib/notifications`.
- [x] After the upload loop, when `uploaded.length > 0`: query `deal_team_members` for `link.deal_id` (select `profile_id`), dedupe.
- [x] Query `unified_deals` for `link.deal_id` to get `name` for the notification title.
- [x] For each distinct `profile_id`, insert into notifications: `user_id`, `notification_slug: "borrower-document-uploaded"`, `title`, `body`, `priority: "normal"`, `action_url: /pipeline/{deal_id}?tab=Diligence`.
- [x] Body: e.g. "1 file uploaded" or "N files uploaded" (optionally append file names).
- [x] Wrap in try/catch per insert so one failure doesn’t break the response; log errors.
- [ ] Manual test: create upload link, upload as borrower, confirm deal team members get in-app notification and link goes to Diligence.

## Phase 2: Send link by email from dialog

- [x] **Actions:** In `createSecureUploadLink`, change `.select("id, token")` to `.select("id, token, expires_at")`, return `expiresAt: link.expires_at` in the result.
- [x] **DealDetailPage:** Pass `dealName={deal.name}`, `currentUserId`, `currentUserName` to `DiligenceTab`.
- [x] **DiligenceTab:** Add props `dealName?`, `currentUserId?`, `currentUserName?`; pass them to DocumentsSection and then to `SecureUploadLinkDialog`.
- [x] **SecureUploadLinkDialog:** Add props `dealName?`, `currentUserId?`, `currentUserName?`. Store `generatedExpiresAt` when link is created (from action return).
- [x] Add state `emailSheetOpen` and "Send by email" button next to Copy when `generatedUrl` is set. Button only enabled when `currentUserId` is present.
- [x] Render `EmailComposeSheet` when `emailSheetOpen` is true with: `open`, `onOpenChange`, `toEmail=""`, `toName=""`, `initialSubject`, `initialBody` (include URL and "This link expires on [date]."), `currentUserId`, `currentUserName`.
- [x] Format expiry date in body (e.g. from `generatedExpiresAt`).
- [x] On send success, close sheet and optionally toast "Email sent."
- [ ] Manual test: create link, click Send by email, confirm subject/body and send works.

## Blockers

- None.

## Last Updated

2026-03-15
