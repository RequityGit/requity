"use client";

import { SectionCard } from "@/components/pipeline/tabs/financials/shared";
import { Users } from "lucide-react";

export function BorrowerEligibilitySection() {
  return (
    <SectionCard title="Borrower & Eligibility" icon={Users}>
      <div className="rq-empty-state">
        <p className="font-medium">Borrower & Eligibility</p>
        <p className="text-sm text-muted-foreground mt-1">Coming in Sprint 2</p>
      </div>
    </SectionCard>
  );
}
