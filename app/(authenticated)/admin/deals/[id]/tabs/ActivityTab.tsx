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
import { SectionCard, cap, fD, type ActivityData } from "../components";
import type { LucideIcon } from "lucide-react";

interface ActivityTabProps {
  activity: ActivityData[];
}

const ICON_MAP: Record<string, { icon: LucideIcon; color: string }> = {
  stage_change: { icon: GitBranch, color: "#3B82F6" },
  stage: { icon: GitBranch, color: "#3B82F6" },
  document: { icon: FileText, color: "#22A861" },
  doc: { icon: FileText, color: "#22A861" },
  document_upload: { icon: FileText, color: "#22A861" },
  comment: { icon: MessageSquare, color: "#1A1A1A" },
  note: { icon: MessageSquare, color: "#1A1A1A" },
  email: { icon: Mail, color: "#3B82F6" },
  call: { icon: Phone, color: "#E5930E" },
  system: { icon: Zap, color: "#8B8B8B" },
  alert: { icon: AlertTriangle, color: "#E5453D" },
};

const FILTER_TYPES = [
  "all",
  "stage_change",
  "comment",
  "document",
  "email",
  "call",
  "system",
] as const;

export function ActivityTab({ activity }: ActivityTabProps) {
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all"
      ? activity
      : activity.filter((a) => {
          const action = a.action || "";
          if (filter === "stage_change")
            return action.includes("stage");
          if (filter === "document")
            return action.includes("doc") || action.includes("upload");
          if (filter === "comment")
            return action.includes("comment") || action.includes("note");
          return action.includes(filter);
        });

  const sorted = [...filtered].sort(
    (a, b) =>
      new Date(b.created_at || "").getTime() -
      new Date(a.created_at || "").getTime()
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TYPES.map((x) => (
          <button
            key={x}
            onClick={() => setFilter(x)}
            className="cursor-pointer rounded-lg border px-3 py-1 text-xs font-medium font-sans"
            style={{
              color: filter === x ? "#FFF" : "#6B6B6B",
              background: filter === x ? "#1A1A1A" : "#FFF",
              borderColor: filter === x ? "#1A1A1A" : "#E5E5E7",
            }}
          >
            {cap(x)}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <SectionCard noPad>
        {sorted.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-[#8B8B8B] font-sans">
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
                borderBottom:
                  i < sorted.length - 1
                    ? "1px solid #F0F0F2"
                    : "none",
              }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: cfg.color + "10" }}
              >
                <Ic size={15} color={cfg.color} />
              </div>
              <div className="flex-1">
                <div className="text-[13px] text-[#1A1A1A] font-sans">
                  {item._actor_name && (
                    <span className="font-semibold">
                      {item._actor_name}
                    </span>
                  )}{" "}
                  {item.description || cap(item.action)}
                </div>
                <div className="mt-0.5 text-[11px] text-[#8B8B8B] font-sans">
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
