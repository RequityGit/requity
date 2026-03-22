"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { showError } from "@/lib/toast";

interface ActionCenterComposerProps {
  onPost: (body: string, isInternal: boolean) => Promise<{ error?: string; success?: boolean }>;
}

export function ActionCenterComposer({ onPost }: ActionCenterComposerProps) {
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async () => {
    const trimmed = body.trim();
    if (!trimmed || posting) return;

    setPosting(true);
    const result = await onPost(trimmed, isInternal);
    setPosting(false);

    if (result.error) {
      showError("Could not post note", result.error);
      return;
    }

    setBody("");
    textareaRef.current?.focus();
  }, [body, isInternal, posting, onPost]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="border-t bg-card px-4 py-3">
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a note..."
          className="min-h-[40px] max-h-[120px] resize-none text-[13px] flex-1 bg-transparent border-border"
          rows={1}
        />
        <div className="flex flex-col gap-1.5">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!body.trim() || posting}
            className="h-8 w-8 p-0"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
          <button
            type="button"
            onClick={() => setIsInternal(!isInternal)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md border rq-transition cursor-pointer",
              isInternal
                ? "border-amber-300 dark:border-amber-700 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "border-emerald-300 dark:border-emerald-700 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            )}
            title={isInternal ? "Internal note (not visible to borrower)" : "External note (visible to borrower)"}
          >
            {isInternal ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <Unlock className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-muted-foreground">
          {isInternal ? "Internal only" : "Visible to borrower"} · Cmd+Enter to send
        </span>
      </div>
    </div>
  );
}
