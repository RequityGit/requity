"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function FundsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load funds"
      description="There was a problem loading the funds page. This is usually temporary."
      reset={reset}
    />
  );
}
