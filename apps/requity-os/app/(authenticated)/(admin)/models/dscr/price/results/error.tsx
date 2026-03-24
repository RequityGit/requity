"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function ResultsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load results"
      description="Something went wrong loading this page. Please try again."
      reset={reset}
    />
  );
}
