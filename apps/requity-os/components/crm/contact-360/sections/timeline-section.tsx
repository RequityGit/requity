"use client";

import { forwardRef } from "react";
import { Clock } from "lucide-react";
import { EntityActivityStream } from "@/components/shared/EntityActivityStream";

interface Props {
  contactId: string;
  currentUserId: string;
  currentUserName: string;
  onComposeEmail?: () => void;
  logCallTrigger?: number;
}

export const TimelineSection = forwardRef<HTMLDivElement, Props>(
  function TimelineSection(
    { contactId, currentUserId, currentUserName },
    ref
  ) {
    return (
      <div ref={ref} id="timeline-section" className="rounded-xl border bg-card overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
        <div className="flex items-center gap-3 px-5 py-3 border-b shrink-0">
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-sm font-semibold text-foreground">Activity</span>
        </div>

        <div className="h-[calc(100%-48px)]">
          <EntityActivityStream
            entityType="contact"
            entityId={contactId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        </div>
      </div>
    );
  }
);
