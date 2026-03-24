# DealCard V4 - Context

## Key Files
- `apps/requity-os/components/pipeline/DealCard.tsx` - Current card (replacing)
- `apps/requity-os/components/pipeline/PipelineKanban.tsx` - Parent that renders cards
- `apps/requity-os/components/pipeline/PipelineView.tsx` - View switcher, passes deals to kanban
- `apps/requity-os/components/pipeline/pipeline-types.ts` - Types (UnifiedDeal, StageConfig, etc.)
- `apps/requity-os/lib/pipeline/deal-display-config.ts` - getDealDisplayConfig, isCommercialAssetClass
- `apps/requity-os/app/(authenticated)/(admin)/pipeline/page.tsx` - Server component, data loading
- `apps/requity-os/stores/pipeline-store.ts` - Zustand store for pipeline data
- `apps/requity-os/hooks/usePipelineStore.ts` - Hook selectors for store

## Decisions Made
- Team members already in store as {id, full_name} - build Map in PipelineKanban
- broker_contact not currently fetched - need to add join to deals query in page.tsx
- Conditions counts fetched as aggregate in page.tsx, passed through store
- Property address from property_data.address or assembled from street_address/city/state/zip
- Property name from property_data.property_name or deal.name

## Gotchas Discovered
- The deals query uses `admin` client with `as never` casts (Supabase types workaround)
- broker_contact needs its own join: `broker_contact:crm_contacts!broker_contact_id(id, first_name, last_name, broker_company:crm_companies(name))`
- property_data is a JSONB field on unified_deals, not a joined table

## Dependencies
- Existing pipeline store hydration pattern
- deal_conditions table with deal_id, status, required_stage columns

## Last Updated: 2026-03-22
## Next Steps: Begin implementation Phase 1
