# Cursor Prompt: Standardize "Deal" Naming Across RequityOS

## Context

RequityOS has two pipeline systems that need consolidation:

1. **`unified_deals`** (25 rows) - The newer unified pipeline with card types, field configurations, checklists, conditions, and workflow engine. This is the future.
2. **`opportunities`** (12 rows) - The legacy originations pipeline with its own Kanban, server actions, approval workflow, and stage management. Still actively used at `/admin/originations`.

We are standardizing on the term **"deal"** (not "opportunity", not "pipeline deal") as the canonical name for an individual pipeline record. The pipeline VIEW/PAGE is called "Pipeline." An individual record is a "Deal."

## Phase 1: UI Naming Cleanup (Do This Now)

Rename all user-facing labels, headings, breadcrumbs, empty states, and button text from "Opportunity" / "Opportunities" to "Deal" / "Deals" across the entire app. This is a cosmetic/labeling change only -- do NOT rename database tables, columns, or TypeScript types yet.

### Files to update:

1. **`apps/requity-os/app/(authenticated)/admin/originations/page.tsx`**
   - Page title, headings, KPI labels, empty states
   - Any reference to "opportunity" in user-facing strings
   - The page itself may be renamed from "Originations" to "Pipeline" in a later phase

2. **`apps/requity-os/components/admin/originations/opportunity-kanban.tsx`**
   - Card labels, tooltips, drag-and-drop aria labels
   - Component can keep its filename for now (internal reference)

3. **`apps/requity-os/lib/constants/db-enums.ts`**
   - `OPPORTUNITY_STAGE_LABELS` -- change display labels if any say "Opportunity"
   - Do NOT rename the constant names themselves yet (that's Phase 2)

4. **`apps/requity-os/components/crm/contact-360/tabs/detail-deals-tab.tsx`**
   - Already says "deals" in some places; audit for any remaining "opportunity" references in empty states or tooltips

5. **`apps/requity-os/app/(authenticated)/admin/operations/approvals/actions.ts`**
   - Approval entity_type display labels (if "opportunity" is shown to users, change to "deal")

6. **Sidebar / navigation** - Check if "Originations" should be renamed to "Pipeline" or "Deals" in the nav. Look in layout files and navigation config.

7. **Any toast messages, error messages, or success messages** that reference "opportunity" -- grep for the string across the app.

### Rules:
- Only change USER-FACING strings (labels, headings, toasts, aria labels, comments)
- Do NOT rename: database tables, columns, TypeScript types/interfaces, variable names, function names, file names, or import paths
- Do NOT change any business logic
- After changes, run `pnpm build` to confirm no TypeScript errors
- Search with case-insensitive grep for: `opportunit` to catch Opportunity, opportunity, opportunities, Opportunities

## Phase 2: Pipeline as Home Screen (Do This After Phase 1)

Make the pipeline the default landing page for authenticated admin/super_admin users after login.

### Approach:
- In the authenticated layout or root loader, redirect admin/super_admin roles to `/admin/originations` (or whatever the pipeline route is) instead of the current dashboard
- Keep the dashboard accessible via nav, just don't make it the default
- Borrower and investor roles should still land on their respective dashboards
- Check `apps/requity-os/app/(authenticated)/` for the root layout/loader that handles post-login routing

### Implementation notes:
- The redirect should be based on `user_roles.role` (app_role enum)
- super_admin and admin -> pipeline
- investor -> investor dashboard
- borrower -> borrower dashboard
- This is a loader-level redirect, not a client-side redirect

## Phase 3: Consolidate opportunities into unified_deals (PLAN ONLY -- Do Not Implement)

This phase is complex and requires a migration plan. For now, just create a file at `dev/active/naming-standardization/consolidation-plan.md` with:

1. A mapping of every `opportunities` column to its `unified_deals` equivalent (or note if it needs to be added to `unified_deals.uw_data` JSONB)
2. A list of all tables with FK references to `opportunities.id` and what needs to change
3. The `opportunity_pipeline` view and what replaces it
4. Data migration strategy for the 12 existing opportunity rows
5. Server action consolidation plan (the originations actions.ts -> unified pipeline actions)
6. Component consolidation (opportunity-kanban.tsx -> unified pipeline board)

Do NOT execute this migration. Just produce the plan document.

## Key Files Reference

```
# Originations (legacy opportunities pipeline)
apps/requity-os/app/(authenticated)/admin/originations/page.tsx
apps/requity-os/app/(authenticated)/admin/originations/actions.ts
apps/requity-os/components/admin/originations/opportunity-kanban.tsx

# Unified Pipeline (new system)
apps/requity-os/app/(authenticated)/admin/pipeline/   (check for this route)
apps/requity-os/components/admin/pipeline/             (check for components)

# Shared
apps/requity-os/lib/constants/db-enums.ts
apps/requity-os/lib/supabase/types.ts
apps/requity-os/app/api/forms/submit/route.ts

# Database
packages/db/supabase/migrations/20260302500000_create_opportunities_table.sql
packages/db/supabase/migrations/20260302500001_create_opportunity_borrowers_table.sql
packages/db/supabase/migrations/20260302500002_create_property_financial_snapshots.sql
```

## CLAUDE.md Rules to Follow

- Auth uses `user_roles` table, not `profiles.role`
- Field Manager (`field_configurations`) is the single source of truth for field definitions
- No em dashes in any content
- Run `pnpm build` after every set of edits
- This is Remix (not Next.js) -- use loaders and actions, not API routes for page data
