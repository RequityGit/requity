import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const POLL_INTERVAL_MS = 8000;
const MAX_POLL_DURATION_MS = 5 * 60 * 1000; // Stop polling after 5 minutes

export function useDocumentReviewStatus(
  dealId: string,
  documentStatuses?: (string | null)[]
) {
  const router = useRouter();
  const supabase = createClient();
  const pollStartRef = useRef<number | null>(null);

  // Realtime subscription
  useEffect(() => {
    if (!dealId) return;

    const channel = supabase
      .channel(`doc-review-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "document_reviews",
          filter: `deal_id=eq.${dealId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, supabase, router]);

  // Polling fallback for in-flight documents
  useEffect(() => {
    const hasInFlight = documentStatuses?.some(
      (s) => s === "pending" || s === "processing"
    );

    if (!hasInFlight) {
      pollStartRef.current = null;
      return;
    }

    if (!pollStartRef.current) {
      pollStartRef.current = Date.now();
    }

    const interval = setInterval(() => {
      if (
        pollStartRef.current &&
        Date.now() - pollStartRef.current > MAX_POLL_DURATION_MS
      ) {
        clearInterval(interval);
        return;
      }
      router.refresh();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [documentStatuses, router]);
}
