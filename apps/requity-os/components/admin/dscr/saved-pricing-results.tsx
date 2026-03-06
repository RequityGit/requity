"use client";

import { PricingResults } from "./pricing-results";
import { useRouter } from "next/navigation";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function SavedPricingResults({ run }: { run: any }) {
  const router = useRouter();
  const results = run.results;

  if (!results || !results.products) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No pricing results available for this run.
      </div>
    );
  }

  return (
    <PricingResults
      results={results}
      pricingRunId={run.id}
      onBack={() => router.push("/admin/models/dscr?tab=pipeline")}
    />
  );
}
