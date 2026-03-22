"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function LoanDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load loan"
      description="This loan may have been deleted, or there was a problem loading it."
      reset={reset}
      backTo={{ label: "Back to loans", href: "/loans" }}
    />
  );
}
