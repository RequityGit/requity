"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load account"
      description="Something went wrong loading this page. Please try again."
      reset={reset}
    />
  );
}
