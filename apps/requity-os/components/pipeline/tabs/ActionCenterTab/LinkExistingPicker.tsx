"use client";

import { useState, useMemo } from "react";
import { FileText, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ConditionDocument } from "./useActionCenterData";

interface LinkExistingPickerProps {
  docs: ConditionDocument[];
  onLink: (docId: string) => void;
  onClose: () => void;
}

export function LinkExistingPicker({ docs, onLink, onClose }: LinkExistingPickerProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      docs.filter((d) =>
        d.document_name.toLowerCase().includes(search.toLowerCase())
      ),
    [docs, search]
  );

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search deal documents..."
          className="h-7 border-0 bg-transparent px-0 py-0 text-[12px] shadow-none focus-visible:ring-0"
        />
        <button onClick={onClose} className="rounded p-0.5 hover:bg-muted rq-transition">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Document list */}
      <div className="max-h-[200px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-[11px] text-muted-foreground">
            No unlinked documents found
          </p>
        ) : (
          filtered.map((doc) => (
            <button
              key={doc.id}
              onClick={() => onLink(doc.id)}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-left",
                "hover:bg-muted/40 rq-transition border-b last:border-b-0"
              )}
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium truncate">{doc.document_name}</p>
                {doc.created_at && (
                  <p className="text-[10px] text-muted-foreground">{timeAgo(doc.created_at)}</p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
