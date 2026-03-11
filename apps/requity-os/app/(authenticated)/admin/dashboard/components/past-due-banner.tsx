"use client";

import { AlertTriangle, Check, ClipboardCheck, FileText, HardHat, PenLine, CircleDot } from "lucide-react";
import type { DashboardTask } from "../actions";

const catMeta: Record<string, { icon: typeof ClipboardCheck; label: string }> = {
  underwriting: { icon: ClipboardCheck, label: "Underwriting" },
  document: { icon: FileText, label: "Document" },
  inspection: { icon: HardHat, label: "Inspection" },
  closing: { icon: PenLine, label: "Closing" },
};

function CatTag({ category }: { category: string }) {
  const m = catMeta[category] || { icon: CircleDot, label: category };
  const Icon = m.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-px text-[11px] font-medium text-muted-foreground">
      <Icon className="h-3 w-3" strokeWidth={1.5} />
      {m.label}
    </span>
  );
}

interface PastDueBannerProps {
  tasks: DashboardTask[];
  onToggle: (id: string) => void;
}

export function PastDueBanner({ tasks, onToggle }: PastDueBannerProps) {
  if (tasks.length === 0) {
    return (
      <div className="mb-5 flex items-center gap-3 rounded-lg border border-[#1B7A44]/20 bg-[#1B7A44]/5 px-5 py-3.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1B7A44]/15">
          <Check className="h-4 w-4 text-[#1B7A44]" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-semibold text-[#1B7A44]">0 past due</span>
        <span className="text-[13px] text-muted-foreground">
          — you&apos;re all caught up. Nice work.
        </span>
      </div>
    );
  }

  return (
    <div className="mb-5 flex overflow-hidden rounded-lg border border-[#B23225]/20 bg-[#B23225]/5">
      <div className="w-1 shrink-0 bg-[#B23225]" />
      <div className="flex-1 px-6 py-4">
        <div className="mb-3 flex items-center gap-2.5">
          <AlertTriangle className="h-4 w-4 text-[#B23225]" strokeWidth={2} />
          <span className="text-sm font-semibold text-[#B23225]">
            {tasks.length} past due task{tasks.length !== 1 ? "s" : ""}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            — handle these before anything else
          </span>
        </div>
        {tasks.map((tk) => (
          <div
            key={tk.id}
            onClick={() => onToggle(tk.id)}
            className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-150 hover:bg-dash-surface-hover"
          >
            <div className="h-5 w-5 shrink-0 rounded-[5px] border-2 border-[#B23225]/50" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-foreground">
                {tk.title}
              </div>
              {tk.category && (
                <div className="mt-0.5 flex items-center gap-2">
                  <CatTag category={tk.category} />
                </div>
              )}
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xs font-bold text-[#B23225] num">
                {tk.due_date
                  ? `${Math.max(0, Math.floor((Date.now() - new Date(tk.due_date + "T00:00:00").getTime()) / 86400000))}d overdue`
                  : "Overdue"}
              </div>
              <div className="mt-0.5 text-[11px] text-dash-text-faint num">
                Due {tk.due_date}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
