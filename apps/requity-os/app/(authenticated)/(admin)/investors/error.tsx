"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function InvestorsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load investors"
      description="There was a problem loading the investors page. This is usually temporary."
      reset={reset}
    />
  );
}
