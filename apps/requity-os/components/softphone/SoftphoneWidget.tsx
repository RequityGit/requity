"use client";

import { useState } from "react";
import {
  Phone,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useSoftphone } from "@/lib/twilio/softphone-context";
import { StatusIndicator } from "./StatusIndicator";
import { DialPad } from "./DialPad";
import { IncomingCallUI } from "./IncomingCallUI";
import { ActiveCallUI } from "./ActiveCallUI";

export function SoftphoneWidget() {
  const { status, error, retry } = useSoftphone();
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand on incoming call
  const shouldForceExpand = status === "incoming";
  const expanded = isExpanded || shouldForceExpand;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end md:bottom-6 md:right-6">
      {/* Expanded panel */}
      {expanded && (
        <div className="mb-2 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#161616] shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.07)]">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#6B6B6B] dark:text-[#888888]" strokeWidth={1.5} />
              <span className="text-sm font-medium text-[#1A1A1A] dark:text-[#F0F0F0]">
                Softphone
              </span>
            </div>
            <StatusIndicator status={status} />
          </div>

          {/* Body */}
          <div className="px-4 py-3">
            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 mb-3 p-2.5 rounded-lg bg-[rgba(212,38,32,0.08)] dark:bg-[rgba(239,68,68,0.1)]">
                <AlertCircle className="h-4 w-4 text-[#D42620] dark:text-[#EF4444] mt-0.5 shrink-0" strokeWidth={1.5} />
                <p className="text-xs text-[#D42620] dark:text-[#EF4444]">{error}</p>
              </div>
            )}

            {/* Offline state */}
            {status === "offline" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <p className="text-sm text-[#6B6B6B] dark:text-[#888888]">
                  Softphone disconnected
                </p>
                <button
                  onClick={retry}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A1A1A] dark:bg-[#F0F0F0] text-white dark:text-[#0C0C0C] text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Reconnect
                </button>
              </div>
            )}

            {/* Ready state — show dial pad */}
            {status === "ready" && <DialPad />}

            {/* Incoming call */}
            {status === "incoming" && <IncomingCallUI />}

            {/* On call or connecting */}
            {(status === "on-call" || status === "connecting") && (
              <ActiveCallUI />
            )}
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] ${
          status === "incoming"
            ? "bg-[#CC7A00] dark:bg-[#F0A030] border-transparent text-white dark:text-[#0C0C0C] animate-pulse"
            : status === "on-call" || status === "connecting"
              ? "bg-[#1A8754] dark:bg-[#34C77B] border-transparent text-white dark:text-[#0C0C0C]"
              : "bg-white dark:bg-[#161616] border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.07)] text-[#1A1A1A] dark:text-[#F0F0F0]"
        }`}
      >
        <StatusIndicator status={status} showLabel={false} />
        <Phone className="h-4 w-4" strokeWidth={1.5} />
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
        ) : (
          <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
}
