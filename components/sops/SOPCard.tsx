"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { SOP } from "@/lib/sops/types";

interface SOPCardProps {
  sop: SOP;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SOPCard({ sop }: SOPCardProps) {
  return (
    <Link
      href={`/sops/${sop.slug}`}
      className="group block rounded-xl border border-border bg-card p-4 shadow-md transition hover:border-border"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-base font-semibold text-foreground group-hover:text-gold-light transition-colors">
          {sop.title}
        </h4>
        <StatusBadge status={sop.status} />
      </div>
      {sop.summary && (
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {sop.summary}
        </p>
      )}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {sop.department && (
          <Badge
            variant="outline"
            className="border-border bg-gold/5 text-gold-light text-xs"
          >
            {sop.department}
          </Badge>
        )}
        <span>Updated {formatDate(sop.updated_at)}</span>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: "bg-[#2D8A56]/15 text-[#2D8A56] border-[#2D8A56]/20",
    draft: "bg-[#D4952B]/15 text-[#D4952B] border-[#D4952B]/20",
    stale: "bg-[#C0392B]/15 text-[#C0392B] border-[#C0392B]/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.draft}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
