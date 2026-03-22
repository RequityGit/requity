"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function OperationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load operations"
      description="There was a problem loading operations. This is usually temporary."
      reset={reset}
    />
  );
}
