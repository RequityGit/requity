"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { CRM_ACTIVITY_TYPES } from "@/lib/constants";
import {
  Mail,
  Send,
  Phone,
  Edit3,
  CheckCircle2,
  Calendar,
  Activity,
  CircleDot,
  Plus,
  Eye,
  ChevronDown,
  ChevronUp,
  Paperclip,
  MessageSquare,
} from "lucide-react";
import { relTime } from "../contact-detail-shared";
import type { ActivityData, EmailData } from "../types";
import { ACTIVITY_TYPE_CONFIG } from "../types";

const ACTIVITY_ICON_MAP: Record<string, React.ElementType> = {
  email: Mail,
  call: Phone,
  note: Edit3,
  task: CheckCircle2,
  meeting: Calendar,
  event: Calendar,
  system: Activity,
  text_message: MessageSquare,
};

const FILTER_TYPES = [
  "all",
  "email",
  "call",
  "note",
  "task",
  "event",
  "system",
];

// Unified timeline item that can be either an activity or an email
interface TimelineItem {
  id: string;
  kind: "activity" | "email";
  created_at: string;
  activity?: ActivityData;
  email?: EmailData;
}

function resolveEmailStatus(e: EmailData): { label: string; color: string } {
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

interface DetailActivityTabProps {
  contactId: string;
  activities: ActivityData[];
  emails: EmailData[];
  currentUserId: string;
  onComposeEmail?: () => void;
  initialAction?: string | null;
}

export function DetailActivityTab({
  contactId,
  activities,
  emails,
  currentUserId,
  onComposeEmail,
  initialAction,
}: DetailActivityTabProps) {
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState({
    activity_type: "note",
    subject: "",
    description: "",
  });

  // Open form pre-filled with "call" when triggered from sidebar Log Call action
  useEffect(() => {
    if (initialAction === "log-call") {
      setShowForm(true);
      setForm({ activity_type: "call", subject: "", description: "" });
      // Clear the action param from URL to prevent re-triggering
      const params = new URLSearchParams(window.location.search);
      params.delete("action");
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState(null, "", newUrl);
    }
  }, [initialAction]);

  const isCallType = form.activity_type === "call";

  // Build unified timeline: merge activities + emails, sorted by created_at desc
  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];

    for (const a of activities) {
      items.push({
        id: `activity-${a.id}`,
        kind: "activity",
        created_at: a.created_at,
        activity: a,
      });
    }

    for (const e of emails) {
      items.push({
        id: `email-${e.id}`,
        kind: "email",
        created_at: e.created_at,
        email: e,
      });
    }

    items.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return items;
  }, [activities, emails]);

  // Filter the timeline
  const filtered = useMemo(() => {
    if (filter === "all") return timeline;
    if (filter === "email") return timeline.filter((t) => t.kind === "email" || t.activity?.activity_type === "email");
    return timeline.filter(
      (t) => t.kind === "activity" && t.activity?.activity_type === filter
    );
  }, [timeline, filter]);

  function formatDuration(seconds: number | null): string {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.activity_type === "call" && !form.description.trim()) {
      toast({ title: "Call notes are required", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("crm_activities").insert({
        contact_id: contactId,
        activity_type: form.activity_type as never,
        subject: form.subject || null,
        description: form.description || null,
        performed_by: currentUserId,
      });

      if (error) throw error;

      await supabase
        .from("crm_contacts")
        .update({ last_contacted_at: new Date().toISOString() })
        .eq("id", contactId);

      toast({ title: "Activity logged" });
      setShowForm(false);
      setForm({ activity_type: "note", subject: "", description: "" });
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Error logging activity",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center justify-between gap-2 mb-5 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_TYPES.map((t) => (
            <Badge
              key={t}
              variant={filter === t ? "default" : "outline"}
              className={
                filter === t
                  ? "cursor-pointer text-xs px-3 py-1.5 rounded-lg bg-foreground text-background"
                  : "cursor-pointer text-xs px-3 py-1.5 rounded-lg border-border text-muted-foreground"
              }
              onClick={() => setFilter(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          {onComposeEmail && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg border-border text-xs"
              onClick={onComposeEmail}
            >
              <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
              Compose
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg border-border text-xs"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Log Activity
          </Button>
        </div>
      </div>

      {/* Log Activity Form */}
      {showForm && (
        <Card className="rounded-xl border-border mb-5">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Activity Type
                  </Label>
                  <Select
                    value={form.activity_type}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, activity_type: v }))
                    }
                  >
                    <SelectTrigger className="rounded-lg border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CRM_ACTIVITY_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Subject</Label>
                  <Input
                    value={form.subject}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, subject: e.target.value }))
                    }
                    placeholder="Brief summary..."
                    className="rounded-lg border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={3}
                  placeholder={isCallType ? "Call notes (required)..." : "Details..."}
                  className="rounded-lg border-border resize-none"
                  required={isCallType}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-border"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading || (isCallType && !form.description.trim())}
                  className="rounded-lg bg-foreground text-background hover:bg-foreground/90"
                >
                  {loading ? "Saving..." : "Save Activity"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Unified Timeline */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-4">
            <Activity
              className="h-6 w-6 text-muted-foreground"
              strokeWidth={1.5}
            />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            No activities
          </h3>
          <p className="text-sm text-muted-foreground">
            {filter !== "all"
              ? `No ${filter} activities. Try changing the filter.`
              : "Log your first activity to start the timeline."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          {filtered.map((item, i) => {
            if (item.kind === "email" && item.email) {
              return (
                <EmailTimelineItem
                  key={item.id}
                  email={item.email}
                  isLast={i === filtered.length - 1}
                  expanded={expandedEmailId === item.email.id}
                  onToggle={() =>
                    setExpandedEmailId((prev) =>
                      prev === item.email!.id ? null : item.email!.id
                    )
                  }
                />
              );
            }

            if (item.kind === "activity" && item.activity) {
              return (
                <ActivityTimelineItem
                  key={item.id}
                  activity={item.activity}
                  isLast={i === filtered.length - 1}
                />
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}

// ── Activity timeline item (existing pattern) ──
function ActivityTimelineItem({
  activity: a,
  isLast,
}: {
  activity: ActivityData;
  isLast: boolean;
}) {
  const Icon = ACTIVITY_ICON_MAP[a.activity_type] || CircleDot;
  const config =
    ACTIVITY_TYPE_CONFIG[a.activity_type] || ACTIVITY_TYPE_CONFIG.system;

  function formatDuration(seconds: number | null): string {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  }

  return (
    <div className="flex gap-3.5 relative pb-5">
      {!isLast && (
        <div
          className="absolute w-px bg-border"
          style={{ left: 15, top: 36, bottom: 0 }}
        />
      )}
      <div
        className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: config.bg }}
      >
        <Icon size={14} style={{ color: config.color }} strokeWidth={1.5} />
      </div>
      <div className="flex-1">
        <div className="text-[13px] text-foreground font-medium leading-snug">
          {a.subject || a.activity_type.replace(/_/g, " ")}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[11px] text-muted-foreground">
            {relTime(a.created_at)}
          </span>
          <span className="text-[11px] text-muted-foreground/50">&middot;</span>
          <span className="text-[11px] text-muted-foreground">
            {a.created_by_name || "System"}
          </span>
          {a.call_duration_seconds != null && a.call_duration_seconds > 0 && (
            <>
              <span className="text-[11px] text-muted-foreground/50">
                &middot;
              </span>
              <span className="text-[11px] text-muted-foreground">
                {formatDuration(a.call_duration_seconds)}
              </span>
            </>
          )}
          {a.direction && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 gap-1"
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

// ── Email timeline item ──
function EmailTimelineItem({
  email: e,
  isLast,
  expanded,
  onToggle,
}: {
  email: EmailData;
  isLast: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isOutbound = e.sent_by_name != null;
  const { label: statusLabel, color: statusColor } = resolveEmailStatus(e);
  const emailConfig = ACTIVITY_TYPE_CONFIG.email;
  const attachmentList = parseAttachments(e.attachments);

  return (
    <div className="flex gap-3.5 relative pb-5">
      {!isLast && (
        <div
          className="absolute w-px bg-border"
          style={{ left: 15, top: 36, bottom: 0 }}
        />
      )}
      <div
        className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: emailConfig.bg }}
      >
        {isOutbound ? (
          <Send size={14} style={{ color: emailConfig.color }} strokeWidth={1.5} />
        ) : (
          <Mail size={14} style={{ color: emailConfig.color }} strokeWidth={1.5} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <button
          type="button"
          onClick={onToggle}
          className="w-full text-left bg-transparent border-0 p-0 cursor-pointer"
        >
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[13px] text-foreground font-medium leading-snug truncate">
                {e.subject}
              </span>
              {attachmentList.length > 0 && (
                <Paperclip
                  size={11}
                  className="text-muted-foreground shrink-0"
                  strokeWidth={1.5}
                />
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {e.opened_at && (
                <Eye
                  size={11}
                  className="text-[#8B5CF6]"
                  strokeWidth={1.5}
                />
              )}
              <Badge
                variant="outline"
                className="text-[10px] gap-1 px-1.5 py-0 h-4"
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
              {expanded ? (
                <ChevronUp size={12} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={12} className="text-muted-foreground" />
              )}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[11px] text-muted-foreground">
            {relTime(e.created_at)}
          </span>
          <span className="text-[11px] text-muted-foreground/50">&middot;</span>
          <span className="text-[11px] text-muted-foreground">
            {isOutbound
              ? `To: ${e.to_name || e.to_email}`
              : `From: ${e.from_email}`}
          </span>
          {isOutbound && (
            <>
              <span className="text-[11px] text-muted-foreground/50">
                &middot;
              </span>
              <span className="text-[11px] text-muted-foreground">
                by {e.sent_by_name}
              </span>
            </>
          )}
        </div>

        {/* Expanded email content */}
        {expanded && (
          <div className="mt-3 rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">From: </span>
                <span className="text-foreground">{e.from_email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">To: </span>
                <span className="text-foreground">{e.to_email}</span>
              </div>
              {e.cc_emails && e.cc_emails.length > 0 && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">CC: </span>
                  <span className="text-foreground">
                    {e.cc_emails.join(", ")}
                  </span>
                </div>
              )}
              {e.delivered_at && (
                <div>
                  <span className="text-muted-foreground">Delivered: </span>
                  <span className="text-foreground">
                    {relTime(e.delivered_at)}
                  </span>
                </div>
              )}
              {e.opened_at && (
                <div>
                  <span className="text-muted-foreground">Opened: </span>
                  <span className="text-foreground">
                    {relTime(e.opened_at)}
                  </span>
                </div>
              )}
            </div>

            {e.body_text && (
              <div className="mt-2 p-3 rounded-md bg-muted text-sm whitespace-pre-wrap max-h-60 overflow-y-auto text-foreground">
                {e.body_text}
              </div>
            )}

            {attachmentList.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">
                  Attachments
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {attachmentList.map((att, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="gap-1 text-xs"
                    >
                      <Paperclip className="h-3 w-3" />
                      {att.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
