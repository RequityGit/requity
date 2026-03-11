"use client";

import { Phone } from "lucide-react";
import { useSoftphoneMaybe } from "@/lib/twilio/softphone-context";
import { formatPhoneNumber } from "@/lib/format";

interface ClickToCallNumberProps {
  number: string | null | undefined;
  fallback?: string;
  className?: string;
  showIcon?: boolean;
}

export function ClickToCallNumber({
  number,
  fallback = "—",
  className,
  showIcon = true,
}: ClickToCallNumberProps) {
  const softphone = useSoftphoneMaybe();

  if (!number) {
    return (
      <span className={`text-xs text-muted-foreground ${className || ""}`}>
        {fallback}
      </span>
    );
  }

  const canCall = softphone?.status === "ready";
  const isBusy =
    softphone?.status === "on-call" || softphone?.status === "connecting";
  const isOffline = !softphone || softphone.status === "offline";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!canCall || !softphone) return;
    const normalized = number.startsWith("+")
      ? number
      : `+1${number.replace(/\D/g, "")}`;
    softphone.makeOutboundCall(normalized);
  };

  const formatted = formatPhoneNumber(number);

  const title = isOffline
    ? "Softphone disconnected"
    : isBusy
      ? "Already on a call"
      : canCall
        ? `Call ${formatted}`
        : "";

  return (
    <button
      onClick={handleClick}
      disabled={!canCall}
      title={title}
      className={`inline-flex items-center gap-1.5 text-xs group transition-colors ${
        canCall
          ? "text-[#6B6B6B] dark:text-[#888888] hover:text-[#2563EB] dark:hover:text-[#3B82F6] cursor-pointer"
          : "text-[#6B6B6B] dark:text-[#888888] cursor-default"
      } ${className || ""}`}
    >
      {showIcon && (
        <Phone
          className={`h-3.5 w-3.5 transition-colors ${
            canCall
              ? "group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6]"
              : ""
          }`}
          strokeWidth={1.5}
        />
      )}
      {formatted}
    </button>
  );
}
