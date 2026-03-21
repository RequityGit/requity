"use client";

import { SectionCard } from "@/components/pipeline/tabs/financials/shared";
import { DollarSign } from "lucide-react";

export function CostsReturnsSection() {
  return (
    <SectionCard title="Costs & Returns" icon={DollarSign}>
      <div className="rq-empty-state">
        <p className="font-medium">Costs & Returns</p>
        <p className="text-sm text-muted-foreground mt-1">Coming in Sprint 2</p>
      </div>
    </SectionCard>
  );
}
