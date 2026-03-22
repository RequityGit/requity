"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function LoansError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load loans"
      description="There was a problem loading loans. This is usually temporary."
      reset={reset}
    />
  );
}
