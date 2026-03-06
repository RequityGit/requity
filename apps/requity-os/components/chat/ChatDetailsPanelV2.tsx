"use client";

import { useEffect, useState } from "react";
import { useChatTheme } from "@/contexts/chat-theme-context";
import { ChatAvatarV2, StagePill, StatusDot } from "./ChatPrimitives";
import { getInitials } from "@/lib/chat-utils";
import { getStageDisplayLabel } from "@/lib/chat-theme";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import type { ChatChannelWithUnread, PresenceStatus } from "@/lib/chat-types";
import {
  X,
  BellOff,
  Pin,
  Archive,
  Plus,
  FileText,
} from "lucide-react";

interface ChatDetailsPanelV2Props {
  channel: ChatChannelWithUnread;
  members: Array<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  }>;
  onClose: () => void;
  getPresenceStatus?: (uid: string) => PresenceStatus;
}

interface LoanDetail {
  id: string;
  loan_number: string | null;
  stage: string | null;
  type: string | null;
  loan_amount: number | null;
}

interface SharedFile {
  name: string;
  created_at: string;
}

export function ChatDetailsPanelV2({
  channel,
  members,
  onClose,
  getPresenceStatus,
}: ChatDetailsPanelV2Props) {
  const { t } = useChatTheme();
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [files, setFiles] = useState<SharedFile[]>([]);

  const initials = getInitials(channel.name);
  const isDealRoom = channel.channel_type === "deal_room";
  const stageLabel = loan?.stage ? getStageDisplayLabel(loan.stage) : null;

  // Fetch linked loan details
  useEffect(() => {
    if (
      channel.linked_entity_type !== "loan" ||
      !channel.linked_entity_id
    )
      return;

    const fetchLoan = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("loans")
        .select("id, loan_number, stage, type, loan_amount")
        .eq("id", channel.linked_entity_id!)
        .single();
      if (data) setLoan(data as LoanDetail);
    };
    fetchLoan();
  }, [channel.linked_entity_id, channel.linked_entity_type]);

  // Fetch shared files (attachments from messages)
  useEffect(() => {
    const fetchFiles = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("chat_messages")
        .select("attachments, created_at")
        .eq("channel_id", channel.id)
        .not("attachments", "eq", "[]")
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) {
        const allFiles: SharedFile[] = [];
        for (const msg of data) {
          const atts = msg.attachments as Array<{ name: string }> | null;
          if (atts) {
            for (const att of atts) {
              allFiles.push({ name: att.name, created_at: msg.created_at });
            }
          }
        }
        setFiles(allFiles.slice(0, 5));
      }
    };
    fetchFiles();
  }, [channel.id]);

  return (
    <div
      style={{
        width: 300,
        minWidth: 300,
        background: t.bgSecondary,
        borderLeft: `1px solid ${t.border}`,
        display: "flex",
        flexDirection: "column",
        animation: "slideIn 0.25s ease",
        transition: "background 0.3s",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: t.textSecondary,
          }}
        >
          Details
        </span>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 4,
            borderRadius: 6,
            display: "flex",
          }}
        >
          <X size={15} strokeWidth={1.5} color={t.textTertiary} />
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {/* Channel info card */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ChatAvatarV2 initials={channel.icon || initials} size={52} />
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              marginTop: 10,
              letterSpacing: "-0.02em",
              color: t.text,
            }}
          >
            {channel.name}
          </div>
          <div style={{ fontSize: 12, color: t.textTertiary, marginTop: 3 }}>
            {channel.description || (isDealRoom ? "Deal Room" : "Channel")}
          </div>
          {stageLabel && (
            <div style={{ marginTop: 8 }}>
              <StagePill stage={stageLabel} />
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 6,
            marginBottom: 20,
          }}
        >
          {[
            { Icon: BellOff, label: "Mute" },
            { Icon: Pin, label: "Pin" },
            { Icon: Archive, label: "Archive" },
          ].map(({ Icon, label }) => (
            <button
              key={label}
              style={{
                background: t.bgTertiary,
                border: `1px solid ${t.borderLight}`,
                borderRadius: 8,
                padding: "10px 6px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = t.bgHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = t.bgTertiary;
              }}
            >
              <Icon size={15} strokeWidth={1.5} color={t.textTertiary} />
              <span style={{ fontSize: 11, color: t.textTertiary, fontWeight: 500 }}>
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Deal Metrics */}
        {loan && (
          <div style={{ marginBottom: 20 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: t.textTertiary,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Deal Info
            </span>
            <div
              style={{
                marginTop: 8,
                borderRadius: 8,
                background: t.bgTertiary,
                border: `1px solid ${t.borderLight}`,
                overflow: "hidden",
              }}
            >
              {[
                {
                  label: "Amount",
                  value: loan.loan_amount
                    ? formatCurrency(loan.loan_amount)
                    : "N/A",
                  mono: true,
                },
                {
                  label: "Type",
                  value: loan.type
                    ? loan.type.toUpperCase()
                    : "N/A",
                  mono: false,
                },
                {
                  label: "Stage",
                  value: stageLabel || "N/A",
                  mono: false,
                },
              ].map((item, i) => (
                <div
                  key={item.label}
                  style={{
                    padding: "10px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom:
                      i < 2 ? `1px solid ${t.borderLight}` : "none",
                  }}
                >
                  <span style={{ fontSize: 12, color: t.textTertiary }}>
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: t.text,
                      ...(item.mono
                        ? {
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 12,
                          }
                        : {}),
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Members */}
        {members.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: t.textTertiary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Members ({members.length})
              </span>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Plus size={12} strokeWidth={2.5} color={t.textSecondary} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: t.textSecondary,
                  }}
                >
                  Add
                </span>
              </button>
            </div>
            {members.map((m) => {
              const memberInitials = getInitials(m.full_name);
              const status = getPresenceStatus?.(m.id) || "offline";
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    borderRadius: 6,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = t.bgHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <ChatAvatarV2
                    initials={memberInitials}
                    size={26}
                    src={m.avatar_url}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      flex: 1,
                      color: t.text,
                    }}
                  >
                    {m.full_name || "Unknown"}
                  </span>
                  <StatusDot
                    status={status}
                    size={10}
                    borderColor={t.bgSecondary}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Shared Files */}
        {files.length > 0 && (
          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: t.textTertiary,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Shared Files
            </span>
            <div
              style={{
                marginTop: 8,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {files.map((f, i) => {
                const daysAgo = Math.floor(
                  (Date.now() - new Date(f.created_at).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const timeLabel =
                  daysAgo === 0 ? "Today" : daysAgo === 1 ? "1d ago" : `${daysAgo}d ago`;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: 6,
                      background: t.bgTertiary,
                      border: `1px solid ${t.borderLight}`,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = t.bgHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = t.bgTertiary;
                    }}
                  >
                    <FileText
                      size={14}
                      strokeWidth={1.5}
                      color={t.textTertiary}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: t.text,
                        }}
                      >
                        {f.name}
                      </div>
                      <div style={{ fontSize: 10, color: t.textMuted }}>
                        {timeLabel}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
