"use client";

import { useMemo, useState } from "react";
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary";
import { ActionCenterStream } from "@/components/pipeline/tabs/ActionCenterTab/ActionCenterStream";
import type { NoteHandlers } from "@/components/pipeline/tabs/ActionCenterTab/ActionCenterStreamItem";
import {
  useEntityActivityData,
  type ActivityEntityType,
} from "@/hooks/useEntityActivityData";
import { CRM_ACTIVITY_TYPES } from "@/lib/constants";
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
import { Plus, X } from "lucide-react";

// ── Props ──

interface EntityActivityStreamProps {
  entityType: ActivityEntityType;
  entityId: string;
  currentUserId: string;
  currentUserName: string;
  onComposeEmail?: () => void;
}

// ── Component ──

export function EntityActivityStream({
  entityType,
  entityId,
  currentUserId,
  currentUserName,
}: EntityActivityStreamProps) {
  const {
    streamItems,
    streamLoading,
    filterCounts,
    activeFilter,
    setActiveFilter,
    postNote,
    replyToNote,
    editNote,
    deleteNote,
    toggleLike,
    pinNote,
    logActivity,
  } = useEntityActivityData({
    entityType,
    entityId,
    currentUserId,
    currentUserName,
  });

  const noteHandlers: NoteHandlers = useMemo(
    () => ({
      currentUserId,
      currentUserName,
      onPin: pinNote,
      onEdit: editNote,
      onDelete: deleteNote,
      onToggleLike: toggleLike,
      onReply: replyToNote,
    }),
    [
      currentUserId,
      currentUserName,
      pinNote,
      editNote,
      deleteNote,
      toggleLike,
      replyToNote,
    ]
  );

  // Log Activity form state
  const [showLogForm, setShowLogForm] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [logForm, setLogForm] = useState({
    activity_type: "call",
    subject: "",
    description: "",
  });

  async function handleLogActivity(e: React.FormEvent) {
    e.preventDefault();
    setLogLoading(true);
    try {
      const result = await logActivity(
        logForm.activity_type,
        logForm.subject,
        logForm.description
      );
      if (result.success) {
        setShowLogForm(false);
        setLogForm({ activity_type: "call", subject: "", description: "" });
      }
    } finally {
      setLogLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Log Activity bar */}
      <div className="flex items-center justify-end px-3 py-1.5 border-b gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-lg border-border text-xs h-7"
          onClick={() => setShowLogForm(!showLogForm)}
        >
          {showLogForm ? (
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          ) : (
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
          Log Activity
        </Button>
      </div>

      {/* Log Activity Form (collapsible) */}
      {showLogForm && (
        <div className="border-b bg-muted/20 px-3 py-3">
          <form onSubmit={handleLogActivity} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Activity Type
                </Label>
                <Select
                  value={logForm.activity_type}
                  onValueChange={(v) =>
                    setLogForm((p) => ({ ...p, activity_type: v }))
                  }
                >
                  <SelectTrigger className="rounded-lg border-border h-8 text-xs">
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
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Subject
                </Label>
                <Input
                  value={logForm.subject}
                  onChange={(e) =>
                    setLogForm((p) => ({ ...p, subject: e.target.value }))
                  }
                  placeholder="Brief summary..."
                  className="rounded-lg border-border h-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">
                Description
              </Label>
              <Textarea
                value={logForm.description}
                onChange={(e) =>
                  setLogForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={2}
                placeholder="Details..."
                className="rounded-lg border-border resize-none text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg border-border text-xs h-7"
                onClick={() => setShowLogForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={logLoading}
                className="rounded-lg bg-foreground text-background hover:bg-foreground/90 text-xs h-7"
              >
                {logLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Activity Stream (reuses deal's ActionCenterStream) */}
      <div className="flex-1 min-h-0">
        <SectionErrorBoundary fallbackTitle="Could not load activity stream">
          <ActionCenterStream
            items={streamItems}
            loading={streamLoading}
            filterCounts={filterCounts}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onPost={postNote}
            showMessageMode={false}
            noteHandlers={noteHandlers}
          />
        </SectionErrorBoundary>
      </div>
    </div>
  );
}
