"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function CapitalcallsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load capital calls"
      description="Something went wrong loading this page. Please try again."
      reset={reset}
    />
  );
}
