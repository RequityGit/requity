# Realtime Pipeline Board — Implementation Prompt

## Objective

Transform the RequityOS pipeline board from a server-rendered, reload-on-change experience into a client-side-first, realtime board that feels instant. Deals should appear, move, and update live across all connected browsers without page refreshes. This is the foundation for every future speed and UX improvement on the portal.

---

## Current Architecture (What We're Changing)

### Data Flow Today
```
1. User navigates to /pipeline
2. Server component (page.tsx) runs 6 parallel Supabase queries:
   - unified_deals (with joins to crm_contacts, companies)
   - unified_stage_configs
   - unified_deal_relationships
   - unified_deal_activity
   - profiles (team members)
   - intake_items
3. Server bulk-fetches properties + borrowers, merges UW data
4. Server computes days_in_stage + alert_level for each deal
5. Full deal array passed as props to PipelineView (client component)
6. PipelineView renders PipelineKanban with all deals
```

### Stage Transition Today
```
1. User drags deal card to new stage column
2. PipelineKanban sets optimistic dealOverrides map
3. Calls advanceStageAction(dealId, newStage) — server action
4. Server action updates DB, calls revalidatePath("/pipeline")
5. Next.js re-runs the server component, re-fetches ALL data
6. Entire board re-renders with fresh props
7. dealOverrides entry cleared
```

### Problems
- **Full page data re-fetch on every stage change.** The server re-runs all 6 queries + 2 bulk fetches even though only one deal's stage changed.
- **No cross-browser sync.** If Luis moves a deal, Estefania doesn't see it until she refreshes.
- **Inline field saves trigger revalidatePath for structural changes.** Even though inline saves are optimistic, structural changes (add/remove deal) cause full pipeline re-render.
- **No incremental updates.** The board has no concept of "just this one deal changed." It's all-or-nothing.
- **Cold navigation.** Every visit to /pipeline waits for SSR. No cached client state.

---

## Target Architecture

### Core Concept: Zustand Store + Supabase Realtime

```
1. SSR seeds initial data (same queries, one time)
2. Client hydrates a Zustand store with SSR data
3. Supabase Realtime channel subscribes to unified_deals changes
4. INSERT/UPDATE/DELETE events patch the store incrementally
5. All components read from the store (not props)
6. Stage drags, inline edits, new deals — all update store optimistically,
   then the realtime subscription confirms/corrects
```

### Key Files to Create

```
stores/
  pipeline-store.ts          — Zustand store definition
  pipeline-realtime.ts       — Supabase realtime subscription manager

hooks/
  usePipelineStore.ts        — Typed selector hooks for components
  usePipelineRealtime.ts     — Hook that manages subscription lifecycle
```

### Key Files to Modify

```
app/(authenticated)/(admin)/pipeline/page.tsx
  — Still SSR fetches initial data
  — Passes to a new <PipelineProvider> that seeds the store

components/pipeline/PipelineView.tsx
  — Reads from store instead of props
  — Filters are store selectors (computed, not re-filtered on render)

components/pipeline/PipelineKanban.tsx
  — Reads deals-per-stage from store selectors
  — Stage drag calls store.moveDeal() which is optimistic + fires server action
  — Removes local dealOverrides state (store IS the override)

components/pipeline/DealCard.tsx
  — No changes needed (already memoized, receives deal as prop)

app/(authenticated)/(admin)/pipeline/actions.ts
  — advanceStageAction stays but NO LONGER calls revalidatePath
  — The realtime subscription handles sync instead
```

---

## Zustand Store Design

```typescript
// stores/pipeline-store.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { UnifiedDeal, StageConfig, UnifiedStage, DealActivity } from '@/components/pipeline/pipeline-types';
import type { IntakeItem } from '@/lib/intake/types';

interface PipelineState {
  // ─── Data ───
  deals: Map<string, UnifiedDeal>;          // keyed by deal.id for O(1) lookup
  stageConfigs: StageConfig[];
  relationshipDealIds: Set<string>;
  activities: DealActivity[];
  teamMembers: { id: string; full_name: string }[];
  intakeItems: IntakeItem[];
  currentUserId: string | null;

  // ─── Hydration ───
  hydrated: boolean;
  hydrate: (data: HydratePayload) => void;

  // ─── Deal Mutations (optimistic) ───
  moveDeal: (dealId: string, newStage: UnifiedStage) => void;
  updateDeal: (dealId: string, patch: Partial<UnifiedDeal>) => void;
  addDeal: (deal: UnifiedDeal) => void;
  removeDeal: (dealId: string) => void;

  // ─── Realtime Patches (from subscription) ───
  applyRealtimeInsert: (deal: UnifiedDeal) => void;
  applyRealtimeUpdate: (dealId: string, newRecord: UnifiedDeal) => void;
  applyRealtimeDelete: (dealId: string) => void;

  // ─── Computed (selectors, not stored) ───
}

interface HydratePayload {
  deals: UnifiedDeal[];
  stageConfigs: StageConfig[];
  relationshipDealIds: Set<string>;
  activities: DealActivity[];
  teamMembers: { id: string; full_name: string }[];
  intakeItems: IntakeItem[];
  currentUserId: string | null;
}

export const usePipelineStore = create<PipelineState>()(
  immer((set) => ({
    deals: new Map(),
    stageConfigs: [],
    relationshipDealIds: new Set(),
    activities: [],
    teamMembers: [],
    intakeItems: [],
    currentUserId: null,
    hydrated: false,

    hydrate: (data) => set((state) => {
      state.deals = new Map(data.deals.map(d => [d.id, d]));
      state.stageConfigs = data.stageConfigs;
      state.relationshipDealIds = data.relationshipDealIds;
      state.activities = data.activities;
      state.teamMembers = data.teamMembers;
      state.intakeItems = data.intakeItems;
      state.currentUserId = data.currentUserId;
      state.hydrated = true;
    }),

    moveDeal: (dealId, newStage) => set((state) => {
      const deal = state.deals.get(dealId);
      if (deal) {
        deal.stage = newStage;
        deal.stage_entered_at = new Date().toISOString();
      }
    }),

    updateDeal: (dealId, patch) => set((state) => {
      const deal = state.deals.get(dealId);
      if (deal) Object.assign(deal, patch);
    }),

    addDeal: (deal) => set((state) => {
      state.deals.set(deal.id, deal);
    }),

    removeDeal: (dealId) => set((state) => {
      state.deals.delete(dealId);
    }),

    // Realtime patches — these are authoritative (server truth)
    applyRealtimeInsert: (deal) => set((state) => {
      state.deals.set(deal.id, deal);
    }),

    applyRealtimeUpdate: (dealId, newRecord) => set((state) => {
      state.deals.set(dealId, newRecord);
    }),

    applyRealtimeDelete: (dealId) => set((state) => {
      state.deals.delete(dealId);
    }),
  }))
);
```

### Selector Hooks (Memoized, Minimal Re-renders)

```typescript
// hooks/usePipelineStore.ts

import { useMemo } from 'react';
import { usePipelineStore } from '@/stores/pipeline-store';
import type { UnifiedStage, UnifiedDeal } from '@/components/pipeline/pipeline-types';

// Returns deals for a specific stage, sorted by amount desc
// Only re-renders when deals in THIS stage change
export function useStageDeals(stageKey: UnifiedStage): UnifiedDeal[] {
  const deals = usePipelineStore((s) => s.deals);
  return useMemo(() => {
    const result: UnifiedDeal[] = [];
    for (const deal of deals.values()) {
      if (deal.stage === stageKey && (deal.status === 'active' || deal.status === 'on_hold')) {
        result.push(deal);
      }
    }
    return result.sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
  }, [deals, stageKey]);
}

// Returns a single deal by ID (for peek panel, detail prefetch)
export function useDeal(dealId: string): UnifiedDeal | undefined {
  return usePipelineStore((s) => s.deals.get(dealId));
}

// Returns stage totals for column headers
export function useStageTotals(): Map<UnifiedStage, { count: number; amount: number }> {
  const deals = usePipelineStore((s) => s.deals);
  return useMemo(() => {
    const totals = new Map<UnifiedStage, { count: number; amount: number }>();
    for (const deal of deals.values()) {
      if (deal.status !== 'active' && deal.status !== 'on_hold') continue;
      const current = totals.get(deal.stage) ?? { count: 0, amount: 0 };
      current.count++;
      current.amount += deal.amount ?? 0;
      totals.set(deal.stage, current);
    }
    return totals;
  }, [deals]);
}
```

---

## Supabase Realtime Subscription

```typescript
// stores/pipeline-realtime.ts

import { createClient } from '@/lib/supabase/client';
import { usePipelineStore } from './pipeline-store';
import type { UnifiedDeal } from '@/components/pipeline/pipeline-types';
import { mergeUwData } from '@/lib/pipeline/resolve-uw-data';
import { daysInStage, getAlertLevel } from '@/components/pipeline/pipeline-types';

let channel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null;

export function subscribeToPipeline() {
  if (channel) return; // Already subscribed

  const supabase = createClient();
  const store = usePipelineStore.getState();

  channel = supabase
    .channel('pipeline-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',                     // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'unified_deals',
        filter: 'status=in.(active,on_hold)',  // Only active pipeline deals
      },
      async (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        switch (eventType) {
          case 'INSERT': {
            // Enrich the new deal (fetch property/borrower if needed)
            const enriched = await enrichDeal(newRecord as UnifiedDeal);
            store.applyRealtimeInsert(enriched);
            break;
          }
          case 'UPDATE': {
            const enriched = await enrichDeal(newRecord as UnifiedDeal);
            store.applyRealtimeUpdate(enriched.id, enriched);
            break;
          }
          case 'DELETE': {
            const id = (oldRecord as { id: string }).id;
            store.applyRealtimeDelete(id);
            break;
          }
        }
      }
    )
    .subscribe();
}

export function unsubscribeFromPipeline() {
  if (channel) {
    channel.unsubscribe();
    channel = null;
  }
}

// Enrich a raw DB record with computed fields + resolved UW data
// This mirrors what page.tsx does server-side but for a single deal
async function enrichDeal(raw: UnifiedDeal): Promise<UnifiedDeal> {
  const supabase = createClient();
  const stageConfigs = usePipelineStore.getState().stageConfigs;
  const stageConfigMap = new Map(stageConfigs.map(sc => [sc.stage, sc]));

  // Fetch property + borrower if IDs present (parallel)
  const [propertyRes, borrowerRes] = await Promise.all([
    raw.property_id
      ? supabase.from('properties').select('*').eq('id', raw.property_id).single()
      : Promise.resolve({ data: null }),
    raw.primary_contact_id
      ? supabase.from('borrowers').select('*').eq('crm_contact_id', raw.primary_contact_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const days = daysInStage(raw.stage_entered_at);
  const config = stageConfigMap.get(raw.stage);

  return {
    ...raw,
    uw_data: mergeUwData(raw.uw_data, propertyRes.data, borrowerRes.data),
    days_in_stage: days,
    alert_level: getAlertLevel(days, config),
  };
}
```

---

## Provider Component (Hydration Bridge)

```typescript
// components/pipeline/PipelineProvider.tsx

'use client';

import { useEffect, useRef } from 'react';
import { usePipelineStore } from '@/stores/pipeline-store';
import { subscribeToPipeline, unsubscribeFromPipeline } from '@/stores/pipeline-realtime';
import type { UnifiedDeal, StageConfig, DealActivity } from './pipeline-types';
import type { IntakeItem } from '@/lib/intake/types';

interface Props {
  deals: UnifiedDeal[];
  stageConfigs: StageConfig[];
  activities: DealActivity[];
  relationshipDealIds: Set<string>;
  teamMembers: { id: string; full_name: string }[];
  intakeItems: IntakeItem[];
  currentUserId: string | null;
  children: React.ReactNode;
}

export function PipelineProvider({ children, ...data }: Props) {
  const hydrate = usePipelineStore((s) => s.hydrate);
  const hydrated = usePipelineStore((s) => s.hydrated);
  const hydratedRef = useRef(false);

  // Hydrate store with SSR data on first mount
  useEffect(() => {
    if (!hydratedRef.current) {
      hydrate(data);
      hydratedRef.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Start realtime subscription after hydration
  useEffect(() => {
    if (hydrated) {
      subscribeToPipeline();
      return () => unsubscribeFromPipeline();
    }
  }, [hydrated]);

  return <>{children}</>;
}
```

---

## Modified page.tsx (Minimal Change)

The server component stays almost identical. It still fetches data for SSR/SEO/initial paint. But now it wraps PipelineView in PipelineProvider:

```tsx
// app/(authenticated)/(admin)/pipeline/page.tsx
// ... existing imports and queries stay the same ...

return (
  <div className="space-y-6">
    <PipelineHeader intakeCount={intakeItems.length} />
    <PipelineProvider
      deals={deals}
      stageConfigs={stageConfigs}
      activities={activities}
      relationshipDealIds={relationshipDealIds}
      teamMembers={teamMembers}
      intakeItems={intakeItems}
      currentUserId={session.user.id}
    >
      <PipelineView />  {/* No more props — reads from store */}
    </PipelineProvider>
  </div>
);
```

---

## Modified PipelineKanban (Store-Driven)

Key changes:
1. Reads deals from store selectors instead of props
2. moveDeal is optimistic through the store (no local dealOverrides state)
3. advanceStageAction still fires but does NOT call revalidatePath
4. The realtime subscription will confirm the change

```tsx
// Drag end handler (simplified)
const handleDragEnd = useCallback(async (event: DragEndEvent) => {
  setActiveId(null);
  const { active, over } = event;
  if (!over) return;

  const dealId = active.id as string;
  const newStage = over.id as UnifiedStage;
  const deal = deals.get(dealId);
  if (!deal || deal.stage === newStage) return;

  // Optimistic — store updates, UI re-renders instantly
  moveDeal(dealId, newStage);

  // Fire server action (no revalidatePath, realtime handles sync)
  const result = await advanceStageAction(dealId, newStage);
  if (result.error) {
    // Revert — move back to original stage
    moveDeal(dealId, deal.stage);
    toast({ variant: 'destructive', title: 'Failed to move deal', description: result.error });
  } else {
    toast({ title: `${deal.name} moved to ${stageLabel}` });
  }
}, [deals, moveDeal, toast]);
```

---

## Modified actions.ts (Remove revalidatePath)

```typescript
// advanceStageAction — remove revalidatePath calls
// The realtime subscription on unified_deals will push the update to all clients

export async function advanceStageAction(dealId: string, newStage: string) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from('unified_deals')
      .update({
        stage: newStage,
        stage_entered_at: new Date().toISOString(),
      })
      .eq('id', dealId);

    if (error) return { error: error.message };

    // NO revalidatePath — realtime handles it
    // Log activity (keep this)
    await logStageChange(admin, dealId, newStage, auth.userId);

    return { success: true };
  } catch (err) {
    return { error: 'Failed to update stage' };
  }
}
```

---

## Supabase Realtime Setup Requirements

### Enable Realtime on unified_deals

```sql
-- Run via Supabase SQL editor or migration
ALTER PUBLICATION supabase_realtime ADD TABLE unified_deals;
```

### RLS Consideration
Supabase Realtime respects RLS. Since pipeline is admin-only, ensure the admin RLS policy on `unified_deals` covers SELECT for authenticated admin users. The existing policies should already handle this, but verify:

```sql
-- Verify this policy exists (or equivalent)
CREATE POLICY "Admins can read all unified_deals"
  ON unified_deals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );
```

---

## Performance Expectations

| Metric | Before (SSR) | After (Realtime Store) |
|--------|-------------|----------------------|
| Initial page load | Same | Same (SSR seeds store) |
| Stage drag feedback | ~200ms (optimistic + server round trip + revalidation flash) | <16ms (store update, single component re-render) |
| Cross-browser sync | Manual refresh only | <1 second (realtime push) |
| Filter change | Full array re-filter on render | Memoized selector, zero re-render on unaffected columns |
| New deal appears | Requires refresh | Auto-appears via realtime INSERT |
| Deal field edit | Optimistic + sometimes revalidation flash | Optimistic + realtime confirmation, zero flash |

---

## Implementation Phases

### Phase 1: Zustand Store + Hydration (No Realtime Yet)
1. Install zustand + immer middleware: `pnpm add zustand immer`
2. Create `stores/pipeline-store.ts` with full store definition
3. Create `hooks/usePipelineStore.ts` with selector hooks
4. Create `components/pipeline/PipelineProvider.tsx`
5. Modify `page.tsx` to wrap PipelineView in PipelineProvider
6. Modify `PipelineView.tsx` to read from store instead of props
7. Modify `PipelineKanban.tsx` to use store for deals + moveDeal
8. Modify `PipelineTable.tsx` to use store for deals
9. **Test:** Board should work identically to before, but state lives in Zustand
10. Run `pnpm build` — verify zero TypeScript errors

### Phase 2: Supabase Realtime Subscription
1. Enable realtime on `unified_deals` table
2. Create `stores/pipeline-realtime.ts` with subscription logic
3. Add `enrichDeal()` function for single-deal enrichment
4. Wire subscription into PipelineProvider (subscribe on hydrate, unsub on unmount)
5. Remove `revalidatePath` from `advanceStageAction` in actions.ts
6. Remove `revalidatePath` from `updateUwDataAction` (inline field saves)
7. Keep `revalidatePath` only for `createUnifiedDealAction` (new deal needs full server render for deal detail page cache)
8. **Test:** Open two browser tabs. Drag a deal in one. Verify it moves in the other within 1-2 seconds.
9. Run `pnpm build` — verify zero TypeScript errors

### Phase 3: Optimistic Inline Edits Through Store
1. Modify inline field save handlers to update store directly
2. Realtime UPDATE event confirms/corrects the optimistic value
3. Remove any remaining revalidateDeal / revalidatePath calls from inline save paths
4. **Test:** Edit a deal field inline. Verify no loading flash, no board re-render.

### Phase 4: Intake Items + Activities Realtime (Optional, Lower Priority)
1. Add realtime subscription for `intake_items` table
2. Add realtime subscription for `unified_deal_activity` table
3. New intake items appear in Lead column automatically
4. Activity feed updates live on deal detail pages

---

## Scope

### IN
- Zustand store for pipeline board state
- Supabase Realtime subscription on unified_deals
- Optimistic stage transitions through store
- Cross-browser live sync
- Removal of revalidatePath from stage/inline-edit actions
- Memoized per-stage selectors for minimal re-renders

### OUT (Future Work — Do Not Build Now)
- Slide-over peek panel (separate task)
- Keyboard navigation / command palette (separate task)
- Stage transition animations (separate task, after store is in place)
- Sound design (separate task)
- Presence indicators (separate task, uses Supabase presence channels)
- Velocity metrics widget (separate task)

---

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Realtime payload doesn't include joined data (primary_contact, company) | `enrichDeal()` fetches related data client-side for single deals. SSR bulk fetch handles initial load. |
| Stale store if user leaves tab open for hours | Add a `lastSyncAt` timestamp. On tab focus (visibilitychange), if >5 min stale, do a background full refresh into the store. |
| Race condition: optimistic update + realtime update arrive simultaneously | Realtime is authoritative. `applyRealtimeUpdate` always overwrites. Optimistic state is just temporary. |
| RLS blocks realtime for some users | Verify admin RLS policy covers SELECT. Test with a non-super-admin account. |
| Zustand + immer bundle size | Zustand is 1.1KB gzipped, immer is 5.9KB. Negligible. |
| Losing revalidatePath breaks deal detail page cache | Keep revalidateDealPaths for createUnifiedDealAction only. Deal detail pages can also adopt the store pattern later. |

---

## Success Criteria

1. Stage drag is visually instant (no flash, no loading state, no board re-render)
2. Two browser windows show the same board state within 2 seconds of any change
3. Inline field edits produce zero loading flash on the board
4. New deals appear on all connected clients without refresh
5. `pnpm build` passes with zero errors
6. No regressions in filter behavior, mobile table view, or intake card rendering
7. Deal detail page navigation still works (prefetch on hover preserved)

---

## Dependencies

- `zustand` (install)
- `immer` (install, for immutable store updates)
- Supabase Realtime enabled on `unified_deals` table (migration)
- No other new dependencies required

---

## Files Reference (Current State)

| File | Role |
|------|------|
| `app/(authenticated)/(admin)/pipeline/page.tsx` | SSR data fetch, passes props |
| `app/(authenticated)/(admin)/pipeline/actions.ts` | Server actions (create, advance, update) |
| `components/pipeline/PipelineView.tsx` | Client wrapper, filters, view toggle |
| `components/pipeline/PipelineKanban.tsx` | Kanban board with dnd-kit |
| `components/pipeline/PipelineTable.tsx` | Table view (mobile fallback) |
| `components/pipeline/DealCard.tsx` | Individual deal card (memoized) |
| `components/pipeline/DealFilters.tsx` | Filter bar component |
| `components/pipeline/pipeline-types.ts` | Types, constants, formatters |
| `lib/pipeline/resolve-uw-data.ts` | UW data merge logic |
| `lib/pipeline/deal-display-config.ts` | Deal flavor + card metric config |
| `lib/pipeline/revalidate-deal.ts` | Cache revalidation helpers |
| `hooks/useUwFieldConfigs.ts` | Field configuration client hook |
