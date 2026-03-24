"use client";

import type { VisibilityCondition } from "@/lib/visibility-engine";
import { hasCondition, assetClassLabel } from "@/lib/visibility-engine";

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
            ? condition.asset_class.map((v) => v.slice(0, 3).toUpperCase()).join("|")
            : condition.asset_class.map(assetClassLabel).join(" | ")}
        </span>
      )}
      {condition.conditions && Object.keys(condition.conditions).length > 0 && (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-400/10 text-indigo-400">
          {compact
            ? Object.entries(condition.conditions)
                .map(([, v]) => (v ?? []).join("|"))
                .join("+")
            : Object.entries(condition.conditions)
                .map(([k, v]) => `${k}: ${(v ?? []).join(" | ")}`)
                .join(" + ")}
        </span>
      )}
    </span>
  );

  if (onClick) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="inline-flex"
      >
        {content}
      </button>
    );
  }

  return content;
}
