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

  // Actions
  hydrate: (data: PipelineHydratePayload) => void;
  moveDeal: (dealId: string, newStage: UnifiedStage) => void;
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
      }),

    moveDeal: (dealId, newStage) =>
      set((state) => {
        const deal = state.deals.get(dealId);
        if (deal) {
          deal.stage = newStage;
          deal.stage_entered_at = new Date().toISOString();
        }
      }),

    updateDeal: (dealId, patch) =>
      set((state) => {
        const deal = state.deals.get(dealId);
        if (deal) Object.assign(deal, patch);
      }),

    addDeal: (deal) =>
      set((state) => {
        state.deals.set(deal.id, deal);
      }),

    removeDeal: (dealId) =>
      set((state) => {
        state.deals.delete(dealId);
      }),

    // Realtime patches are authoritative (server truth)
    applyRealtimeInsert: (deal) =>
      set((state) => {
        state.deals.set(deal.id, deal);
      }),

    applyRealtimeUpdate: (dealId, newRecord) =>
      set((state) => {
        state.deals.set(dealId, newRecord);
      }),

    applyRealtimeDelete: (dealId) =>
      set((state) => {
        state.deals.delete(dealId);
      }),
  }))
);
