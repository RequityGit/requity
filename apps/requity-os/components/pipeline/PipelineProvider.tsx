"use client";

import { useEffect, useRef, useMemo } from "react";
import {
  usePipelineStore,
  type PipelineHydratePayload,
} from "@/stores/pipeline-store";
import {
  subscribeToPipeline,
  unsubscribeFromPipeline,
} from "@/stores/pipeline-realtime";

interface PipelineProviderProps extends PipelineHydratePayload {
  children: React.ReactNode;
}

/**
 * Build a lightweight fingerprint from SSR deal data so we can detect
 * when Next.js re-renders the server component with meaningfully new data
 * (e.g. after a deal creation/deletion that triggers revalidatePath).
 */
function buildFingerprint(deals: PipelineHydratePayload["deals"]): string {
  // Sort by ID for stable comparison, then concatenate id:stage:sort_order
  return deals
    .map((d) => `${d.id}:${d.stage}:${d.sort_order ?? ""}`)
    .sort()
    .join("|");
}

export function PipelineProvider({
  children,
  ...data
}: PipelineProviderProps) {
  const hydrate = usePipelineStore((s) => s.hydrate);
  const hydrated = usePipelineStore((s) => s.hydrated);
  const draggingDealId = usePipelineStore((s) => s.draggingDealId);

  const fingerprint = useMemo(() => buildFingerprint(data.deals), [data.deals]);
  const lastFingerprintRef = useRef<string>("");

  // Hydrate store with SSR data on first mount, and re-hydrate when
  // server data changes meaningfully (e.g. deal created/deleted).
  // Skip re-hydration during active drag to avoid clobbering optimistic state.
  useEffect(() => {
    if (fingerprint !== lastFingerprintRef.current && !draggingDealId) {
      hydrate(data);
      lastFingerprintRef.current = fingerprint;
    }
  }, [fingerprint, draggingDealId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start realtime subscription after hydration
  useEffect(() => {
    if (hydrated) {
      subscribeToPipeline();
      return () => unsubscribeFromPipeline();
    }
  }, [hydrated]);

  return <>{children}</>;
}
