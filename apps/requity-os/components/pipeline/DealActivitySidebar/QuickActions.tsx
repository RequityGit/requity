"use client";

import { useState } from "react";
import { Mail, Phone, Edit3, Calendar, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import {
  logDealActivityRich,
  logQuickActionV2,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";

interface QuickActionsProps {
  dealId: string;
  primaryContactId: string | null;
  onNoteClick: () => void;
  onActivityLogged: () => void;
}

const ACTIONS = [
  { key: "email", label: "Email", icon: Mail, color: "#3B82F6" },
  { key: "call", label: "Call", icon: Phone, color: "#22A861" },
  { key: "note", label: "Note", icon: Edit3, color: "#E5930E" },
  { key: "meeting", label: "Meeting", icon: Calendar, color: "#FB923C" },
] as const;

export function QuickActions({
  dealId,
  primaryContactId,
  onNoteClick,
  onActivityLogged,
}: QuickActionsProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  async function handleAction(key: string) {
    // Note action switches to the notes tab / focuses composer
    if (key === "note") {
      onNoteClick();
      return;
    }

    setLoadingAction(key);
    try {
      if (key === "email" || key === "call") {
        const result = await logQuickActionV2(
          dealId,
          key === "email" ? "email_sent" : "call_logged",
          `${key === "email" ? "Email" : "Call"} logged`
        );
        if (result.error) throw new Error(result.error);
      } else if (key === "meeting") {
        const result = await logDealActivityRich(
          dealId,
          primaryContactId,
          "meeting",
          "Meeting logged",
          ""
        );
        if (result.error) throw new Error(result.error);
      }
      showSuccess("Activity logged");
      onActivityLogged();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      showError("Could not log activity", message);
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="flex gap-1.5 px-3 py-2 border-b border-border overflow-x-auto flex-shrink-0">
      {ACTIONS.map((a) => (
        <button
          key={a.key}
          onClick={() => handleAction(a.key)}
          disabled={loadingAction !== null}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-transparent text-muted-foreground text-[11px] font-medium whitespace-nowrap hover:border-border hover:bg-muted/40 hover:text-foreground rq-transition cursor-pointer disabled:opacity-50"
        >
          {loadingAction === a.key ? (
            <Loader2 size={12} className="animate-spin" strokeWidth={1.5} />
          ) : (
            <a.icon size={12} style={{ color: a.color }} strokeWidth={1.5} />
          )}
          {a.label}
        </button>
      ))}
    </div>
  );
}
