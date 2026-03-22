"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function InvestorPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load investor portal"
      description="There was a problem loading the investor portal. This is usually temporary."
      reset={reset}
    />
  );
}
