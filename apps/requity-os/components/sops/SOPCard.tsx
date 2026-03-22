"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { SOP } from "@/lib/sops/types";
import { formatDate } from "@/lib/format";

interface SOPCardProps {
  sop: SOP;
}

const STATUS_STYLES: Record<string, string> = {
  published: "bg-[#2D8A56]/15 text-[#2D8A56] border-[#2D8A56]/20",
  draft: "bg-[#D4952B]/15 text-[#D4952B] border-[#D4952B]/20",
  stale: "bg-[#C0392B]/15 text-[#C0392B] border-[#C0392B]/20",
};

export function SOPCard({ sop }: SOPCardProps) {
  return (
    <Link href={`/sops/${sop.slug}`} className="group block">
      <Card className="shadow-md transition hover:shadow-lg">
        <CardContent className="p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h4 className="text-base font-semibold text-foreground group-hover:text-foreground transition-colors">
              {sop.title}
            </h4>
            <Badge
              variant="outline"
              className={STATUS_STYLES[sop.status] ?? STATUS_STYLES.draft}
            >
              {sop.status.charAt(0).toUpperCase() + sop.status.slice(1)}
            </Badge>
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
                className="border-border bg-muted text-muted-foreground text-xs"
              >
                {sop.department}
              </Badge>
            )}
            <span>Updated {formatDate(sop.updated_at)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
