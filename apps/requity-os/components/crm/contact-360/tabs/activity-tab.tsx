"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Phone,
  Mail,
  Send,
  Calendar,
  StickyNote,
  MessageSquare,
  Bell,
  TrendingUp,
  Plus,
  Activity,
  Eye,
  ChevronDown,
  ChevronUp,
  Paperclip,
} from "lucide-react";
import { TimelineEvent, EmptyState } from "../shared";
import type { ActivityData, EmailData } from "../types";
import { ACTIVITY_TYPE_CONFIG } from "../types";

const activityIconConfig: Record<
  string,
  { icon: React.ElementType; bg: string; color: string }
> = {
  call: { icon: Phone, bg: "#EFF6FF", color: "#2563EB" },
  email: { icon: Mail, bg: "#F5F3FF", color: "#7C3AED" },
  meeting: { icon: Calendar, bg: "#ECFDF3", color: "#16A34A" },
  note: { icon: StickyNote, bg: "#FFF7ED", color: "#C2410C" },
  text_message: { icon: MessageSquare, bg: "#EFF6FF", color: "#2563EB" },
  follow_up: { icon: Bell, bg: "#FEF2F2", color: "#DC2626" },
  deal_update: { icon: TrendingUp, bg: "#ECFDF3", color: "#16A34A" },
};

function resolveEmailStatus(e: EmailData): { label: string; color: string } {
  if (e.opened_at) return { label: "Opened", color: "#8B5CF6" };
  if (e.delivered_at) return { label: "Delivered", color: "#22A861" };
  const status = e.postmark_status?.toLowerCase();
  if (status === "sent") return { label: "Sent", color: "#22A861" };
  if (status === "bounced" || status === "bounce") return { label: "Bounced", color: "#E5453D" };
  if (status === "failed" || status === "error") return { label: "Failed", color: "#E5453D" };
  if (status === "queued") return { label: "Queued", color: "#E5930E" };
  return { label: "Pending", color: "#E5930E" };
}

function parseAttachments(raw: unknown): { name: string }[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw as { name: string }[];
}

interface TimelineItem {
  id: string;
  kind: "activity" | "email";
  created_at: string;
  activity?: ActivityData;
  email?: EmailData;
}

interface ActivityTabProps {
  contactId: string;
  activities: ActivityData[];
  emails?: EmailData[];
  currentUserId: string;
  onComposeEmail?: () => void;
}

export function ActivityTab({
  contactId,
  activities,
  emails = [],
  currentUserId,
  onComposeEmail,
}: ActivityTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState({
    activity_type: "note",
    subject: "",
    description: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Build unified timeline
  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    for (const a of activities) {
      items.push({ id: `activity-${a.id}`, kind: "activity", created_at: a.created_at, activity: a });
    }
    for (const e of emails) {
      items.push({ id: `email-${e.id}`, kind: "email", created_at: e.created_at, email: e });
    }
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return items;
  }, [activities, emails]);

  const filtered = useMemo(() => {
    if (filterType === "all") return timeline;
    if (filterType === "email") return timeline.filter((t) => t.kind === "email" || t.activity?.activity_type === "email");
    return timeline.filter((t) => t.kind === "activity" && t.activity?.activity_type === filterType);
  }, [timeline, filterType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Unknown error";
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
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-border">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              {CRM_ACTIVITY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          {onComposeEmail && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg border-border"
              onClick={onComposeEmail}
            >
              <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
              Compose
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg border-border"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Log Activity
          </Button>
        </div>
      </div>

      {/* Log Activity Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-card p-4 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Activity Type</Label>
              <Select
                value={form.activity_type}
                onValueChange={(v) => updateField("activity_type", v)}
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
                onChange={(e) => updateField("subject", e.target.value)}
                placeholder="Brief summary..."
                className="rounded-lg border-border"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              placeholder="Details about the interaction..."
              className="rounded-lg border-border resize-none"
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
              disabled={loading}
              className="rounded-lg bg-foreground text-white hover:bg-foreground/90"
            >
              {loading ? "Saving..." : "Save Activity"}
            </Button>
          </div>
        </form>
      )}

      {/* Unified Timeline */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No activities logged"
          description={
            filterType !== "all"
              ? `No ${filterType.replace(/_/g, " ")} activities. Try changing the filter.`
              : "Log your first activity to start the timeline."
          }
          icon={Activity}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card p-4">
          {filtered.map((item, i) => {
            if (item.kind === "email" && item.email) {
              const e = item.email;
              const isOutbound = e.sent_by_name != null;
              const { label: statusLabel, color: statusColor } = resolveEmailStatus(e);
              const attachments = parseAttachments(e.attachments);
              const isExpanded = expandedEmailId === e.id;
              const emailConfig = activityIconConfig.email;

              return (
                <div key={item.id} className="relative">
                  {i < filtered.length - 1 && (
                    <div
                      className="absolute w-px bg-border"
                      style={{ left: 15, top: 36, bottom: 0 }}
                    />
                  )}
                  <div className="flex gap-3 pb-4">
                    <div
                      className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0"
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
                        onClick={() => setExpandedEmailId(isExpanded ? null : e.id)}
                        className="w-full text-left bg-transparent border-0 p-0 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium text-foreground truncate">
                              {e.subject}
                            </span>
                            {attachments.length > 0 && (
                              <Paperclip size={11} className="text-muted-foreground shrink-0" strokeWidth={1.5} />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {e.opened_at && <Eye size={11} className="text-[#8B5CF6]" strokeWidth={1.5} />}
                            <Badge
                              variant="outline"
                              className="text-[10px] gap-1 px-1.5 py-0 h-4"
                              style={{ color: statusColor, borderColor: `${statusColor}30`, backgroundColor: `${statusColor}08` }}
                            >
                              <span className="h-1 w-1 rounded-full" style={{ backgroundColor: statusColor }} />
                              {statusLabel}
                            </Badge>
                            {isExpanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                          </div>
                        </div>
                      </button>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <span>{isOutbound ? `To: ${e.to_name || e.to_email}` : `From: ${e.from_email}`}</span>
                        <span className="text-muted-foreground/50">&middot;</span>
                        <span>{new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        {isOutbound && e.sent_by_name && (
                          <>
                            <span className="text-muted-foreground/50">&middot;</span>
                            <span>by {e.sent_by_name}</span>
                          </>
                        )}
                      </div>
                      {isExpanded && (
                        <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><span className="text-muted-foreground">From: </span><span>{e.from_email}</span></div>
                            <div><span className="text-muted-foreground">To: </span><span>{e.to_email}</span></div>
                            {e.cc_emails && e.cc_emails.length > 0 && (
                              <div className="col-span-2"><span className="text-muted-foreground">CC: </span><span>{e.cc_emails.join(", ")}</span></div>
                            )}
                          </div>
                          {e.body_text && (
                            <div className="mt-2 p-3 rounded-md bg-muted text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                              {e.body_text}
                            </div>
                          )}
                          {attachments.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {attachments.map((att, idx) => (
                                <Badge key={idx} variant="outline" className="gap-1 text-xs">
                                  <Paperclip className="h-3 w-3" />
                                  {att.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            if (item.kind === "activity" && item.activity) {
              const activity = item.activity;
              const config = activityIconConfig[activity.activity_type] || activityIconConfig.note;
              const typeLabel =
                CRM_ACTIVITY_TYPES.find((t) => t.value === activity.activity_type)?.label || activity.activity_type;

              return (
                <TimelineEvent
                  key={item.id}
                  icon={config.icon}
                  iconBg={config.bg}
                  iconColor={config.color}
                  title={activity.subject || typeLabel}
                  description={activity.description}
                  timestamp={activity.created_at}
                  actor={activity.created_by_name}
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
