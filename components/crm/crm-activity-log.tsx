"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CRM_ACTIVITY_TYPES } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/format";
import type { Database } from "@/lib/supabase/types";
import {
  Phone,
  Mail,
  Calendar,
  StickyNote,
  MessageSquare,
  Bell,
  TrendingUp,
  Plus,
} from "lucide-react";

interface Activity {
  id: string;
  activity_type: string;
  subject: string | null;
  description: string | null;
  outcome: string | null;
  created_by_name: string | null;
  created_at: string;
}

interface CrmActivityLogProps {
  contactId: string;
  activities: Activity[];
  currentUserId: string;
}

const activityIcons: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: StickyNote,
  text_message: MessageSquare,
  follow_up: Bell,
  deal_update: TrendingUp,
};

const activityColors: Record<string, string> = {
  call: "bg-blue-100 text-blue-600",
  email: "bg-purple-100 text-purple-600",
  meeting: "bg-green-100 text-green-600",
  note: "bg-amber-100 text-amber-600",
  text_message: "bg-cyan-100 text-cyan-600",
  follow_up: "bg-red-100 text-red-600",
  deal_update: "bg-emerald-100 text-emerald-600",
};

export function CrmActivityLog({
  contactId,
  activities,
  currentUserId,
}: CrmActivityLogProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState({
    activity_type: "note",
    subject: "",
    description: "",
    outcome: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      const insertData: Database["public"]["Tables"]["crm_activities"]["Insert"] = {
        contact_id: contactId,
        activity_type: form.activity_type as any,
        subject: form.subject || null,
        description: form.description || null,
        performed_by: currentUserId,
      };

      const { error } = await supabase.from("crm_activities").insert(insertData);

      if (error) throw error;

      // Update the contact's last_contacted_at
      await supabase
        .from("crm_contacts")
        .update({ last_contacted_at: new Date().toISOString() })
        .eq("id", contactId);

      toast({ title: "Activity logged" });
      setShowForm(false);
      setForm({
        activity_type: "note",
        subject: "",
        description: "",
        outcome: "",
      });
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error logging activity",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Activity Log</CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-3.5 w-3.5" />
          Log Activity
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="rounded-md border bg-muted p-4 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Activity Type</Label>
                <Select
                  value={form.activity_type}
                  onValueChange={(v) => updateField("activity_type", v)}
                >
                  <SelectTrigger>
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
                <Label>Subject</Label>
                <Input
                  value={form.subject}
                  onChange={(e) => updateField("subject", e.target.value)}
                  placeholder="Brief summary..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                placeholder="Details about the interaction..."
              />
            </div>

            <div className="space-y-2">
              <Label>Outcome</Label>
              <Input
                value={form.outcome}
                onChange={(e) => updateField("outcome", e.target.value)}
                placeholder="e.g., Scheduled follow-up call next week"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? "Saving..." : "Save Activity"}
              </Button>
            </div>
          </form>
        )}

        {/* Activity timeline */}
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No activities logged yet.
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.activity_type] || StickyNote;
              const colorClass =
                activityColors[activity.activity_type] ||
                "bg-gray-100 text-gray-600";
              const typeLabel =
                CRM_ACTIVITY_TYPES.find(
                  (t) => t.value === activity.activity_type
                )?.label || activity.activity_type;

              return (
                <div
                  key={activity.id}
                  className="flex gap-3 rounded-md border p-3"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{typeLabel}</span>
                      {activity.subject && (
                        <>
                          <span className="text-muted-foreground">—</span>
                          <span className="text-sm">{activity.subject}</span>
                        </>
                      )}
                    </div>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {activity.description}
                      </p>
                    )}
                    {activity.outcome && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">Outcome:</span>{" "}
                        {activity.outcome}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span>{formatDate(activity.created_at)}</span>
                      {activity.created_by_name && (
                        <>
                          <span>by</span>
                          <span>{activity.created_by_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
