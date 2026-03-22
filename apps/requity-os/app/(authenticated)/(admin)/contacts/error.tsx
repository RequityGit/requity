"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function ContactsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load contacts"
      description="There was a problem loading contacts. This is usually temporary."
      reset={reset}
    />
  );
}
