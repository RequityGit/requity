"use client";

import { useState, useEffect, useRef } from "react";
import {
  Pin,
  PinOff,
  Pencil,
  Trash2,
  Lock,
  FileCheck,
  MoreHorizontal,
  Reply,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseComment, relativeTime } from "@/lib/comment-utils";
import { MentionInput } from "@/components/shared/mention-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NoteData } from "./types";
import { getUserColor, colorVariants } from "@/lib/user-colors";
import { AttachmentList } from "@/components/shared/attachments";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* ─── Custom Geometric Thumb Icon ─── */
function ThumbGeo({
  size = 14,
  filled = false,
  color = "currentColor",
}: {
  size?: number;
  filled?: boolean;
  color?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      {filled ? (
        <path
          d="M3 9.5C3 9.22 3.22 9 3.5 9H5.5C5.78 9 6 9.22 6 9.5V16.5C6 16.78 5.78 17 5.5 17H3.5C3.22 17 3 16.78 3 16.5V9.5ZM7.5 8.2L10.5 3.5C10.65 3.27 10.95 3.1 11.25 3.1C12.22 3.1 13 3.88 13 4.85V7.5H16.1C16.95 7.5 17.65 8.3 17.5 9.15L16.3 16.15C16.18 16.85 15.57 17 15.1 17H8.5C7.95 17 7.5 16.55 7.5 16V8.2Z"
          fill={color}
        />
      ) : (
        <path
          d="M3.5 9.5H5.5V16.5H3.5V9.5ZM7.5 8.2L10.5 3.5C10.65 3.27 10.95 3.1 11.25 3.1C12.22 3.1 13 3.88 13 4.85V7.5H16.1C16.95 7.5 17.65 8.3 17.5 9.15L16.3 16.15C16.18 16.85 15.57 17 15.1 17H8.5C7.95 17 7.5 16.55 7.5 16V8.2Z"
          stroke={color}
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

/* ─── Particle Burst (6 dots that burst outward on like) ─── */
function ParticleBurst({ active, color }: { active: boolean; color: string }) {
  const [particles, setParticles] = useState<
    { tx: number; ty: number; delay: number; size: number }[] | null
  >(null);

  useEffect(() => {
    if (active) {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const dist = 14 + Math.random() * 6;
        return {
          tx: Math.cos(angle) * dist,
          ty: Math.sin(angle) * dist,
          delay: i * 15,
          size: 3 + Math.random() * 2,
        };
      });
      setParticles(pts);
      const timer = setTimeout(() => setParticles(null), 500);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!particles) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: color,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
            "--tx": `${p.tx}px`,
            "--ty": `${p.ty}px`,
            animation: `particle-burst 400ms ${p.delay}ms ease-out forwards`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/* ─── Animated Count (slides up/down on change) ─── */
function AnimatedCount({ count }: { count: number }) {
  const [displayCount, setDisplayCount] = useState(count);
  const [anim, setAnim] = useState<string | null>(null);

  useEffect(() => {
    if (count !== displayCount) {
      setAnim(count > displayCount ? "count-up" : "count-down");
      const timer = setTimeout(() => {
        setDisplayCount(count);
        setAnim(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [count, displayCount]);

  return (
    <span
      className="num inline-block"
      style={{
        animation: anim ? `${anim} 200ms ease forwards` : "none",
      }}
    >
      {displayCount}
    </span>
  );
}

/* ─── Stacked Avatars (each liker in their own color) ─── */
export function StackedAvatars({
  likes,
  max = 3,
}: {
  likes: { user_id: string; name: string; accent_color?: string | null }[];
  max?: number;
}) {
  const shown = likes.slice(0, max);
  const extra = likes.length - max;

  return (
    <div className="flex items-center ml-1">
      {shown.map((l, i) => {
        const likerColor = getUserColor({ id: l.user_id, accent_color: l.accent_color ?? null });
        const initials = l.name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        return (
          <div
            key={l.user_id}
            title={l.name}
            className="rounded-full flex items-center justify-center text-[7px] font-bold"
            style={{
              width: 18,
              height: 18,
              backgroundColor: `${likerColor}20`,
              border: `1.5px solid ${likerColor}40`,
              color: likerColor,
              letterSpacing: "-0.03em",
              marginLeft: i > 0 ? -5 : 0,
              zIndex: max - i,
              position: "relative",
            }}
          >
            {initials}
          </div>
        );
      })}
      {extra > 0 && (
        <span className="text-[9px] text-muted-foreground ml-1">+{extra}</span>
      )}
    </div>
  );
}

interface NoteCardProps {
  note: NoteData;
  currentUserId: string;
  showPinning: boolean;
  compact: boolean;
  onPin: (noteId: string, isPinned: boolean) => void;
  onEdit: (noteId: string, body: string, mentionIds: string[]) => void;
  onDelete: (noteId: string) => void;
  onToggleLike: (noteId: string, isLiked: boolean) => void;
  /** Only passed for top-level notes (not replies) */
  onReply?: () => void;
}

export function NoteCard({
  note,
  currentUserId,
  showPinning,
  compact,
  onPin,
  onEdit,
  onDelete,
  onToggleLike,
  onReply,
}: NoteCardProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [animating, setAnimating] = useState(false);
  const animKey = useRef(0);

  const isOwn = note.author_id === currentUserId;
  const canEdit = isOwn;
  const segments = parseComment(note.body);
  const initials = note.author_name ? getInitials(note.author_name) : "??";

  const likes = note.note_likes ?? [];
  const isLiked = likes.some((l) => l.user_id === currentUserId);
  const likeCount = likes.length;

  // Accent color for author name and avatar
  const authorColor = getUserColor({
    id: note.author_id,
    accent_color: note.author_accent_color ?? null,
  });
  const aC = colorVariants(authorColor);

  // Liker data for stacked avatars
  const likerData = likes.map((l) => ({
    user_id: l.user_id,
    name: l.profiles?.full_name ?? "Unknown",
    accent_color: l.profiles?.accent_color ?? null,
  }));

  const avatarSize = compact ? 24 : 32;
  const bodyText = compact ? "text-[12px]" : "text-[13px]";

  function handleToggleLike() {
    animKey.current += 1;
    setAnimating(true);
    setTimeout(() => setAnimating(false), 450);
    onToggleLike(note.id, isLiked);
  }

  if (editing) {
    return (
      <div className="activity-message">
        <div>
          <MentionInput
            value={editText}
            onChange={setEditText}
            onSubmit={(text, ids) => {
              onEdit(note.id, text, ids);
              setEditing(false);
              setEditText("");
            }}
            submitLabel="Save"
            submitIcon={<Pencil className="h-3 w-3" />}
            rows={2}
            extraControls={
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setEditText("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "activity-message",
        note.is_pinned &&
          "border-l-2 border-l-amber-400/60 dark:border-l-amber-500/40 rounded-l-none"
      )}
    >
      <div className="flex gap-3">
        {/* Avatar with accent color tint */}
        <div
          className="flex-shrink-0 rounded-full flex items-center justify-center font-semibold"
          style={{
            width: avatarSize,
            height: avatarSize,
            backgroundColor: `${authorColor}14`,
            border: `1.5px solid ${authorColor}30`,
            color: authorColor,
            fontSize: avatarSize * 0.34,
            letterSpacing: "-0.03em",
          }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header: name + time + badges */}
          <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
            <span
              className="text-[13px] font-semibold leading-tight"
              style={{ color: authorColor }}
            >
              {note.author_name || "Unknown"}
            </span>
            <span className="text-[11px] text-muted-foreground/50 num">
              {relativeTime(note.created_at)}
            </span>
            {note.is_pinned && (
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-px rounded bg-amber-500/10 text-amber-500">
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Pinned
              </span>
            )}
            {note.is_internal && (
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-px rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
                Internal
              </span>
            )}
            {note.is_edited && (
              <span className="text-[10px] text-muted-foreground/40">
                (edited)
              </span>
            )}
            {note.condition_name && (
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-px rounded bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <FileCheck className="h-2.5 w-2.5" strokeWidth={2} />
                {note.condition_name}
              </span>
            )}
          </div>

          {/* Body text */}
          <div
            className={cn(
              bodyText,
              "leading-[1.75] text-foreground/60 whitespace-pre-wrap"
            )}
          >
            {segments.map((seg, i) =>
              seg.type === "mention" ? (
                <span
                  key={i}
                  className="font-medium text-blue-500 dark:text-blue-400 bg-blue-500/[0.08] px-0.5 rounded"
                >
                  @{seg.value}
                </span>
              ) : (
                <span key={i}>{seg.value}</span>
              )
            )}
          </div>

          {/* Attachments */}
          {note.note_attachments && note.note_attachments.length > 0 && (
            <AttachmentList
              attachments={note.note_attachments.map((a) => ({
                id: a.id,
                fileName: a.file_name,
                fileType: a.file_type,
                fileSize: a.file_size_bytes,
                storagePath: a.storage_path,
              }))}
              compact
            />
          )}

          {/* Reaction pill — author-colored thumb + count, liker-colored avatars */}
          {likeCount > 0 && (
            <div
              className="flex items-center gap-0.5 mt-2"
              style={{ animation: "pill-in 250ms ease" }}
            >
              <button
                type="button"
                onClick={handleToggleLike}
                className="inline-flex items-center gap-[5px] rounded-full px-2.5 py-[3px] text-[11px] font-medium cursor-pointer rq-transition"
                style={{
                  border: `1px solid ${isLiked ? aC.border : "hsl(var(--border))"}`,
                  background: isLiked ? aC.bg : "hsl(var(--foreground) / 0.03)",
                  color: isLiked ? aC.base : "hsl(var(--muted-foreground))",
                }}
                onMouseEnter={(e) => {
                  if (!isLiked) {
                    e.currentTarget.style.borderColor = aC.border;
                    e.currentTarget.style.color = aC.base;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLiked) {
                    e.currentTarget.style.borderColor = "hsl(var(--border))";
                    e.currentTarget.style.color = "hsl(var(--muted-foreground))";
                  }
                }}
              >
                <span
                  className="inline-flex relative"
                  style={{
                    animation: animating ? "like-pulse 300ms ease" : "none",
                  }}
                >
                  <ThumbGeo
                    size={12}
                    filled={isLiked}
                    color={isLiked ? aC.base : "currentColor"}
                  />
                  <ParticleBurst
                    active={animating && isLiked}
                    color={aC.base}
                  />
                </span>
                <AnimatedCount count={likeCount} />
              </button>
              <StackedAvatars likes={likerData} />
            </div>
          )}
        </div>
      </div>

      {/* Floating hover toolbar */}
      <div className="hover-toolbar absolute -top-2 right-3 flex items-center gap-px bg-card border border-border rounded-lg shadow-md p-0.5 z-10">
        <HoverToolbarButton
          onClick={handleToggleLike}
          title={isLiked ? "Unlike" : "Like"}
          active={isLiked}
          activeColor={aC.base}
          activeBg={aC.bg}
          hoverColor={aC.base}
          hoverBg={aC.hover}
        >
          <span
            className="inline-flex relative"
            style={{
              animation: animating ? "like-pulse 300ms ease" : "none",
            }}
          >
            <ThumbGeo
              size={14}
              filled={isLiked}
              color={isLiked ? aC.base : "currentColor"}
            />
            <ParticleBurst
              active={animating && isLiked}
              color={aC.base}
            />
          </span>
        </HoverToolbarButton>

        {onReply && (
          <HoverToolbarButton onClick={onReply} title="Reply">
            <Reply className="h-3.5 w-3.5" strokeWidth={1.5} />
          </HoverToolbarButton>
        )}

        {showPinning && (
          <HoverToolbarButton
            onClick={() => onPin(note.id, note.is_pinned)}
            title={note.is_pinned ? "Unpin" : "Pin"}
          >
            {note.is_pinned ? (
              <PinOff className="h-3.5 w-3.5" strokeWidth={1.5} />
            ) : (
              <Pin className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
          </HoverToolbarButton>
        )}

        {(canEdit || isOwn) && (
          <>
            <div className="w-px h-4 bg-border mx-0.5" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[120px]">
                {canEdit && (
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(true);
                      setEditText(note.body);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} />
                    Edit
                  </DropdownMenuItem>
                )}
                {isOwn && (
                  <DropdownMenuItem
                    onClick={() => onDelete(note.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </div>
  );
}

function HoverToolbarButton({
  children,
  onClick,
  title,
  active,
  activeColor,
  activeBg,
  hoverColor,
  hoverBg,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  activeColor?: string;
  activeBg?: string;
  hoverColor?: string;
  hoverBg?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex items-center justify-center h-7 w-7 rounded-md transition-colors",
        !activeColor &&
          (active
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted")
      )}
      style={
        activeColor
          ? {
              color: active ? activeColor : undefined,
              backgroundColor: active ? activeBg : undefined,
            }
          : undefined
      }
      onMouseEnter={(e) => {
        if (hoverColor && !active) {
          e.currentTarget.style.color = hoverColor;
          e.currentTarget.style.backgroundColor = hoverBg || "";
        }
      }}
      onMouseLeave={(e) => {
        if (hoverColor && !active) {
          e.currentTarget.style.color = "";
          e.currentTarget.style.backgroundColor = "";
        }
      }}
    >
      {children}
    </button>
  );
}
