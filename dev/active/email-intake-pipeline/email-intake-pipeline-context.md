# Email Intake Pipeline - Context

## Key Files
- `apps/requity-os/app/(authenticated)/admin/pipeline-v2/page.tsx` - Main pipeline page (server component, fetches deals)
- `apps/requity-os/app/(authenticated)/admin/pipeline-v2/actions.ts` - Server actions (create deal, advance stage, resolve intake)
- `apps/requity-os/components/pipeline-v2/PipelineView.tsx` - Client wrapper with filters
- `apps/requity-os/components/pipeline-v2/PipelineKanban.tsx` - Kanban board with DnD
- `apps/requity-os/components/pipeline-v2/DealCard.tsx` - Individual deal card
- `apps/requity-os/components/pipeline-v2/pipeline-types.ts` - All pipeline types
- `apps/requity-os/components/pipeline-v2/IntakeQueue.tsx` - OLD intake queue (to be replaced)
- `apps/requity-os/components/pipeline-v2/IntakeReviewSheet.tsx` - OLD intake review (to be replaced)
- `apps/requity-os/app/(authenticated)/admin/pipeline/intake/page.tsx` - OLD intake page (to be removed)
- `apps/requity-os/components/layout/sidebar.tsx` - Sidebar nav config
- `packages/db/supabase/types.ts` - Generated Supabase types
- `packages/db/supabase/migrations/` - Migration files

## Architecture Notes
- This is Next.js 14 App Router (NOT Remix as CLAUDE.md root says)
- Server components fetch data, pass to client components
- Server actions in colocated `actions.ts` files
- Uses `createAdminClient()` for privileged DB access
- Uses `createClient()` for user-scoped access
- Pipeline uses `unified_deals` + `unified_card_types` tables
- CRM uses `crm_contacts` + `companies` tables
- Properties in `properties` table
- Existing `email_intake_queue` table handles raw email ingestion
- The new `intake_items` table adds structured parsing + matching on top

## Key Type Information
- `crm_contacts`: has email, phone, first_name, last_name, company_id, address fields
- `companies`: has name, email, phone, company_type (required enum), state, primary_contact_id
- `properties`: has address_line1, city, state, zip, property_type, year_built, number_of_units, zoning
- `unified_deals`: has name, card_type_id, capital_side, asset_class, amount, primary_contact_id, company_id, property_id, uw_data JSONB

## Decisions Made
- Use `intake_items` as the new table name (not reusing `email_intake_queue`)
- The matching engine runs at ingestion time, not review time
- Entity merge is per-entity (4 independent decisions), not all-or-nothing
- Review UI is a Dialog (modal), not a Sheet (drawer)

## Gotchas Discovered
- `companies` table requires `company_type` enum - must handle when creating new companies
- `crm_contacts` has `contact_type` enum required field
- The kanban columns use dnd-kit with droppable zones keyed by stage name
- Pipeline stages are: lead, analysis, negotiation, execution, closed

## Dependencies
- Existing Gmail sync flow feeds `email_intake_queue`
- The new edge function bridges `email_intake_queue` -> `intake_items`

## Last Updated: 2026-03-11
## Next Steps: Create migration, then start building UI components
