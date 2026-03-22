"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { fetchActivityTabData } from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import type { DealActivity } from "@/components/pipeline/pipeline-types";
import type { ActivityData, EmailData } from "@/components/crm/contact-360/types";

// ── Timeline filter categories ──

export const TIMELINE_FILTER_TYPES = [
  "all",
  "email",
  "call",
  "note",
  "meeting",
  "system",
] as const;

export type TimelineFilter = (typeof TIMELINE_FILTER_TYPES)[number];

// System-level deal activity types from unified_deal_activity
export const SYSTEM_ACTIVITY_TYPES = new Set([
  "stage_change",
  "team_updated",
  "approval_requested",
  "closing_scheduled",
]);

// Map unified_deal_activity types to filter categories
export function mapDealActivityToFilter(type: string): TimelineFilter {
  if (SYSTEM_ACTIVITY_TYPES.has(type)) return "system";
  if (type === "call_logged") return "call";
  if (type === "email_sent") return "email";
  return "system";
}

// ── Timeline item type ──

export interface TimelineItem {
  id: string;
  kind: "deal_activity" | "activity" | "email";
  created_at: string;
  filterCategory: TimelineFilter;
  dealActivity?: DealActivity;
  activity?: ActivityData;
  email?: EmailData;
}

// ── Filter counts ──

export type TimelineFilterCounts = Record<TimelineFilter, number>;

// ── Hook options ──

interface UseUnifiedTimelineOptions {
  dealId: string;
  primaryContactId: string | null;
  enabled?: boolean;
}

// ── Hook ──

export function useUnifiedTimeline({
  dealId,
  primaryContactId,
  enabled = true,
}: UseUnifiedTimelineOptions) {
  const [dealActivities, setDealActivities] = useState<DealActivity[]>([]);
  const [crmActivities, setCrmActivities] = useState<ActivityData[]>([]);
  const [crmEmails, setCrmEmails] = useState<EmailData[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchRef = useRef(0);

  const fetchData = useCallback(
    async (silent?: boolean) => {
      const id = ++fetchRef.current;
      if (!silent) setLoading(true);

      try {
        const result = await fetchActivityTabData(dealId, primaryContactId);
        if (fetchRef.current !== id) return;

        if (!("error" in result) || !result.error) {
          setDealActivities(
            result.dealActivities as unknown as DealActivity[]
          );
          setCrmActivities(
            result.crmActivities as unknown as ActivityData[]
          );
          setCrmEmails(result.crmEmails as unknown as EmailData[]);
        }
      } catch {
        // Silently handle fetch errors — data just stays stale
      } finally {
        if (fetchRef.current === id) setLoading(false);
      }
    },
    [dealId, primaryContactId]
  );

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;
    fetchData();
  }, [fetchData, enabled]);

  // Build unified timeline
  const items = useMemo<TimelineItem[]>(() => {
    const result: TimelineItem[] = [];

    // Add deal-native activities (only system types to avoid duplicates with CRM)
    for (const da of dealActivities) {
      const filterCat = mapDealActivityToFilter(da.activity_type);
      if (
        SYSTEM_ACTIVITY_TYPES.has(da.activity_type) ||
        crmActivities.length === 0
      ) {
        result.push({
          id: `deal-${da.id}`,
          kind: "deal_activity",
          created_at: da.created_at,
          filterCategory: filterCat,
          dealActivity: da,
        });
      }
    }

    // Add CRM activities (calls, notes, meetings, etc.)
    for (const a of crmActivities) {
      const filterCat =
        a.activity_type === "text_message" ? "call" : a.activity_type;
      result.push({
        id: `activity-${a.id}`,
        kind: "activity",
        created_at: a.created_at,
        filterCategory: filterCat as TimelineFilter,
        activity: a,
      });
    }

    // Add CRM emails
    for (const e of crmEmails) {
      result.push({
        id: `email-${e.id}`,
        kind: "email",
        created_at: e.created_at,
        filterCategory: "email",
        email: e,
      });
    }

    result.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return result;
  }, [dealActivities, crmActivities, crmEmails]);

  // Counts per filter
  const counts = useMemo<TimelineFilterCounts>(() => {
    const c: TimelineFilterCounts = {
      all: 0,
      email: 0,
      call: 0,
      note: 0,
      meeting: 0,
      system: 0,
    };
    for (const item of items) {
      c.all++;
      const cat = item.filterCategory;
      if (cat in c) c[cat]++;
    }
    return c;
  }, [items]);

  return {
    items,
    loading,
    counts,
    refetch: fetchData,
  };
}
