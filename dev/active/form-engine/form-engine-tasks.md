# Form Engine - Tasks

## Phase 1: Database
- [ ] Create migration for form_definitions, form_submissions, entity_audit_log tables
- [ ] Add RLS policies (using user_roles, not profiles)
- [ ] Add indexes and triggers
- [ ] Create lookup_contact_by_email RPC function
- [ ] Seed loan application form definition

## Phase 2: Core Rendering
- [ ] Create lib/form-engine/types.ts (TypeScript interfaces)
- [ ] Create lib/form-engine/evaluator.ts (show_when condition evaluator)
- [ ] Create FormEngine.tsx (main orchestrator)
- [ ] Create StepRenderer.tsx
- [ ] Create CardSelect.tsx
- [ ] Create FormField.tsx
- [ ] Create FormProgress.tsx
- [ ] Create FormSummary.tsx
- [ ] Create contexts/FormPage.tsx
- [ ] Create contexts/FormDrawer.tsx
- [ ] Create contexts/FormModal.tsx
- [ ] Create public route: (public)/forms/[slug]/page.tsx
- [ ] Create lib/form-engine/autosave.ts
- [ ] Create lib/form-engine/email-lookup.ts
- [ ] Create lib/form-engine/prefill.ts

## Phase 3: Submission
- [ ] Create API route: api/forms/submit/route.ts
- [ ] Create lib/form-engine/submission-handler.ts (client-side caller)

## Phase 4: Borrower Links
- [ ] Create OverrideWarning.tsx
- [ ] Create ResumePrompt.tsx

## Phase 5: Admin UI
- [ ] Add Forms entry to Control Center nav
- [ ] Create IconPicker.tsx
- [ ] Create control-center/forms/page.tsx (form list)
- [ ] Create control-center/forms/[id]/page.tsx (form editor)

## Phase 6: Audit
- [ ] Audit trail display on entity detail pages (deferred)

## Last Updated: 2026-03-10
