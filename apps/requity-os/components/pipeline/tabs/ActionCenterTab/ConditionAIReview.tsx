"use client";

import {
  Check,
  X,
  HelpCircle,
  AlertTriangle,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConditionReviewData } from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";

interface ConditionAIReviewProps {
  review: ConditionReviewData;
  onRetrigger: () => void;
  isRetriggering: boolean;
}

const RECOMMENDATION_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  approve: {
    bg: "bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
    label: "Approve",
  },
  request_revision: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    label: "Needs Revision",
  },
  needs_manual_review: {
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    label: "Manual Review",
  },
};

const RESULT_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  pass: { icon: Check, color: "text-green-500" },
  fail: { icon: X, color: "text-red-500" },
  unclear: { icon: HelpCircle, color: "text-amber-500" },
};

export function ConditionAIReview({
  review,
  onRetrigger,
  isRetriggering,
}: ConditionAIReviewProps) {
  const recStyle = RECOMMENDATION_STYLES[review.recommendation] ?? RECOMMENDATION_STYLES.approve;

  return (
    <div className="border-b p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="rq-micro-label">Document Analysis</span>
        </div>
        <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold", recStyle.bg, recStyle.text)}>
          {recStyle.label}
        </span>
      </div>

      {/* Summary */}
      {review.summary && (
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          {review.summary}
        </p>
      )}

      {/* Criteria checklist */}
      {review.criteria_results && review.criteria_results.length > 0 && (
        <div className="space-y-1.5">
          {review.criteria_results.map((cr, i) => {
            const ri = RESULT_ICONS[cr.result] ?? RESULT_ICONS.unclear;
            const ResultIcon = ri.icon;
            return (
              <div key={i} className="flex items-start gap-2">
                <ResultIcon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", ri.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium">{cr.criterion}</p>
                  {cr.detail && (
                    <p className="text-[11px] text-muted-foreground">{cr.detail}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Flags */}
      {review.flags && review.flags.length > 0 && (
        <div className="space-y-1.5">
          {review.flags.map((flag, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5"
            >
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
              <p className="text-[11px] text-amber-700 dark:text-amber-300">{flag}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reasoning (collapsed) */}
      {review.recommendation_reasoning && (
        <details className="group">
          <summary className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground rq-transition">
            View reasoning
          </summary>
          <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
            {review.recommendation_reasoning}
          </p>
        </details>
      )}

      {/* Re-analyze button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2.5 text-[11px] text-muted-foreground"
        onClick={onRetrigger}
        disabled={isRetriggering}
      >
        <RotateCw className={cn("h-3 w-3 mr-1.5", isRetriggering && "animate-spin")} />
        Re-analyze
      </Button>
    </div>
  );
}
