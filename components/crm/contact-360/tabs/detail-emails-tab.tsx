"use client";

import { Send, Mail, Eye } from "lucide-react";
import { DotPill, relTime } from "../contact-detail-shared";
import type { EmailData } from "../types";

interface DetailEmailsTabProps {
  emails: EmailData[];
}

export function DetailEmailsTab({ emails }: DetailEmailsTabProps) {
  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F7F7F8] mb-4">
          <Mail className="h-6 w-6 text-[#9A9A9A]" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">No emails</h3>
        <p className="text-sm text-[#6B6B6B]">No email history for this contact.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {emails.map((e) => {
        const isOutbound = e.from_email !== e.to_email && e.sent_by_name;
        return (
          <div
            key={e.id}
            className="bg-white border border-[#E5E5E7] rounded-xl p-[18px] cursor-pointer transition-all duration-150 hover:border-[#D0D0D0]"
          >
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex items-center gap-2">
                {isOutbound ? (
                  <Send size={13} className="text-[#3B82F6]" strokeWidth={1.5} />
                ) : (
                  <Mail size={13} className="text-[#22A861]" strokeWidth={1.5} />
                )}
                <span className="text-sm font-semibold text-[#1A1A1A]">{e.subject}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {e.opened_at && <Eye size={12} className="text-[#22A861]" strokeWidth={1.5} />}
                <DotPill
                  color={e.delivered_at ? "#22A861" : "#E5930E"}
                  label={e.delivered_at ? "delivered" : "pending"}
                  small
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8B8B8B]">
              <span>{isOutbound ? `From: ${e.sent_by_name || e.from_email}` : `From: ${e.from_email}`}</span>
              <span className="text-[#D5D5D5]">&rarr;</span>
              <span>{e.to_email}</span>
              <span className="text-[#D5D5D5]">&middot;</span>
              <span>{relTime(e.created_at)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
