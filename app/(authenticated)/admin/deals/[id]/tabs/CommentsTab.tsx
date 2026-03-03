"use client";

import { useState } from "react";
import { Send, Lock } from "lucide-react";
import { DotPill, Av, Btn, fD, type CommentData } from "../components";

interface CommentsTabProps {
  comments: CommentData[];
  currentUserInitials: string;
}

export function CommentsTab({ comments, currentUserInitials }: CommentsTabProps) {
  const [showAll, setShowAll] = useState(true);
  const filtered = showAll
    ? comments
    : comments.filter((c) => !c.is_internal);

  return (
    <div className="flex flex-col gap-4">
      {/* Compose box */}
      <div className="rounded-xl border border-[#E5E5E7] bg-white p-5">
        <div className="flex gap-3">
          <Av text={currentUserInitials} size={32} />
          <div className="flex-1">
            <textarea
              placeholder="Add a comment... use @name to mention"
              className="box-border w-full resize-y rounded-lg border border-[#E5E5E7] bg-[#F7F7F8] p-3 text-[13px] text-[#1A1A1A] outline-none font-sans"
              style={{ minHeight: 72 }}
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock size={12} color="#E5930E" />
                <span className="text-xs font-medium text-[#E5930E] font-sans">
                  Internal Only
                </span>
              </div>
              <Btn label="Post" icon={Send} primary small />
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { val: true, label: "All" },
          { val: false, label: "External Only" },
        ].map(({ val, label }) => (
          <button
            key={label}
            onClick={() => setShowAll(val)}
            className="cursor-pointer rounded-lg border px-3 py-1 text-xs font-medium font-sans"
            style={{
              color: showAll === val ? "#FFF" : "#6B6B6B",
              background: showAll === val ? "#1A1A1A" : "#FFF",
              borderColor: showAll === val ? "#1A1A1A" : "#E5E5E7",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Comment list */}
      {filtered.length === 0 && (
        <div className="rounded-xl border border-[#E5E5E7] bg-white px-5 py-8 text-center text-sm text-[#8B8B8B] font-sans">
          No comments yet.
        </div>
      )}
      {filtered.map((c) => {
        const initials =
          c.author_name
            ?.split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "??";

        return (
          <div
            key={c.id}
            className="rounded-xl bg-white px-5 py-3.5"
            style={{
              border: `1px solid ${c.is_internal ? "#E5930E30" : "#E5E5E7"}`,
            }}
          >
            <div className="flex gap-2.5">
              <Av text={initials} size={32} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[#1A1A1A] font-sans">
                    {c.author_name || "Unknown"}
                  </span>
                  <span className="text-[11px] text-[#8B8B8B] font-sans">
                    {fD(c.created_at)}
                  </span>
                  {c.is_internal && (
                    <DotPill label="Internal" color="#E5930E" />
                  )}
                </div>
                <div className="mt-1.5 text-[13px] leading-relaxed text-[#1A1A1A] font-sans">
                  {c.comment}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
