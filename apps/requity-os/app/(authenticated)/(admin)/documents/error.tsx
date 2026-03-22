"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function DocumentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load documents"
      description="There was a problem loading documents. This is usually temporary."
      reset={reset}
    />
  );
}
