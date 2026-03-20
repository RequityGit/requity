"use client";

import { useState } from "react";
import { Phone, Delete } from "lucide-react";
import { useSoftphone } from "@/lib/twilio/softphone-context";

const KEYPAD_KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

export function DialPad() {
  const { makeOutboundCall, status } = useSoftphone();
  const [number, setNumber] = useState("");

  const handleDial = () => {
    if (!number.trim()) return;
    // Normalize: if it doesn't start with +, add +1
    const normalized = number.startsWith("+") ? number : `+1${number.replace(/\D/g, "")}`;
    makeOutboundCall(normalized);
  };

  const handleKeyPress = (key: string) => {
    setNumber((prev) => prev + key);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Number input */}
      <div className="flex items-center gap-2">
        <input
          type="tel"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleDial();
          }}
          placeholder="+1 (555) 123-4567"
          className="flex-1 bg-[#EFEFEF] dark:bg-[#1C1C1C] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.07)] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] dark:text-[#F0F0F0] placeholder:text-[#999999] dark:placeholder:text-[#606060] focus:outline-none focus:border-[rgba(0,0,0,0.16)] dark:focus:border-[rgba(255,255,255,0.16)]"
        />
        {number && (
          <button
            onClick={() => setNumber((prev) => prev.slice(0, -1))}
            className="p-2 text-[#6B6B6B] dark:text-[#888888] hover:text-[#1A1A1A] dark:hover:text-[#F0F0F0] transition-colors"
          >
            <Delete className="h-4 w-4" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Keypad grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {KEYPAD_KEYS.flat().map((key) => (
          <button
            key={key}
            onClick={() => handleKeyPress(key)}
            className="h-10 rounded-lg text-sm font-medium text-[#1A1A1A] dark:text-[#F0F0F0] bg-[#F7F7F8] dark:bg-[#141414] hover:bg-[#EFEFEF] dark:hover:bg-[#1C1C1C] active:bg-[#E8E8EC] dark:active:bg-[#262626] transition-colors"
          >
            {key}
          </button>
        ))}
      </div>

      {/* Dial button */}
      <button
        onClick={handleDial}
        disabled={!number.trim() || status !== "ready"}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#1A8754] dark:bg-[#34C77B] text-white dark:text-[#0C0C0C] font-medium text-sm hover:opacity-90 active:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        <Phone className="h-4 w-4" strokeWidth={1.5} />
        Call
      </button>
    </div>
  );
}

export function DTMFKeypad() {
  const { sendDigit } = useSoftphone();

  return (
    <div className="grid grid-cols-3 gap-1.5 p-2">
      {KEYPAD_KEYS.flat().map((key) => (
        <button
          key={key}
          onClick={() => sendDigit(key)}
          className="h-10 rounded-lg text-sm font-medium text-[#1A1A1A] dark:text-[#F0F0F0] bg-[#F7F7F8] dark:bg-[#141414] hover:bg-[#EFEFEF] dark:hover:bg-[#1C1C1C] active:bg-[#E8E8EC] dark:active:bg-[#262626] transition-colors"
        >
          {key}
        </button>
      ))}
    </div>
  );
}
