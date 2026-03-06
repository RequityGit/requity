"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Send, MessageSquare, Pin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { relTime } from "@/components/crm/contact-360/contact-detail-shared";
import type { CompanyNoteData } from "../types";

interface NotesTabProps {
  notes: CompanyNoteData[];
  companyId: string;
  currentUserId: string;
  currentUserName: string;
}

export function CompanyNotesTab({
  notes,
  companyId,
  currentUserId,
  currentUserName,
}: NotesTabProps) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handlePost() {
    if (!content.trim()) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("crm_chatter_posts").insert({
        company_id: companyId,
        author_id: currentUserId,
        body: content.trim(),
      });

      if (error) throw error;

      toast({ title: "Note posted" });
      setContent("");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Error posting note",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Compose box */}
      <div className="bg-card border border-border rounded-xl p-4">
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
            onClick={handlePost}
            disabled={saving || !content.trim()}
            className="gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-xs"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
            {saving ? "Saving..." : "Post Note"}
          </Button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-4">
            <MessageSquare
              className="h-6 w-6 text-muted-foreground"
              strokeWidth={1.5}
            />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            No notes yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Add your first note above.
          </p>
        </div>
      ) : (
        notes.map((note) => {
          const authorInitials = note.author_name
            ? note.author_name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            : "?";

          return (
            <div
              key={note.id}
              className="bg-card border border-border rounded-xl p-4 relative"
            >
              {note.is_pinned && (
                <div className="absolute top-2.5 right-3">
                  <Pin
                    size={13}
                    className="text-[#E5930E] fill-[#E5930E]"
                    strokeWidth={1.5}
                  />
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6 rounded-md">
                  <AvatarFallback className="rounded-md bg-foreground/[0.06] text-foreground text-[10px] font-semibold">
                    {authorInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[13px] font-semibold text-foreground">
                  {note.author_name || "Unknown"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {relTime(note.created_at)}
                </span>
              </div>
              <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap">
                {note.body}
              </p>
            </div>
          );
        })
      )}
    </div>
  );
}
