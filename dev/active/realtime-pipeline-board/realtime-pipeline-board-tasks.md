# Realtime Pipeline Board - Tasks

## Phase 1: Zustand Store + Hydration
- [x] Install immer
- [x] Create stores/pipeline-store.ts
- [x] Create hooks/usePipelineStore.ts
- [x] Create components/pipeline/PipelineProvider.tsx
- [x] Modify page.tsx to use PipelineProvider
- [x] Modify PipelineView.tsx to read from store
- [x] Modify PipelineKanban.tsx to use store (removed dealOverrides, uses store.moveDeal)
- [x] PipelineTable.tsx unchanged (still receives deals as props from PipelineView)
- [x] pnpm typecheck passes (0 errors across all 7 packages)

## Phase 2: Supabase Realtime
- [x] Migration: 20260327000000_enable_realtime_unified_deals.sql
- [x] Create stores/pipeline-realtime.ts (with enrichDeal for single-deal client-side enrichment)
- [x] Wire realtime into PipelineProvider (subscribe on hydrate, unsub on unmount)
- [x] Remove revalidatePath("/pipeline") from advanceStageAction (kept revalidateDealPaths)
- [x] Remove revalidatePath("/pipeline") from regressStageAction (kept revalidateDealPaths)
- [x] Remove revalidatePath("/pipeline") from updateUwDataAction (kept revalidateDealPaths)
- [x] pnpm typecheck passes (0 errors)

## Phase 3: Remaining (out of scope for now)
- [ ] Tab visibility stale-check (visibilitychange > 5min = background refresh)
- [ ] Intake items realtime subscription
- [ ] Activity feed realtime subscription

## Blockers
- None

## Last Updated: 2026-03-21
