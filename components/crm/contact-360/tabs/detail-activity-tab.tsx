"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
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
  Mail,
  Phone,
  Edit3,
  CheckCircle2,
  Calendar,
  Activity,
  CircleDot,
  Plus,
} from "lucide-react";
import { DotPill, relTime } from "../contact-detail-shared";
import type { ActivityData } from "../types";
import { ACTIVITY_TYPE_CONFIG } from "../types";

const ACTIVITY_ICON_MAP: Record<string, React.ElementType> = {
  email: Mail,
  call: Phone,
  note: Edit3,
  task: CheckCircle2,
  meeting: Calendar,
  event: Calendar,
  system: Activity,
};

const FILTER_TYPES = ["all", "email", "call", "note", "task", "event", "system"];

interface DetailActivityTabProps {
  contactId: string;
  activities: ActivityData[];
  currentUserId: string;
}

export function DetailActivityTab({
  contactId,
  activities,
  currentUserId,
}: DetailActivityTabProps) {
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState({
    activity_type: "note",
    subject: "",
    description: "",
  });

  const filtered =
    filter === "all" ? activities : activities.filter((a) => a.activity_type === filter);

  function formatDuration(seconds: number | null): string {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  }

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
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error logging activity", description: message, variant: "destructive" });
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
            <button
              key={t}
              onClick={() => setFilter(t)}
              className="px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all duration-150"
              style={{
                borderColor: filter === t ? "#1A1A1A" : "#E5E5E7",
                background: filter === t ? "#1A1A1A" : "#FFF",
                color: filter === t ? "#FFF" : "#6B6B6B",
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-lg border-[#E5E5E7] text-xs"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          Log Activity
        </Button>
      </div>

      {/* Log Activity Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[#E5E5E7] bg-white p-4 space-y-4 mb-5"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-[#6B6B6B]">Activity Type</Label>
              <Select
                value={form.activity_type}
                onValueChange={(v) => setForm((p) => ({ ...p, activity_type: v }))}
              >
                <SelectTrigger className="rounded-lg border-[#E5E5E7]">
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
              <Label className="text-xs text-[#6B6B6B]">Subject</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                placeholder="Brief summary..."
                className="rounded-lg border-[#E5E5E7]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-[#6B6B6B]">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="Details..."
              className="rounded-lg border-[#E5E5E7] resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg border-[#E5E5E7]"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="rounded-lg bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90"
            >
              {loading ? "Saving..." : "Save Activity"}
            </Button>
          </div>
        </form>
      )}

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F7F7F8] mb-4">
            <Activity className="h-6 w-6 text-[#9A9A9A]" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">No activities</h3>
          <p className="text-sm text-[#6B6B6B]">
            {filter !== "all"
              ? `No ${filter} activities. Try changing the filter.`
              : "Log your first activity to start the timeline."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          {filtered.map((a, i) => {
            const Icon = ACTIVITY_ICON_MAP[a.activity_type] || CircleDot;
            const config = ACTIVITY_TYPE_CONFIG[a.activity_type] || ACTIVITY_TYPE_CONFIG.system;

            return (
              <div key={a.id} className="flex gap-3.5 relative pb-5">
                {i < filtered.length - 1 && (
                  <div
                    className="absolute w-px bg-[#E5E5E7]"
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
                  <div className="text-[13px] text-[#1A1A1A] font-medium leading-snug">
                    {a.subject || a.activity_type.replace(/_/g, " ")}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[11px] text-[#8B8B8B]">{relTime(a.created_at)}</span>
                    <span className="text-[11px] text-[#C5C5C5]">&middot;</span>
                    <span className="text-[11px] text-[#8B8B8B]">{a.created_by_name || "System"}</span>
                    {a.call_duration_seconds != null && a.call_duration_seconds > 0 && (
                      <>
                        <span className="text-[11px] text-[#C5C5C5]">&middot;</span>
                        <span className="text-[11px] text-[#8B8B8B]">
                          {formatDuration(a.call_duration_seconds)}
                        </span>
                      </>
                    )}
                    {a.direction && (
                      <DotPill color={config.color} label={a.direction} small />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
