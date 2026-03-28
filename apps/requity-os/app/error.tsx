"use client";

/**
 * Root segment error boundary. Next.js needs this for reliable error recovery
 * in dev; without it, the client can show "missing required error components,
 * refreshing..." and loop.
 *
 * Do not import @sentry/nextjs here: it pulls the Node SDK into the SSR bundle
 * and requires optional deps like @opentelemetry/api. global-error.tsx
 * handles Sentry for root-layout failures.
 */

import { useEffect } from "react";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { isChunkLoadError, handleChunkLoadError } from "@/lib/chunk-error";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (isChunkLoadError(error)) {
      handleChunkLoadError();
    }
  }, [error]);

  return (
    <ErrorFallback
      title="Something went wrong"
      description="An unexpected error occurred. Try again, or refresh the page."
      reset={reset}
      backTo={{ label: "Go to dashboard", href: "/" }}
    />
  );
}
