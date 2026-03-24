# Realtime Pipeline Board - Implementation Plan

## Objective
Transform the pipeline board from server-rendered reload-on-change to a client-side-first realtime board using Zustand + Supabase Realtime.

## Scope
- IN: Zustand store, Supabase Realtime on unified_deals, optimistic stage transitions, cross-browser sync, removal of revalidatePath from stage/inline-edit actions
- OUT: Slide-over peek panel, keyboard nav, stage animations, sound, presence indicators, velocity metrics

## Approach

### Phase 1: Zustand Store + Hydration
1. Install immer middleware
2. Create pipeline-store.ts with Map-based deal storage
3. Create selector hooks for per-stage deals, single deal lookup, stage totals
4. Create PipelineProvider to bridge SSR data into store
5. Modify PipelineView, PipelineKanban, PipelineTable to read from store
6. Remove dealOverrides local state from PipelineKanban (store IS the override)

### Phase 2: Supabase Realtime
1. Enable realtime on unified_deals table (migration)
2. Create pipeline-realtime.ts subscription manager
3. Add enrichDeal() for single-deal client-side enrichment
4. Wire subscription into PipelineProvider
5. Remove revalidatePath from advanceStageAction and regressStageAction
6. Keep revalidatePath only for createUnifiedDealAction

## Files to Create
- stores/pipeline-store.ts
- hooks/usePipelineStore.ts
- components/pipeline/PipelineProvider.tsx
- stores/pipeline-realtime.ts
- Migration: enable realtime on unified_deals

## Files to Modify
- app/(authenticated)/(admin)/pipeline/page.tsx
- components/pipeline/PipelineView.tsx
- components/pipeline/PipelineKanban.tsx
- components/pipeline/PipelineTable.tsx
- app/(authenticated)/(admin)/pipeline/actions.ts

## Risks
- Realtime payload missing joined data (primary_contact, company) -- enrichDeal() handles this
- Stale store on long-open tabs -- visibilitychange handler refreshes after 5min
- Race between optimistic + realtime -- realtime is authoritative, always overwrites

## Success Criteria
1. Stage drag visually instant (no flash)
2. Two browser windows sync within 2 seconds
3. Inline edits produce zero loading flash
4. pnpm build passes with zero errors
