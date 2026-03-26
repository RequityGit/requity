"use client";

import { useState } from "react";
import {
  Mail,
  MailOpen,
  Phone,
  PhoneMissed,
  MessageSquare,
  GitCommitHorizontal,
  Activity,
  FileText,
  FileCheck,
  Calendar,
  ArrowRight,
  Zap,
  Send,
  Eye,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { timeAgo, formatDate } from "@/lib/format";
import { getUserColor, colorVariants } from "@/lib/user-colors";
import { NoteThread } from "@/components/shared/UnifiedNotes/NoteThread";
import type { NoteData } from "@/components/shared/UnifiedNotes/types";
import type { UploadedAttachment } from "@/components/shared/attachments";
import { ExpandableText } from "@/components/shared/ExpandableText";
import { isIntakeNote, IntakeNoteRenderer } from "./IntakeNoteRenderer";
import type { StreamItem, StreamItemType } from "./useActionCenterData";

// ── Icon + color config per type ──

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string; color: string }
> = {
  note: { icon: FileText, label: "Note", color: "text-blue-600 dark:text-blue-400" },
  email_in: { icon: MailOpen, label: "Received", color: "text-violet-600 dark:text-violet-400" },
  email_out: { icon: Mail, label: "Sent", color: "text-indigo-600 dark:text-indigo-400" },
  call: { icon: Phone, label: "Call", color: "text-emerald-600 dark:text-emerald-400" },
  sms: { icon: MessageSquare, label: "SMS", color: "text-cyan-600 dark:text-cyan-400" },
  meeting: { icon: Calendar, label: "Meeting", color: "text-amber-600 dark:text-amber-400" },
  stage_change: { icon: GitCommitHorizontal, label: "Stage", color: "text-purple-600 dark:text-purple-400" },
  system: { icon: Activity, label: "System", color: "text-muted-foreground" },
  system_group: { icon: Zap, label: "Updates", color: "text-muted-foreground" },
  document_upload: { icon: FileText, label: "Document", color: "text-orange-600 dark:text-orange-400" },
  form_link_sent: { icon: Send, label: "Form Sent", color: "text-teal-600 dark:text-teal-400" },
  form_submission: { icon: FileCheck, label: "Form", color: "text-teal-600 dark:text-teal-400" },
  document_generated: { icon: FileText, label: "Document", color: "text-orange-600 dark:text-orange-400" },
  message: { icon: MessageCircle, label: "Message", color: "text-orange-600 dark:text-orange-400" },
};

// ── Date divider ──

export function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5 px-3">
      <div className="flex-1 border-t border-border/50" />
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {formatDate(date)}
      </span>
      <div className="flex-1 border-t border-border/50" />
    </div>
  );
}

// ── Colored avatar ──

function ColoredAvatar({ authorId, initials, accentColor }: { authorId?: string; initials: string; accentColor?: string | null }) {
  const color = getUserColor({ id: authorId ?? "unknown", accent_color: accentColor ?? null });
  const variants = colorVariants(color);

  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
      style={{
        backgroundColor: variants.bg,
        borderColor: variants.border,
        color: variants.base,
        border: "1.5px solid",
      }}
    >
      {initials}
    </div>
  );
}

// ── Note handler props ──

export interface NoteHandlers {
  currentUserId: string;
  currentUserName: string;
  onPin: (noteId: string, isPinned: boolean) => void;
  onEdit: (noteId: string, body: string, mentionIds: string[]) => void;
  onDelete: (noteId: string) => void;
  onToggleLike: (noteId: string, isLiked: boolean) => void;
  onReply: (
    parentNoteId: string,
    body: string,
    isInternal: boolean,
    mentionIds: string[],
    attachments?: UploadedAttachment[]
  ) => Promise<void>;
}

// ── Main renderer ──

interface ActionCenterStreamItemProps {
  item: StreamItem;
  noteHandlers?: NoteHandlers;
}

export function ActionCenterStreamItem({ item, noteHandlers }: ActionCenterStreamItemProps) {
  // Stage change: centered pill
  if (item.type === "stage_change") {
    return <StageChangeItem item={item} />;
  }

  // System: compact one-liner
  if (item.type === "system") {
    return <SystemItem item={item} />;
  }

  // System group: compact grouped
  if (item.type === "system_group") {
    return <SystemGroupItem item={item} />;
  }

  // Form link sent: compact system-style row
  if (item.type === "form_link_sent") {
    const cfg = TYPE_CONFIG[item.type];
    const Icon = cfg.icon;
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
        <Icon className={cn("h-3.5 w-3.5 shrink-0", cfg.color)} />
        <span>{item.title}</span>
        <span className="ml-auto shrink-0 text-[10px]">{timeAgo(item.timestamp)}</span>
      </div>
    );
  }

  // Form submission: compact one-liner (only completed forms shown)
  if (item.type === "form_submission") {
    const cfg = TYPE_CONFIG[item.type];
    const Icon = cfg.icon;
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
        <Icon className={cn("h-3.5 w-3.5 shrink-0", cfg.color)} />
        <span className="truncate">{item.title}</span>
        <span className="ml-auto shrink-0 text-[10px]">{timeAgo(item.timestamp)}</span>
      </div>
    );
  }

  // Document generated: user action with author avatar
  if (item.type === "document_generated") {
    return (
      <div className="flex items-start gap-3 px-3 py-2.5">
        <ColoredAvatar authorId={item.author.id} initials={item.author.initials} accentColor={item.author.accent_color} />
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <span className="font-medium">{item.author.name}</span>
            {" generated "}
            <span className="font-medium">{item.docTemplateName ?? "a document"}</span>
          </p>
          {item.docFileName && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {item.docFileName}
            </p>
          )}
        </div>
        <span className="shrink-0 text-[10px] text-muted-foreground mt-0.5">
          {timeAgo(item.timestamp)}
        </span>
      </div>
    );
  }

  // Note: use NoteThread (with enhanced rendering for intake notes)
  if (item.type === "note" && item.noteData && noteHandlers) {
    const isIntake = isIntakeNote(item.noteData.body);
    return (
      <div className="px-2 py-0.5 border-b border-border/20">
        {isIntake && (
          <div className="px-2 pt-2 pb-1">
            <IntakeNoteRenderer body={item.noteData.body} />
          </div>
        )}
        <NoteThread
          note={isIntake ? { ...item.noteData, body: item.noteData.body.split("\n")[0].replace(/\*\*/g, "") } : item.noteData}
          replies={item.noteReplies ?? []}
          currentUserId={noteHandlers.currentUserId}
          currentUserName={noteHandlers.currentUserName}
          showPinning={true}
          showInternalToggle={true}
          defaultInternal={true}
          compact={isIntake}
          onPin={noteHandlers.onPin}
          onEdit={noteHandlers.onEdit}
          onDelete={noteHandlers.onDelete}
          onToggleLike={noteHandlers.onToggleLike}
          onReply={noteHandlers.onReply}
        />
      </div>
    );
  }

  // Email
  if (item.type === "email_in" || item.type === "email_out") {
    return <EmailItem item={item} />;
  }

  // Call
  if (item.type === "call") {
    return <CallItem item={item} />;
  }

  // SMS
  if (item.type === "sms") {
    return <SmsItem item={item} />;
  }

  // Message (deal room message - borrower-visible)
  if (item.type === "message") {
    return <MessageItem item={item} />;
  }

  // Default: generic activity item
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.system;
  const Icon = config.icon;

  return (
    <div className="flex gap-2.5 px-3 py-2 border-b border-border/20 hover:bg-muted/30 rq-transition">
      <ColoredAvatar authorId={item.author.id} initials={item.author.initials} accentColor={item.author.accent_color} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[12px] font-medium">{item.author.name}</span>
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", config.color)}>
            <Icon className="h-2.5 w-2.5 mr-0.5" />
            {config.label}
          </Badge>
          <span className="text-[11px] text-muted-foreground ml-auto shrink-0">
            {timeAgo(item.timestamp)}
          </span>
        </div>
        {item.title && <p className="text-[13px] text-foreground">{item.title}</p>}
        {item.description && (
          <ExpandableText text={item.description} maxLines={5} className="mt-0" />
        )}
      </div>
    </div>
  );
}

// ── Email item ──

function EmailItem({ item }: { item: StreamItem }) {
  const config = TYPE_CONFIG[item.type];
  const Icon = config.icon;
  return (
    <div className="flex gap-2.5 px-3 py-2 border-b border-border/20 hover:bg-muted/30 rq-transition">
      <ColoredAvatar authorId={item.author.id} initials={item.author.initials} accentColor={item.author.accent_color} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[12px] font-medium">{item.author.name}</span>
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", config.color)}>
            <Icon className="h-2.5 w-2.5 mr-0.5" />
            {config.label}
          </Badge>
          <span className="text-[11px] text-muted-foreground ml-auto shrink-0">
            {timeAgo(item.timestamp)}
          </span>
        </div>
        <div className="rounded-lg border bg-card p-2.5 mt-0.5">
          {item.subject && <p className="text-[13px] font-medium mb-1">{item.subject}</p>}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5">
            {item.fromEmail && <span>From: {item.fromEmail}</span>}
            {item.toEmail && <span>To: {item.toEmail}</span>}
          </div>
          {item.bodyPreview && (
            <ExpandableText text={item.bodyPreview} maxLines={5} className="mt-0" />
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
    <div className="flex gap-2.5 px-3 py-2 border-b border-border/20 hover:bg-muted/30 rq-transition">
      <ColoredAvatar authorId={item.author.id} initials={item.author.initials} accentColor={item.author.accent_color} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[12px] font-medium">{item.author.name}</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0",
              isMissed ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
            )}
          >
            <CallIcon className="h-2.5 w-2.5 mr-0.5" />
            {isMissed ? "Missed" : "Call"}
          </Badge>
          {durationStr && <span className="text-[11px] text-muted-foreground num">{durationStr}</span>}
          <span className="text-[11px] text-muted-foreground ml-auto shrink-0">
            {timeAgo(item.timestamp)}
          </span>
        </div>
        {item.title && <p className="text-[13px] text-foreground">{item.title}</p>}
        {item.description && <p className="text-[12px] text-muted-foreground mt-0.5">{item.description}</p>}
      </div>
    </div>
  );
}

// ── SMS item ──

function SmsItem({ item }: { item: StreamItem }) {
  const isOutbound = item.callDirection === "outbound";
  return (
    <div className="flex gap-2.5 px-3 py-2 border-b border-border/20 hover:bg-muted/30 rq-transition">
      <ColoredAvatar authorId={item.author.id} initials={item.author.initials} accentColor={item.author.accent_color} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[12px] font-medium">{item.author.name}</span>
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
            isOutbound ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
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
    <div className="flex justify-center py-2">
      <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 border-border/50 px-3 py-1 text-xs">
        <GitCommitHorizontal className="h-3 w-3 text-purple-500" />
        {item.fromStage && (
          <>
            <span className="text-muted-foreground line-through">{item.fromStage}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
          </>
        )}
        <span className="font-semibold text-foreground">{item.toStage ?? item.title}</span>
        <span className="text-muted-foreground/70">{timeAgo(item.timestamp)}</span>
      </div>
    </div>
  );
}

// ── Fix "Unknown" display name in system event text ──

function fixUnknownInTitle(text: string, authorName?: string): string {
  if (!text) return text;
  // Replace leading "Unknown" with the resolved author name or "System"
  return text.replace(/^Unknown\b/, authorName && authorName !== "System" ? authorName : "System");
}

// ── System one-liner ──

function SystemItem({ item }: { item: StreamItem }) {
  const displayText = fixUnknownInTitle(
    item.title ?? item.description ?? "",
    item.author?.name
  );
  return (
    <div className="flex items-center gap-2 px-4 py-1 text-[11px] text-muted-foreground/70 border-b border-border/10">
      <Zap className="h-3 w-3 shrink-0 text-muted-foreground/40" />
      <span className="truncate">{displayText}</span>
      <span className="ml-auto text-[10px] shrink-0 num">{timeAgo(item.timestamp)}</span>
    </div>
  );
}

// ── Message item (deal room message) ──

function MessageItem({ item }: { item: StreamItem }) {
  const senderType = item.messageSenderType ?? "admin";
  const source = item.messageSource;

  // System messages: centered italic muted text
  if (senderType === "system") {
    return (
      <div className="flex justify-center py-1.5 px-3">
        <p className="text-xs italic text-muted-foreground">{item.description}</p>
      </div>
    );
  }

  const isBorrower = senderType === "borrower";

  return (
    <div className="flex gap-2.5 px-3 py-2 border-b border-border/20 hover:bg-muted/30 rq-transition">
      <ColoredAvatar authorId={item.author.id} initials={item.author.initials} accentColor={item.author.accent_color} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[12px] font-medium">{item.author.name}</span>
          {isBorrower && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
            >
              Borrower
            </Badge>
          )}
          {source && source !== "portal" && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
              {source === "email" ? "via Email" : "via SMS"}
            </Badge>
          )}
          <span className="text-[11px] text-muted-foreground ml-auto shrink-0">
            {timeAgo(item.timestamp)}
          </span>
        </div>
        <div
          className={cn(
            "inline-block max-w-[85%] rounded-xl px-3 py-2 text-[13px]",
            isBorrower
              ? "bg-orange-50 dark:bg-orange-950/20 text-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {item.description}
        </div>
        {!isBorrower && (
          <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground/60">
            <Eye className="h-2.5 w-2.5" />
            <span>Visible to borrower</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Truncate a display value for compact inline display ──

function truncateValue(val: string, max = 30): string {
  if (!val || val === "null" || val === "undefined") return "";
  return val.length > max ? val.slice(0, max) + "..." : val;
}

// ── System group (multiple updates collapsed, expandable) ──

function SystemGroupItem({ item }: { item: StreamItem }) {
  const [expanded, setExpanded] = useState(false);
  const rawAuthorName = item.author?.name && item.author.name !== "System" ? item.author.name : null;
  const authorName = rawAuthorName === "Unknown" ? null : rawAuthorName;

  return (
    <div className="border-b border-border/10">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-2 px-4 py-1 text-[11px] text-muted-foreground/70 hover:bg-muted/30 rq-transition"
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 shrink-0 text-muted-foreground/60 rq-transition-transform",
            expanded && "rotate-90"
          )}
        />
        <Zap className="h-3 w-3 shrink-0 text-muted-foreground/60" />
        <span className="truncate text-left">
          <span className="font-medium text-foreground">{item.groupCount}</span> field updates
          {authorName && <span className="text-muted-foreground"> by {authorName}</span>}
        </span>
        <span className="ml-auto text-[10px] shrink-0 num">{timeAgo(item.timestamp)}</span>
      </button>

      {expanded && item.groupedItems && (
        <div className="pl-10 pr-4 pb-1.5">
          {item.groupedItems.map((child) => {
            const hasValues = child.fieldOldValue != null || child.fieldNewValue != null;
            const oldDisplay = child.fieldOldValue ? truncateValue(child.fieldOldValue) : null;
            const newDisplay = child.fieldNewValue ? truncateValue(child.fieldNewValue) : null;
            const rawChildAuthor = child.author?.name && child.author.name !== "System" ? child.author.name : null;
            const childAuthorName = rawChildAuthor === "Unknown" ? null : rawChildAuthor;

            return (
              <div
                key={child.id}
                className="flex items-center gap-2 py-0.5 text-[11px] text-muted-foreground/70"
              >
                <span className="truncate">
                  {fixUnknownInTitle(child.title ?? "", child.author?.name)}
                  {hasValues && (
                    <>
                      {oldDisplay && (
                        <>
                          {": "}
                          <span className="line-through opacity-60">{oldDisplay}</span>
                          {newDisplay && " \u2192 "}
                        </>
                      )}
                      {newDisplay && !oldDisplay && ": "}
                      {newDisplay && (
                        <span className="text-foreground">{newDisplay}</span>
                      )}
                    </>
                  )}
                </span>
                {childAuthorName && childAuthorName !== authorName && (
                  <span className="shrink-0 text-[10px] font-medium">{child.author.initials}</span>
                )}
                <span className="ml-auto text-[10px] shrink-0 num">{timeAgo(child.timestamp)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
