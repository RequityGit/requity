# Borrower Document Notify + Send Link by Email — Implementation Plan

## Objective

Implement two enhancements from the borrower document collection roadmap: (1) notify the deal team when a borrower uploads documents via a secure upload link, and (2) add a "Send by email" flow from the Upload Link dialog so staff can email the link with pre-filled subject and body.

## Scope

- **IN**
  - **Step 1:** When one or more files are uploaded via `POST /api/upload-link/upload`, create in-app notifications for each member of the deal team (deal_team_members) so they see "New document(s) uploaded for [Deal Name]" with a link to the deal's Diligence tab.
  - **Step 2:** In the Secure Upload Link dialog, after a link is generated, add a "Send by email" button that opens the existing EmailComposeSheet with pre-filled subject (e.g. "Document upload link for [Deal Name]"), body containing the upload URL and expiry date, and optional To (if we have primary contact). No new API for sending; reuse existing email compose and send flow.
- **OUT**
  - Email notifications for "borrower uploaded" (only in-app for now; email can be a later preference).
  - Storing who the link was "sent to" on the link record (optional future).
  - New notification type in Control Center (we use a slug; if notification_types is required we can add later).

## Approach

### Step 1: Notify team when borrower uploads

1. **Upload API** (`app/api/upload-link/upload/route.ts`)
   - After the loop that processes files, when `uploaded.length > 0`:
     - Query `deal_team_members` for `link.deal_id` to get `profile_id` list (unique).
     - Query `unified_deals` for `link.deal_id` to get `name` for the notification title.
     - Use admin client to insert into `notifications` (via the same pattern as tasks: `nq(admin).notifications().insert(...)`). One row per deal team member.
   - Notification shape: `user_id` = profile_id, `notification_slug` = `"borrower-document-uploaded"`, `title` = `"New document(s) uploaded for {dealName}"`, `body` = e.g. `"1 file uploaded"` or `"3 files uploaded"` (and optionally list file names), `priority` = `"normal"`, `action_url` = `/pipeline/${link.deal_id}?tab=Diligence`, `entity_type` = null or a type that routes to pipeline (if we use entity_type for routing we can set it; else action_url is enough).
   - Import the notifications helper: `nq` from `@/lib/notifications`. Notifications table exists and is used by tasks; no migration needed for this slug unless we want a notification_type for preferences (out of scope for now).

2. **Edge cases**
   - If deal has no team members, skip inserts (no-op).
   - If notification insert fails for one user, log and continue (don’t fail the upload response).

### Step 2: Send link by email from Upload Link dialog

1. **Data flow**
   - **DealDetailPage** already has `deal`, `currentUserId`, `currentUserName`. Pass to **DiligenceTab**: `dealName={deal.name}`, `currentUserId`, `currentUserName`.
   - **DiligenceTab** passes to **SecureUploadLinkDialog**: `dealName`, `currentUserId`, `currentUserName`.
   - **SecureUploadLinkDialog** needs `expiresAt` for the email body. Today `createSecureUploadLink` returns `url` and `linkId` only. Extend the action to select and return `expires_at` (e.g. `.select("id, token, expires_at")`) and return `expiresAt: link.expires_at` so the client can format "This link expires on [date]."

2. **SecureUploadLinkDialog**
   - Add optional props: `dealName?: string`, `currentUserId?: string`, `currentUserName?: string`.
   - When `generatedUrl` is set, show a "Send by email" button next to "Copy" (and "Create another link"). On click, set local state `emailSheetOpen = true`.
   - Render `EmailComposeSheet` when `emailSheetOpen` is true (and we have currentUserId/currentUserName; if not, show a toast "Unable to open email composer" or hide the button when currentUserId is missing).
   - EmailComposeSheet props: `open={emailSheetOpen}`, `onOpenChange={setEmailSheetOpen}`, `toEmail=""`, `toName=""`, `initialSubject={Document upload link for ${dealName ?? "your deal"}}`, `initialBody={body}` where body is plain text or simple HTML containing the upload URL and "This link expires on [formatted expiresAt]." Optionally add a one-line instruction.
   - After send success, we can close the email sheet and optionally toast "Email sent."

3. **createSecureUploadLink return value**
   - Change `.select("id, token")` to `.select("id, token, expires_at")`.
   - Return `{ error, url, linkId, expiresAt: link.expires_at }` so the dialog can store `generatedExpiresAt` and use it in the email body.

4. **Primary contact (optional for v1)**
   - If we have `deal.primary_contact_id` and a way to resolve email/name (e.g. from deal fetch or a small helper), we could pre-fill `toEmail` / `toName`. Mark as optional in the plan; can be Phase 2.

## Files to Modify

### Step 1
- `apps/requity-os/app/api/upload-link/upload/route.ts` — after successful uploads, query deal_team_members + deal name, insert notifications (using nq).

### Step 2
- `apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/actions.ts` — `createSecureUploadLink`: select `expires_at`, return `expiresAt`.
- `apps/requity-os/components/pipeline/SecureUploadLinkDialog.tsx` — add props (dealName, currentUserId, currentUserName), state (emailSheetOpen), "Send by email" button, render EmailComposeSheet with initialSubject/initialBody, use generatedExpiresAt in body.
- `apps/requity-os/components/pipeline/tabs/DiligenceTab.tsx` — add props dealName?, currentUserId?, currentUserName?; pass through to SecureUploadLinkDialog.
- `apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage.tsx` — pass dealName, currentUserId, currentUserName into DiligenceTab.

## Database Changes

- None. Notifications table and deal_team_members already exist.

## Risks

- **Step 1:** Notifications might fire for every upload batch; if a borrower uploads 5 files in one go we still send one notification per team member (not per file). Good.
- **Step 2:** EmailComposeSheet is a large component; ensure it’s only rendered when emailSheetOpen is true to avoid loading cost when dialog is only used for copy. Optional: lazy-load the EmailComposeSheet component.
- If deal name is missing (dealName undefined), use a fallback like "your deal" in subject/body.

## Success Criteria

- When a borrower uploads at least one file via a secure upload link, every member of that deal’s team sees an in-app notification with title "New document(s) uploaded for [Deal Name]" and clicking it goes to the deal’s Diligence tab.
- From the Upload Link dialog, after generating a link, the user can click "Send by email", and the email compose sheet opens with subject and body pre-filled (including URL and expiry). Sending uses the existing email flow and works as today.

## Dependencies

- Existing: `notifications` table, `nq()` helper, `deal_team_members`, `EmailComposeSheet`, pipeline deal page data (deal.name, currentUserId, currentUserName).
