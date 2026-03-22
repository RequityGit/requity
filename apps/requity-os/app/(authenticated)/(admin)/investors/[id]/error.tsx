"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function InvestorDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load investor"
      description="This investor record may have been deleted, or there was a problem loading it."
      reset={reset}
      backTo={{ label: "Back to investors", href: "/investors" }}
    />
  );
}
