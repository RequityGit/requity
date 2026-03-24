"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function BorrowerPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load borrower portal"
      description="There was a problem loading the borrower portal. This is usually temporary."
      reset={reset}
    />
  );
}
