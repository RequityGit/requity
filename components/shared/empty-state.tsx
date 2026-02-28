"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center max-w-[400px] mx-auto py-16",
        className
      )}
    >
      <Icon className="h-12 w-12 text-surface-muted mb-4" strokeWidth={1.5} />
      <h3 className="font-display text-2xl text-surface-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-surface-gray font-body mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-gold text-navy-deep hover:bg-gold-light font-semibold text-sm px-5 py-2.5 rounded-md transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
