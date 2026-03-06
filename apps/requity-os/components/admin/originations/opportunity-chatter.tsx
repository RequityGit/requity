"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/format";
import {
  MessageSquare,
  Send,
  Pin,
  PinOff,
  Reply,
  AtSign,
  X,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { getOrCreateOpportunityChatterChannel } from "@/app/(authenticated)/admin/originations/actions";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ChatMessage {
  id: string;
  channel_id: string;
  loan_id: string;
  sent_by: string;
  content: string;
  content_html: string | null;
  thread_parent_id: string | null;
  thread_reply_count: number;
  thread_last_reply_at: string | null;
  mentioned_user_ids: string[];
  attachments: { name: string; size: number; type: string; storage_path: string }[];
  message_type: string;
  is_pinned: boolean;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface ChatChannel {
  id: string;
  loan_id: string;
  channel_name: string;
  last_message_at: string | null;
  pinned_message_ids: string[];
  is_archived: boolean;
}

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface OpportunityChatterProps {
  opportunityId: string;
  currentUserId: string;
  dealName?: string;
}

export function OpportunityChatter({
  opportunityId,
  currentUserId,
  dealName,
}: OpportunityChatterProps) {
  const [channel, setChannel] = useState<ChatChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [showMentions, setShowMentions] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [expanded, setExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Load channel and messages
  const loadData = useCallback(async () => {
    // Get or create channel via server action
    const result = await getOrCreateOpportunityChatterChannel(opportunityId);
    if (result.error || !result.channel) {
      setLoading(false);
      return;
    }

    const channelData = result.channel;
    setChannel(channelData as ChatChannel);

    const supabase = createClient();

    // Load messages
    const { data: msgData } = await (supabase as any)
      .from("deal_chat_messages")
      .select("*")
      .eq("channel_id", channelData.id)
      .eq("is_deleted", false)
      .is("thread_parent_id", null)
      .order("created_at", { ascending: true });

    setMessages((msgData ?? []) as ChatMessage[]);

    // Load team member profiles
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name, email");

    if (profileData) {
      const profileMap: Record<string, string> = {};
      const members: TeamMember[] = [];
      profileData.forEach((p: any) => {
        profileMap[p.id] = p.full_name || p.email || "Unknown";
        members.push(p);
      });
      setProfiles(profileMap);
      setTeamMembers(members);
    }

    // Mark as read
    await (supabase as any)
      .from("deal_chat_read_status")
      .upsert(
        {
          channel_id: channelData.id,
          user_id: currentUserId,
          last_read_at: new Date().toISOString(),
          unread_count: 0,
        },
        { onConflict: "channel_id,user_id" }
      );

    setLoading(false);
  }, [opportunityId, currentUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (expanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, expanded]);

  // Realtime subscription
  useEffect(() => {
    if (!channel) return;

    const supabase = createClient();
    const sub = supabase
      .channel(`opp-chatter-${channel.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deal_chat_messages",
          filter: `channel_id=eq.${channel.id}`,
        },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [channel, loadData]);

  async function handleSend() {
    if (!messageText.trim() || !channel) return;

    setSending(true);
    try {
      const supabase = createClient();

      // Parse @mentions
      const mentionRegex = /@(\w+(?:\s\w+)?)/g;
      const mentionedIds: string[] = [];
      let match;
      while ((match = mentionRegex.exec(messageText)) !== null) {
        const mentionName = match[1].toLowerCase();
        const found = teamMembers.find(
          (m) =>
            m.full_name?.toLowerCase().includes(mentionName) ||
            m.email?.toLowerCase().includes(mentionName)
        );
        if (found) mentionedIds.push(found.id);
      }

      const { error } = await (supabase as any)
        .from("deal_chat_messages")
        .insert({
          channel_id: channel.id,
          loan_id: opportunityId,
          sent_by: currentUserId,
          content: messageText.trim(),
          mentioned_user_ids: mentionedIds,
          message_type: "message",
        });

      if (error) throw error;

      setMessageText("");
      textareaRef.current?.focus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Failed to send message",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  async function handlePin(messageId: string, isPinned: boolean) {
    if (!channel) return;
    const supabase = createClient();
    await (supabase as any)
      .from("deal_chat_messages")
      .update({ is_pinned: !isPinned })
      .eq("id", messageId);
    loadData();
    toast({ title: isPinned ? "Message unpinned" : "Message pinned" });
  }

  async function handleEdit(messageId: string) {
    if (!editText.trim()) return;
    const supabase = createClient();
    await (supabase as any)
      .from("deal_chat_messages")
      .update({
        content: editText.trim(),
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq("id", messageId);
    setEditingId(null);
    setEditText("");
    loadData();
  }

  async function handleDelete(messageId: string) {
    const supabase = createClient();
    await (supabase as any)
      .from("deal_chat_messages")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", messageId);
    loadData();
    toast({ title: "Message deleted" });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "@") {
      setShowMentions(true);
    }
  }

  function insertMention(member: TeamMember) {
    const name = member.full_name || member.email || "user";
    setMessageText((prev) => prev + `@${name} `);
    setShowMentions(false);
    textareaRef.current?.focus();
  }

  // Group messages by date
  const messageGroups = groupMessagesByDate(messages);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none flex flex-row items-center justify-between py-3 px-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Deal Chatter</CardTitle>
          {messages.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {messages.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link href="/chat" title="Open in full Chatter">
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
              <ExternalLink className="h-3 w-3" /> Full Chatter
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-col" style={{ maxHeight: "500px" }}>
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto space-y-1 mb-3" style={{ maxHeight: "400px" }}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No messages yet. Start the conversation about this deal.
                    </p>
                  </div>
                ) : (
                  <>
                    {messageGroups.map(([dateLabel, msgs]) => (
                      <div key={dateLabel}>
                        <div className="flex items-center gap-3 my-2">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-xs text-muted-foreground font-medium">
                            {dateLabel}
                          </span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                        {msgs.map((msg) => (
                          <ChatterBubble
                            key={msg.id}
                            message={msg}
                            senderName={profiles[msg.sent_by] ?? "Unknown"}
                            isOwnMessage={msg.sent_by === currentUserId}
                            editingId={editingId}
                            editText={editText}
                            onStartEdit={(id, text) => { setEditingId(id); setEditText(text); }}
                            onSaveEdit={handleEdit}
                            onCancelEdit={() => { setEditingId(null); setEditText(""); }}
                            onEditTextChange={setEditText}
                            onPin={handlePin}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Mention dropdown */}
              {showMentions && (
                <div className="mb-2">
                  <div className="rounded-md border bg-popover shadow-md p-1 max-h-32 overflow-y-auto">
                    {teamMembers.slice(0, 8).map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors"
                        onClick={() => insertMention(member)}
                      >
                        <span className="font-medium">{member.full_name || member.email}</span>
                        {member.full_name && member.email && (
                          <span className="text-xs text-muted-foreground ml-2">{member.email}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Compose bar */}
              <div className="border-t pt-3">
                <div className="flex items-end gap-2">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      if (showMentions && !e.target.value.includes("@")) {
                        setShowMentions(false);
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    className="min-h-[40px] max-h-[120px] resize-none text-sm"
                    rows={1}
                  />
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => setShowMentions(!showMentions)}
                      title="Mention someone"
                    >
                      <AtSign className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="h-9 px-3 gap-1"
                      disabled={!messageText.trim() || sending}
                      onClick={handleSend}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Message Bubble
// ---------------------------------------------------------------------------

function ChatterBubble({
  message,
  senderName,
  isOwnMessage,
  editingId,
  editText,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditTextChange,
  onPin,
  onDelete,
}: {
  message: ChatMessage;
  senderName: string;
  isOwnMessage: boolean;
  editingId: string | null;
  editText: string;
  onStartEdit: (id: string, text: string) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onEditTextChange: (text: string) => void;
  onPin: (id: string, isPinned: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const isEditing = editingId === message.id;
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      className="group relative py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-2">
        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs font-medium">
            {senderName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium">{senderName}</span>
            <span className="text-xs text-muted-foreground">{time}</span>
            {message.is_edited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
            {message.is_pinned && (
              <Pin className="h-3 w-3 text-amber-500 inline" />
            )}
          </div>

          {isEditing ? (
            <div className="mt-1 space-y-1">
              <Textarea
                value={editText}
                onChange={(e) => onEditTextChange(e.target.value)}
                className="min-h-[60px] text-sm"
                autoFocus
              />
              <div className="flex gap-1">
                <Button size="sm" className="h-6 text-xs" onClick={() => onSaveEdit(message.id)}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={onCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
      </div>

      {/* Hover actions */}
      {showActions && !isEditing && (
        <div className="absolute -top-2 right-2 flex items-center gap-0.5 bg-background border rounded-md shadow-sm px-0.5 py-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            title={message.is_pinned ? "Unpin" : "Pin"}
            onClick={() => onPin(message.id, message.is_pinned)}
          >
            {message.is_pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
          </Button>
          {isOwnMessage && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                title="Edit"
                onClick={() => onStartEdit(message.id, message.content)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                title="Delete"
                onClick={() => onDelete(message.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Group messages by date
// ---------------------------------------------------------------------------

function groupMessagesByDate(messages: ChatMessage[]): [string, ChatMessage[]][] {
  const groups = new Map<string, ChatMessage[]>();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (const msg of messages) {
    const msgDate = new Date(msg.created_at).toDateString();
    let label: string;
    if (msgDate === today) label = "Today";
    else if (msgDate === yesterday) label = "Yesterday";
    else label = formatDate(msg.created_at);

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(msg);
  }

  return Array.from(groups.entries());
}
