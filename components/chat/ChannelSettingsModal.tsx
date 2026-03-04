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
import { getInitials } from "@/lib/chat-utils";
import { createClient } from "@/lib/supabase/client";
import type {
  ChatChannelWithUnread,
  ChatMemberRole,
} from "@/lib/chat-types";
import {
  Bell,
  BellOff,
  Pin,
  PinOff,
  LogOut,
  Archive,
  Loader2,
} from "lucide-react";

interface ChannelSettingsModalProps {
  open: boolean;
  onClose: () => void;
  channel: ChatChannelWithUnread | null;
  userId: string;
  isAdmin: boolean;
}

interface ChannelMember {
  id: string;
  user_id: string;
  role: ChatMemberRole;
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export function ChannelSettingsModal({
  open,
  onClose,
  channel,
  userId,
  isAdmin,
}: ChannelSettingsModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    if (!channel || !open) return;
    setName(channel.name);
    setDescription(channel.description || "");

    const fetchMembers = async () => {
      const supabase = supabaseRef.current;
      const { data } = await supabase
        .from("chat_channel_members")
        .select(
          "id, user_id, role, profiles:user_id(id, full_name, email, avatar_url)"
        )
        .eq("channel_id", channel.id)
        .is("left_at", null);

      if (data) {
        setMembers(
          (data as unknown as ChannelMember[]).sort((a, b) => {
            const roleOrder: Record<string, number> = {
              owner: 0,
              admin: 1,
              member: 2,
              guest: 3,
              observer: 4,
            };
            return (roleOrder[a.role] || 9) - (roleOrder[b.role] || 9);
          })
        );
      }
      setLoading(false);
    };

    fetchMembers();
  }, [channel, open]);

  const handleSave = async () => {
    if (!channel) return;
    setSaving(true);
    const supabase = supabaseRef.current;

    await supabase
      .from("chat_channels")
      .update({
        name: name.trim(),
        description: description.trim() || null,
      })
      .eq("id", channel.id);

    setSaving(false);
    onClose();
  };

  const handleToggleMute = async () => {
    if (!channel) return;
    const supabase = supabaseRef.current;
    await supabase
      .from("chat_channel_members")
      .update({ is_muted: !channel.is_muted })
      .eq("channel_id", channel.id)
      .eq("user_id", userId);
    onClose();
  };

  const handleTogglePin = async () => {
    if (!channel) return;
    const supabase = supabaseRef.current;
    await supabase
      .from("chat_channel_members")
      .update({ is_pinned: !channel.is_pinned })
      .eq("channel_id", channel.id)
      .eq("user_id", userId);
    onClose();
  };

  const handleLeave = async () => {
    if (!channel) return;
    const supabase = supabaseRef.current;
    await supabase
      .from("chat_channel_members")
      .update({ left_at: new Date().toISOString() })
      .eq("channel_id", channel.id)
      .eq("user_id", userId);
    onClose();
  };

  const handleArchive = async () => {
    if (!channel) return;
    const supabase = supabaseRef.current;
    await supabase
      .from("chat_channels")
      .update({ is_archived: true })
      .eq("id", channel.id);
    onClose();
  };

  if (!channel) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md bg-secondary border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Channel Settings
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Manage {channel.name} settings and members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick actions */}
          <div className="flex gap-2">
            <button
              onClick={handleToggleMute}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border text-muted-foreground hover:bg-[rgba(255,255,255,0.06)] transition-colors duration-200"
            >
              {channel.is_muted ? (
                <>
                  <Bell className="h-4 w-4" /> Unmute
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4" /> Mute
                </>
              )}
            </button>
            <button
              onClick={handleTogglePin}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border text-muted-foreground hover:bg-[rgba(255,255,255,0.06)] transition-colors duration-200"
            >
              {channel.is_pinned ? (
                <>
                  <PinOff className="h-4 w-4" /> Unpin
                </>
              ) : (
                <>
                  <Pin className="h-4 w-4" /> Pin
                </>
              )}
            </button>
          </div>

          <div className="border-t border-border" />

          {/* Edit name and description */}
          {(isAdmin || channel.member_role === "owner") && (
            <>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1">
                  Channel Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1">
                  Description
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="border-t border-border" />
            </>
          )}

          {/* Members list */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Members ({members.length})
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (
                members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <ChatAvatar
                        src={m.profile?.avatar_url}
                        name={m.profile?.full_name}
                        size="header"
                      />
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {m.profile?.full_name || "Unknown"}
                          {m.user_id === userId && (
                            <span className="text-muted-foreground ml-1">
                              (you)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded">
                      {m.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between mt-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeave}
              className="border-[rgba(192,57,43,0.3)] text-[#C0392B] hover:bg-[rgba(192,57,43,0.1)] hover:text-[#C0392B]"
            >
              <LogOut className="h-4 w-4 mr-1.5" /> Leave
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleArchive}
                className="border-[rgba(192,57,43,0.3)] text-[#C0392B] hover:bg-[rgba(192,57,43,0.1)] hover:text-[#C0392B]"
              >
                <Archive className="h-4 w-4 mr-1.5" /> Archive
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-border text-muted-foreground hover:bg-[rgba(255,255,255,0.06)] hover:text-foreground"
            >
              Cancel
            </Button>
            {(isAdmin || channel.member_role === "owner") && (
              <Button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="bg-primary text-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
