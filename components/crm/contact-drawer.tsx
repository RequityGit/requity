"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import { CRM_LIFECYCLE_STAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import {
  X,
  Mail,
  Phone,
  Briefcase,
  Activity,
  Send,
} from "lucide-react";
import { ClickToCallNumber } from "@/components/ui/ClickToCallNumber";
import type { CrmContactRow } from "./crm-v2-page";
import { Avatar, RelPill, StageDot, getInitials, getNameInitials } from "./crm-primitives";

// ── Contact Drawer ─────────────────────────────────────────────────────

interface ContactDrawerProps {
  contact: CrmContactRow;
  onClose: () => void;
  isSuperAdmin: boolean;
}

export function ContactDrawer({
  contact,
  onClose,
  isSuperAdmin,
}: ContactDrawerProps) {
  const [tab, setTab] = useState<"overview" | "activity" | "notes">("overview");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [activities, setActivities] = useState<Array<{
    id: string;
    activity_type: string;
    subject: string | null;
    description: string | null;
    performed_by_name: string | null;
    created_at: string;
  }>>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const initials = getInitials(contact.first_name, contact.last_name);

  // Fetch activities when activity tab is opened
  useEffect(() => {
    if (tab === "activity" || tab === "notes") {
      setLoadingActivity(true);
      const supabase = createClient();
      supabase
        .from("crm_activities")
        .select("id, activity_type, subject, description, performed_by_name, created_at")
        .eq("contact_id", contact.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50)
        .then(({ data }) => {
          setActivities(data ?? []);
          setLoadingActivity(false);
        });
    }
  }, [tab, contact.id]);

  async function handleSaveNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("crm_activities").insert({
        contact_id: contact.id,
        activity_type: "note",
        subject: "Note added",
        description: noteText.trim(),
      });
      if (error) throw error;
      toast({ title: "Note saved" });
      setNoteText("");
      // Refresh activities
      const { data } = await supabase
        .from("crm_activities")
        .select("id, activity_type, subject, description, performed_by_name, created_at")
        .eq("contact_id", contact.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      setActivities(data ?? []);
    } catch (err: unknown) {
      toast({
        title: "Error saving note",
        description: err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSavingNote(false);
    }
  }

  const tabs = ["overview", "activity", "notes"] as const;

  return (
    <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-card border-l z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-6 py-5 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <Avatar text={initials} size="lg" />
            <div>
              <div className="text-lg font-bold text-foreground">
                {contact.first_name} {contact.last_name}
              </div>
              <div className="text-sm text-muted-foreground">{contact.company_name || "—"}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {contact.relationships.map((r) => (
            <RelPill key={r} type={r} />
          ))}
          <StageDot stage={contact.lifecycle_stage} />
        </div>
        <div className="mt-3 space-y-1">
          {contact.email && (
            <div className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400">
              <Mail className="h-3.5 w-3.5" />
              {contact.email}
            </div>
          )}
          {contact.phone && (
            <ClickToCallNumber number={contact.phone} className="text-sm" />
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex border-b">
        {[
          { l: "Activities", v: contact.activity_count.toString() },
          { l: "Stage", v: CRM_LIFECYCLE_STAGES.find((s) => s.value === contact.lifecycle_stage)?.label ?? "—" },
          { l: "Location", v: contact.city && contact.state ? `${contact.city}, ${contact.state}` : contact.city || contact.state || "—" },
        ].map((s, i) => (
          <div
            key={s.l}
            className={cn(
              "flex-1 px-5 py-3 text-center",
              i < 2 && "border-r"
            )}
          >
            <div className="text-[11px] text-muted-foreground">{s.l}</div>
            <div className="font-mono text-sm font-semibold text-foreground mt-0.5">{s.v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 px-6 border-b">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "text-sm font-medium py-2.5 border-b-2 capitalize transition-colors",
              tab === t
                ? "text-foreground border-foreground"
                : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {tab === "overview" && (
          <div className="space-y-4">
            {contact.notes && (
              <div className="bg-muted/50 rounded-lg p-3.5">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Notes</div>
                <div className="text-sm text-foreground leading-relaxed">{contact.notes}</div>
              </div>
            )}
            {contact.assigned_to_name && (
              <div className="flex items-center justify-between py-2.5 border-b">
                <span className="text-sm text-muted-foreground">Assigned To</span>
                <div className="flex items-center gap-2">
                  <Avatar text={contact.assigned_to_initials ?? getNameInitials(contact.assigned_to_name)} size="sm" />
                  <span className="text-sm font-medium text-foreground">{contact.assigned_to_name}</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between py-2.5 border-b">
              <span className="text-sm text-muted-foreground">Last Contacted</span>
              <span className="font-mono text-sm text-foreground">
                {contact.last_contacted_at ? formatDate(contact.last_contacted_at) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b">
              <span className="text-sm text-muted-foreground">Location</span>
              <span className="text-sm text-foreground">
                {contact.city && contact.state ? `${contact.city}, ${contact.state}` : contact.city || contact.state || "—"}
              </span>
            </div>
            {contact.source && (
              <div className="flex items-center justify-between py-2.5 border-b">
                <span className="text-sm text-muted-foreground">Source</span>
                <span className="text-sm text-foreground capitalize">{contact.source.replace(/_/g, " ")}</span>
              </div>
            )}
            {contact.next_follow_up_date && (
              <div className="flex items-center justify-between py-2.5 border-b">
                <span className="text-sm text-muted-foreground">Next Follow-Up</span>
                <span className="font-mono text-sm text-foreground">
                  {formatDate(contact.next_follow_up_date)}
                </span>
              </div>
            )}
          </div>
        )}

        {tab === "activity" && (
          <div>
            {loadingActivity ? (
              <div className="text-center py-10">
                <div className="text-sm text-muted-foreground">Loading activities...</div>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-10">
                <Activity className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
                <p className="text-xs text-muted-foreground mt-1">Interactions will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((a) => (
                  <div key={a.id} className="flex gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground">{a.subject || a.activity_type}</div>
                      {a.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-muted-foreground">
                          {a.performed_by_name || "System"}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {formatDate(a.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "notes" && (
          <div>
            <Textarea
              placeholder="Add a note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[80px] resize-y text-sm"
            />
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                disabled={!noteText.trim() || savingNote}
                onClick={handleSaveNote}
                className="gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                {savingNote ? "Saving..." : "Save Note"}
              </Button>
            </div>

            {/* Previous notes (from activities) */}
            {activities.filter((a) => a.activity_type === "note").length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Previous Notes</div>
                {activities
                  .filter((a) => a.activity_type === "note")
                  .map((a) => (
                    <div key={a.id} className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm text-foreground">{a.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] text-muted-foreground">{a.performed_by_name || "—"}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">{formatDate(a.created_at)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-3.5 border-t flex gap-2">
        {contact.email && (
          <Button variant="outline" size="sm" className="flex-1 gap-1.5 justify-center" asChild>
            <a href={`mailto:${contact.email}`}>
              <Mail className="h-3.5 w-3.5" />
              Email
            </a>
          </Button>
        )}
        {contact.phone && (
          <Button variant="outline" size="sm" className="flex-1 gap-1.5 justify-center" asChild>
            <a href={`tel:${contact.phone}`}>
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
          </Button>
        )}
        <Button size="sm" className="flex-1 gap-1.5 justify-center" asChild>
          <Link href={`/admin/crm/${contact.id}`}>
            <Briefcase className="h-3.5 w-3.5" />
            Full Profile
          </Link>
        </Button>
      </div>
    </div>
  );
}
