"use client";

import { Phone, PhoneOff } from "lucide-react";
import { useSoftphone } from "@/lib/twilio/softphone-context";

export function IncomingCallUI() {
  const { incomingCallerNumber, acceptCall, rejectCall } = useSoftphone();

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="text-center">
        <p className="text-xs text-[#6B6B6B] dark:text-[#888888] mb-1">
          Incoming call from
        </p>
        <p className="text-base font-semibold text-[#1A1A1A] dark:text-[#F0F0F0] num">
          {incomingCallerNumber || "Unknown"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={acceptCall}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1A8754] dark:bg-[#34C77B] text-white dark:text-[#0C0C0C] font-medium text-sm hover:opacity-90 active:opacity-80 transition-opacity"
        >
          <Phone className="h-4 w-4" strokeWidth={1.5} />
          Accept
        </button>
        <button
          onClick={rejectCall}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D42620] dark:bg-[#EF4444] text-white font-medium text-sm hover:opacity-90 active:opacity-80 transition-opacity"
        >
          <PhoneOff className="h-4 w-4" strokeWidth={1.5} />
          Reject
        </button>
      </div>
    </div>
  );
}
