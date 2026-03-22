"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function ControlCenterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load control center"
      description="There was a problem loading the control center. This is usually temporary."
      reset={reset}
    />
  );
}
