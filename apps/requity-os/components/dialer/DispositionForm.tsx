"use client";

import { useState } from "react";
import { Send, Clock, SkipForward } from "lucide-react";
import { useDialer } from "@/lib/dialer/dialer-context";
import { MANUAL_DISPOSITIONS } from "@/lib/dialer/types";
import type { ManualDisposition } from "@/lib/dialer/types";
import { cn } from "@/lib/utils";

export function DispositionForm() {
  const { session, handleDisposition, skipCurrent } = useDialer();
  const [selected, setSelected] = useState<ManualDisposition | null>(null);
  const [notes, setNotes] = useState("");
  const [showCallback, setShowCallback] = useState(false);
  const [callbackDate, setCallbackDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (session.state !== "dispositioning") return null;

  const onSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await handleDisposition(
        selected,
        notes || undefined,
        showCallback && callbackDate ? new Date(callbackDate).toISOString() : undefined
      );
      // Reset form
      setSelected(null);
      setNotes("");
      setShowCallback(false);
      setCallbackDate("");
    } catch (err) {
      console.error("Disposition error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Disposition
      </h3>

      {/* Disposition buttons */}
      <div className="grid grid-cols-1 gap-1.5">
        {MANUAL_DISPOSITIONS.map((d) => (
          <button
            key={d.value}
            onClick={() => setSelected(d.value)}
            className={cn(
              "px-3 py-2 text-left text-sm rounded-lg border transition-colors",
              selected === d.value
                ? d.value === "dnc"
                  ? "border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
                  : "border-foreground bg-foreground/5 text-foreground font-medium"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Notes */}
      <div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)..."
          rows={2}
          className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
      </div>

      {/* Schedule callback */}
      <div>
        <button
          onClick={() => setShowCallback(!showCallback)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Clock className="h-3 w-3" strokeWidth={1.5} />
          {showCallback ? "Hide" : "Schedule"} Callback
        </button>
        {showCallback && (
          <input
            type="datetime-local"
            value={callbackDate}
            onChange={(e) => setCallbackDate(e.target.value)}
            className="mt-2 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSubmit}
          disabled={!selected || submitting}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
          {submitting ? "Submitting..." : "Submit & Next"}
        </button>
        <button
          onClick={skipCurrent}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
        >
          <SkipForward className="h-3.5 w-3.5" strokeWidth={1.5} />
          Skip
        </button>
      </div>
    </div>
  );
}
