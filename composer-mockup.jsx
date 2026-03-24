/**
 * Modern Note Composer — Mockup
 *
 * Design goals:
 * 1. Single surface — no box-in-a-box. The textarea IS the container.
 * 2. Controls (Internal toggle, Send) live inside the bottom of the same surface.
 * 3. At rest: subtle border, clean. On focus: elevated with ring.
 * 4. Avatar sits outside the input area (left-aligned).
 * 5. Inspired by: Linear comments, Slack message input, Notion inline blocks.
 */

import { useState } from "react";
import { Send, Lock, LockOpen, Loader2, Paperclip, AtSign } from "lucide-react";

// ── Current Design (what we're replacing) ─────────────────────────────
//
//  ┌─ .comment-composer (border + bg-card + rounded-xl) ──────────────┐
//  │  [Avatar]  ┌─ textarea (border-input + bg-background) ────────┐  │
//  │            │  Write a note...                                  │  │
//  │            │                                                   │  │
//  │            └───────────────────────────────────────────────────┘  │
//  │            [🔒 Internal Only]                    [📤 Post Note]  │
//  └──────────────────────────────────────────────────────────────────┘
//
// Problems:
// - Double border (card border + textarea border)
// - Textarea looks like a form field, not a message input
// - Controls feel disconnected from the input area
// - The whole thing reads as "fill out this form" not "send a message"

// ── New Design ────────────────────────────────────────────────────────
//
//  [Avatar]  ┌─ single surface (border + rounded-xl) ──────────────┐
//            │  Write a note... use @mention to tag team members    │
//            │                                                      │
//            │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
//            │  [🔒 Internal]  [📎]  [@ ]            [Send ▶]      │
//            └──────────────────────────────────────────────────────┘
//
// Improvements:
// - ONE surface. Textarea is borderless, fills the container.
// - Toolbar row is inside the container, separated by a subtle divider.
// - Focus elevates the whole container (not just the textarea).
// - Attachment icon hints at upcoming file support.
// - @ icon provides discoverability for mentions.

export function NoteComposerV2({
  currentUserName = "Dylan Marma",
  showInternalToggle = true,
  defaultInternal = true,
  compact = false,
  onPost,
  enterToSend = false,
}) {
  const [text, setText] = useState("");
  const [isInternal, setIsInternal] = useState(defaultInternal);
  const [posting, setPosting] = useState(false);
  const [focused, setFocused] = useState(false);

  const initials = currentUserName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarSize = compact ? "h-7 w-7" : "h-8 w-8";
  const avatarText = compact ? "text-[10px]" : "text-[11px]";

  return (
    <div className="flex gap-3 items-start">
      {/* Avatar — outside the input surface */}
      <div
        className={`${avatarSize} rounded-lg bg-foreground/[0.06] flex items-center justify-center flex-shrink-0`}
      >
        <span className={`${avatarText} font-semibold text-foreground`}>
          {initials}
        </span>
      </div>

      {/* Single unified input surface */}
      <div
        className={`
          flex-1 min-w-0 rounded-xl border transition-all duration-normal
          ${focused
            ? "border-primary/40 bg-background ring-1 ring-primary/15 shadow-sm"
            : "border-border bg-card hover:border-border/80"
          }
        `}
      >
        {/* Textarea — borderless, blends into the container */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Write a note... use @mention to tag team members"
          rows={compact ? 2 : 3}
          disabled={posting}
          className={`
            w-full bg-transparent border-0 outline-none resize-none
            text-xs text-foreground placeholder:text-muted-foreground
            ${compact ? "px-3 pt-3 pb-2" : "px-4 pt-3.5 pb-2"}
            focus:ring-0 focus:outline-none
          `}
        />

        {/* Toolbar row — inside the surface, separated by subtle divider */}
        <div
          className={`
            flex items-center justify-between gap-2
            border-t border-border/50
            ${compact ? "px-3 py-2" : "px-3.5 py-2.5"}
          `}
        >
          {/* Left side: toggles and quick actions */}
          <div className="flex items-center gap-1.5">
            {showInternalToggle && (
              <button
                type="button"
                onClick={() => setIsInternal(!isInternal)}
                className={`
                  inline-flex items-center gap-1 rounded-md px-2 py-1
                  text-[11px] font-medium cursor-pointer transition-colors
                  ${isInternal
                    ? "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                    : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  }
                `}
              >
                {isInternal ? (
                  <Lock className="h-3 w-3" strokeWidth={2} />
                ) : (
                  <LockOpen className="h-3 w-3" strokeWidth={2} />
                )}
                {isInternal ? "Internal" : "Visible"}
              </button>
            )}

            {/* Attachment button (prep for upcoming feature) */}
            <button
              type="button"
              className="
                inline-flex items-center justify-center rounded-md
                h-7 w-7 text-muted-foreground hover:text-foreground
                hover:bg-muted/50 transition-colors cursor-pointer
              "
              title="Attach file"
            >
              <Paperclip className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>

            {/* @ mention hint button */}
            <button
              type="button"
              className="
                inline-flex items-center justify-center rounded-md
                h-7 w-7 text-muted-foreground hover:text-foreground
                hover:bg-muted/50 transition-colors cursor-pointer
              "
              title="Mention someone"
            >
              <AtSign className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Right side: send button */}
          <button
            type="button"
            disabled={posting || !text.trim()}
            className={`
              inline-flex items-center gap-1.5 rounded-lg
              px-3 py-1.5 text-[11px] font-medium
              transition-colors cursor-pointer
              ${text.trim()
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
              }
              disabled:opacity-50 disabled:pointer-events-none
            `}
          >
            {posting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            {enterToSend ? "Send" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Chat Mode Variant (for task activity panels) ─────────────────────
// Same design but more compact, Enter-to-send, no Internal toggle.
//
//  [DM]  ┌─────────────────────────────────────────────────────┐
//        │  Write a message...                                 │
//        │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
//        │  [📎] [@ ]     Enter to send       [Send ▶]        │
//        └─────────────────────────────────────────────────────┘

export function ChatComposerV2({ currentUserName = "Dylan Marma", onPost }) {
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [focused, setFocused] = useState(false);

  const initials = currentUserName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex gap-2.5 items-start">
      <div className="h-7 w-7 rounded-lg bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
        <span className="text-[10px] font-semibold text-foreground">{initials}</span>
      </div>

      <div
        className={`
          flex-1 min-w-0 rounded-xl border transition-all duration-normal
          ${focused
            ? "border-primary/40 bg-background ring-1 ring-primary/15 shadow-sm"
            : "border-border bg-card hover:border-border/80"
          }
        `}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Write a message..."
          rows={1}
          disabled={posting}
          className="
            w-full bg-transparent border-0 outline-none resize-none
            text-xs text-foreground placeholder:text-muted-foreground
            px-3 pt-2.5 pb-1.5
            focus:ring-0 focus:outline-none
          "
        />

        <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/40">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <Paperclip className="h-3 w-3" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <AtSign className="h-3 w-3" strokeWidth={1.5} />
            </button>
            <span className="text-[10px] text-muted-foreground/60 ml-1.5">
              Enter to send, Shift+Enter for new line
            </span>
          </div>

          <button
            type="button"
            disabled={posting || !text.trim()}
            className={`
              inline-flex items-center justify-center rounded-lg
              h-6 w-6 transition-colors cursor-pointer
              ${text.trim()
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground"
              }
              disabled:opacity-50 disabled:pointer-events-none
            `}
          >
            {posting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
