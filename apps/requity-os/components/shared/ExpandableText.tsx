"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ExpandableTextProps {
  text: string;
  /** Max lines before clamping. Default 5 */
  maxLines?: number;
  className?: string;
}

/**
 * Renders text with a line-clamp and Show more / Show less toggle.
 * Uses a ref to detect whether the content is actually clamped.
 */
export function ExpandableText({
  text,
  maxLines = 5,
  className,
}: ExpandableTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    if (ref.current) {
      setIsClamped(ref.current.scrollHeight > ref.current.clientHeight);
    }
  }, [text]);

  const clampClass =
    maxLines === 5 ? "line-clamp-5" : `line-clamp-[${maxLines}]`;

  return (
    <div className={cn("mt-1.5", className)}>
      <p
        ref={ref}
        className={cn(
          "text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap break-words",
          !expanded && clampClass
        )}
      >
        {text}
      </p>
      {isClamped && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-1 text-[11px] font-medium text-primary hover:underline"
        >
          Show more
        </button>
      )}
      {expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-1 text-[11px] font-medium text-primary hover:underline"
        >
          Show less
        </button>
      )}
    </div>
  );
}
