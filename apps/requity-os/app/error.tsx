"use client";

import { useEffect } from "react";

/**
 * Root segment error boundary. Next.js needs this for reliable error recovery
 * in dev; without it, the client can show "missing required error components,
 * refreshing..." and loop.
 *
 * Do not import @sentry/nextjs here: it pulls the Node SDK into the SSR bundle
 * and requires optional deps like @opentelemetry/api. global-error.tsx
 * handles Sentry for root-layout failures.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root segment error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-lg font-semibold text-foreground">
        Something went wrong
      </h2>
      <p className="max-w-md text-sm text-muted-foreground">
        An unexpected error occurred. Try again, or refresh the page.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        Try again
      </button>
    </div>
  );
}
