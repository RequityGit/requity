"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function DialerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load dialer"
      description="There was a problem loading the dialer. This is usually temporary."
      reset={reset}
    />
  );
}
