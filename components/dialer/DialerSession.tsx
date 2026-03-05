"use client";

import { useEffect } from "react";
import { useDialer } from "@/lib/dialer/dialer-context";
import { useSoftphoneMaybe } from "@/lib/twilio/softphone-context";
import { DialerProgress } from "./DialerProgress";
import { ContactInfoPanel } from "./ContactInfoPanel";
import { DispositionForm } from "./DispositionForm";
import { SessionSummary } from "./SessionSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Loader2,
  SkipForward,
  Play,
  Pause as PauseIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatCallDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function CallStatusBadge({ phase }: { phase: string }) {
  const config: Record<string, { label: string; variant: string; className: string }> = {
    loading: { label: "Loading...", variant: "secondary", className: "" },
    pre_call: { label: "Ready to Call", variant: "outline", className: "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300" },
    dialing: { label: "Ringing...", variant: "outline", className: "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300 animate-pulse" },
    on_call: { label: "Connected", variant: "outline", className: "border-green-300 text-green-700 dark:border-green-700 dark:text-green-300" },
    disposition: { label: "Disposition Required", variant: "outline", className: "border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-300" },
    advancing: { label: "Advancing...", variant: "secondary", className: "" },
    paused: { label: "Paused", variant: "outline", className: "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300" },
  };

  const c = config[phase] || { label: phase, variant: "secondary", className: "" };

  return (
    <Badge variant={c.variant as "secondary" | "outline"} className={c.className}>
      {c.label}
    </Badge>
  );
}

export function DialerSession({ listId }: { listId: string }) {
  const { state, startSession, dialCurrentContact, skipContact, pauseSession, resumeSession } =
    useDialer();
  const softphone = useSoftphoneMaybe();

  // Start session on mount
  useEffect(() => {
    if (state.phase === "idle") {
      startSession(listId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId]);

  // Auto-dial when contact is loaded (pre_call phase)
  useEffect(() => {
    if (state.phase === "pre_call" && state.currentContact) {
      const timer = setTimeout(() => {
        dialCurrentContact();
      }, 500); // small delay for UI to render contact info
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.currentContact, dialCurrentContact]);

  if (state.phase === "completed") {
    return <SessionSummary />;
  }

  const isOnCall = state.phase === "on_call";
  const isDialing = state.phase === "dialing";
  const showDisposition =
    state.phase === "disposition" || state.phase === "advancing";
  const showCallControls = isOnCall || isDialing;

  return (
    <div className="space-y-4">
      <DialerProgress />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Contact Info */}
        <ContactInfoPanel />

        {/* Right: Call Controls & Disposition */}
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Call Controls</CardTitle>
              <CallStatusBadge phase={state.phase} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Call Controls */}
            {showCallControls && softphone && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => softphone.toggleMute()}
                    className={cn(
                      "gap-1.5",
                      softphone.isMuted && "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300"
                    )}
                  >
                    {softphone.isMuted ? (
                      <MicOff className="h-3.5 w-3.5" strokeWidth={1.5} />
                    ) : (
                      <Mic className="h-3.5 w-3.5" strokeWidth={1.5} />
                    )}
                    {softphone.isMuted ? "Unmute" : "Mute"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => softphone.hangUp()}
                    className="gap-1.5"
                  >
                    <PhoneOff className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Hang Up
                  </Button>
                </div>

                {isOnCall && (
                  <div className="text-center">
                    <span className="font-mono text-lg tabular-nums text-foreground">
                      {formatCallDuration(softphone.callDuration)}
                    </span>
                  </div>
                )}

                {isDialing && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Ringing...</span>
                  </div>
                )}
              </div>
            )}

            {/* Pre-call state */}
            {state.phase === "pre_call" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Dialing in a moment...
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => skipContact()}
                  className="gap-1.5"
                >
                  <SkipForward className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Skip This Contact
                </Button>
              </div>
            )}

            {/* Loading state */}
            {state.phase === "loading" && (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Loading next contact...
                </p>
              </div>
            )}

            {/* Paused state */}
            {state.phase === "paused" && (
              <div className="flex flex-col items-center gap-3 py-8">
                <PauseIcon className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                <p className="text-sm text-muted-foreground">
                  Session paused
                </p>
                <Button
                  size="sm"
                  onClick={() => resumeSession()}
                  className="gap-1.5"
                >
                  <Play className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Resume Dialing
                </Button>
              </div>
            )}

            {/* Disposition */}
            {showDisposition && (
              <div>
                {state.phase === "advancing" && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pb-3">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>
                      Next call in {state.advanceCountdown}s...
                    </span>
                  </div>
                )}
                {state.phase === "disposition" && <DispositionForm />}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
