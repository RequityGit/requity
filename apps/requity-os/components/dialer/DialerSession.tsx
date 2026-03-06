"use client";

import { useDialer } from "@/lib/dialer/dialer-context";
import { DialerToolbar } from "./DialerToolbar";
import { TripleLineIndicator } from "./TripleLineIndicator";
import { ContactInfoPanel } from "./ContactInfoPanel";
import { DispositionForm } from "./DispositionForm";
import { SessionSummary } from "./SessionSummary";
import { useSoftphoneMaybe } from "@/lib/twilio/softphone-context";
import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/dialer/dialer-engine";
import { PhoneOff, Mic, MicOff } from "lucide-react";

function ActiveCallControls() {
  const softphone = useSoftphoneMaybe();
  const { session } = useDialer();
  const [callTime, setCallTime] = useState(0);

  useEffect(() => {
    if (session.state !== "on_call") {
      setCallTime(0);
      return;
    }
    const interval = setInterval(() => setCallTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [session.state]);

  if (session.state !== "on_call") return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Active Call
        </h3>
        <span className="text-xs font-mono text-emerald-500">{formatDuration(callTime)}</span>
      </div>
      <p className="text-sm font-medium text-foreground">{session.connectedContactName}</p>
      <div className="flex items-center gap-2">
        {softphone && (
          <button
            onClick={softphone.toggleMute}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            {softphone.isMuted ? (
              <MicOff className="h-3.5 w-3.5" strokeWidth={1.5} />
            ) : (
              <Mic className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
            {softphone.isMuted ? "Unmute" : "Mute"}
          </button>
        )}
        <button
          onClick={() => softphone?.hangUp()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          <PhoneOff className="h-3.5 w-3.5" strokeWidth={1.5} />
          Hang Up
        </button>
      </div>
    </div>
  );
}

export function DialerSession() {
  const { session } = useDialer();

  if (session.state === "completed") {
    return <SessionSummary />;
  }

  if (session.state === "idle") {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground text-sm">
        No active dialing session. Start one from the dialer lists page.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <DialerToolbar />

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 min-h-0 overflow-hidden">
        {/* Left panel: Contact info */}
        <div className="border-r border-border overflow-y-auto">
          <ContactInfoPanel />
        </div>

        {/* Right panel: Lines + Disposition */}
        <div className="overflow-y-auto p-4 space-y-6">
          <TripleLineIndicator />
          <ActiveCallControls />
          <DispositionForm />

          {/* Ready/Paused state message */}
          {session.state === "ready" && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {session.settings.auto_advance
                ? `Auto-advancing in ${session.settings.pause_between_calls}s...`
                : "Click 'Dial Next' to fire the next group."}
            </div>
          )}
          {session.state === "paused" && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Session paused. Click Resume to continue dialing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
