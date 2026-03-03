"use client";

import { MessageSquare, Send } from "lucide-react";
import { Av, Btn, type ChatMessage } from "../components";

interface ChatTabProps {
  messages: ChatMessage[];
  currentUserInitials: string;
}

function formatTime(ts: string | null | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function ChatTab({ messages, currentUserInitials }: ChatTabProps) {
  return (
    <div className="flex h-[480px] flex-col rounded-xl border border-[#E5E5E7] bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#F0F0F2] px-5 py-3">
        <MessageSquare size={16} className="text-[#6B6B6B]" />
        <span className="text-sm font-semibold text-[#1A1A1A] font-sans">
          Deal Room
        </span>
        <span className="text-xs text-[#8B8B8B] font-sans">
          {messages.length > 0
            ? `${new Set(messages.map((m) => m.sent_by)).size} members`
            : "0 members"}
        </span>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="flex flex-1 items-center justify-center text-sm text-[#8B8B8B] font-sans">
            No messages yet. Start the conversation.
          </div>
        )}
        {messages.map((m) => {
          const initials =
            m._sender_initials ||
            m._sender_name
              ?.split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() ||
            "??";
          return (
            <div key={m.id} className="flex gap-2.5">
              <Av text={initials} size={32} />
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[13px] font-semibold text-[#1A1A1A] font-sans">
                    {m._sender_name || "Unknown"}
                  </span>
                  <span className="text-[11px] text-[#8B8B8B] font-sans">
                    {formatTime(m.created_at)}
                  </span>
                </div>
                <div className="mt-1 text-[13px] leading-normal text-[#1A1A1A] font-sans">
                  {m.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compose bar */}
      <div className="flex gap-2.5 border-t border-[#F0F0F2] px-5 py-3">
        <input
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-[#E5E5E7] bg-[#F7F7F8] px-3.5 py-2.5 text-[13px] text-[#1A1A1A] outline-none font-sans"
        />
        <Btn label="Send" icon={Send} primary small />
      </div>
    </div>
  );
}
