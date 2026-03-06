"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, Send, Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "../shared";
import { formatDate } from "@/lib/format";
import type { TeamMember } from "../types";

interface Note {
  id: string;
  content: string;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

interface NotesTabProps {
  contactId: string;
  currentUserId: string;
  currentUserName: string;
  teamMembers: TeamMember[];
}

export function NotesTab({
  contactId,
  currentUserId,
  currentUserName,
  teamMembers,
}: NotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  // Load notes on mount
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
            updated_at: n.created_at as string,
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

      // Refresh local list
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
            updated_at: n.created_at as string,
          }))
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Error saving note",
        description: message,
        variant: "destructive",
      });
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
      toast({
        title: "Error deleting note",
        description: message,
        variant: "destructive",
      });
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
        prev.map((n) =>
          n.id === noteId ? { ...n, content: editContent.trim() } : n
        )
      );
      setEditingId(null);
      setEditContent("");
      toast({ title: "Note updated" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Error updating note",
        description: message,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-4">
      {/* Compose box */}
      <Card className="rounded-xl border-border bg-card">
        <CardContent className="p-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a note..."
            rows={3}
            className="border-border rounded-lg resize-none mb-3 focus:border-foreground focus:ring-0"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !content.trim()}
              className="gap-1.5 rounded-lg bg-foreground text-white hover:bg-foreground/90"
            >
              <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
              {saving ? "Saving..." : "Save Note"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes list */}
      {!loaded ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Loading notes...</p>
          <div className="h-16 rounded-xl bg-muted animate-pulse" />
          <div className="h-16 rounded-xl bg-muted animate-pulse" />
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          title="No notes yet"
          description="Add your first note above."
          icon={MessageSquare}
        />
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const isOwn = note.created_by === currentUserId;
            const isEditing = editingId === note.id;

            return (
              <Card
                key={note.id}
                className="rounded-xl border-border bg-card"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {note.created_by_name || "Unknown"}
                      </span>
                      <span
                        className="text-xs text-muted-foreground font-mono num"
                      >
                        {formatDate(note.created_at)}
                      </span>
                    </div>
                    {isOwn && !isEditing && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setEditingId(note.id);
                            setEditContent(note.content);
                          }}
                        >
                          <Pencil
                            className="h-3.5 w-3.5 text-muted-foreground"
                            strokeWidth={1.5}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleDelete(note.id)}
                        >
                          <Trash2
                            className="h-3.5 w-3.5 text-[#E5453D]"
                            strokeWidth={1.5}
                          />
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
                          className="rounded-lg bg-foreground text-white hover:bg-foreground/90"
                          onClick={() => handleUpdate(note.id)}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {note.content}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
