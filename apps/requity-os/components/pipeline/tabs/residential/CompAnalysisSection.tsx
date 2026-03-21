"use client";

import { SectionCard } from "@/components/pipeline/tabs/financials/shared";
import { Building2 } from "lucide-react";

export function CompAnalysisSection() {
  return (
    <SectionCard title="Comp Analysis" icon={Building2}>
      <div className="rq-empty-state">
        <p className="font-medium">Comp Analysis</p>
        <p className="text-sm text-muted-foreground mt-1">Coming in Sprint 3</p>
      </div>
    </SectionCard>
  );
}
