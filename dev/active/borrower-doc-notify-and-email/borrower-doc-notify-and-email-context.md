# Borrower Document Notify + Send Link by Email — Context

## Key Files

| File | Purpose |
|------|---------|
| `apps/requity-os/app/api/upload-link/upload/route.ts` | Upload handler; add notification logic after successful uploads. |
| `apps/requity-os/lib/notifications.ts` | `nq(admin).notifications().insert(...)` pattern; used in tasks/actions. |
| `apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/actions.ts` | `createSecureUploadLink` — add return of `expires_at`. |
| `apps/requity-os/components/pipeline/SecureUploadLinkDialog.tsx` | Upload Link dialog; add Send by email + EmailComposeSheet. |
| `apps/requity-os/components/crm/email-compose-sheet.tsx` | Existing compose sheet; props: open, onOpenChange, toEmail, toName, initialSubject, initialBody, currentUserId, currentUserName. |
| `apps/requity-os/components/pipeline/tabs/DiligenceTab.tsx` | Renders SecureUploadLinkDialog; add and pass dealName, currentUserId, currentUserName. |
| `apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage.tsx` | Passes deal, currentUserId, currentUserName to tabs; add dealName and pass user + dealName to DiligenceTab. |

## Decisions Made

- In-app only for "borrower uploaded" (no email notification type in this phase).
- One notification per deal team member per upload batch (not per file).
- Reuse EmailComposeSheet as-is; no new "send upload link" API.
- Return `expiresAt` from createSecureUploadLink so the dialog can show it in the email body.

## Gotchas Discovered

- (To be filled during implementation.)
- DiligenceTab currently does not receive deal name or current user; those are on DealDetailPage. Prop drilling required.

## Dependencies

- Notifications: `notifications` table, `nq()` from `@/lib/notifications`.
- Deal team: `deal_team_members` has `deal_id`, `profile_id`; `profile_id` is the user to notify.
- Email: EmailComposeSheet requires `currentUserId` and `currentUserName`; no linked loan/contact required for a simple send.

## Last Updated

2026-03-15

## Next Steps

1. Implement Step 1 (notify team) in upload route.
2. Implement Step 2 (return expiresAt, prop drill dealName/currentUser, Send by email + EmailComposeSheet in dialog).
