"use client";

import { cn } from "@/lib/utils";
import {
  FileText,
  ArrowRight,
  Upload,
  DollarSign,
  UserPlus,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  link?: string;
}

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  stage_change: ArrowRight,
  document_uploaded: Upload,
  loan_created: FileText,
  note_added: FileText,
  assignment_change: UserPlus,
  terms_modified: DollarSign,
  default: Clock,
};

interface ActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-surface-muted py-8 text-center">
        No recent activity
      </p>
    );
  }

  return (
    <div className={cn("space-y-0", className)}>
      {activities.map((activity, i) => {
        const Icon = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.default;
        const isLast = i === activities.length - 1;

        return (
          <div key={activity.id} className="flex gap-3 relative">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[15px] top-8 bottom-0 w-px bg-navy-light" />
            )}
            {/* Icon */}
            <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-navy-light flex items-center justify-center">
              <Icon className="h-3.5 w-3.5 text-gold" />
            </div>
            {/* Content */}
            <div className="flex-1 pb-4">
              <p className="text-sm text-surface-offwhite font-body leading-snug">
                {activity.description}
              </p>
              <p className="text-xs text-surface-muted mt-1 font-body">
                {formatRelativeTime(activity.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
