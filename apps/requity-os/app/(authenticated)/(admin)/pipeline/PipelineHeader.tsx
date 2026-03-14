"use client";

import { useState } from "react";
import { Copy, Check, Mail } from "lucide-react";

interface PipelineHeaderProps {
  intakeCount: number;
}

export function PipelineHeader({ intakeCount }: PipelineHeaderProps) {
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard?.writeText("intake@requitygroup.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 mb-6 md:mb-8 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-[-0.04em] text-foreground">Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Unified deal pipeline across debt and equity.
          {" "}Forward deals to{" "}
          <button
            onClick={copyEmail}
            className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400 hover:underline"
          >
            intake@requitygroup.com
            {copied ? (
              <Check className="inline h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="inline h-3 w-3 text-muted-foreground" />
            )}
          </button>
        </p>
      </div>
      {intakeCount > 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gradient-to-br from-amber-500 to-amber-600">
            <Mail className="h-3 w-3 text-black" />
          </div>
          <span className="text-xs text-amber-700 dark:text-amber-400">
            <strong>{intakeCount} intake item{intakeCount > 1 ? "s" : ""}</strong> ready for review
          </span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No pending intake. Processed items become deals in Lead. Forward another email to add one.
        </p>
      )}
    </div>
  );
}
