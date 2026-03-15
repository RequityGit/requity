"use client";

import type { DealCondition } from "@/components/pipeline/pipeline-types";

interface ConditionsTabProps {
  conditions: DealCondition[];
  dealId: string;
}

export function ConditionsTab({ conditions, dealId }: ConditionsTabProps) {
  return (
    <div className="space-y-4 p-4">
      <p className="text-muted-foreground text-sm">
        Conditions for this deal. {conditions.length} condition(s).
      </p>
      {conditions.length === 0 && (
        <p className="text-muted-foreground text-sm">No conditions yet.</p>
      )}
    </div>
  );
}
