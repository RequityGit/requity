"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function DealError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load deal"
      description="This deal may have been deleted, or there was a problem loading it."
      reset={reset}
      backTo={{ label: "Back to pipeline", href: "/pipeline" }}
    />
  );
}
