"use client";

import { useState, useEffect } from "react";
import { Clock, Check, FileText, ChevronRight } from "lucide-react";
import type { UnderwritingModelType } from "@/lib/underwriting/resolver";
import { getModelConfig } from "@/lib/underwriting/resolver";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface VersionHistoryProps {
  modelType: UnderwritingModelType;
  scenarioId: string | null;
  onSelectVersion?: (versionId: string) => void;
  activeVersionId?: string | null;
}

interface VersionRow {
  id: string;
  version_number: number;
  is_active: boolean;
  status: string;
  label: string | null;
  created_at: string;
}

export function VersionHistory({
  modelType,
  scenarioId,
  onSelectVersion,
  activeVersionId,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const config = getModelConfig(modelType);

  useEffect(() => {
    if (!scenarioId) return;

    const fetchVersions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from(config.primaryTable)
          .select("id, version_number, is_active, status, label, created_at")
          .eq("scenario_id", scenarioId)
          .order("version_number", { ascending: false });

        if (error) {
          console.error("VersionHistory fetch error:", error);
          return;
        }
        setVersions(data ?? []);
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [scenarioId, config.primaryTable]);

  if (!scenarioId) return null;

  return (
    <div className="rounded-xl border border-[#27272a] bg-[#111113] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e1e22]">
        <Clock size={14} className="text-[#71717a]" strokeWidth={1.5} />
        <span className="text-[13px] font-semibold text-[#fafafa]">Version History</span>
        <span className="text-[11px] text-[#71717a] ml-auto">{versions.length} version{versions.length !== 1 ? "s" : ""}</span>
      </div>

      {loading && (
        <div className="py-6 text-center text-[13px] text-[#71717a]">Loading...</div>
      )}

      {!loading && versions.length === 0 && (
        <div className="py-6 text-center text-[13px] text-[#71717a]">No versions yet.</div>
      )}

      <div className="divide-y divide-[#1e1e22]">
        {versions.map((v) => {
          const isActive = v.id === activeVersionId || v.is_active;
          return (
            <button
              key={v.id}
              onClick={() => onSelectVersion?.(v.id)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors hover:bg-[#1e1e22] cursor-pointer"
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-semibold num"
                style={{
                  backgroundColor: isActive ? "rgba(59,130,246,0.15)" : "#18181b",
                  color: isActive ? "#3b82f6" : "#71717a",
                }}
              >
                v{v.version_number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-medium text-[#fafafa]">
                    {v.label || `Version ${v.version_number}`}
                  </span>
                  {v.status === "draft" && (
                    <span className="rounded px-1.5 py-px text-[9px] font-medium bg-[rgba(245,158,11,0.12)] text-[#f59e0b]">
                      Draft
                    </span>
                  )}
                  {v.status === "final" && (
                    <span className="rounded px-1.5 py-px text-[9px] font-medium bg-[rgba(34,197,94,0.12)] text-[#22c55e]">
                      Final
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#71717a] num">
                  {new Date(v.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
              {isActive && (
                <Check size={14} className="text-[#3b82f6] shrink-0" strokeWidth={2} />
              )}
              <ChevronRight size={14} className="text-[#71717a] shrink-0" strokeWidth={1.5} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
