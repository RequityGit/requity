# Realtime Pipeline Board - Context

## Key Files
- `pipeline/page.tsx` - SSR entry, 6 parallel queries + bulk property/borrower fetch
- `pipeline/actions.ts` - Server actions, uses `revalidatePipeline()` helper
- `PipelineView.tsx` - Client orchestrator, filters, view toggle (kanban/table)
- `PipelineKanban.tsx` - DnD board, local `dealOverrides` Map for optimistic state
- `PipelineTable.tsx` - Table view, receives deals as props
- `DealCard.tsx` - Memoized card, receives deal as prop (no changes needed)
- `pipeline-types.ts` - All types (UnifiedDeal, StageConfig, etc.)
- `resolve-uw-data.ts` - mergeUwData() for property/borrower field overlay
- `revalidate-deal.ts` - revalidateDealPaths() helper

## Decisions Made
- Using Map<string, UnifiedDeal> for O(1) lookup in store
- immer middleware for immutable updates (Zustand recommends for Map/Set)
- Realtime subscription uses filter `status=in.(active,on_hold)` to match SSR query
- enrichDeal() fetches property + borrower client-side for realtime payloads
- PipelineView keeps filter state local (not in store) -- filters are UI-only

## Dependencies
- zustand ^5.0.11 (already installed)
- immer (needs install)
- Supabase Realtime (needs table publication)

## Last Updated: 2026-03-21
## Next Steps: Install immer, create store
