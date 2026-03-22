"use client";

import { useEffect, useRef } from "react";
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

export function PipelineProvider({
  children,
  ...data
}: PipelineProviderProps) {
  const hydrate = usePipelineStore((s) => s.hydrate);
  const hydrated = usePipelineStore((s) => s.hydrated);
  const hydratedRef = useRef(false);

  // Hydrate store with SSR data on first mount
  useEffect(() => {
    if (!hydratedRef.current) {
      hydrate(data);
      hydratedRef.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Start realtime subscription after hydration
  useEffect(() => {
    if (hydrated) {
      subscribeToPipeline();
      return () => unsubscribeFromPipeline();
    }
  }, [hydrated]);

  return <>{children}</>;
}
