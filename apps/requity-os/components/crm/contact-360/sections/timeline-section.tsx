"use client";

import { useState, forwardRef } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { UnifiedNotes } from "@/components/shared/UnifiedNotes";
import { DetailActivityTab } from "../tabs/detail-activity-tab";
import type { ActivityData, EmailData } from "../types";

type TimelineFilter = "notes" | "activity";

interface Props {
  contactId: string;
  activities: ActivityData[];
  emails: EmailData[];
  currentUserId: string;
  onComposeEmail?: () => void;
  logCallTrigger?: number;
}

const FILTERS: { value: TimelineFilter; label: string }[] = [
  { value: "notes", label: "Notes" },
  { value: "activity", label: "Activity" },
];

export const TimelineSection = forwardRef<HTMLDivElement, Props>(
  function TimelineSection(
    { contactId, activities, emails, currentUserId, onComposeEmail, logCallTrigger },
    ref
  ) {
    const [filter, setFilter] = useState<TimelineFilter>("notes");

    return (
      <div ref={ref} id="timeline-section" className="rounded-xl border bg-card">
        <div className="flex items-center gap-3 px-5 py-4 border-b">
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-sm font-semibold text-foreground">Timeline</span>
          <div className="ml-2 flex items-center gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "cursor-pointer rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                  filter === f.value
                    ? "border-foreground/20 bg-foreground/5 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-4">
          {filter === "notes" && (
            <UnifiedNotes entityType="contact" entityId={contactId} />
          )}
          {filter === "activity" && (
            <DetailActivityTab
              contactId={contactId}
              activities={activities}
              emails={emails}
              currentUserId={currentUserId}
              onComposeEmail={onComposeEmail}
              logCallTrigger={logCallTrigger}
            />
          )}
        </div>
      </div>
    );
  }
);
