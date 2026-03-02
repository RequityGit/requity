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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/chat-utils";
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
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
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

  const removeMember = (userId: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== userId));
  };

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);

    const supabase = supabaseRef.current;

    if (mode === "dm") {
      if (selectedMembers.length === 0) return;

      // For 1:1, check if DM channel already exists
      if (selectedMembers.length === 1) {
        const otherUserId = selectedMembers[0].id;
        // Look for existing direct channel between these two users
        const { data: existingChannels } = await supabase
          .from("chat_channel_members" as never)
          .select("channel_id")
          .eq("user_id", userId);

        if (existingChannels) {
          for (const ec of existingChannels as unknown as Array<{ channel_id: string }>) {
            const { data: ch } = await supabase
              .from("chat_channels" as never)
              .select("id, channel_type")
              .eq("id", ec.channel_id)
              .eq("channel_type", "direct")
              .single();

            if (ch) {
              const chTyped = ch as unknown as { id: string };
              const { data: otherMember } = await supabase
                .from("chat_channel_members" as never)
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
          ? selectedMembers[0].full_name || selectedMembers[0].email || "DM"
          : selectedMembers.map((m) => m.full_name?.split(" ")[0] || "?").join(", ");

      const { data: channelData, error } = await supabase
        .from("chat_channels" as never)
        .insert({
          name: channelName,
          channel_type: channelType,
          is_private: true,
        } as never)
        .select("id")
        .single();

      const channel = channelData as unknown as { id: string } | null;
      if (error || !channel) {
        console.error("Error creating DM:", error);
        setCreating(false);
        return;
      }

      // Add all members (including self)
      const members = [
        { channel_id: channel.id, user_id: userId, role: "owner" as const },
        ...selectedMembers.map((m) => ({
          channel_id: channel.id,
          user_id: m.id,
          role: "member" as const,
        })),
      ];

      await supabase.from("chat_channel_members" as never).insert(members as never);
      onChannelCreated(channel.id);
    } else {
      // Create team channel
      if (!name.trim()) return;

      const { data: channelData2, error } = await supabase
        .from("chat_channels" as never)
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          channel_type: "team" as ChatChannelType,
          is_private: isPrivate,
        } as never)
        .select("id")
        .single();

      const channel = channelData2 as unknown as { id: string } | null;
      if (error || !channel) {
        console.error("Error creating channel:", error);
        setCreating(false);
        return;
      }

      // Add self as owner
      const members = [
        { channel_id: channel.id, user_id: userId, role: "owner" as const },
        ...selectedMembers.map((m) => ({
          channel_id: channel.id,
          user_id: m.id,
          role: "member" as const,
        })),
      ];

      await supabase.from("chat_channel_members" as never).insert(members as never);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Create a team channel or start a direct message.
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("channel")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "channel"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Users className="h-4 w-4" />
            Team Channel
          </button>
          <button
            onClick={() => setMode("dm")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "dm"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
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
              <Label htmlFor="channel-name">Channel Name</Label>
              <Input
                id="channel-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., general, marketing"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="channel-desc">Description (optional)</Label>
              <Input
                id="channel-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this channel about?"
                className="mt-1"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span className="text-slate-700">Make private</span>
            </label>
          </div>
        )}

        {/* Member search */}
        <div className="mt-2">
          <Label>
            {mode === "dm" ? "Send to" : "Add members (optional)"}
          </Label>

          {/* Selected members */}
          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
              {selectedMembers.map((m) => (
                <Badge key={m.id} variant="secondary" className="gap-1 pr-1">
                  {m.full_name || m.email}
                  <button
                    onClick={() => removeMember(m.id)}
                    className="p-0.5 rounded-full hover:bg-slate-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="relative mt-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-8"
            />
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="mt-1 border border-slate-200 rounded-md max-h-40 overflow-y-auto">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => addMember(user)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                >
                  <Avatar className="h-7 w-7">
                    {user.avatar_url && (
                      <AvatarImage src={user.avatar_url} />
                    )}
                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {user.full_name || "Unknown"}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {user.email}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              creating ||
              (mode === "channel" && !name.trim()) ||
              (mode === "dm" && selectedMembers.length === 0)
            }
          >
            {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === "dm" ? "Start Chat" : "Create Channel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
