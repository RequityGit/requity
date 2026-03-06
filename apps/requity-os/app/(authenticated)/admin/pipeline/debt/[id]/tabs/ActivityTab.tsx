"use client";

import { useState } from "react";
import {
  GitBranch,
  FileText,
  MessageSquare,
  Mail,
  Phone,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { T, SectionCard, cap, fD, type ActivityData } from "../components";
import type { LucideIcon } from "lucide-react";

interface ActivityTabProps {
  activity: ActivityData[];
}

const ICON_MAP: Record<string, { icon: LucideIcon; color: string }> = {
  stage_change: { icon: GitBranch, color: "#3b82f6" },
  stage: { icon: GitBranch, color: "#3b82f6" },
  document: { icon: FileText, color: "#22c55e" },
  doc: { icon: FileText, color: "#22c55e" },
  document_upload: { icon: FileText, color: "#22c55e" },
  comment: { icon: MessageSquare, color: "#a1a1aa" },
  note: { icon: MessageSquare, color: "#a1a1aa" },
  email: { icon: Mail, color: "#3b82f6" },
  call: { icon: Phone, color: "#f59e0b" },
  system: { icon: Zap, color: "#71717a" },
  alert: { icon: AlertTriangle, color: "#ef4444" },
  underwriting_saved: { icon: Zap, color: "#a78bfa" },
};

const FILTER_TYPES = ["all", "stage_change", "comment", "document", "email", "call", "system"] as const;

export function ActivityTab({ activity }: ActivityTabProps) {
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all"
      ? activity
      : activity.filter((a) => {
          const action = a.action || "";
          if (filter === "stage_change") return action.includes("stage");
          if (filter === "document") return action.includes("doc") || action.includes("upload");
          if (filter === "comment") return action.includes("comment") || action.includes("note");
          return action.includes(filter);
        });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TYPES.map((x) => (
          <button
            key={x}
            onClick={() => setFilter(x)}
            className="cursor-pointer rounded-lg border px-3 py-1 text-xs font-medium"
            style={{
              color: filter === x ? "#FFF" : T.text.muted,
              background: filter === x ? T.accent.blue : T.bg.surface,
              borderColor: filter === x ? T.accent.blue : T.bg.border,
            }}
          >
            {cap(x)}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <SectionCard noPad>
        {sorted.length === 0 && (
          <div className="px-5 py-8 text-center text-sm" style={{ color: T.text.muted }}>
            No activity recorded yet.
          </div>
        )}
        {sorted.map((item, i) => {
          const action = item.action || "system";
          const cfg = ICON_MAP[action] || ICON_MAP.system;
          const Ic = cfg.icon;
          return (
            <div
              key={item.id}
              className="flex gap-3.5 px-5 py-3.5"
              style={{
                borderBottom: i < sorted.length - 1 ? `1px solid ${T.bg.borderSubtle}` : "none",
              }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: cfg.color + "14" }}
              >
                <Ic size={15} color={cfg.color} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <div className="text-[13px]" style={{ color: T.text.primary }}>
                  {item._actor_name && (
                    <span className="font-semibold">{item._actor_name}</span>
                  )}{" "}
                  {item.description || cap(item.action)}
                </div>
                <div className="mt-0.5 text-[11px] num" style={{ color: T.text.muted }}>
                  {fD(item.created_at)}
                </div>
              </div>
            </div>
          );
        })}
      </SectionCard>
    </div>
  );
}
