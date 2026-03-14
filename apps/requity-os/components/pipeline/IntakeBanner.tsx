"use client";

import { useState } from "react";
import { Mail, Forward, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IntakeItem } from "@/lib/intake/types";

interface IntakeBannerProps {
  items: IntakeItem[];
}

export function IntakeBanner({ items }: IntakeBannerProps) {
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard?.writeText("intake@requitygroup.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const withMerges = items.filter(
    (i) => Object.values(i.auto_matches).some(Boolean)
  ).length;

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Pending count banner */}
      {items.length > 0 && (
        <div className="flex items-center gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gradient-to-br from-amber-500 to-amber-600">
            <Mail className="h-3 w-3 text-black" />
          </div>
          <span className="text-xs text-amber-700 dark:text-amber-400">
            <strong>{items.length} intake item{items.length > 1 ? "s" : ""}</strong> ready for review
            {withMerges > 0 && (
              <span className="text-amber-600/60 dark:text-amber-500/60">
                {" "}&middot; {withMerges} with possible merges
              </span>
            )}
          </span>
        </div>
      )}

      {/* Forward email callout */}
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-2 border-amber-500/20 hover:border-amber-500/40 text-xs"
        onClick={copyEmail}
      >
        <Forward className="h-3.5 w-3.5 text-amber-600" />
        <span className="text-muted-foreground">Forward deals to</span>
        <span className="font-semibold text-amber-600 dark:text-amber-400">
          {copied ? "Copied!" : "intake@requitygroup.com"}
        </span>
        {copied ? (
          <Check className="h-3 w-3 text-emerald-500" />
        ) : (
          <Copy className="h-3 w-3 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}
