"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedTaskProps {
  children: React.ReactNode;
  isCompleting: boolean;
  onCollapseComplete: () => void;
}

export function AnimatedTask({
  children,
  isCompleting,
  onCollapseComplete,
}: AnimatedTaskProps) {
  const [phase, setPhase] = useState<"idle" | "highlight" | "collapsing" | "done">("idle");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCompleting) {
      setPhase("idle");
      return;
    }

    setPhase("highlight");

    const highlightTimer = setTimeout(() => {
      setPhase("collapsing");
    }, 1200);

    return () => clearTimeout(highlightTimer);
  }, [isCompleting]);

  useEffect(() => {
    if (phase !== "collapsing") return;

    const collapseTimer = setTimeout(() => {
      setPhase("done");
      onCollapseComplete();
    }, 500);

    return () => clearTimeout(collapseTimer);
  }, [phase, onCollapseComplete]);

  if (phase === "done") return null;

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all",
        phase === "highlight" && "bg-green-50 dark:bg-green-950/20 rounded-lg",
        phase === "collapsing" &&
          "max-h-0 opacity-0 my-0 overflow-hidden bg-green-50 dark:bg-green-950/20 rounded-lg"
      )}
      style={
        phase === "collapsing"
          ? {
              transitionProperty: "max-height, opacity, margin",
              transitionDuration: "500ms",
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            }
          : phase === "highlight"
            ? { maxHeight: "200px" }
            : undefined
      }
    >
      {children}
    </div>
  );
}
