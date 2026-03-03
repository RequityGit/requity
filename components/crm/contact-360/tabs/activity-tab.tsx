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
  Phone,
  Mail,
  Calendar,
  StickyNote,
  MessageSquare,
  Bell,
  TrendingUp,
  Plus,
  Activity,
} from "lucide-react";
import { TimelineEvent, EmptyState } from "../shared";
import type { ActivityData } from "../types";

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

interface ActivityTabProps {
  contactId: string;
  activities: ActivityData[];
  currentUserId: string;
}

export function ActivityTab({
  contactId,
  activities,
  currentUserId,
}: ActivityTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
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
      toast({
        title: "Error logging activity",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredActivities =
    filterType === "all"
      ? activities
      : activities.filter((a) => a.activity_type === filterType);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-[#E5E5E7]">
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
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-lg border-[#E5E5E7]"
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
          className="rounded-xl border border-[#E5E5E7] bg-white p-4 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-[#6B6B6B]">Activity Type</Label>
              <Select
                value={form.activity_type}
                onValueChange={(v) => updateField("activity_type", v)}
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
                onChange={(e) => updateField("subject", e.target.value)}
                placeholder="Brief summary..."
                className="rounded-lg border-[#E5E5E7]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-[#6B6B6B]">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              placeholder="Details about the interaction..."
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

      {/* Activity Timeline */}
      {filteredActivities.length === 0 ? (
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
        <div className="rounded-xl border border-[#E5E5E7] bg-white p-4">
          {filteredActivities.map((activity, i) => {
            const config =
              activityIconConfig[activity.activity_type] ||
              activityIconConfig.note;
            const typeLabel =
              CRM_ACTIVITY_TYPES.find(
                (t) => t.value === activity.activity_type
              )?.label || activity.activity_type;

            return (
              <TimelineEvent
                key={activity.id}
                icon={config.icon}
                iconBg={config.bg}
                iconColor={config.color}
                title={activity.subject || typeLabel}
                description={activity.description}
                timestamp={activity.created_at}
                actor={activity.created_by_name}
                isLast={i === filteredActivities.length - 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
