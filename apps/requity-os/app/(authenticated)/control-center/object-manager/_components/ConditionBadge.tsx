"use client";

import type { VisibilityCondition } from "@/lib/visibility-engine";
import { hasCondition } from "@/lib/visibility-engine";

interface Props {
  condition: VisibilityCondition | null | undefined;
  onClick?: () => void;
  compact?: boolean;
}

export function ConditionBadge({ condition, onClick, compact }: Props) {
  if (!condition || !hasCondition(condition)) return null;

  const content = (
    <span className="inline-flex gap-1 items-center">
      {condition.asset_class && condition.asset_class.length > 0 && (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-500">
          {compact
            ? condition.asset_class.map((v) => v.slice(0, 3)).join("|")
            : condition.asset_class.join(" | ")}
        </span>
      )}
      {condition.loan_type && condition.loan_type.length > 0 && (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-400/10 text-indigo-400">
          {compact
            ? condition.loan_type.join("|")
            : condition.loan_type.join(" | ")}
        </span>
      )}
    </span>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="inline-flex">
        {content}
      </button>
    );
  }

  return content;
}
