"use client";

import { useState } from "react";
import { useDialer } from "@/lib/dialer/dialer-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MANUAL_DISPOSITIONS,
  type Disposition,
  type ManualDisposition,
} from "@/lib/dialer/types";
import { cn } from "@/lib/utils";
import {
  ThumbsDown,
  PhoneOff,
  Sprout,
  XCircle,
  Ban,
  CalendarClock,
  Send,
} from "lucide-react";

const DISPOSITION_ICONS: Record<ManualDisposition, React.ElementType> = {
  "Contacted - Not Interested": ThumbsDown,
  "No Contact": PhoneOff,
  "Nurturing": Sprout,
  "Unqualified": XCircle,
  "DNC Do Not Call": Ban,
};

const DISPOSITION_COLORS: Record<ManualDisposition, string> = {
  "Contacted - Not Interested":
    "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300 dark:hover:bg-orange-900",
  "No Contact":
    "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800",
  Nurturing:
    "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900",
  Unqualified:
    "border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 dark:hover:bg-yellow-900",
  "DNC Do Not Call":
    "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900",
};

export function DispositionForm() {
  const { state, submitContactDisposition, skipContact } = useDialer();
  const [selectedDisposition, setSelectedDisposition] =
    useState<Disposition | null>(state.autoDisposition);
  const [notes, setNotes] = useState("");
  const [showCallback, setShowCallback] = useState(false);
  const [callbackDate, setCallbackDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const disposition = selectedDisposition || state.autoDisposition;
    if (!disposition) return;

    setSubmitting(true);
    try {
      await submitContactDisposition(
        disposition as Disposition,
        notes || undefined,
        showCallback ? callbackDate || undefined : undefined
      );
      // Reset form
      setSelectedDisposition(null);
      setNotes("");
      setShowCallback(false);
      setCallbackDate("");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    (selectedDisposition || state.autoDisposition) && !submitting;

  return (
    <div className="space-y-4">
      {state.autoDisposition && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Auto-detected: <strong>{state.autoDisposition}</strong>
          <span className="text-xs ml-1">(you can override below)</span>
        </div>
      )}

      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">
          Disposition
        </Label>
        <div className="grid grid-cols-1 gap-1.5">
          {MANUAL_DISPOSITIONS.map((d) => {
            const Icon = DISPOSITION_ICONS[d];
            const isSelected = selectedDisposition === d;
            return (
              <button
                key={d}
                onClick={() =>
                  setSelectedDisposition(isSelected ? null : d)
                }
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors text-left",
                  isSelected
                    ? DISPOSITION_COLORS[d]
                    : "border-border bg-card hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
                {d}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label htmlFor="disp-notes" className="text-xs text-muted-foreground">
          Notes (optional)
        </Label>
        <Textarea
          id="disp-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add call notes..."
          className="mt-1 h-20 resize-none text-sm"
        />
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowCallback(!showCallback)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.5} />
          {showCallback ? "Cancel callback" : "Schedule callback"}
        </button>
        {showCallback && (
          <Input
            type="datetime-local"
            value={callbackDate}
            onChange={(e) => setCallbackDate(e.target.value)}
            className="mt-1.5 text-sm"
          />
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1 gap-1.5"
          size="sm"
        >
          <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
          {submitting ? "Submitting..." : "Submit & Next"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => skipContact()}
          disabled={submitting}
        >
          Skip
        </Button>
      </div>
    </div>
  );
}
