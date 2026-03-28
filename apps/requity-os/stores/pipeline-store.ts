"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  UnifiedDeal,
  StageConfig,
  DealActivity,
  UnifiedStage,
} from "@/components/pipeline/pipeline-types";
import type { IntakeItem } from "@/lib/intake/types";

// ─── Hydration Payload ───

export interface ConditionsProgress {
  completed: number;
  total: number;
}

export interface PipelineHydratePayload {
  deals: UnifiedDeal[];
  stageConfigs: StageConfig[];
  relationshipDealIds: Set<string>;
  activities: DealActivity[];
  teamMembers: { id: string; full_name: string }[];
  intakeItems: IntakeItem[];
  currentUserId: string | null;
  conditionsMap: Map<string, ConditionsProgress>;
}

// ─── Store Shape ───

interface PipelineState {
  // Data
  deals: Map<string, UnifiedDeal>;
  stageConfigs: StageConfig[];
  relationshipDealIds: Set<string>;
  activities: DealActivity[];
  teamMembers: { id: string; full_name: string }[];
  intakeItems: IntakeItem[];
  currentUserId: string | null;
  conditionsMap: Map<string, ConditionsProgress>;

  // Hydration flag
  hydrated: boolean;

  // Drag-in-progress guard — prevents realtime from overwriting optimistic state
  draggingDealId: string | null;

  // Version counter — increments on structural changes (add/remove/stage move/hydrate).
  // Sort-order-only changes do NOT bump this, so downstream selectors like
  // useAllDeals() skip expensive array rebuilds for reorder-only updates.
  dealsVersion: number;

  // Actions
  hydrate: (data: PipelineHydratePayload) => void;
  setDraggingDealId: (id: string | null) => void;
  moveDeal: (dealId: string, newStage: UnifiedStage) => void;
  reorderDeal: (orderedIds: string[], stage: UnifiedStage) => void;
  updateDeal: (dealId: string, patch: Partial<UnifiedDeal>) => void;
  addDeal: (deal: UnifiedDeal) => void;
  removeDeal: (dealId: string) => void;

  // Realtime patches (authoritative from server)
  applyRealtimeInsert: (deal: UnifiedDeal) => void;
  applyRealtimeUpdate: (dealId: string, newRecord: UnifiedDeal) => void;
  applyRealtimeDelete: (dealId: string) => void;
}

// ─── Store ───

export const usePipelineStore = create<PipelineState>()(
  immer((set) => ({
    deals: new Map(),
    stageConfigs: [],
    relationshipDealIds: new Set(),
    activities: [],
    teamMembers: [],
    intakeItems: [],
    currentUserId: null,
    conditionsMap: new Map(),
    hydrated: false,
    draggingDealId: null,
    dealsVersion: 0,

    setDraggingDealId: (id) =>
      set((state) => {
        state.draggingDealId = id;
      }),

    hydrate: (data) =>
      set((state) => {
        state.deals = new Map(data.deals.map((d) => [d.id, d]));
        state.stageConfigs = data.stageConfigs;
        state.relationshipDealIds = data.relationshipDealIds;
        state.activities = data.activities;
        state.teamMembers = data.teamMembers;
        state.intakeItems = data.intakeItems;
        state.currentUserId = data.currentUserId;
        state.conditionsMap = data.conditionsMap;
        state.hydrated = true;
        state.dealsVersion++;
      }),

    moveDeal: (dealId, newStage) =>
      set((state) => {
        const deal = state.deals.get(dealId);
        if (deal) {
          state.deals.set(dealId, {
            ...deal,
            stage: newStage,
            stage_entered_at: new Date().toISOString(),
          });
          state.dealsVersion++; // Stage change is structural
        }
      }),

    reorderDeal: (orderedIds, stage) =>
      set((state) => {
        orderedIds.forEach((id, index) => {
          const deal = state.deals.get(id);
          if (deal && deal.stage === stage) {
            state.deals.set(id, { ...deal, sort_order: index });
          }
        });
        state.dealsVersion++;
      }),

    updateDeal: (dealId, patch) =>
      set((state) => {
        const deal = state.deals.get(dealId);
        if (deal) {
          const stageChanged = patch.stage !== undefined && patch.stage !== deal.stage;
          state.deals.set(dealId, { ...deal, ...patch });
          if (stageChanged) state.dealsVersion++;
        }
      }),

    addDeal: (deal) =>
      set((state) => {
        state.deals.set(deal.id, deal);
        state.dealsVersion++; // Add is structural
      }),

    removeDeal: (dealId) =>
      set((state) => {
        state.deals.delete(dealId);
        state.dealsVersion++; // Remove is structural
      }),

    // Realtime patches are authoritative (server truth)
    applyRealtimeInsert: (deal) =>
      set((state) => {
        state.deals.set(deal.id, deal);
        state.dealsVersion++;
      }),

    applyRealtimeUpdate: (dealId, newRecord) =>
      set((state) => {
        // Skip realtime updates for the deal currently being dragged —
        // optimistic state takes priority until drag completes
        if (state.draggingDealId !== dealId) {
          const existing = state.deals.get(dealId);
          if (existing) {
            const stageChanged = newRecord.stage !== existing.stage;
            // Shallow merge: realtime fields overwrite, but existing fields
            // not present in the enrichment are preserved (e.g. broker_contact)
            state.deals.set(dealId, { ...existing, ...newRecord });
            if (stageChanged) state.dealsVersion++;
          } else {
            state.deals.set(dealId, newRecord);
            state.dealsVersion++;
          }
        }
      }),

    applyRealtimeDelete: (dealId) =>
      set((state) => {
        state.deals.delete(dealId);
        state.dealsVersion++;
      }),
  }))
);
