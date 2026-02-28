"use client";

import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  message?: string;
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({
  message = "Loading...",
  rows = 3,
  className,
}: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-sm text-surface-muted font-body">{message}</p>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton-shimmer h-12 rounded-md"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="card-cinematic">
      <div className="skeleton-shimmer h-3 w-20 rounded mb-3" />
      <div className="skeleton-shimmer h-8 w-32 rounded mb-2" />
      <div className="skeleton-shimmer h-3 w-24 rounded" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <div className="skeleton-shimmer h-10 rounded-md" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton-shimmer h-14 rounded-md"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
