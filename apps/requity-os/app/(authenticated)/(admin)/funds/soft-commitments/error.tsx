"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load soft commitments"
      description={error.message}
      backTo={{ label: "Back to Funds", href: "/funds" }}
      reset={reset}
    />
  );
}
