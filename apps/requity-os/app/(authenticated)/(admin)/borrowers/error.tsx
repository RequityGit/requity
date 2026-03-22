"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function BorrowersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load borrowers"
      description="There was a problem loading the borrowers page. This is usually temporary."
      reset={reset}
    />
  );
}
