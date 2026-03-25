"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDealPreview } from "./DealPreviewProvider";
import type { UnifiedDeal, DealCondition, DealActivity } from "../pipeline-types";
import type { DealTeamContact } from "@/app/types/deal-team";

// ─── Types ───

export interface DealNote {
  id: string;
  body: string;
  author_id: string;
  author_name: string | null;
  is_internal: boolean;
  is_pinned: boolean | null;
  mentions: string[] | null;
  created_at: string;
  parent_note_id: string | null;
}

export interface DealTeamMember {
  id: string;
  deal_id: string;
  profile_id: string;
  role: string;
  created_at: string;
}

export interface DealPreviewData {
  deal: UnifiedDeal;
  conditions: DealCondition[];
  notes: DealNote[];
  activity: DealActivity[];
  teamMembers: DealTeamMember[];
  teamContacts: DealTeamContact[];
}

// ─── Fetcher ───

const supabaseRef = { current: null as ReturnType<typeof createClient> | null };

function getSupabase() {
  if (!supabaseRef.current) supabaseRef.current = createClient();
  return supabaseRef.current;
}

export async function fetchDealPreview(dealId: string): Promise<DealPreviewData> {
  const supabase = getSupabase();

  const [dealRes, conditionsRes, notesRes, activityRes, teamMembersRes, teamContactsRes] =
    await Promise.all([
      supabase
        .from("unified_deals")
        .select(
          `*, primary_contact:crm_contacts!unified_deals_primary_contact_id_fkey(id, first_name, last_name, email, phone, company_name), broker_contact:crm_contacts!unified_deals_broker_contact_id_fkey(id, first_name, last_name, email, phone, company_name), company:companies!unified_deals_company_id_fkey(id, name)`
        )
        .eq("id", dealId)
        .single(),
      supabase
        .from("unified_deal_conditions" as never)
        .select("*" as never)
        .eq("deal_id" as never, dealId as never)
        .order("sort_order" as never, { ascending: true }),
      supabase
        .from("notes" as never)
        .select(
          "id, body, author_id, author_name, is_internal, is_pinned, mentions, created_at, parent_note_id" as never
        )
        .eq("deal_id" as never, dealId as never)
        .is("deleted_at" as never, null as never)
        .is("unified_condition_id" as never, null as never)
        .is("parent_note_id" as never, null as never)
        .order("created_at" as never, { ascending: false })
        .limit(20),
      supabase
        .from("unified_deal_activity" as never)
        .select("*" as never)
        .eq("deal_id" as never, dealId as never)
        .order("created_at" as never, { ascending: false })
        .limit(20),
      supabase
        .from("deal_team_members" as never)
        .select("id, deal_id, profile_id, role, created_at" as never)
        .eq("deal_id" as never, dealId as never)
        .order("created_at" as never),
      supabase
        .from("deal_team_contacts" as never)
        .select(
          "*, contact:crm_contacts!deal_team_contacts_contact_id_fkey(id, first_name, last_name, email, phone, company_name), company:companies!deal_team_contacts_company_id_fkey(id, name)" as never
        )
        .eq("deal_id" as never, dealId as never)
        .order("sort_order" as never, { ascending: true }),
    ]);

  if (dealRes.error) throw dealRes.error;

  // Compute days_in_stage
  const deal = { ...(dealRes.data as unknown as UnifiedDeal) };
  if (deal.stage_entered_at) {
    const entered = new Date(deal.stage_entered_at).getTime();
    deal.days_in_stage = Math.floor((Date.now() - entered) / 86_400_000);
  }

  return {
    deal,
    conditions: ((conditionsRes.data as unknown) ?? []) as DealCondition[],
    notes: ((notesRes.data as unknown) ?? []) as DealNote[],
    activity: ((activityRes.data as unknown) ?? []) as DealActivity[],
    teamMembers: ((teamMembersRes.data as unknown) ?? []) as DealTeamMember[],
    teamContacts: ((teamContactsRes.data as unknown) ?? []) as DealTeamContact[],
  };
}

// ─── Hook ───

interface UseDealPreviewDataReturn {
  data: DealPreviewData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<DealPreviewData | null>>;
}

export function useDealPreviewData(): UseDealPreviewDataReturn {
  const {
    selectedDealId,
    isOpen,
    getCached,
    setCache,
    dealIds,
    currentIndex,
    prefetchDealId,
    setPrefetchDealId,
  } = useDealPreview();

  const [data, setData] = useState<DealPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  // Track which deal we last fetched to avoid flicker
  const fetchingRef = useRef<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch selected deal
  useEffect(() => {
    if (!selectedDealId || !isOpen) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Check cache synchronously via the ref (avoids stale getCached closure)
    const cached = getCached(selectedDealId);
    if (cached) {
      setData(cached);
      setError(null);
      setLoading(false);
      return;
    }

    // Already fetching this deal
    if (fetchingRef.current === selectedDealId) return;

    let cancelled = false;
    fetchingRef.current = selectedDealId;
    setLoading(true);
    setError(null);

    fetchDealPreview(selectedDealId)
      .then((result) => {
        if (cancelled || !mountedRef.current) return;
        setCache(selectedDealId, result);
        setData(result);
        setLoading(false);
        fetchingRef.current = null;
      })
      .catch((err) => {
        if (cancelled || !mountedRef.current) return;
        setError(err?.message ?? "Failed to load deal");
        setLoading(false);
        fetchingRef.current = null;
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDealId, isOpen, getCached, setCache]);

  // Prefetch next 2 deals when cycling
  useEffect(() => {
    if (!isOpen || currentIndex < 0) return;

    const toPrefetch = dealIds.slice(currentIndex + 1, currentIndex + 3);
    toPrefetch.forEach((id) => {
      if (!getCached(id)) {
        fetchDealPreview(id)
          .then((result) => {
            if (mountedRef.current) setCache(id, result);
          })
          .catch(() => {
            // silent prefetch failure
          });
      }
    });
  }, [currentIndex, isOpen, dealIds, getCached, setCache]);

  // Handle hover prefetch from kanban
  useEffect(() => {
    if (!prefetchDealId) return;
    if (getCached(prefetchDealId)) {
      setPrefetchDealId(null);
      return;
    }

    fetchDealPreview(prefetchDealId)
      .then((result) => {
        if (mountedRef.current) setCache(prefetchDealId, result);
      })
      .catch(() => {
        // silent prefetch failure
      })
      .finally(() => {
        if (mountedRef.current) setPrefetchDealId(null);
      });
  }, [prefetchDealId, getCached, setCache, setPrefetchDealId]);

  const refetch = useCallback(async () => {
    if (!selectedDealId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDealPreview(selectedDealId);
      if (mountedRef.current) {
        setCache(selectedDealId, result);
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError((err as Error)?.message ?? "Failed to load deal");
        setLoading(false);
      }
    }
  }, [selectedDealId, setCache]);

  return { data, loading, error, refetch, setData };
}
