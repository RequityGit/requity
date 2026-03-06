"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChatTheme } from "@/contexts/chat-theme-context";
import { ChatAvatarV2 } from "./ChatPrimitives";
import { getInitials } from "@/lib/chat-utils";
import { getStageDisplayLabel, getStagePillStyle } from "@/lib/chat-theme";
import {
  Search,
  X,
  Users,
  Landmark,
  Loader2,
  MessageSquarePlus,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SearchableTeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface SearchableDeal {
  id: string;
  loan_number: string | null;
  property_address: string | null;
  loan_stage: string | null;
  borrower_name: string | null;
  loan_amount: number | null;
}

export type SearchSelection =
  | { type: "member"; data: SearchableTeamMember }
  | { type: "deal"; data: SearchableDeal };

interface ChatterMultiSearchProps {
  /** When user finalizes selections and clicks "Start Conversation" */
  onStartConversation: (selections: SearchSelection[]) => void;
  /** Passthrough for channel name filtering (existing behavior) */
  onSearchChange: (query: string) => void;
  searchQuery: string;
  currentUserId?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ChatterMultiSearch({
  onStartConversation,
  onSearchChange,
  searchQuery,
  currentUserId,
}: ChatterMultiSearchProps) {
  const { mode, t } = useChatTheme();
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [memberResults, setMemberResults] = useState<SearchableTeamMember[]>([]);
  const [dealResults, setDealResults] = useState<SearchableDeal[]>([]);
  const [selections, setSelections] = useState<SearchSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef(createClient());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search profiles and loans
  const performSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setMemberResults([]);
        setDealResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const supabase = supabaseRef.current;
      const selectedMemberIds = selections
        .filter((s) => s.type === "member")
        .map((s) => s.data.id);
      const selectedDealIds = selections
        .filter((s) => s.type === "deal")
        .map((s) => s.data.id);

      // Search team members
      let memberQuery = supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(6);

      if (currentUserId) {
        memberQuery = memberQuery.neq("id", currentUserId);
      }

      const { data: members } = await memberQuery;

      // Search active deals (loans)
      const { data: deals } = await supabase
        .from("loan_pipeline")
        .select("id, loan_number, property_address, loan_stage, borrower_name, loan_amount")
        .or(
          `loan_number.ilike.%${q}%,property_address.ilike.%${q}%,borrower_name.ilike.%${q}%`
        )
        .limit(6);

      const filteredMembers = ((members as SearchableTeamMember[]) || []).filter(
        (m) => !selectedMemberIds.includes(m.id)
      );
      const filteredDeals = ((deals as unknown as SearchableDeal[]) || []).filter(
        (d) => !selectedDealIds.includes(d.id)
      );

      setMemberResults(filteredMembers);
      setDealResults(filteredDeals);
      setLoading(false);
      setActiveIndex(-1);
    },
    [selections, currentUserId]
  );

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setMemberResults([]);
      setDealResults([]);
      // Also pass through to channel filter
      onSearchChange(query);
      return;
    }
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 250);
    // Also filter channels in parallel
    onSearchChange(query);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, performSearch, onSearchChange]);

  // Keep external searchQuery in sync (e.g., cleared externally)
  useEffect(() => {
    if (searchQuery !== query && !searchQuery) {
      setQuery("");
    }
    // Only sync when searchQuery is cleared externally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const addSelection = (selection: SearchSelection) => {
    setSelections((prev) => [...prev, selection]);
    setQuery("");
    setMemberResults([]);
    setDealResults([]);
    inputRef.current?.focus();
  };

  const removeSelection = (id: string) => {
    setSelections((prev) =>
      prev.filter((s) => s.data.id !== id)
    );
  };

  const clearAll = () => {
    setSelections([]);
    setQuery("");
    onSearchChange("");
  };

  const handleStartConversation = () => {
    if (selections.length === 0) return;
    onStartConversation(selections);
    setSelections([]);
    setQuery("");
    setFocused(false);
  };

  // All results flattened for keyboard navigation
  const allResults: SearchSelection[] = [
    ...memberResults.map((m) => ({ type: "member" as const, data: m })),
    ...dealResults.map((d) => ({ type: "deal" as const, data: d })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0 && activeIndex < allResults.length) {
      e.preventDefault();
      addSelection(allResults[activeIndex]);
    } else if (e.key === "Backspace" && !query && selections.length > 0) {
      removeSelection(selections[selections.length - 1].data.id);
    } else if (e.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  const showDropdown =
    focused && (query.trim().length > 0 || selections.length > 0);
  const hasResults = memberResults.length > 0 || dealResults.length > 0;

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Selected chips + input */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 4,
          padding: selections.length > 0 ? "6px 8px 6px 8px" : "0",
          background: focused
            ? mode === "dark"
              ? "#222"
              : "#FFF"
            : t.bgTertiary,
          border: `1px solid ${focused ? t.borderFocus : t.borderLight}`,
          borderRadius: 8,
          transition: "all 0.2s",
          minHeight: 36,
        }}
      >
        {/* Selection chips */}
        {selections.map((s) => (
          <SelectionChip
            key={s.data.id}
            selection={s}
            onRemove={() => removeSelection(s.data.id)}
          />
        ))}

        {/* Search input */}
        <div style={{ position: "relative", flex: 1, minWidth: 80, display: "flex", alignItems: "center" }}>
          {selections.length === 0 && (
            <Search
              size={14}
              strokeWidth={2}
              color={t.textTertiary}
              style={{
                position: "absolute",
                left: selections.length > 0 ? 2 : 10,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={
              selections.length > 0
                ? "Add more..."
                : "Search people & deals..."
            }
            style={{
              width: "100%",
              padding: selections.length > 0 ? "4px 4px" : "8px 10px 8px 32px",
              background: "transparent",
              border: "none",
              color: t.text,
              fontSize: 13,
              fontFamily: "'Inter', sans-serif",
              outline: "none",
            }}
          />
        </div>

        {/* Clear button */}
        {(selections.length > 0 || query) && (
          <button
            onClick={clearAll}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 2,
              borderRadius: 4,
              display: "flex",
              flexShrink: 0,
            }}
          >
            <X size={14} strokeWidth={2} color={t.textTertiary} />
          </button>
        )}
      </div>

      {/* Start Conversation button (when selections exist) */}
      {selections.length > 0 && (
        <button
          onClick={handleStartConversation}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            padding: "8px 12px",
            marginTop: 6,
            background: t.gold,
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            color: mode === "dark" ? "#0C0C0C" : "#FFFFFF",
            fontFamily: "'Inter', sans-serif",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          <MessageSquarePlus size={14} strokeWidth={1.5} />
          Start Conversation
          <span style={{ fontSize: 11, opacity: 0.7 }}>
            ({selections.length} selected)
          </span>
        </button>
      )}

      {/* Search results dropdown */}
      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: selections.length > 0 ? 40 : 4,
            background: t.bgCard,
            border: `1px solid ${t.border}`,
            borderRadius: 10,
            boxShadow: t.shadowFloat,
            maxHeight: 320,
            overflowY: "auto",
            zIndex: 50,
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
              }}
            >
              <Loader2
                size={18}
                color={t.textTertiary}
                style={{ animation: "spin 1s linear infinite" }}
              />
            </div>
          ) : !hasResults && query.trim() ? (
            <div
              style={{
                padding: "16px 12px",
                textAlign: "center",
                fontSize: 13,
                color: t.textTertiary,
              }}
            >
              No team members or deals found
            </div>
          ) : (
            <>
              {/* Team Members section */}
              {memberResults.length > 0 && (
                <div>
                  <div
                    style={{
                      padding: "8px 12px 4px",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Users size={11} strokeWidth={2} color={t.textTertiary} />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: t.textTertiary,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Team Members
                    </span>
                  </div>
                  {memberResults.map((member, i) => {
                    const flatIdx = i;
                    return (
                      <SearchResultRow
                        key={member.id}
                        isActive={activeIndex === flatIdx}
                        onClick={() =>
                          addSelection({ type: "member", data: member })
                        }
                      >
                        <ChatAvatarV2
                          initials={getInitials(member.full_name)}
                          size={28}
                          src={member.avatar_url}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: t.text,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {member.full_name || "Unknown"}
                          </div>
                          {member.email && (
                            <div
                              style={{
                                fontSize: 11,
                                color: t.textTertiary,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {member.email}
                            </div>
                          )}
                        </div>
                      </SearchResultRow>
                    );
                  })}
                </div>
              )}

              {/* Deals section */}
              {dealResults.length > 0 && (
                <div>
                  {memberResults.length > 0 && (
                    <div
                      style={{
                        height: 1,
                        background: t.divider,
                        margin: "4px 12px",
                      }}
                    />
                  )}
                  <div
                    style={{
                      padding: "8px 12px 4px",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Landmark size={11} strokeWidth={2} color={t.textTertiary} />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: t.textTertiary,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Active Deals
                    </span>
                  </div>
                  {dealResults.map((deal, i) => {
                    const flatIdx = memberResults.length + i;
                    const stageLabel = deal.loan_stage
                      ? getStageDisplayLabel(deal.loan_stage)
                      : null;
                    return (
                      <SearchResultRow
                        key={deal.id}
                        isActive={activeIndex === flatIdx}
                        onClick={() =>
                          addSelection({ type: "deal", data: deal })
                        }
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: t.goldSoft,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Landmark
                            size={14}
                            strokeWidth={1.5}
                            color={t.gold}
                          />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: t.text,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {deal.loan_number || "Deal"}
                            </span>
                            {stageLabel && <DealStagePill stage={stageLabel} />}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: t.textTertiary,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {[deal.borrower_name, deal.property_address]
                              .filter(Boolean)
                              .join(" · ") || "No address"}
                          </div>
                        </div>
                      </SearchResultRow>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Selection Chip ──────────────────────────────────────────────────────────

function SelectionChip({
  selection,
  onRemove,
}: {
  selection: SearchSelection;
  onRemove: () => void;
}) {
  const { mode, t } = useChatTheme();
  const isMember = selection.type === "member";
  const label = isMember
    ? selection.data.full_name || (selection.data as SearchableTeamMember).email || "Unknown"
    : (selection.data as SearchableDeal).loan_number || "Deal";

  const chipBg = isMember ? t.accentSoft : t.goldSoft;
  const chipColor = isMember ? t.text : t.gold;
  const chipBorder = isMember
    ? mode === "dark"
      ? "rgba(255,255,255,0.08)"
      : "rgba(0,0,0,0.08)"
    : t.goldBorder;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 6px 2px 4px",
        background: chipBg,
        color: chipColor,
        border: `1px solid ${chipBorder}`,
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 500,
        fontFamily: "'Inter', sans-serif",
        whiteSpace: "nowrap",
        maxWidth: 160,
      }}
    >
      {isMember ? (
        <Users size={10} strokeWidth={2} />
      ) : (
        <Landmark size={10} strokeWidth={2} />
      )}
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 1,
          borderRadius: 3,
          display: "flex",
          flexShrink: 0,
          opacity: 0.6,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.6";
        }}
      >
        <X size={10} strokeWidth={2.5} color={chipColor} />
      </button>
    </span>
  );
}

// ─── Search Result Row ───────────────────────────────────────────────────────

function SearchResultRow({
  children,
  isActive,
  onClick,
}: {
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  const { t } = useChatTheme();

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "7px 12px",
        background: isActive ? t.bgHover : "transparent",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = t.bgHover;
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

// ─── Deal Stage Pill ─────────────────────────────────────────────────────────

function DealStagePill({ stage }: { stage: string }) {
  const { t } = useChatTheme();
  const styles = getStagePillStyle(stage, t);

  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: "1px 6px",
        borderRadius: 4,
        background: styles.bg,
        color: styles.color,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {stage}
    </span>
  );
}
