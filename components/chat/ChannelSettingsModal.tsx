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
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/chat-utils";
import { createClient } from "@/lib/supabase/client";
import type { ChatChannelWithUnread, ChatMemberRole, NotificationLevel } from "@/lib/chat-types";
import {
  Bell,
  BellOff,
  Pin,
  PinOff,
  UserMinus,
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
        .from("chat_channel_members" as never)
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
      .from("chat_channels" as never)
      .update({
        name: name.trim(),
        description: description.trim() || null,
      } as never)
      .eq("id", channel.id);

    setSaving(false);
    onClose();
  };

  const handleToggleMute = async () => {
    if (!channel) return;
    const supabase = supabaseRef.current;
    await supabase
      .from("chat_channel_members" as never)
      .update({ is_muted: !channel.is_muted } as never)
      .eq("channel_id", channel.id)
      .eq("user_id", userId);
    onClose();
  };

  const handleTogglePin = async () => {
    if (!channel) return;
    const supabase = supabaseRef.current;
    await supabase
      .from("chat_channel_members" as never)
      .update({ is_pinned: !channel.is_pinned } as never)
      .eq("channel_id", channel.id)
      .eq("user_id", userId);
    onClose();
  };

  const handleLeave = async () => {
    if (!channel) return;
    const supabase = supabaseRef.current;
    await supabase
      .from("chat_channel_members" as never)
      .update({ left_at: new Date().toISOString() } as never)
      .eq("channel_id", channel.id)
      .eq("user_id", userId);
    onClose();
  };

  const handleArchive = async () => {
    if (!channel) return;
    const supabase = supabaseRef.current;
    await supabase
      .from("chat_channels" as never)
      .update({ is_archived: true } as never)
      .eq("id", channel.id);
    onClose();
  };

  if (!channel) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Channel Settings</DialogTitle>
          <DialogDescription>
            Manage {channel.name} settings and members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleToggleMute}>
              {channel.is_muted ? (
                <>
                  <Bell className="h-4 w-4 mr-1.5" /> Unmute
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4 mr-1.5" /> Mute
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleTogglePin}>
              {channel.is_pinned ? (
                <>
                  <PinOff className="h-4 w-4 mr-1.5" /> Unpin
                </>
              ) : (
                <>
                  <Pin className="h-4 w-4 mr-1.5" /> Pin
                </>
              )}
            </Button>
          </div>

          <Separator />

          {/* Edit name and description (admin only or channel owner) */}
          {(isAdmin || channel.member_role === "owner") && (
            <>
              <div>
                <Label htmlFor="edit-name">Channel Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-desc">Description</Label>
                <Input
                  id="edit-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Separator />
            </>
          )}

          {/* Members list */}
          <div>
            <Label className="mb-2 block">
              Members ({members.length})
            </Label>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : (
                members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        {m.profile?.avatar_url && (
                          <AvatarImage src={m.profile.avatar_url} />
                        )}
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                          {getInitials(m.profile?.full_name || null)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {m.profile?.full_name || "Unknown"}
                          {m.user_id === userId && (
                            <span className="text-slate-400 ml-1">(you)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {m.role}
                    </Badge>
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
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4 mr-1.5" /> Leave
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleArchive}
                className="text-red-600 hover:text-red-700"
              >
                <Archive className="h-4 w-4 mr-1.5" /> Archive
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {(isAdmin || channel.member_role === "owner") && (
              <Button onClick={handleSave} disabled={saving || !name.trim()}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
