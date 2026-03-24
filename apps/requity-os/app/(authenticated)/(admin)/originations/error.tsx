"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function OriginationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load originations"
      description="Something went wrong loading this page. Please try again."
      reset={reset}
    />
  );
}
