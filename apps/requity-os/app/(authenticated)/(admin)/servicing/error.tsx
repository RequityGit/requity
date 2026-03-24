"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function ServicingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load servicing"
      description="There was a problem loading the servicing page. This is usually temporary."
      reset={reset}
    />
  );
}
