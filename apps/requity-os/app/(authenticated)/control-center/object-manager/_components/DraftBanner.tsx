"use client";

import { useState } from "react";
import { Check, X, Eye, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@repo/lib";

interface Props {
  dirtyCount: number;
  hasChanges: boolean;
  publishing: boolean;
  lastPublished: string | null;
  onPublish: () => void;
  onDiscard: () => void;
  onReviewChanges: () => void;
}

export function DraftBanner({
  dirtyCount,
  hasChanges,
  publishing,
  lastPublished,
  onPublish,
  onDiscard,
  onReviewChanges,
}: Props) {
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  if (!hasChanges && !lastPublished && !publishing) {
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" className="h-8 gap-1.5" variant="outline" disabled>
          <Check size={13} />
          Publish
        </Button>
      </div>
    );
  }

  if (!hasChanges && lastPublished) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">
          Published {lastPublished}
        </span>
        <Button size="sm" className="h-8 gap-1.5" variant="outline" disabled>
          <Check size={13} />
          Publish
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Change count badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-[10px] font-medium text-amber-600">
          {dirtyCount} unsaved {dirtyCount === 1 ? "change" : "changes"}
        </span>
      </div>

      {/* Review button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-[10px] gap-1"
        onClick={onReviewChanges}
      >
        <Eye size={11} />
        Review
      </Button>

      {/* Discard */}
      {showDiscardConfirm ? (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-destructive/10 border border-destructive/20">
          <AlertTriangle size={11} className="text-destructive" />
          <span className="text-[10px] text-destructive">Discard all?</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[9px] text-destructive hover:bg-destructive/20"
            onClick={() => {
              onDiscard();
              setShowDiscardConfirm(false);
            }}
          >
            Yes
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[9px]"
            onClick={() => setShowDiscardConfirm(false)}
          >
            No
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[10px] gap-1 text-muted-foreground"
          onClick={() => setShowDiscardConfirm(true)}
        >
          <X size={11} />
          Discard
        </Button>
      )}

      {/* Publish button */}
      <Button
        size="sm"
        className="h-8 gap-1.5"
        onClick={onPublish}
        disabled={publishing}
      >
        {publishing ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Check size={13} />
        )}
        {publishing ? "Publishing..." : "Publish"}
      </Button>
    </div>
  );
}
