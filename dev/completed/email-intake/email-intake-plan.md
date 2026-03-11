# Email Intake - Implementation Plan

## Objective
Allow team members to forward emails with document attachments to `intake@requitygroup.com` and have them appear in a portal review queue with AI-pre-populated deal fields.

## Scope
- IN: Gmail sync extension, attachment download, AI extraction (body + attachments), intake queue UI, deal creation/attachment from queue
- OUT: Real-time processing (5-min cron is fine), Make.com integration, borrower-facing features

## Approach
Extend existing Gmail sync engine to detect intake emails, download attachments, and queue them. Separate API endpoint for AI extraction. New admin UI page for reviewing and resolving queued items.

## Phases
1. Database migration (`email_intake_queue` table)
2. Gmail sync extension (intake detection, attachment download)
3. AI extraction API (`/api/intake/process`)
4. Intake queue UI (page, list component, review sheet)
5. Deal resolution actions (create deal, attach to existing, dismiss)

## Success Criteria
- Forward email with PDF to intake address -> appears in queue within 5 min
- AI extracts deal fields from attachments and email body
- Admin can review, edit, and create deal from queue item
- Documents linked to created deal
