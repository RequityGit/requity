"use client";

import { useState } from "react";
import { PhoneOff, Mic, MicOff, Grid3X3 } from "lucide-react";
import { useSoftphone } from "@/lib/twilio/softphone-context";
import { DTMFKeypad } from "./DialPad";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function ActiveCallUI() {
  const {
    callDuration,
    isMuted,
    hangUp,
    toggleMute,
    incomingCallerNumber,
    dialedNumber,
    status,
  } = useSoftphone();
  const [showKeypad, setShowKeypad] = useState(false);

  const connectedNumber = incomingCallerNumber || dialedNumber || "Unknown";
  const isConnecting = status === "connecting";

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      {/* Connected info */}
      <div className="text-center">
        <p className="text-xs text-[#6B6B6B] dark:text-[#888888] mb-0.5">
          {isConnecting ? "Calling..." : "Connected"}
        </p>
        <p className="text-sm font-medium text-[#1A1A1A] dark:text-[#F0F0F0] num">
          {connectedNumber}
        </p>
        {!isConnecting && (
          <p className="text-lg font-semibold text-[#1A1A1A] dark:text-[#F0F0F0] num mt-1">
            {formatDuration(callDuration)}
          </p>
        )}
      </div>

      {/* DTMF Keypad */}
      {showKeypad && <DTMFKeypad />}

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMute}
          className={`p-2.5 rounded-lg transition-colors ${
            isMuted
              ? "bg-[#D42620] dark:bg-[#EF4444] text-white"
              : "bg-[#F7F7F8] dark:bg-[#141414] text-[#6B6B6B] dark:text-[#888888] hover:bg-[#EFEFEF] dark:hover:bg-[#1C1C1C]"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <MicOff className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <Mic className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>

        <button
          onClick={() => setShowKeypad(!showKeypad)}
          className={`p-2.5 rounded-lg transition-colors ${
            showKeypad
              ? "bg-[#1A1A1A] dark:bg-[#F0F0F0] text-white dark:text-[#0C0C0C]"
              : "bg-[#F7F7F8] dark:bg-[#141414] text-[#6B6B6B] dark:text-[#888888] hover:bg-[#EFEFEF] dark:hover:bg-[#1C1C1C]"
          }`}
          title="Keypad"
        >
          <Grid3X3 className="h-4 w-4" strokeWidth={1.5} />
        </button>

        <button
          onClick={hangUp}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D42620] dark:bg-[#EF4444] text-white font-medium text-sm hover:opacity-90 active:opacity-80 transition-opacity"
        >
          <PhoneOff className="h-4 w-4" strokeWidth={1.5} />
          Hang Up
        </button>
      </div>
    </div>
  );
}
