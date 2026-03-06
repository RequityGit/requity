"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Send, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { relTime } from "../contact-detail-shared";
import type { TeamMember } from "../types";

interface Note {
  id: string;
  content: string;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

interface DetailNotesTabProps {
  contactId: string;
  currentUserId: string;
  currentUserName: string;
  teamMembers: TeamMember[];
}

export function DetailNotesTab({
  contactId,
  currentUserId,
  currentUserName,
}: DetailNotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const loadNotes = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("crm_activities")
        .select("*")
        .eq("contact_id", contactId)
        .eq("activity_type", "note" as never)
        .order("created_at", { ascending: false });

      if (data) {
        setNotes(
          data.map((n: Record<string, unknown>) => ({
            id: n.id as string,
            content: (n.description as string) || "",
            created_by: n.performed_by as string | null,
            created_by_name: (n.performed_by_name as string) || null,
            created_at: n.created_at as string,
          }))
        );
      }
      setLoaded(true);
    };
    loadNotes();
  }, [contactId]);

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("crm_activities").insert({
        contact_id: contactId,
        activity_type: "note" as never,
        subject: "Note added",
        description: content.trim(),
        performed_by: currentUserId,
        performed_by_name: currentUserName,
      });

      if (error) throw error;

      toast({ title: "Note added" });
      setContent("");
      router.refresh();

      const { data } = await supabase
        .from("crm_activities")
        .select("*")
        .eq("contact_id", contactId)
        .eq("activity_type", "note" as never)
        .order("created_at", { ascending: false });

      if (data) {
        setNotes(
          data.map((n: Record<string, unknown>) => ({
            id: n.id as string,
            content: (n.description as string) || "",
            created_by: n.performed_by as string | null,
            created_by_name: (n.performed_by_name as string) || null,
            created_at: n.created_at as string,
          }))
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error saving note", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(noteId: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("crm_activities")
        .delete()
        .eq("id", noteId);
      if (error) throw error;
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast({ title: "Note deleted" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error deleting note", description: message, variant: "destructive" });
    }
  }

  async function handleUpdate(noteId: string) {
    if (!editContent.trim()) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("crm_activities")
        .update({ description: editContent.trim() })
        .eq("id", noteId);
      if (error) throw error;
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, content: editContent.trim() } : n))
      );
      setEditingId(null);
      setEditContent("");
      toast({ title: "Note updated" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error updating note", description: message, variant: "destructive" });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Compose box */}
      <Card className="rounded-xl border-border">
        <CardContent className="p-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a note... use @mention to tag team members"
          rows={3}
          className="border-border rounded-lg resize-none mb-2.5 bg-muted/50 focus:border-foreground focus:ring-0"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-xs"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
            {saving ? "Saving..." : "Post Note"}
          </Button>
        </div>
        </CardContent>
      </Card>

      {/* Notes list */}
      {!loaded ? (
        <div className="space-y-3">
          <div className="h-16 rounded-xl bg-muted animate-pulse" />
          <div className="h-16 rounded-xl bg-muted animate-pulse" />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-4">
            <MessageSquare className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">No notes yet</h3>
          <p className="text-sm text-muted-foreground">Add your first note above.</p>
        </div>
      ) : (
        notes.map((note) => {
          const isOwn = note.created_by === currentUserId;
          const isEditing = editingId === note.id;
          const authorInitials = note.created_by_name
            ? note.created_by_name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            : "?";

          return (
            <Card key={note.id} className="rounded-xl border-border">
              <CardContent className="p-4 relative">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6 rounded-md">
                  <AvatarFallback className="rounded-md bg-foreground/[0.06] text-foreground text-[10px] font-semibold">
                    {authorInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[13px] font-semibold text-foreground">
                  {note.created_by_name || "Unknown"}
                </span>
                <span className="text-[11px] text-muted-foreground">{relTime(note.created_at)}</span>
                {isOwn && !isEditing && (
                  <div className="flex items-center gap-1 ml-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        setEditingId(note.id);
                        setEditContent(note.content);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-[#E5453D]" strokeWidth={1.5} />
                    </Button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="border-border rounded-lg resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg border-border"
                      onClick={() => {
                        setEditingId(null);
                        setEditContent("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-lg bg-foreground text-background hover:bg-foreground/90"
                      onClick={() => handleUpdate(note.id)}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
