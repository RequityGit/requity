# Form Engine - Implementation Plan

## Objective
Build a dynamic form engine that replaces Jotform for external (borrower/investor-facing) and internal (team CRM) form use cases within RequityOS.

## Scope
- IN: Database schema (form_definitions, form_submissions, entity_audit_log), rendering engine (FormEngine, StepRenderer, CardSelect, FormField), auto-save/resume, submission handler (API route), email lookup, edit mode + pre-fill, override warnings, audit trail, pre-populated borrower links, admin UI (Control Center form manager), seed data (loan application form)
- OUT: Chatter/messaging, changes to existing pages except integration points, Jotform migration of existing data

## Approach
1. Phase 1: Database migration (tables, RLS, seed data)
2. Phase 2: Form rendering components + public route
3. Phase 2b: Auto-save, resume, email lookup
4. Phase 3: Submission handler (Next.js API route, NOT Edge Function since this is Next.js on Netlify)
5. Phase 4: Pre-populated borrower links
6. Phase 5: Admin UI in Control Center
7. Phase 6: Audit trail integration

## Key Decisions
- This is Next.js 14 App Router (NOT Remix). Routes use `app/` directory with `page.tsx` files.
- Edge Functions live in `packages/db/supabase/functions/`. Submission handler will be a Next.js API route at `app/api/forms/submit/route.ts`.
- Supabase client: `@/lib/supabase/client` (browser) and `@/lib/supabase/server` (server).
- UI components: `@/components/ui/*` (shadcn/ui). Utilities: `@/lib/utils` (`cn` function).
- Form components go in `apps/requity-os/components/forms/`.
- Public form route: `app/(public)/forms/[slug]/page.tsx`.
- Admin routes: `app/(authenticated)/control-center/forms/`.
- RLS policies use `user_roles` table (NOT `profiles.role`). Migration must use correct auth pattern.

## Files to Create/Modify
### New Files
- `packages/db/supabase/migrations/20260310000000_form_engine_tables.sql`
- `apps/requity-os/components/forms/FormEngine.tsx`
- `apps/requity-os/components/forms/StepRenderer.tsx`
- `apps/requity-os/components/forms/CardSelect.tsx`
- `apps/requity-os/components/forms/FormField.tsx`
- `apps/requity-os/components/forms/FormProgress.tsx`
- `apps/requity-os/components/forms/FormSummary.tsx`
- `apps/requity-os/components/forms/OverrideWarning.tsx`
- `apps/requity-os/components/forms/ResumePrompt.tsx`
- `apps/requity-os/components/forms/IconPicker.tsx`
- `apps/requity-os/components/forms/contexts/FormPage.tsx`
- `apps/requity-os/components/forms/contexts/FormDrawer.tsx`
- `apps/requity-os/components/forms/contexts/FormModal.tsx`
- `apps/requity-os/lib/form-engine/evaluator.ts`
- `apps/requity-os/lib/form-engine/submission-handler.ts`
- `apps/requity-os/lib/form-engine/prefill.ts`
- `apps/requity-os/lib/form-engine/email-lookup.ts`
- `apps/requity-os/lib/form-engine/autosave.ts`
- `apps/requity-os/lib/form-engine/types.ts`
- `apps/requity-os/app/(public)/forms/[slug]/page.tsx`
- `apps/requity-os/app/api/forms/submit/route.ts`
- `apps/requity-os/app/(authenticated)/control-center/forms/page.tsx`
- `apps/requity-os/app/(authenticated)/control-center/forms/[id]/page.tsx`

### Modified Files
- `apps/requity-os/app/(authenticated)/control-center/_config/nav.ts` (add Forms entry)
- `packages/db/src/types.ts` (regenerated after migration)

## Risks
- RLS policies must correctly reference `user_roles` table, not `profiles`
- Column names in seed data must match actual DB schema for `crm_contacts`, `opportunities`, `properties`
- Large Lucide icon import in CardSelect could affect bundle size

## Success Criteria
- External loan application form renders at `/forms/loan-application`
- Multi-step form with router steps and conditional steps works
- Auto-save creates/updates submission records
- Resume via session token works
- Admin can view/edit form definitions in Control Center
- Submission handler creates entities in correct tables
