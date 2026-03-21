"use client";

import { useState, useEffect, useRef } from "react";

const cache = new Map<string, unknown>();

export type Company360Scope = "overview" | "activities" | "files" | "tasks" | "notes";

export function useCompany360Lazy<T>(
  companyId: string,
  scope: Company360Scope,
  enabled: boolean
): { data: T | null; loading: boolean; error: string | null; refresh: () => void } {
  const key = `${companyId}:${scope}`;
  const [data, setData] = useState<T | null>(() => (cache.get(key) as T | null) ?? null);
  const [loading, setLoading] = useState(() => enabled && !cache.has(key));
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = async () => {
    if (!enabled || !companyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/crm/companies/${encodeURIComponent(companyId)}/tab-data?scope=${scope}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || `Request failed (${res.status})`);
      }
      const json = (await res.json()) as T;
      cache.set(key, json);
      if (mounted.current) setData(json);
    } catch (e) {
      if (mounted.current) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    mounted.current = true;
    if (!enabled || !companyId) {
      setLoading(false);
      return;
    }
    if (cache.has(key)) {
      setData(cache.get(key) as T);
      setLoading(false);
      return;
    }
    void load();
    return () => {
      mounted.current = false;
    };
  }, [companyId, scope, enabled]);

  return {
    data,
    loading,
    error,
    refresh: () => {
      cache.delete(key);
      void load();
    },
  };
}
