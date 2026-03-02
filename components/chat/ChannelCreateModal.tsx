"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChatAvatar } from "./ChatAvatar";
import { createClient } from "@/lib/supabase/client";
import type { ChatChannelType } from "@/lib/chat-types";
import { Search, X, Users, MessageCircle, Loader2 } from "lucide-react";

interface ChannelCreateModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onChannelCreated: (channelId: string) => void;
}

type CreateMode = "channel" | "dm";

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export function ChannelCreateModal({
  open,
  onClose,
  userId,
  onChannelCreated,
}: ChannelCreateModalProps) {
  const [mode, setMode] = useState<CreateMode>("channel");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<UserProfile[]>([]);
  const [creating, setCreating] = useState(false);
  const supabaseRef = useRef(createClient());

  // Search users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const supabase = supabaseRef.current;
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .or(
          `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
        )
        .neq("id", userId)
        .limit(10);

      if (data) {
        setSearchResults(
          (data as UserProfile[]).filter(
            (u) => !selectedMembers.some((m) => m.id === u.id)
          )
        );
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, userId, selectedMembers]);

  const addMember = (user: UserProfile) => {
    setSelectedMembers((prev) => [...prev, user]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeMember = (memberId: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);

    const supabase = supabaseRef.current;

    if (mode === "dm") {
      if (selectedMembers.length === 0) return;

      if (selectedMembers.length === 1) {
        const otherUserId = selectedMembers[0].id;
        const { data: existingChannels } = await supabase
          .from("chat_channel_members")
          .select("channel_id")
          .eq("user_id", userId);

        if (existingChannels) {
          for (const ec of existingChannels as unknown as Array<{
            channel_id: string;
          }>) {
            const { data: ch } = await supabase
              .from("chat_channels")
              .select("id, channel_type")
              .eq("id", ec.channel_id)
              .eq("channel_type", "direct")
              .single();

            if (ch) {
              const chTyped = ch as unknown as { id: string };
              const { data: otherMember } = await supabase
                .from("chat_channel_members")
                .select("id")
                .eq("channel_id", chTyped.id)
                .eq("user_id", otherUserId)
                .single();

              if (otherMember) {
                onChannelCreated(chTyped.id);
                resetAndClose();
                return;
              }
            }
          }
        }
      }

      const channelType: ChatChannelType =
        selectedMembers.length === 1 ? "direct" : "group";
      const channelName =
        selectedMembers.length === 1
          ? selectedMembers[0].full_name ||
            selectedMembers[0].email ||
            "DM"
          : selectedMembers
              .map((m) => m.full_name?.split(" ")[0] || "?")
              .join(", ");

      const { data: channelData, error } = await supabase
        .from("chat_channels")
        .insert({
          name: channelName,
          channel_type: channelType,
          is_private: true,
        })
        .select("id")
        .single();

      const channel = channelData as unknown as { id: string } | null;
      if (error || !channel) {
        console.error("Error creating DM:", error);
        setCreating(false);
        return;
      }

      const members = [
        {
          channel_id: channel.id,
          user_id: userId,
          role: "owner" as const,
        },
        ...selectedMembers.map((m) => ({
          channel_id: channel.id,
          user_id: m.id,
          role: "member" as const,
        })),
      ];

      await supabase.from("chat_channel_members").insert(members);
      onChannelCreated(channel.id);
    } else {
      if (!name.trim()) return;

      const { data: channelData2, error } = await supabase
        .from("chat_channels")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          channel_type: "team" as ChatChannelType,
          is_private: isPrivate,
        })
        .select("id")
        .single();

      const channel = channelData2 as unknown as { id: string } | null;
      if (error || !channel) {
        console.error("Error creating channel:", error);
        setCreating(false);
        return;
      }

      const members = [
        {
          channel_id: channel.id,
          user_id: userId,
          role: "owner" as const,
        },
        ...selectedMembers.map((m) => ({
          channel_id: channel.id,
          user_id: m.id,
          role: "member" as const,
        })),
      ];

      await supabase.from("chat_channel_members").insert(members);
      onChannelCreated(channel.id);
    }

    resetAndClose();
  };

  const resetAndClose = () => {
    setName("");
    setDescription("");
    setSearchQuery("");
    setSelectedMembers([]);
    setCreating(false);
    setMode("channel");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && resetAndClose()}>
      <DialogContent className="sm:max-w-md bg-secondary border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            New Conversation
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a team channel or start a direct message.
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("channel")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              mode === "channel"
                ? "bg-[rgba(197,151,91,0.1)] text-gold border border-border"
                : "bg-muted text-muted-foreground border border-border hover:bg-muted"
            }`}
          >
            <Users className="h-4 w-4" />
            Team Channel
          </button>
          <button
            onClick={() => setMode("dm")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              mode === "dm"
                ? "bg-[rgba(197,151,91,0.1)] text-gold border border-border"
                : "bg-muted text-muted-foreground border border-border hover:bg-muted"
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            Direct Message
          </button>
        </div>

        {/* Channel name (only for team channels) */}
        {mode === "channel" && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">
                Channel Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., general, marketing"
                className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">
                Description (optional)
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this channel about?"
                className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded border-border bg-card"
              />
              <span className="text-muted-foreground">Make private</span>
            </label>
          </div>
        )}

        {/* Member search */}
        <div className="mt-2">
          <label className="text-sm font-medium text-muted-foreground block mb-1">
            {mode === "dm" ? "Send to" : "Add members (optional)"}
          </label>

          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
              {selectedMembers.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-[rgba(197,151,91,0.1)] text-gold text-xs rounded-md border border-border"
                >
                  {m.full_name || m.email}
                  <button
                    onClick={() => removeMember(m.id)}
                    className="p-0.5 rounded-full hover:bg-[rgba(197,151,91,0.2)]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative mt-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="mt-1 border border-border rounded-md max-h-40 overflow-y-auto bg-card">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => addMember(user)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[rgba(255,255,255,0.04)] transition-colors duration-200"
                >
                  <ChatAvatar
                    src={user.avatar_url}
                    name={user.full_name}
                    size="header"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {user.full_name || "Unknown"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={resetAndClose}
            className="border-[rgba(197,151,91,0.15)] text-muted-foreground hover:bg-[rgba(255,255,255,0.06)] hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              creating ||
              (mode === "channel" && !name.trim()) ||
              (mode === "dm" && selectedMembers.length === 0)
            }
            className="bg-gold text-foreground hover:bg-gold-light disabled:opacity-50"
          >
            {creating && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {mode === "dm" ? "Start Chat" : "Create Channel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
