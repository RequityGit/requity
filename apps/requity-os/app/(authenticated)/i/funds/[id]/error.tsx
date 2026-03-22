"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function InvestmentDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load investment"
      description="This investment may have been deleted, or there was a problem loading it."
      reset={reset}
      backTo={{ label: "Back to investments", href: "/i/funds" }}
    />
  );
}
