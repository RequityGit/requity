"use client";

import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Send,
  Phone,
  Edit3,
  CheckCircle2,
  Calendar,
  Activity,
  CircleDot,
  Paperclip,
  MessageSquare,
  GitCommitHorizontal,
  Eye,
} from "lucide-react";
import { relTime } from "@/components/crm/contact-360/contact-detail-shared";
import type { ActivityData, EmailData } from "@/components/crm/contact-360/types";
import { ACTIVITY_TYPE_CONFIG } from "@/components/crm/contact-360/types";
import type { DealActivity } from "@/components/pipeline/pipeline-types";
import { SYSTEM_ACTIVITY_TYPES } from "@/hooks/useUnifiedTimeline";

// ── Icon map ──

const ACTIVITY_ICON_MAP: Record<string, React.ElementType> = {
  email: Mail,
  call: Phone,
  note: Edit3,
  task: CheckCircle2,
  meeting: Calendar,
  event: Calendar,
  system: Activity,
  text_message: MessageSquare,
  stage_change: GitCommitHorizontal,
  team_updated: Activity,
  approval_requested: Activity,
  closing_scheduled: Calendar,
};

// ── Email status resolution ──

export function resolveEmailStatus(e: EmailData): {
  label: string;
  color: string;
} {
  if (e.opened_at) return { label: "Opened", color: "#8B5CF6" };
  if (e.delivered_at) return { label: "Delivered", color: "#22A861" };

  const status = e.postmark_status?.toLowerCase();
  if (status === "sent") return { label: "Sent", color: "#22A861" };
  if (status === "bounced" || status === "bounce")
    return { label: "Bounced", color: "#E5453D" };
  if (status === "failed" || status === "error")
    return { label: "Failed", color: "#E5453D" };
  if (status === "spam" || status === "spamcomplaint")
    return { label: "Spam", color: "#E5453D" };
  if (status === "queued") return { label: "Queued", color: "#E5930E" };

  return { label: "Pending", color: "#E5930E" };
}

function parseAttachments(
  raw: unknown
): { name: string; path: string; size: number; type: string }[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw as { name: string; path: string; size: number; type: string }[];
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

// ── CRM Activity Item (calls, notes, meetings) ──

export function SidebarCrmActivityItem({
  activity: a,
  isLast,
}: {
  activity: ActivityData;
  isLast: boolean;
}) {
  const Icon = ACTIVITY_ICON_MAP[a.activity_type] || CircleDot;
  const config =
    ACTIVITY_TYPE_CONFIG[a.activity_type] || ACTIVITY_TYPE_CONFIG.system;

  return (
    <div className="flex gap-2.5 relative px-3 py-2 hover:bg-muted/30 rq-transition">
      {!isLast && (
        <div
          className="absolute w-px bg-border"
          style={{ left: 21, top: 32, bottom: 0 }}
        />
      )}
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 relative z-[1]"
        style={{ backgroundColor: config.bg }}
      >
        <Icon size={12} style={{ color: config.color }} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-foreground font-medium leading-snug truncate">
          {a.subject || a.activity_type.replace(/_/g, " ")}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground">
            {relTime(a.created_at)}
          </span>
          <span className="text-[10px] text-muted-foreground/50">&middot;</span>
          <span className="text-[10px] text-muted-foreground truncate">
            {a.created_by_name || "System"}
          </span>
          {a.call_duration_seconds != null && a.call_duration_seconds > 0 && (
            <>
              <span className="text-[10px] text-muted-foreground/50">
                &middot;
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formatDuration(a.call_duration_seconds)}
              </span>
            </>
          )}
          {a.direction && (
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 h-3.5 gap-0.5"
              style={{
                color: config.color,
                borderColor: `${config.color}30`,
                backgroundColor: `${config.color}08`,
              }}
            >
              <span
                className="h-1 w-1 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              {a.direction}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Deal System Activity Item (stage changes, team updates) ──

export function SidebarDealActivityItem({
  activity: a,
  isLast,
}: {
  activity: DealActivity;
  isLast: boolean;
}) {
  const Icon = ACTIVITY_ICON_MAP[a.activity_type] || Activity;
  const isSystem = SYSTEM_ACTIVITY_TYPES.has(a.activity_type);
  const config = isSystem
    ? ACTIVITY_TYPE_CONFIG.system
    : ACTIVITY_TYPE_CONFIG[a.activity_type] || ACTIVITY_TYPE_CONFIG.system;

  return (
    <div className="flex gap-2.5 relative px-3 py-2 hover:bg-muted/30 rq-transition">
      {!isLast && (
        <div
          className="absolute w-px bg-border"
          style={{ left: 21, top: 32, bottom: 0 }}
        />
      )}
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 relative z-[1]"
        style={{ backgroundColor: config.bg }}
      >
        <Icon size={12} style={{ color: config.color }} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-foreground font-medium leading-snug truncate">
          {a.title}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground">
            {relTime(a.created_at)}
          </span>
          {a.description && (
            <>
              <span className="text-[10px] text-muted-foreground/50">
                &middot;
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {a.description}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Email Item ──

export function SidebarEmailItem({
  email: e,
  isLast,
}: {
  email: EmailData;
  isLast: boolean;
}) {
  const isOutbound = e.sent_by_name != null;
  const { label: statusLabel, color: statusColor } = resolveEmailStatus(e);
  const emailConfig = ACTIVITY_TYPE_CONFIG.email;
  const attachmentList = parseAttachments(e.attachments);

  return (
    <div className="flex gap-2.5 relative px-3 py-2 hover:bg-muted/30 rq-transition">
      {!isLast && (
        <div
          className="absolute w-px bg-border"
          style={{ left: 21, top: 32, bottom: 0 }}
        />
      )}
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 relative z-[1]"
        style={{ backgroundColor: emailConfig.bg }}
      >
        {isOutbound ? (
          <Send size={12} style={{ color: emailConfig.color }} strokeWidth={1.5} />
        ) : (
          <Mail size={12} style={{ color: emailConfig.color }} strokeWidth={1.5} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 justify-between">
          <span className="text-[12px] text-foreground font-medium leading-snug truncate">
            {e.subject}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {e.opened_at && (
              <Eye
                size={10}
                className="text-[#8B5CF6]"
                strokeWidth={1.5}
              />
            )}
            <Badge
              variant="outline"
              className="text-[9px] gap-0.5 px-1 py-0 h-3.5"
              style={{
                color: statusColor,
                borderColor: `${statusColor}30`,
                backgroundColor: `${statusColor}08`,
              }}
            >
              <span
                className="h-1 w-1 rounded-full"
                style={{ backgroundColor: statusColor }}
              />
              {statusLabel}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground">
            {relTime(e.created_at)}
          </span>
          <span className="text-[10px] text-muted-foreground/50">&middot;</span>
          <span className="text-[10px] text-muted-foreground truncate">
            {isOutbound
              ? `To: ${e.to_name || e.to_email}`
              : `From: ${e.from_email}`}
          </span>
          {attachmentList.length > 0 && (
            <>
              <span className="text-[10px] text-muted-foreground/50">
                &middot;
              </span>
              <Paperclip
                size={10}
                className="text-muted-foreground shrink-0"
                strokeWidth={1.5}
              />
              <span className="text-[10px] text-muted-foreground">
                {attachmentList.length}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
