"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function ServicingDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load loan details"
      description="There was a problem loading this loan's details."
      reset={reset}
      backTo={{ label: "Back to servicing", href: "/servicing" }}
    />
  );
}
