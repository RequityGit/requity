"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function AuthenticatedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Failed to load this page"
      description="An error occurred while loading. Please try again or contact support if the problem persists."
      reset={reset}
      backTo={{ label: "Go to dashboard", href: "/" }}
    />
  );
}
