"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function AuthenticatedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Authenticated page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">
        Failed to load this page
      </h2>
      <p className="text-sm text-muted-foreground max-w-md">
        An error occurred while loading. Please try again or contact support if
        the problem persists.
      </p>
      <Button onClick={reset} variant="outline" size="sm">
        Try again
      </Button>
    </div>
  );
}
