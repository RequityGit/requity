"use client";

import { MessageSquare } from "lucide-react";
import { T, SectionCard } from "../components";

// Chat tab has been merged into Comments tab
export function ChatTab() {
  return (
    <SectionCard title="Deal Room" icon={MessageSquare}>
      <div className="py-8 text-center text-sm" style={{ color: T.text.muted }}>
        Chat has been moved to the Comments tab.
      </div>
    </SectionCard>
  );
}
