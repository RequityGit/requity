# Loan Application Form - Implementation Plan

## Objective
Extend the existing Form Engine to support deal-linked loan applications. Team sends a unique link from the deal detail page; borrower opens a pre-populated multi-step form (no login), completes it, and the submission attaches as a child object of the deal with a PDF in documents.

## Scope
- IN: Schema extensions, submission handler updates, form definition matching Jotform, deal detail "Send Application" button, PDF generation, activity logging
- OUT: Replacing the quick loan-request form on requitygroup.com (that stays as the lead capture). Borrower portal login. Custom form builder UI changes.

## Approach

### Phase 1: Schema Extensions
1. Migration: `deal_application_links` table (token, deal_id, form_id, contact_id, expires_at, status, prefill_data JSONB)
2. Migration: Add `deal_id` column to `form_submissions` (nullable FK to unified_deals)
3. Migration: Add `deal_application_link_id` to `form_submissions` (nullable FK)
4. RLS: admin/super_admin full access on deal_application_links; public insert/update on form_submissions via valid token

### Phase 2: Form Engine Extensions
1. Add `unified_deal` as target_entity in submission handler
2. When submission has deal_id: update deal's uw_data with mapped fields (merge, don't overwrite)
3. Support `deal_token` query param on `/forms/[slug]` route
4. Validate deal_token against deal_application_links table
5. Pre-fill form data from deal + contact + property
6. On final submit: generate PDF, save to unified_deal_documents (category: "application"), log unified_deal_activity

### Phase 3: Form Definition (Seed Data)
Create form_definitions row with steps matching Jotform structure:
- Step 1: Mortgage Broker (conditional on "Are you working with a broker?")
- Step 2: Program Selection (Residential vs Commercial branch)
- Step 3: DSCR/Fix & Flip/Ground Up/Commercial sub-steps (conditional)
- Step 4: Borrower Info (pre-filled from contact)
- Step 5: Co-borrower Info (conditional on "Is there a Co-borrower?")
- Step 6: Additional Guarantors (conditional)
- Step 7: Borrower Background (yes/no questions with conditional explanations)
- Step 8: Co-borrower Background (conditional)
- Step 9: Borrower Experience
- Step 10: Co-borrower Experience (conditional)
- Step 11: Loan Settings + Terms + Dates
- Step 12: Subject Property Details (pre-filled from deal property)
- Step 13: Property Photos (file upload)
- Step 14: Additional Questions (transaction details, occupancy, secondary financing)
- Step 15: Scenario Description + T&C + Submit

### Phase 4: Deal Detail Integration
1. Add "Send Application" button to deal detail page (alongside existing "Create Upload Link")
2. Dialog: select form, set expiry, optional message, send email to borrower contact
3. Creates deal_application_links record
4. Shows active application links with status (sent, started, submitted)

### Phase 5: PDF Generation
1. On form submission, render all answers into a structured PDF
2. Save to unified_deal_documents with category "application"
3. Use the existing document storage pattern (Supabase Storage bucket)

## Files to Modify
### New Files
- `packages/db/supabase/migrations/YYYYMMDD_deal_application_links.sql`
- `apps/requity-os/app/api/forms/deal-token/route.ts` (validate deal token API)
- `apps/requity-os/components/pipeline/SendApplicationDialog.tsx`
- `apps/requity-os/app/api/forms/generate-pdf/route.ts`

### Modified Files
- `apps/requity-os/app/(public)/forms/[slug]/page.tsx` (accept deal_token param)
- `apps/requity-os/components/forms/FormEngine.tsx` (deal token handling, prefill)
- `apps/requity-os/app/api/forms/submit/route.ts` (unified_deal entity, PDF trigger, activity log)
- `apps/requity-os/lib/form-engine/types.ts` (new types)
- `apps/requity-os/lib/form-engine/autosave.ts` (pass deal_id to submission)
- `apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage.tsx` (Send Application button)
- `apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/actions.ts` (createDealApplicationLink action)

## Database Changes
1. New table: `deal_application_links`
2. New columns on `form_submissions`: `deal_id`, `deal_application_link_id`
3. RLS policies for both

## Risks
- Form definition is large (~100 fields, 15 sections). Need thorough testing of conditional logic.
- PDF generation quality - need to handle all field types cleanly.
- Pre-fill mapping must be accurate (deal uw_data keys must match form field mapped_columns).

## Success Criteria
1. Team can click "Send Application" on any deal and generate a unique link
2. Borrower opens link, sees pre-filled data from the deal
3. Borrower can save progress and resume later
4. On submit: deal uw_data updated, PDF in documents tab, activity logged, team notified
5. All conditional logic from Jotform works (residential/commercial branch, co-borrower, background explanations)
