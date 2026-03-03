"use client";

import { cn } from "@/lib/utils";
import { RELATIONSHIP_BADGE_COLORS, STATUS_CONFIG } from "./types";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus } from "lucide-react";

// ---------- Relationship Badge ----------
export function RelationshipBadge({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const colors = RELATIONSHIP_BADGE_COLORS[type];
  if (!colors) return null;

  const label = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: colors.dot }}
      />
      {label}
    </span>
  );
}

// ---------- Stage Pill ----------
export function StagePill({
  stage,
  className,
}: {
  stage: string;
  className?: string;
}) {
  const config = STATUS_CONFIG[stage] || STATUS_CONFIG.draft;
  const label = stage.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        className
      )}
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: config.dot }}
      />
      {label}
    </span>
  );
}

// ---------- Empty State ----------
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  const IconComponent = Icon || UserPlus;
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F7F7F8] mb-4">
        <IconComponent className="h-6 w-6 text-[#9A9A9A]" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">{title}</h3>
      <p className="text-sm text-[#6B6B6B] max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}

// ---------- Section Skeleton ----------
export function SectionSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-[#9A9A9A] font-medium">{label}</p>
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  );
}

// ---------- Timeline Event ----------
export function TimelineEvent({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  description,
  timestamp,
  actor,
  isLast,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  description?: string | null;
  timestamp: string;
  actor?: string | null;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-3 relative">
      {/* Connecting line */}
      {!isLast && (
        <div className="absolute left-4 top-9 bottom-0 w-px bg-[#E5E5E7]" />
      )}
      {/* Icon */}
      <div
        className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="h-4 w-4" style={{ color: iconColor }} strokeWidth={1.5} />
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0 pb-6">
        <p className="text-sm font-medium text-[#1A1A1A]">{title}</p>
        {description && (
          <p className="text-sm text-[#6B6B6B] mt-0.5 whitespace-pre-wrap">
            {description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 text-xs text-[#9A9A9A]">
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {new Date(timestamp).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {actor && (
            <>
              <span>by</span>
              <span className="text-[#6B6B6B]">{actor}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Mono Value (JetBrains Mono for numbers) ----------
export function MonoValue({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("tabular-nums", className)}
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {children}
    </span>
  );
}
