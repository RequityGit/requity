"use client";

import { useState, useEffect, useRef } from "react";
import { sopClient } from "@/lib/sops/client";
import type { SOPSearchResult } from "@/lib/sops/types";

export function useSOPSearch(debounceMs = 300) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SOPSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const supabase = sopClient();
        const { data, error } = await supabase.rpc("search_sops", {
          search_query: query.trim(),
          dept: "",
          cat: "",
        });
        if (error) throw error;
        setResults((data as SOPSearchResult[]) ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, debounceMs]);

  return { query, setQuery, results, loading };
}
