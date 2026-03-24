"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function EditError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load edit"
      description="Something went wrong loading this page. Please try again."
      reset={reset}
    />
  );
}
