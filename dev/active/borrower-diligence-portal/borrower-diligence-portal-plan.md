# Borrower Diligence Portal - Implementation Plan

## Objective
Transform the secure upload link from a one-way upload form into a persistent, two-way diligence dashboard where borrowers can see live condition statuses, reviewer feedback, uploaded file history, and re-upload revised documents -- all without authentication.

## Scope
- IN: Phase 1 (live status dashboard), Phase 2 (revision feedback loop), Phase 3 (automated email notifications)
- OUT: Authenticated borrower portal changes (`/b/*` routes), link expiry extension (Phase 4), activity timeline on borrower page (Phase 4)

## Approach

### Phase 1: Live Status Dashboard (no DB changes)
- Update validate API to return document names/timestamps per condition (not just counts)
- Redesign SecureUploadClient to show:
  - Progress bar (X of Y conditions cleared)
  - Status badges per condition (Pending, Submitted, Under Review, Approved, Needs Revision, Waived)
  - Uploaded file history with timestamps per condition
  - Smart sorting: action-needed items first, completed items collapsed at bottom
- Auto-refresh: poll validate endpoint every 60s so borrower sees live updates

### Phase 2: Revision Feedback Loop (DB changes)
- Add `borrower_feedback` text and `feedback_updated_at` timestamptz to `unified_deal_conditions`
- Add `revision_requested` to condition_status enum (or reuse `rejected` with better labeling)
- Build "Request Revision" action in DiligenceTab: sets status, saves borrower feedback, logs activity
- Display feedback on upload link page for revision-needed items
- Enable re-upload specifically for revision items

### Phase 3: Automated Email Notifications
- Status change triggers via server actions (not DB triggers, for control)
- Email templates: revision requested (immediate), daily digest of approvals, stale condition reminders
- Uses existing Nodemailer infrastructure + email template system

## Files to Modify

### Phase 1
- `app/api/upload-link/validate/route.ts` - Return richer condition data (docs, timestamps)
- `app/(public)/upload/[token]/SecureUploadClient.tsx` - Complete UI redesign with status dashboard

### Phase 2
- New migration: `borrower_feedback` + `feedback_updated_at` columns
- `components/pipeline/pipeline-types.ts` - Add new fields to DealCondition
- `components/pipeline/tabs/DiligenceTab.tsx` - Add "Request Revision" action
- `app/(authenticated)/(admin)/pipeline/[id]/actions.ts` - New server action for requesting revision
- `app/api/upload-link/validate/route.ts` - Return feedback fields
- `app/(public)/upload/[token]/SecureUploadClient.tsx` - Show feedback, re-upload on revision items

### Phase 3
- New file: `lib/emails/condition-notifications.ts` - Email trigger logic
- New migration: seed email templates for condition status changes
- `app/(authenticated)/(admin)/pipeline/[id]/actions.ts` - Wire email triggers to status change actions

## Database Changes

### Phase 2 Migration
```sql
ALTER TABLE unified_deal_conditions
  ADD COLUMN borrower_feedback text,
  ADD COLUMN feedback_updated_at timestamptz;

-- Update generate_deal_conditions if needed (no, these are runtime fields)
```

### Phase 3 Migration
```sql
-- Seed email templates for condition notifications
INSERT INTO user_email_templates (...)
```

## Risks
- Polling validate endpoint every 60s adds load; mitigate with caching or conditional fetching
- `revision_requested` as new enum value requires careful migration; alternative is reusing `rejected` with UI label change
- Email notification volume: need batching for approvals to avoid spam

## Success Criteria
- Borrower can see real-time status of all conditions on their upload link
- Borrower sees exactly which docs need revision and why
- Team can request revision with one click + one sentence from the Diligence tab
- Borrower gets automated email when revision is needed
- Zero manual emails required for standard condition review workflow
