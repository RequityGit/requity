"use client";

import { createClient } from "@/lib/supabase/client";
import { usePipelineStore } from "./pipeline-store";
import type { UnifiedDeal, UnifiedStage } from "@/components/pipeline/pipeline-types";
import {
  mergeUwData,
  getPropertySelectColumns,
  getBorrowerSelectColumns,
} from "@/lib/pipeline/resolve-uw-data";
import { daysInStage, getAlertLevel } from "@/components/pipeline/pipeline-types";
import type { RealtimeChannel } from "@supabase/supabase-js";

let channel: RealtimeChannel | null = null;

/**
 * Check if a realtime UPDATE requires re-fetching joined data.
 * Returns false for stage-only moves where FK references are unchanged,
 * avoiding 4 unnecessary DB queries on every drag-and-drop.
 */
function needsEnrichment(
  existing: UnifiedDeal,
  raw: Record<string, unknown>
): boolean {
  if (existing.primary_contact_id !== raw.primary_contact_id) return true;
  if (existing.property_id !== raw.property_id) return true;
  if (existing.company_id !== raw.company_id) return true;
  return false;
}

export function subscribeToPipeline() {
  if (channel) return; // Already subscribed

  const supabase = createClient();

  channel = supabase
    .channel("pipeline-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "unified_deals",
      },
      async (payload) => {
        const { eventType } = payload;
        const store = usePipelineStore.getState();

        switch (eventType) {
          case "INSERT": {
            const raw = payload.new as Record<string, unknown>;
            // Only add active/on_hold deals to the board
            if (raw.status !== "active" && raw.status !== "on_hold") return;
            const enriched = await enrichDeal(raw as unknown as UnifiedDeal);
            store.applyRealtimeInsert(enriched);
            break;
          }
          case "UPDATE": {
            const raw = payload.new as Record<string, unknown>;
            const id = raw.id as string;
            // If deal moved out of active/on_hold, remove from board
            if (raw.status !== "active" && raw.status !== "on_hold") {
              store.applyRealtimeDelete(id);
              return;
            }

            const existing = store.deals.get(id);

            // Fast path: if the deal exists and FK refs haven't changed
            // (e.g. stage move), skip expensive enrichment queries and
            // merge only the changed DB columns + recomputed derived fields.
            if (existing && !needsEnrichment(existing, raw)) {
              const days = daysInStage(raw.stage_entered_at as string);
              const stageConfigs = store.stageConfigs;
              const configMap = new Map(
                stageConfigs.map((sc) => [sc.stage, sc])
              );
              const config = configMap.get(raw.stage as UnifiedStage);
              const rawUwData = (raw.uw_data ?? {}) as Record<string, unknown>;
              store.applyRealtimeUpdate(id, {
                ...(raw as unknown as UnifiedDeal),
                // Preserve existing enriched joins (primary_contact, company, etc.)
                // applyRealtimeUpdate merges, so existing fields are kept
                uw_data: mergeUwData(rawUwData, null, null),
                days_in_stage: days,
                alert_level: getAlertLevel(days, config),
              });
              return;
            }

            // Slow path: FK refs changed or deal is new — full enrichment
            const enriched = await enrichDeal(raw as unknown as UnifiedDeal);
            store.applyRealtimeUpdate(id, enriched);
            break;
          }
          case "DELETE": {
            const id = (payload.old as { id: string }).id;
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

/**
 * Enrich a raw DB record with computed fields + resolved UW data.
 * Mirrors what page.tsx does server-side but for a single deal.
 */
async function enrichDeal(raw: UnifiedDeal): Promise<UnifiedDeal> {
  const supabase = createClient();
  const stageConfigs = usePipelineStore.getState().stageConfigs;
  const stageConfigMap = new Map(stageConfigs.map((sc) => [sc.stage, sc]));

  // Fetch joined contact + company data (realtime payload doesn't include joins)
  const [propertyRes, borrowerRes, contactRes, companyRes] = await Promise.all([
    raw.property_id
      ? supabase
          .from("properties")
          .select(getPropertySelectColumns())
          .eq("id", raw.property_id)
          .single()
      : Promise.resolve({ data: null }),
    raw.primary_contact_id
      ? supabase
          .from("borrowers")
          .select(getBorrowerSelectColumns())
          .eq("crm_contact_id", raw.primary_contact_id)
          .single()
      : Promise.resolve({ data: null }),
    raw.primary_contact_id
      ? supabase
          .from("crm_contacts")
          .select("id, first_name, last_name, email, phone")
          .eq("id", raw.primary_contact_id)
          .single()
      : Promise.resolve({ data: null }),
    raw.company_id
      ? supabase
          .from("companies")
          .select("id, name")
          .eq("id", raw.company_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const days = daysInStage(raw.stage_entered_at);
  const config = stageConfigMap.get(raw.stage);

  type Row = Record<string, unknown>;

  return {
    ...raw,
    uw_data: mergeUwData(
      raw.uw_data ?? {},
      (propertyRes.data as unknown as Row) ?? null,
      (borrowerRes.data as unknown as Row) ?? null
    ),
    primary_contact: (contactRes.data as unknown as UnifiedDeal["primary_contact"]) ?? null,
    company: (companyRes.data as unknown as UnifiedDeal["company"]) ?? null,
    days_in_stage: days,
    alert_level: getAlertLevel(days, config),
  };
}
