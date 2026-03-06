// Chat system TypeScript types
// Based on the deployed Supabase schema

export type ChatChannelType =
  | "deal_room"
  | "team"
  | "direct"
  | "group"
  | "investor_room"
  | "borrower_room"
  | "project_room";

export type ChatEntityType =
  | "loan"
  | "property"
  | "fund"
  | "investor"
  | "borrower"
  | "borrower_entity"
  | "ops_project"
  | "crm_contact";

export type ChatMemberRole = "owner" | "admin" | "member" | "guest" | "observer";

export type ChatMessageType =
  | "text"
  | "system"
  | "file"
  | "ai_response"
  | "action_item"
  | "status_update"
  | "mention_link";

export type PresenceStatus = "online" | "away" | "busy" | "offline";

export type NotificationLevel = "all" | "mentions" | "none";

// ─── Table Row Types ───────────────────────────────────────────

export interface ChatChannel {
  id: string;
  name: string;
  description: string | null;
  channel_type: ChatChannelType;
  icon: string | null;
  linked_entity_type: ChatEntityType | null;
  linked_entity_id: string | null;
  is_archived: boolean;
  is_private: boolean;
  allow_external: boolean;
  auto_created: boolean;
  default_notification_level: string;
  pinned_context: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
}

export interface ChatChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  role: ChatMemberRole;
  notification_level: string | null;
  last_read_message_id: string | null;
  last_read_at: string | null;
  unread_count: number;
  is_muted: boolean;
  is_pinned: boolean;
  joined_at: string;
  left_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_id: string | null;
  message_type: ChatMessageType;
  content: string | null;
  content_html: string | null;
  parent_message_id: string | null;
  thread_count: number;
  thread_last_reply_at: string | null;
  linked_entities: LinkedEntity[] | null;
  attachments: Attachment[] | null;
  reactions: Record<string, string[]> | null;
  action_item: ActionItem | null;
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  ai_metadata: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMention {
  id: string;
  message_id: string;
  channel_id: string;
  mentioned_user_id: string | null;
  mention_type: string;
  mentioned_entity_type: ChatEntityType | null;
  mentioned_entity_id: string | null;
  created_at: string;
}

export interface ChatPinnedMessage {
  id: string;
  channel_id: string;
  message_id: string;
  pinned_by: string;
  pinned_at: string;
}

export interface ChatTypingIndicator {
  channel_id: string;
  user_id: string;
  started_at: string;
}

export interface ChatActivityFeedItem {
  id: string;
  channel_id: string;
  event_type: string;
  event_source: string;
  event_data: Record<string, unknown>;
  summary: string;
  icon: string | null;
  source_table: string | null;
  source_id: string | null;
  actor_id: string | null;
  created_at: string;
}

export interface ChatEscalationRule {
  id: string;
  channel_type: ChatChannelType | null;
  entity_type: ChatEntityType | null;
  event_pattern: string;
  primary_assignee_id: string | null;
  escalation_assignee_id: string | null;
  escalation_timeout_minutes: number;
  priority: string;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ChatUserPresence {
  user_id: string;
  status: PresenceStatus;
  custom_status: string | null;
  last_seen_at: string;
  updated_at: string;
}

// ─── View Types ────────────────────────────────────────────────

export interface LastMessagePreview {
  id: string;
  content: string | null;
  sender_id: string | null;
  message_type: ChatMessageType;
  created_at: string;
}

export interface ChatChannelWithUnread extends ChatChannel {
  unread_count: number;
  is_muted: boolean;
  is_pinned: boolean;
  notification_level: string | null;
  member_role: ChatMemberRole;
  last_read_at: string | null;
  last_message: LastMessagePreview | null;
}

export interface ChatMyMention {
  id: string;
  message_id: string;
  channel_id: string;
  mention_type: string;
  created_at: string;
  message_content: string | null;
  sender_id: string | null;
  message_type: ChatMessageType;
  channel_name: string;
  channel_type: ChatChannelType;
  linked_entity_type: ChatEntityType | null;
  linked_entity_id: string | null;
  sender_name: string | null;
  sender_avatar: string | null;
}

// ─── JSONB Sub-Types ───────────────────────────────────────────

export interface LinkedEntity {
  type: ChatEntityType;
  id: string;
  label: string;
  url?: string;
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface ActionItem {
  title: string;
  assignee_id?: string;
  due_date?: string;
  status?: "pending" | "completed";
}

// ─── Composite / UI Types ──────────────────────────────────────

export interface ChatMessageWithSender extends ChatMessage {
  sender?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
}

export interface ChatChannelGroup {
  label: string;
  type: "pinned" | ChatChannelType;
  channels: ChatChannelWithUnread[];
}

export interface TypingUser {
  user_id: string;
  full_name: string | null;
  started_at: string;
}

export interface MentionSuggestion {
  id: string;
  type: "user" | "channel" | "everyone" | "entity";
  label: string;
  sublabel?: string;
  avatar_url?: string | null;
  entity_type?: ChatEntityType;
}
