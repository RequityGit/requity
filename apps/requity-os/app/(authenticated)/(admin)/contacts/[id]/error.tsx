"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function ContactDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load contact"
      description="This contact may have been deleted, or there was a problem loading it."
      reset={reset}
      backTo={{ label: "Back to contacts", href: "/contacts" }}
    />
  );
}
