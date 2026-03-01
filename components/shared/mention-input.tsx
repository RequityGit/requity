"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { extractMentionIds } from "@/lib/comment-utils";

interface TeamMember {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string, mentionIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  submitLabel?: string;
  submitIcon?: React.ReactNode;
  /** Extra controls rendered between the textarea and submit button row */
  extraControls?: React.ReactNode;
}

export function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Add a comment...",
  disabled = false,
  rows = 2,
  submitLabel = "Post",
  submitIcon,
  extraControls,
}: MentionInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownQuery, setDropdownQuery] = useState("");
  const [dropdownIndex, setDropdownIndex] = useState(0);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mentionStartRef = useRef<number>(-1);
  const mentionsRef = useRef<Map<string, string>>(new Map());
  const initializedRef = useRef(false);

  // Load team members once
  const loadTeamMembers = useCallback(async () => {
    if (membersLoaded) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .not("full_name", "is", null)
      .order("full_name");

    if (data) {
      setTeamMembers(data.filter((p) => p.full_name) as TeamMember[]);
      setMembersLoaded(true);
    }
  }, [membersLoaded]);

  // Filter members based on query
  useEffect(() => {
    if (!showDropdown) return;
    const q = dropdownQuery.toLowerCase();
    const filtered = teamMembers.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q))
    );
    setFilteredMembers(filtered.slice(0, 8));
    setDropdownIndex(0);
  }, [dropdownQuery, teamMembers, showDropdown]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (showDropdown) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setDropdownIndex((prev) =>
          prev < filteredMembers.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setDropdownIndex((prev) =>
          prev > 0 ? prev - 1 : filteredMembers.length - 1
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        if (filteredMembers.length > 0) {
          e.preventDefault();
          selectMember(filteredMembers[dropdownIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowDropdown(false);
      }
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    onChange(newValue);

    // Prune stale mentions whose display text no longer appears
    Array.from(mentionsRef.current.keys()).forEach((name) => {
      if (!newValue.includes(`\u200B@${name}`)) {
        mentionsRef.current.delete(name);
      }
    });

    // Check for @ trigger
    const cursorPos = e.target.selectionStart;
    const textBefore = newValue.slice(0, cursorPos);

    // Find the last @ — completed mentions are preceded by \u200B (not whitespace)
    // so they won't pass the whitespace check below
    const lastAt = textBefore.lastIndexOf("@");
    if (lastAt >= 0) {
      const afterAt = textBefore.slice(lastAt + 1);
      if (
        !afterAt.includes("\n") &&
        afterAt.length <= 30 &&
        (lastAt === 0 || /\s/.test(textBefore[lastAt - 1]))
      ) {
        mentionStartRef.current = lastAt;
        setDropdownQuery(afterAt);
        setShowDropdown(true);
        loadTeamMembers();
        return;
      }
    }
    setShowDropdown(false);
  }

  function selectMember(member: TeamMember) {
    const start = mentionStartRef.current;
    if (start < 0) return;

    const cursorPos = textareaRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, start);
    const after = value.slice(cursorPos);
    const mention = `\u200B@${member.full_name} `;
    const newValue = before + mention + after;

    mentionsRef.current.set(member.full_name, member.id);
    onChange(newValue);
    setShowDropdown(false);

    // Restore focus and cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = before.length + mention.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }

  function handleSubmit() {
    if (!value.trim() || disabled) return;

    // Reconstruct markup format from display text
    let markupText = value;

    // Sort by name length descending to avoid partial matches
    const entries = Array.from(mentionsRef.current.entries()).sort(
      (a, b) => b[0].length - a[0].length
    );

    for (const [name, userId] of entries) {
      markupText = markupText.replaceAll(
        `\u200B@${name}`,
        `@[${name}](${userId})`
      );
    }

    // Strip any remaining zero-width spaces
    markupText = markupText.replaceAll("\u200B", "");

    const mentionIds = extractMentionIds(markupText);
    onSubmit(markupText.trim(), mentionIds);
  }

  // Convert markup format to display format when value is set externally (edit mode)
  useEffect(() => {
    if (initializedRef.current) return;
    if (!value) return;

    const mentionRegex = /@\[([^\]]+)\]\(([a-f0-9-]+)\)/g;
    let match: RegExpExecArray | null;
    const found: Array<{ name: string; userId: string }> = [];

    while ((match = mentionRegex.exec(value)) !== null) {
      found.push({ name: match[1], userId: match[2] });
    }

    if (found.length === 0) {
      initializedRef.current = true;
      return;
    }

    for (const { name, userId } of found) {
      mentionsRef.current.set(name, userId);
    }

    let displayText = value;
    for (const { name, userId } of found) {
      displayText = displayText.replaceAll(
        `@[${name}](${userId})`,
        `\u200B@${name}`
      );
    }

    initializedRef.current = true;
    onChange(displayText);
  }, [value, onChange]);

  // Reset internal state when value is cleared (after posting)
  useEffect(() => {
    if (value === "") {
      mentionsRef.current.clear();
      initializedRef.current = false;
    }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
        {showDropdown && filteredMembers.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-64 bg-popover border rounded-md shadow-md mt-1 max-h-48 overflow-y-auto"
          >
            {filteredMembers.map((member, idx) => (
              <button
                key={member.id}
                type="button"
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-accent transition-colors ${
                  idx === dropdownIndex ? "bg-accent" : ""
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectMember(member);
                }}
              >
                <div className="w-6 h-6 rounded-full bg-[#1a2b4a] text-white flex items-center justify-center text-[10px] font-medium flex-shrink-0">
                  {member.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{member.full_name}</div>
                  {member.email && (
                    <div className="text-muted-foreground text-[10px] truncate">
                      {member.email}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
        {showDropdown && filteredMembers.length === 0 && membersLoaded && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-64 bg-popover border rounded-md shadow-md mt-1 px-3 py-2 text-xs text-muted-foreground"
          >
            No team members found
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">{extraControls}</div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-7 px-3 gap-1"
        >
          {submitIcon}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
