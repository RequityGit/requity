"use client";

import { useImpersonation } from "./impersonation-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Wraps interactive elements to disable them during impersonation mode.
 * When impersonating, shows a tooltip explaining why the action is disabled.
 */
export function ReadOnlyGuard({ children }: { children: React.ReactNode }) {
  const { isImpersonating } = useImpersonation();

  if (!isImpersonating) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="opacity-50 pointer-events-none cursor-not-allowed">
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>View-only while impersonating</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Hook to check if current session is in impersonation (read-only) mode.
 * Useful for conditionally hiding write actions in client components.
 */
export function useReadOnly() {
  const { isImpersonating } = useImpersonation();
  return isImpersonating;
}
