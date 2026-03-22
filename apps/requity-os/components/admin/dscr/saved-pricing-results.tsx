"use client";

import { PricingResults } from "./pricing-results";
import { useRouter } from "next/navigation";
import { BarChart2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function SavedPricingResults({ run }: { run: any }) {
  const router = useRouter();
  const results = run.results;

  if (!results || !results.products) {
    return (
      <EmptyState icon={BarChart2} title="No pricing results available for this run." />
    );
  }

  return (
    <PricingResults
      results={results}
      pricingRunId={run.id}
      onBack={() => router.push("/models/dscr?tab=pipeline")}
    />
  );
}
