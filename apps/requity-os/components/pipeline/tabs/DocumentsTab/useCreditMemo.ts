import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { showError } from "@/lib/toast";
import type { CreditMemoData } from "@/lib/docgen/types";

interface UseCreditMemoReturn {
  memo: CreditMemoData | null;
  loading: boolean;
  saving: boolean;
  updateField: (field: string, value: unknown) => void;
  saveNow: () => Promise<void>;
  createDraft: () => Promise<void>;
  reload: () => Promise<void>;
}

export function useCreditMemo(dealId: string): UseCreditMemoReturn {
  const [memo, setMemo] = useState<CreditMemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const pendingRef = useRef<Record<string, unknown>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("deal_credit_memos" as never)
        .select("*")
        .eq("deal_id" as never, dealId as never)
        .order("version" as never, { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setMemo((data as unknown as CreditMemoData) ?? null);
    } catch (err) {
      showError("Could not load credit memo", err);
    } finally {
      setLoading(false);
    }
  }, [dealId, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  // Flush pending changes to Supabase
  const flush = useCallback(async () => {
    if (!memo?.id || Object.keys(pendingRef.current).length === 0) return;

    setSaving(true);
    try {
      const updates = { ...pendingRef.current };
      pendingRef.current = {};

      const { error } = await supabase
        .from("deal_credit_memos" as never)
        .update(updates as never)
        .eq("id" as never, memo.id as never);

      if (error) throw error;
    } catch (err) {
      showError("Could not save credit memo", err);
    } finally {
      setSaving(false);
    }
  }, [memo?.id, supabase]);

  // Debounced save
  const scheduleSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      flush();
    }, 2000);
  }, [flush]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      // Fire-and-forget final save
      if (Object.keys(pendingRef.current).length > 0) {
        flush();
      }
    };
  }, [flush]);

  const updateField = useCallback(
    (field: string, value: unknown) => {
      setMemo((prev) => (prev ? { ...prev, [field]: value } : prev));
      pendingRef.current[field] = value;
      scheduleSave();
    },
    [scheduleSave]
  );

  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    await flush();
  }, [flush]);

  const createDraft = useCallback(async () => {
    setSaving(true);
    try {
      const nextVersion = (memo?.version ?? 0) + 1;

      // If there's an existing memo, mark it superseded
      if (memo?.id) {
        await supabase
          .from("deal_credit_memos" as never)
          .update({ status: "superseded" } as never)
          .eq("id" as never, memo.id as never);
      }

      const { data, error } = await supabase
        .from("deal_credit_memos" as never)
        .insert({
          deal_id: dealId,
          version: nextVersion,
          status: "draft",
        } as never)
        .select()
        .single();

      if (error) throw error;
      setMemo(data as unknown as CreditMemoData);
    } catch (err) {
      showError("Could not create credit memo draft", err);
    } finally {
      setSaving(false);
    }
  }, [dealId, memo, supabase]);

  return { memo, loading, saving, updateField, saveNow, createDraft, reload: load };
}
