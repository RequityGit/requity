"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/format";
import { getOrCreateDealChatChannel } from "@/app/(authenticated)/admin/loans/[id]/deal-actions";
import {
  MessageCircle,
  Send,
  Pin,
  PinOff,
  Reply,
  Paperclip,
  MoreHorizontal,
  AtSign,
  File,
  X,
  Mail,
  ChevronDown,
  Pencil,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";

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

interface DealChatTabProps {
  loanId: string;
  currentUserId: string;
  currentUserName?: string;
}

export function DealChatTab({
  loanId,
  currentUserId,
  currentUserName,
}: DealChatTabProps) {
  const [channel, setChannel] = useState<ChatChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [showMentions, setShowMentions] = useState(false);
  const [threadParentId, setThreadParentId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [creatingChannel, setCreatingChannel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Load channel and messages
  const loadData = useCallback(async () => {
    const supabase = createClient();

    // Get or create channel
    const { data: channelData } = await (supabase as any)
      .from("deal_chat_channels")
      .select("*")
      .eq("loan_id", loanId)
      .maybeSingle();

    if (channelData) {
      setChannel(channelData as ChatChannel);

      // Load messages
      const { data: msgData } = await (supabase as any)
        .from("deal_chat_messages")
        .select("*")
        .eq("channel_id", channelData.id)
        .eq("is_deleted", false)
        .is("thread_parent_id", null)
        .order("created_at", { ascending: true });

      setMessages((msgData ?? []) as ChatMessage[]);
    }

    // Load team member profiles for display names
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
    if (channelData) {
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
    }

    setLoading(false);
  }, [loanId, currentUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (!channel) return;

    const supabase = createClient();
    const sub = supabase
      .channel(`deal-chat-${channel.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deal_chat_messages",
          filter: `channel_id=eq.${channel.id}`,
        },
        () => {
          loadData();
        }
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

      const insertData = {
        channel_id: channel.id,
        loan_id: loanId,
        sent_by: currentUserId,
        content: messageText.trim(),
        mentioned_user_ids: mentionedIds,
        message_type: "message",
        thread_parent_id: threadParentId,
      };

      const { error } = await (supabase as any)
        .from("deal_chat_messages")
        .insert(insertData);

      if (error) throw error;

      setMessageText("");
      setThreadParentId(null);
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
    toast({
      title: isPinned ? "Message unpinned" : "Message pinned",
    });
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
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
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

  // Separate pinned messages
  const pinnedMessages = messages.filter((m) => m.is_pinned);

  // Group messages by date
  const messageGroups = groupMessagesByDate(messages);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Loading chat...
        </CardContent>
      </Card>
    );
  }

  async function handleCreateChannel() {
    setCreatingChannel(true);
    try {
      const result = await getOrCreateDealChatChannel(loanId);
      if ("error" in result && result.error) {
        toast({
          title: "Failed to create chatter",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({ title: "Chatter created" });
        loadData();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Failed to create chatter",
        description: message,
        variant: "destructive",
      });
    } finally {
      setCreatingChannel(false);
    }
  }

  if (!channel) {
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center justify-center gap-4">
          <MessageCircle className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No chat channel found for this deal.
          </p>
          <Button
            onClick={handleCreateChannel}
            disabled={creatingChannel}
            className="gap-2"
          >
            {creatingChannel ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {creatingChannel ? "Creating..." : "Create Chatter"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col" style={{ height: "600px" }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Deal Chatter
        </CardTitle>
        {pinnedMessages.length > 0 && (
          <Badge variant="outline" className="gap-1 text-xs">
            <Pin className="h-3 w-3" />
            {pinnedMessages.length} pinned
          </Badge>
        )}
      </CardHeader>

      {/* Pinned messages */}
      {pinnedMessages.length > 0 && (
        <div className="px-4 pb-2 shrink-0">
          <div className="rounded-md border bg-amber-50/50 dark:bg-amber-950/20 p-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Pin className="h-3 w-3" />
              Pinned Messages
            </p>
            {pinnedMessages.map((msg) => (
              <div
                key={msg.id}
                className="text-xs flex items-start gap-2 py-1"
              >
                <span className="font-medium shrink-0">
                  {profiles[msg.sent_by] ?? "Unknown"}:
                </span>
                <span className="text-muted-foreground truncate">
                  {msg.content.slice(0, 120)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 shrink-0"
                  onClick={() => handlePin(msg.id, true)}
                >
                  <PinOff className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages area */}
      <CardContent className="flex-1 overflow-y-auto px-4 pb-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              No messages yet. Start the conversation about this deal.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messageGroups.map(([dateLabel, msgs]) => (
              <div key={dateLabel}>
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-medium">
                    {dateLabel}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                {msgs.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    senderName={profiles[msg.sent_by] ?? "Unknown"}
                    isOwnMessage={msg.sent_by === currentUserId}
                    editingId={editingId}
                    editText={editText}
                    onStartEdit={(id, text) => {
                      setEditingId(id);
                      setEditText(text);
                    }}
                    onSaveEdit={handleEdit}
                    onCancelEdit={() => {
                      setEditingId(null);
                      setEditText("");
                    }}
                    onEditTextChange={setEditText}
                    onPin={handlePin}
                    onDelete={handleDelete}
                    onReply={(id) => setThreadParentId(id)}
                    threadReplyCount={msg.thread_reply_count}
                  />
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>

      {/* Thread indicator */}
      {threadParentId && (
        <div className="px-4 py-1 bg-muted/50 border-t flex items-center gap-2 shrink-0">
          <Reply className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Replying to thread
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 ml-auto"
            onClick={() => setThreadParentId(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Mention dropdown */}
      {showMentions && (
        <div className="px-4 shrink-0">
          <div className="rounded-md border bg-popover shadow-md p-1 max-h-32 overflow-y-auto">
            {teamMembers.slice(0, 8).map((member) => (
              <button
                key={member.id}
                type="button"
                className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors"
                onClick={() => insertMention(member)}
              >
                <span className="font-medium">
                  {member.full_name || member.email}
                </span>
                {member.full_name && member.email && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {member.email}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Compose bar */}
      <div className="px-4 pb-4 pt-2 border-t shrink-0">
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
    </Card>
  );
}

function MessageBubble({
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
  onReply,
  threadReplyCount,
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
  onReply: (id: string) => void;
  threadReplyCount: number;
}) {
  const [showActions, setShowActions] = useState(false);
  const isEditing = editingId === message.id;
  const isSystemMessage =
    message.message_type === "system" ||
    message.message_type === "email_notification";
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isSystemMessage) {
    return (
      <div className="flex items-center gap-2 py-1.5 px-2">
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {message.message_type === "email_notification" && (
            <Mail className="h-3 w-3" />
          )}
          <span>{message.content}</span>
        </div>
        <div className="flex-1 h-px bg-border" />
      </div>
    );
  }

  return (
    <div
      className="group relative py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-2">
        {/* Avatar placeholder */}
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
                <Button
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => onSaveEdit(message.id)}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs"
                  onClick={onCancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {message.attachments.map((att, i) => (
                <Badge key={i} variant="outline" className="gap-1 text-xs">
                  <File className="h-3 w-3" />
                  {att.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Thread indicator */}
          {threadReplyCount > 0 && (
            <button
              type="button"
              className="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              onClick={() => onReply(message.id)}
            >
              <MessageCircle className="h-3 w-3" />
              {threadReplyCount} {threadReplyCount === 1 ? "reply" : "replies"}
            </button>
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
            title="Reply in thread"
            onClick={() => onReply(message.id)}
          >
            <Reply className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            title={message.is_pinned ? "Unpin" : "Pin"}
            onClick={() => onPin(message.id, message.is_pinned)}
          >
            {message.is_pinned ? (
              <PinOff className="h-3 w-3" />
            ) : (
              <Pin className="h-3 w-3" />
            )}
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

function groupMessagesByDate(
  messages: ChatMessage[]
): [string, ChatMessage[]][] {
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
