"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CommercialUWDataForUW } from "./UnderwritingTab";

interface CommercialUwDataResult {
  data: CommercialUWDataForUW | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCommercialUwData(dealId: string): CommercialUwDataResult {
  const [data, setData] = useState<CommercialUWDataForUW | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // Step 1: Fetch UW record
        const uwRes = await supabase
          .from("deal_commercial_uw" as never)
          .select("*")
          .eq("opportunity_id" as never, dealId as never)
          .order("version" as never, { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!mountedRef.current) return;

        const uwRecord = (uwRes as unknown as { data: Record<string, unknown> | null }).data;
        if (!uwRecord) {
          // No UW record yet -- trigger auto-init via server action and retry
          try {
            const { ensureCommercialUW } = await import(
              "@/app/(authenticated)/(admin)/pipeline/[id]/commercial-uw-actions"
            );
            await ensureCommercialUW(dealId);
          } catch {
            // Server action may fail if not available client-side; fall through
          }

          // Retry fetch after ensure
          const retryRes = await supabase
            .from("deal_commercial_uw" as never)
            .select("*")
            .eq("opportunity_id" as never, dealId as never)
            .order("version" as never, { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!mountedRef.current) return;

          const retryRecord = (retryRes as unknown as { data: Record<string, unknown> | null }).data;
          if (!retryRecord) {
            setData(null);
            setLoading(false);
            return;
          }

          // Fetch sub-tables with the retry record
          await fetchSubTables(supabase, retryRecord);
          return;
        }

        await fetchSubTables(supabase, uwRecord);
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to load underwriting data");
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [dealId]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchSubTables = useCallback(async (supabase: any, uwRecord: Record<string, unknown>) => {
    const uwId = uwRecord.id as string;

    const [incomeRes, expensesRes, rentRollRes, scopeRes, suRes, debtRes, waterfallRes, versionsRes] =
      await Promise.all([
        supabase.from("deal_commercial_income").select("*").eq("uw_id", uwId).order("sort_order"),
        supabase.from("deal_commercial_expenses").select("*").eq("uw_id", uwId).order("sort_order"),
        supabase.from("deal_commercial_rent_roll").select("*").eq("uw_id", uwId).order("sort_order"),
        supabase.from("deal_commercial_scope_of_work").select("*").eq("uw_id", uwId).order("sort_order"),
        supabase.from("deal_commercial_sources_uses").select("*").eq("uw_id", uwId).order("sort_order"),
        supabase.from("deal_commercial_debt").select("*").eq("uw_id", uwId).order("sort_order"),
        supabase.from("deal_commercial_waterfall").select("*").eq("uw_id", uwId).order("tier_order"),
        supabase
          .from("deal_commercial_uw")
          .select("id, version, status, created_at, created_by")
          .eq("opportunity_id", dealId)
          .order("version", { ascending: false }),
      ]);

    if (!mountedRef.current) return;

    setData({
      uw: uwRecord,
      income: incomeRes.data ?? [],
      expenses: expensesRes.data ?? [],
      rentRoll: rentRollRes.data ?? [],
      scopeOfWork: scopeRes.data ?? [],
      sourcesUses: suRes.data ?? [],
      debt: debtRes.data ?? [],
      waterfall: waterfallRes.data ?? [],
      allVersions: versionsRes.data ?? [],
    });
  }, [dealId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return { data, loading, error, refetch: () => fetchData(true) };
}
