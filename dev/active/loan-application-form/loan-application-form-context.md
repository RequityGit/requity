# Loan Application Form - Context

## Key Files
- `/packages/db/supabase/migrations/20260310000000_form_engine_tables.sql` - Form engine schema
- `/packages/db/supabase/migrations/20260319000000_secure_upload_links.sql` - Token pattern reference
- `/apps/requity-os/components/forms/FormEngine.tsx` - Main form orchestrator
- `/apps/requity-os/app/api/forms/submit/route.ts` - Submission handler
- `/apps/requity-os/app/(public)/forms/[slug]/page.tsx` - Public form route
- `/apps/requity-os/lib/form-engine/types.ts` - Form engine types
- `/apps/requity-os/lib/form-engine/autosave.ts` - Submission creation + auto-save
- `/apps/requity-os/lib/form-engine/evaluator.ts` - Conditional step evaluation
- `/apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/actions.ts` - Deal actions (reference for createSecureUploadLink)
- `/apps/requity-os/components/pipeline/SecureUploadLinkDialog.tsx` - Reference UI for link generation
- `/sessions/funny-zealous-cori/jotform_loan_app.json` - Jotform JSON export (source of truth for form fields)

## Existing Form Engine Capabilities
- Multi-step forms with conditional show_when logic
- Session tokens for resumable progress (7-day default)
- Entity mapping: crm_contact (match on email), property (match on address), opportunity
- Auto-save on step transition and field blur
- Email lookup RPC for contact pre-fill
- Public route at /forms/[slug] with ?t= session token
- Field types: text, email, phone, number, currency, date, select, multi_select, textarea, address, file, checkbox, card-select
- Admin builder UI at /control-center/forms

## What We're Adding
- deal_application_links table (token -> deal -> form)
- deal_id on form_submissions (child object of deal)
- unified_deal as target_entity in submission handler (writes to uw_data)
- Deal token param (?dt=) on public form route
- Pre-fill from deal + contact + property data
- PDF generation on submit -> unified_deal_documents
- Activity logging -> unified_deal_activity

## Jotform Structure (15 sections, ~100 fields)
Sections by order:
1. Mortgage Broker Info (conditional on broker question)
2. Residential vs Commercial (main branch)
3. DSCR fields / Fix & Flip fields / Ground Up Construction fields / Commercial Bridge fields (conditional sub-branches)
4. Borrower Info (name, rent/own, credit score)
5. Co-borrower Info (conditional on co-borrower question)
6. Additional Guarantors (configurable list, up to 4)
7. Borrower Background (10+ yes/no with conditional explanations)
8. Co-borrower Background (mirrors borrower, conditional)
9. Borrower Experience
10. Co-borrower Experience (conditional)
11. Loan Settings (rehab, term, transaction type, purchase price, property value)
12. Important Dates (desired closing)
13. Rehab/Construction Info + Loan Terms + Additional Settings
14. Subject Property Details (configurable list widget - multi-property)
15. Property Photos (file upload)
16. Additional Questions (transaction details, occupancy, secondary financing)
17. Terms & Conditions

## Decisions Made
- Extending Form Engine rather than building from scratch
- Using deal_application_links table (mirrors secure_upload_links pattern)
- Form definition stored in form_definitions table (managed via admin UI)
- Application data stored as form_submission + deal uw_data merge
- PDF generated server-side on submit

## Gotchas Discovered
- Form Engine currently only supports crm_contact, property, opportunity as target entities. Need to add unified_deal.
- The Jotform has two "configurable list" widgets (guarantors and property details) that allow dynamic rows. The Form Engine doesn't have a "repeater/list" field type yet - may need to add one or handle differently.
- Some Jotform fields are duplicated across borrower/co-borrower sections with identical labels but different qids.

## Dependencies
- Form Engine must be working (it is, already deployed)
- unified_deals and unified_deal_documents tables exist (they do)
- Supabase Storage bucket for documents exists (loan-documents bucket)

## Last Updated: 2026-03-16
## Next Steps: Start with Phase 1 schema migrations, then Phase 2 form engine extensions
