"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function ConditionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load conditions"
      description="There was a problem loading conditions. This is usually temporary."
      reset={reset}
    />
  );
}
