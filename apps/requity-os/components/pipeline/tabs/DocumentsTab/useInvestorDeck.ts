import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { showError } from "@/lib/toast";
import type { InvestorDeckData } from "@/lib/docgen/types";

interface UseInvestorDeckReturn {
  deck: InvestorDeckData | null;
  loading: boolean;
  saving: boolean;
  updateField: (field: string, value: unknown) => void;
  saveNow: () => Promise<void>;
  createDraft: () => Promise<InvestorDeckData | null>;
  reload: () => Promise<void>;
}

export function useInvestorDeck(dealId: string): UseInvestorDeckReturn {
  const [deck, setDeck] = useState<InvestorDeckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const pendingRef = useRef<Record<string, unknown>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("deal_investor_decks" as never)
        .select("*")
        .eq("deal_id" as never, dealId as never)
        .order("version" as never, { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setDeck((data as unknown as InvestorDeckData) ?? null);
    } catch (err) {
      showError("Could not load investor deck", err);
    } finally {
      setLoading(false);
    }
  }, [dealId, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const flush = useCallback(async () => {
    if (!deck?.id || Object.keys(pendingRef.current).length === 0) return;

    setSaving(true);
    try {
      const updates = { ...pendingRef.current };
      pendingRef.current = {};

      const { error } = await supabase
        .from("deal_investor_decks" as never)
        .update(updates as never)
        .eq("id" as never, deck.id as never);

      if (error) throw error;
    } catch (err) {
      showError("Could not save investor deck", err);
    } finally {
      setSaving(false);
    }
  }, [deck?.id, supabase]);

  const scheduleSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      flush();
    }, 2000);
  }, [flush]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (Object.keys(pendingRef.current).length > 0) {
        flush();
      }
    };
  }, [flush]);

  const updateField = useCallback(
    (field: string, value: unknown) => {
      setDeck((prev) => (prev ? { ...prev, [field]: value } : prev));
      pendingRef.current[field] = value;
      scheduleSave();
    },
    [scheduleSave]
  );

  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    await flush();
  }, [flush]);

  const createDraft = useCallback(async (): Promise<InvestorDeckData | null> => {
    setSaving(true);
    try {
      const nextVersion = (deck?.version ?? 0) + 1;

      if (deck?.id) {
        await supabase
          .from("deal_investor_decks" as never)
          .update({ status: "superseded" } as never)
          .eq("id" as never, deck.id as never);
      }

      const { data, error } = await supabase
        .from("deal_investor_decks" as never)
        .insert({
          deal_id: dealId,
          version: nextVersion,
          status: "draft",
        } as never)
        .select()
        .single();

      if (error) throw error;
      const newDeck = data as unknown as InvestorDeckData;
      setDeck(newDeck);
      return newDeck;
    } catch (err) {
      showError("Could not create investor deck draft", err);
      return null;
    } finally {
      setSaving(false);
    }
  }, [dealId, deck, supabase]);

  return { deck, loading, saving, updateField, saveNow, createDraft, reload: load };
}
