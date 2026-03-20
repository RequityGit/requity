# Loan Application Form - Tasks

## Phase 1: Schema Extensions
- [ ] Create deal_application_links migration
- [ ] Add deal_id + deal_application_link_id to form_submissions migration
- [ ] Push migrations to Supabase
- [ ] Regenerate TypeScript types

## Phase 2: Form Engine Extensions
- [ ] Add deal-token validation API route
- [ ] Extend FormEngine to accept dealToken prop and pre-fill
- [ ] Extend public /forms/[slug] route to pass deal_token
- [ ] Add unified_deal entity handling in submission handler
- [ ] Add deal_id to autosave/submission creation
- [ ] Add PDF generation on submit
- [ ] Add unified_deal_activity logging on submit
- [ ] Add team notifications on submit

## Phase 3: Form Definition
- [ ] Build form definition JSON with all steps/fields matching Jotform
- [ ] Map fields to correct entities and columns
- [ ] Set up show_when conditions for all conditional sections
- [ ] Seed form definition via migration or API
- [ ] Test all conditional paths

## Phase 4: Deal Detail Integration
- [ ] Create SendApplicationDialog component
- [ ] Add createDealApplicationLink server action
- [ ] Add "Send Application" button to deal detail page
- [ ] Show active application link status on deal

## Phase 5: PDF Generation
- [ ] Build PDF generation endpoint
- [ ] Render form answers into structured PDF
- [ ] Save PDF to unified_deal_documents
- [ ] Test PDF output quality

## Phase 6: Testing & Polish
- [ ] End-to-end test: generate link -> open -> fill -> submit
- [ ] Test pre-fill accuracy
- [ ] Test resume from session token
- [ ] Test all conditional branches
- [ ] Build verification

## Last Updated: 2026-03-16
