"use client";

import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ErrorFallbackProps {
  title?: string;
  description?: string;
  reset?: () => void;
  backTo?: { label: string; href: string };
  compact?: boolean;
}

export function ErrorFallback({
  title = "Something went wrong",
  description = "An error occurred while loading this section. Try again, or navigate away and come back.",
  reset,
  backTo,
  compact = false,
}: ErrorFallbackProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-4" : "min-h-[40vh] px-6"
      )}
    >
      <div
        className={cn(
          "rounded-full bg-muted/60 p-3 mb-4",
          compact && "p-2 mb-3"
        )}
      >
        <AlertTriangle
          className={cn(
            "text-muted-foreground/60",
            compact ? "h-5 w-5" : "h-6 w-6"
          )}
          strokeWidth={1.5}
        />
      </div>
      <h3
        className={cn(
          "font-semibold text-foreground",
          compact ? "text-sm" : "text-base"
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "mt-1.5 max-w-sm text-muted-foreground",
          compact ? "text-xs" : "text-sm"
        )}
      >
        {description}
      </p>
      <div className="mt-4 flex items-center gap-3">
        {reset && (
          <Button variant="outline" size="sm" onClick={reset} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        )}
        {backTo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(backTo.href)}
            className="gap-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backTo.label}
          </Button>
        )}
      </div>
    </div>
  );
}
