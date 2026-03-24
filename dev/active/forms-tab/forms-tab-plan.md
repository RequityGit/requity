# Forms Tab - Implementation Plan

## Objective
Add a "Forms" tab to the deal detail page that shows all form submissions linked to the deal, with expandable detail views and a "Send Form" button for generating pre-filled borrower application links.

## Scope
- IN: FormsTab component, SendFormModal, integration into DealDetailPage tabs
- OUT: PDF export of submissions, form builder changes, form renderer changes

## Approach
Phase 1: FormsTab read-only view (submissions list with expandable answers)
Phase 2: SendFormModal (generate deal application links, copy URL)

## Files to Modify
- apps/requity-os/components/pipeline/tabs/FormsTab.tsx (NEW)
- apps/requity-os/components/pipeline/tabs/SendFormModal.tsx (NEW)
- apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage.tsx (add tab)

## Database Changes
None - uses existing form_submissions, form_definitions, deal_application_links tables

## Success Criteria
- Forms tab appears between Borrower and Diligence
- Shows all submissions for the deal with form name, submitter, date, status
- Expandable cards show field answers grouped by step
- Send Form button generates a deal application link
