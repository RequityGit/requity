# Performance Sprint 1 - Context

## Key Files Modified (Phase 1)

| File | Change |
|------|--------|
| lib/pipeline/revalidate-deal.ts | Removed revalidatePath("/pipeline") - deal detail actions no longer bust kanban cache |
| app/(authenticated)/(admin)/pipeline/[id]/actions.ts | Removed revalidateDeal from 7 inline save functions |
| components/crm/contacts-view.tsx | Added useDebounce(contactSearch, 300) for search filtering + URL params |
| components/crm/companies-view.tsx | Added useDebounce(companySearch, 300) for search filtering |
| hooks/useDealMessages.ts | Added visibilitychange listener to pause/resume 10s polling |
| app/(public)/upload/[token]/SecureUploadClient.tsx | Added visibilitychange to both 60s link data and 15s message polling |
| hooks/useActivityTracker.ts | Added visibilitychange to pause/resume 30s flush interval |

## Decisions Made

1. revalidateDealPaths no longer touches /pipeline. The kanban has its own revalidatePipeline() in pipeline/actions.ts for stage moves, creates, deletes.
2. Structural changes on deals (add/remove contacts, documents) still call revalidateDealPaths for the deal detail page only.
3. Debounce value of 300ms chosen as standard for search. The existing useDebounce hook was already in the codebase but unused by CRM views.
4. Visibility pause pattern: clear interval on hidden, fetch immediately + restart interval on visible.

## Gotchas Discovered

1. The revalidate-deal.ts function makes a DB query to look up deal_number for slug-based revalidation. This runs even for inline saves. Removing revalidation from inline saves also eliminates this unnecessary DB call.
2. There is a duplicate file "revalidate-deal 2.ts" with old /admin/pipeline paths. Should be cleaned up.
3. The contacts-view URL param update was also running on every keystroke (not just the filter). Now debounced.

## Phase 2 Key Files Modified

| File | Change |
|------|--------|
| app/(authenticated)/(admin)/pipeline/page.tsx | Narrowed unified_stage_configs to 6 cols, unified_deal_activity to 8 cols, intake_items to explicit list |
| app/(authenticated)/(admin)/pipeline/[id]/page.tsx | Narrowed unified_stage_configs to 6 cols, unified_deal_documents to explicit list |
| app/(authenticated)/(admin)/contacts/[id]/page.tsx | Narrowed crm_contacts to 31 cols, crm_activities to 10 cols, crm_emails to 15 cols, contact_relationship_types to 10 cols |
| app/(authenticated)/(admin)/companies/[id]/page.tsx | Narrowed companies to 28 cols, crm_activities to 9 cols, company_files to 9 cols, ops_tasks to 10 cols (from ~45), notes to 5 cols, company_wire_instructions to 8 cols |

## Phase 2 Decisions

5. Deal detail page queries already well-parallelized (Promise.all with 12 + 8 queries). No further parallelization needed.
6. ops_tasks on Contact 360 left as select("*") because OpsTask type consumes ~45 fields. On Company 360, narrowed to 10 cols.
7. Commercial UW sub-tables left as select("*") -- editing tables need all columns.
8. unified_deals left as select("*") -- UnifiedDeal type uses nearly every column.
9. FieldConfigProvider consolidation deferred to Phase 4.

## Phase 3 Key Files

| Area | Files |
|------|--------|
| CRM lists | `components/crm/contacts-view.tsx`, `companies-view.tsx` (page state, PAGE_SIZE 50, slice filtered rows, pagination bar) |
| Contact 360 API | `app/api/crm/contacts/[contactId]/tab-data/route.ts` |
| Company 360 API | `app/api/crm/companies/[companyId]/tab-data/route.ts` |
| Lazy hooks | `hooks/useContact360Lazy.ts`, `hooks/useCompany360Lazy.ts` |
| Pages | `app/(authenticated)/(admin)/contacts/[id]/page.tsx`, `companies/[id]/page.tsx` (SSR counts + core data only) |
| Clients | `contact-360/contact-detail-client.tsx`, `company-360/company-detail-client.tsx` and tab sections |

## Last Updated: 2026-03-21
## Next Steps: Phase 4 - Realtime messaging, auth snapshot cookie, virtualization, DB indexes
