"use client";

import {
  Mail,
  MailOpen,
  Phone,
  PhoneMissed,
  MessageSquare,
  GitCommitHorizontal,
  Activity,
  FileText,
  StickyNote,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { timeAgo, formatDate, formatTime } from "@/lib/format";
import type { StreamItem, StreamItemType } from "./useActionCenterData";

// ── Icon + color config per type ──

const TYPE_CONFIG: Record<
  StreamItemType,
  { icon: React.ElementType; label: string; color: string; bgColor: string }
> = {
  note: {
    icon: StickyNote,
    label: "Note",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  email_in: {
    icon: MailOpen,
    label: "Received",
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-500/10",
  },
  email_out: {
    icon: Mail,
    label: "Sent",
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-500/10",
  },
  call: {
    icon: Phone,
    label: "Call",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  sms: {
    icon: MessageSquare,
    label: "SMS",
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  meeting: {
    icon: Calendar,
    label: "Meeting",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  stage_change: {
    icon: GitCommitHorizontal,
    label: "Stage",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  system: {
    icon: Activity,
    label: "System",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  document_upload: {
    icon: FileText,
    label: "Document",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10",
  },
};

// ── Date divider ──

export function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 py-2 px-4">
      <div className="flex-1 border-t border-border" />
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {formatDate(date)}
      </span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

// ── Avatar circle ──

function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground",
        className
      )}
    >
      {initials}
    </div>
  );
}

// ── Main renderer ──

interface ActionCenterStreamItemProps {
  item: StreamItem;
}

export function ActionCenterStreamItem({ item }: ActionCenterStreamItemProps) {
  const config = TYPE_CONFIG[item.type];
  const Icon = config.icon;

  // Stage change: centered pill
  if (item.type === "stage_change") {
    return <StageChangeItem item={item} />;
  }

  // System: compact one-liner
  if (item.type === "system") {
    return <SystemItem item={item} />;
  }

  // Note
  if (item.type === "note" && item.noteData) {
    return <NoteItem item={item} />;
  }

  // Email
  if (item.type === "email_in" || item.type === "email_out") {
    return <EmailItem item={item} config={config} />;
  }

  // Call
  if (item.type === "call") {
    return <CallItem item={item} />;
  }

  // SMS
  if (item.type === "sms") {
    return <SmsItem item={item} />;
  }

  // Default: generic activity item
  return (
    <div className="flex gap-3 px-4 py-3 hover:bg-muted/30 rq-transition">
      <Avatar initials={item.author.initials} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-medium">{item.author.name}</span>
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", config.color)}>
            <Icon className="h-2.5 w-2.5 mr-0.5" />
            {config.label}
          </Badge>
          <span className="text-[11px] text-muted-foreground ml-auto shrink-0">
            {timeAgo(item.timestamp)}
          </span>
        </div>
        {item.title && (
          <p className="text-[13px] text-foreground">{item.title}</p>
        )}
        {item.description && (
          <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Note item ──

function NoteItem({ item }: { item: StreamItem }) {
  const note = item.noteData!;
  return (
    <div className="flex gap-3 px-4 py-3 hover:bg-muted/30 rq-transition">
      <Avatar initials={item.author.initials} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[13px] font-medium">{item.author.name}</span>
          {note.is_internal && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700">
              Internal
            </Badge>
          )}
          <span className="text-[11px] text-muted-foreground ml-auto shrink-0">
            {timeAgo(item.timestamp)}
          </span>
        </div>
        <p className="text-[13px] text-foreground whitespace-pre-wrap break-words">
          {note.body}
        </p>
        {note.note_attachments && note.note_attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {note.note_attachments.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                <FileText className="h-3 w-3" />
                {a.file_name}
              </span>
            ))}
          </div>
        )}
        {note.is_pinned && (
          <Badge variant="outline" className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-400">
            Pinned
          </Badge>
        )}
      </div>
    </div>
  );
}

// ── Email item ──

function EmailItem({
  item,
  config,
}: {
  item: StreamItem;
  config: (typeof TYPE_CONFIG)[StreamItemType];
}) {
  const Icon = config.icon;
  return (
    <div className="flex gap-3 px-4 py-3 hover:bg-muted/30 rq-transition">
      <Avatar initials={item.author.initials} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[13px] font-medium">{item.author.name}</span>
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", config.color)}>
            <Icon className="h-2.5 w-2.5 mr-0.5" />
            {config.label}
          </Badge>
          <span className="text-[11px] text-muted-foreground ml-auto shrink-0">
            {timeAgo(item.timestamp)}
          </span>
        </div>
        <div className="rounded-lg border bg-card p-3 mt-0.5">
          {item.subject && (
            <p className="text-[13px] font-medium mb-1">{item.subject}</p>
          )}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5">
            {item.fromEmail && <span>From: {item.fromEmail}</span>}
            {item.toEmail && <span>To: {item.toEmail}</span>}
          </div>
          {item.bodyPreview && (
            <p className="text-[12px] text-muted-foreground line-clamp-3">
              {item.bodyPreview}
            </p>
          )}
          {item.emailAttachments && item.emailAttachments.length > 0 && (
            <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground">
              <FileText className="h-3 w-3" />
              {item.emailAttachments.length} attachment{item.emailAttachments.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Call item ──

function CallItem({ item }: { item: StreamItem }) {
  const isMissed = item.callDirection === "missed";
  const CallIcon = isMissed ? PhoneMissed : Phone;
  const duration = item.callDuration;
  const durationStr = duration
    ? `${Math.floor(duration / 60)}m ${duration % 60}s`
    : null;

  return (
    <div className="flex gap-3 px-4 py-3 hover:bg-muted/30 rq-transition">
      <Avatar initials={item.author.initials} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-medium">{item.author.name}</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0",
              isMissed
                ? "text-red-600 dark:text-red-400"
                : "text-emerald-600 dark:text-emerald-400"
            )}
          >
            <CallIcon className="h-2.5 w-2.5 mr-0.5" />
            {isMissed ? "Missed" : "Call"}
          </Badge>
          {durationStr && (
            <span className="text-[11px] text-muted-foreground num">{durationStr}</span>
          )}
          <span className="text-[11px] text-muted-foreground ml-auto shrink-0">
            {timeAgo(item.timestamp)}
          </span>
        </div>
        {item.title && (
          <p className="text-[13px] text-foreground">{item.title}</p>
        )}
        {item.description && (
          <p className="text-[12px] text-muted-foreground mt-0.5">{item.description}</p>
        )}
      </div>
    </div>
  );
}

// ── SMS item ──

function SmsItem({ item }: { item: StreamItem }) {
  const isOutbound = item.callDirection === "outbound";
  return (
    <div className="flex gap-3 px-4 py-3 hover:bg-muted/30 rq-transition">
      <Avatar initials={item.author.initials} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[13px] font-medium">{item.author.name}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-cyan-600 dark:text-cyan-400">
            <MessageSquare className="h-2.5 w-2.5 mr-0.5" />
            SMS
          </Badge>
          <span className="text-[11px] text-muted-foreground ml-auto shrink-0">
            {timeAgo(item.timestamp)}
          </span>
        </div>
        <div
          className={cn(
            "inline-block max-w-[80%] rounded-xl px-3 py-2 text-[13px]",
            isOutbound
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {item.description ?? item.title}
        </div>
      </div>
    </div>
  );
}

// ── Stage change pill ──

function StageChangeItem({ item }: { item: StreamItem }) {
  return (
    <div className="flex justify-center py-3 px-4">
      <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5">
        <GitCommitHorizontal className="h-3.5 w-3.5 text-purple-500" />
        <span className="text-[12px] text-muted-foreground">
          {item.fromStage && (
            <>
              <span className="line-through">{item.fromStage}</span>
              <ArrowRight className="inline h-3 w-3 mx-1.5 text-muted-foreground/50" />
            </>
          )}
          <span className="font-medium text-foreground">{item.toStage ?? item.title}</span>
        </span>
        <span className="text-[10px] text-muted-foreground">{timeAgo(item.timestamp)}</span>
      </div>
    </div>
  );
}

// ── System one-liner ──

function SystemItem({ item }: { item: StreamItem }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-[12px] text-muted-foreground">
      <Activity className="h-3 w-3 shrink-0" />
      <span>{item.title ?? item.description}</span>
      <span className="ml-auto text-[10px] shrink-0">{timeAgo(item.timestamp)}</span>
    </div>
  );
}
