"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function PipelineError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load pipeline"
      description="There was a problem loading the pipeline board. This is usually temporary."
      reset={reset}
    />
  );
}
