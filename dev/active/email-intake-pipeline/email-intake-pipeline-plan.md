# Email Intake Pipeline Integration - Implementation Plan

## Objective
Replace the standalone `/pipeline/intake` page with an integrated intake flow inside the existing Pipeline kanban. Emails forwarded to `intake@requitygroup.com` get parsed, matched against existing CRM records, and surface in the Lead column with entity-level merge controls.

## Scope
- IN: New `intake_items` table with parsed_data + auto_matches, intake cards in Lead column, review modal with entity merge decisions, processing server action, edge function for email parsing + matching, removal of old intake page
- OUT: Gmail sync mechanism (already exists), attachment extraction (already handled by existing `email_intake_queue`), changes to the DSCR/RTL/Comm Debt card type system

## Key Discovery: Existing System
The existing system uses `email_intake_queue` with a flat extraction model. The new system introduces:
1. A new `intake_items` table with 4-entity structured parsing + match results
2. Entity-level (contact, company, property, opportunity) new/merge decisions
3. Field-level comparison and merge UI
4. Inline display in Pipeline kanban Lead column

## Approach

### Phase 1: Schema
- Create `intake_items` migration with parsed_data JSONB, auto_matches JSONB, status, decisions columns
- RLS: admin/super_admin only (matches existing email_intake_queue pattern)

### Phase 2: Edge Function
- New `process-intake-email` edge function
- Receives email webhook (or called from existing Gmail sync)
- Uses AI to parse email body + attachments into structured 4-entity format
- Runs matching engine against crm_contacts, companies, properties, unified_deals
- Stores results in intake_items

### Phase 3: Pipeline UI Integration
- Modify `PipelineView` to accept intake items
- Modify `PipelineKanban` to render intake cards in Lead column
- New `IntakeCard` component with amber border, INTAKE badge, entity match pills
- Intake banner in pipeline header showing count
- Email callout button with copy-to-clipboard

### Phase 4: Review Modal
- New `IntakeReviewModal` (Dialog, not Sheet) with:
  - Header with intake badge, time ago, subject, from email
  - Extracted fields grid
  - 4 entity sections (Contact, Company, Property, Opportunity)
  - Each entity: New/Merge toggle, field-level comparison when merge selected
  - Conflict resolution (pick existing/incoming/keep both for phone/email)
  - Action summary + Confirm & Process button

### Phase 5: Processing Action
- Server action `processIntakeItemAction` that:
  - For "new" entities: INSERT into crm_contacts, companies, properties, unified_deals
  - For "merge" entities: UPDATE existing records with field decisions
  - Links relationships (contact <-> company <-> property <-> deal)
  - Marks intake_item as processed

### Phase 6: Cleanup
- Remove `/pipeline/intake` page
- Remove sidebar nav entry for Intake
- Remove old IntakeQueue and IntakeReviewSheet components (or repurpose)

## Files to Modify
### New Files
- `packages/db/supabase/migrations/YYYYMMDD_create_intake_items.sql`
- `packages/db/supabase/functions/process-intake-email/index.ts`
- `apps/requity-os/components/pipeline-v2/IntakeCard.tsx`
- `apps/requity-os/components/pipeline-v2/IntakeReviewModal.tsx`
- `apps/requity-os/components/pipeline-v2/IntakeBanner.tsx`
- `apps/requity-os/components/pipeline-v2/EntityMergeSection.tsx`
- `apps/requity-os/components/pipeline-v2/FieldMergeRow.tsx`
- `apps/requity-os/lib/intake/matching-engine.ts`
- `apps/requity-os/lib/intake/types.ts`

### Modified Files
- `apps/requity-os/app/(authenticated)/admin/pipeline-v2/page.tsx` - fetch intake_items
- `apps/requity-os/app/(authenticated)/admin/pipeline-v2/actions.ts` - add processIntakeItemAction
- `apps/requity-os/components/pipeline-v2/PipelineView.tsx` - accept + pass intake items
- `apps/requity-os/components/pipeline-v2/PipelineKanban.tsx` - render intake cards in Lead
- `apps/requity-os/components/layout/sidebar.tsx` - remove Intake nav entry

### Removed Files
- `apps/requity-os/app/(authenticated)/admin/pipeline/intake/page.tsx`
- `apps/requity-os/components/pipeline-v2/IntakeQueue.tsx` (old)
- `apps/requity-os/components/pipeline-v2/IntakeReviewSheet.tsx` (old)

## Database Changes
- New `intake_items` table with RLS
- No changes to existing tables

## Risks
- Matching engine accuracy depends on data quality in CRM
- Edge function cold start time for AI parsing
- Field merge logic for "keep both" only applies to contact phone/email

## Success Criteria
- Intake items appear inline in Pipeline Lead column
- Users can review and merge/create entities from a single modal
- All conflicts must be resolved before processing
- Old intake page is fully removed
- Build passes with no TypeScript errors
