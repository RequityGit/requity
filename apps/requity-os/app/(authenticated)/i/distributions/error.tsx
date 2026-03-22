"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function DistributionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load distributions"
      description="There was a problem loading distributions. This is usually temporary."
      reset={reset}
      backTo={{ label: "Back to investments", href: "/i/funds" }}
    />
  );
}
