"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Tag, X } from "lucide-react";

interface ContactTag {
  id: string;
  contact_id: string;
  tag: string;
  created_at: string;
  created_by: string | null;
}

interface ContactTagsProps {
  contactId: string;
  tags: ContactTag[];
  currentUserId: string;
}

export function ContactTags({
  contactId,
  tags,
  currentUserId,
}: ContactTagsProps) {
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function addTag() {
    const tagText = newTag.trim();
    if (!tagText) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("contact_tags").insert({
        contact_id: contactId,
        tag: tagText,
        created_by: currentUserId,
      });
      if (error) throw error;
      setNewTag("");
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error adding tag",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function removeTag(tagId: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("contact_tags")
        .delete()
        .eq("id", tagId);
      if (error) throw error;
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error removing tag",
        description: err.message,
        variant: "destructive",
      });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Tags
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tag chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((t) => (
            <Badge
              key={t.id}
              variant="outline"
              className="text-xs font-medium bg-muted gap-1 pr-1"
            >
              {t.tag}
              <button
                onClick={() => removeTag(t.id)}
                className="ml-0.5 hover:text-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {tags.length === 0 && (
            <p className="text-sm text-muted-foreground">No tags yet.</p>
          )}
        </div>

        {/* Add tag input */}
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a tag..."
            className="max-w-xs"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={addTag}
            disabled={!newTag.trim() || loading}
            className="gap-1"
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
