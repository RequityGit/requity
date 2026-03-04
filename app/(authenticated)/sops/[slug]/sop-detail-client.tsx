"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Pencil,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SOPContent } from "@/components/sops/SOPContent";
import { SOPVersionHistory } from "@/components/sops/SOPVersionHistory";
import { sopClient } from "@/lib/sops/client";
import type { SOP, SOPVersion } from "@/lib/sops/types";

interface SOPDetailClientProps {
  sop: SOP;
  categoryName: string | null;
  versions: SOPVersion[];
  relatedSops: { id: string; title: string; slug: string }[];
  isAdmin: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: "bg-[#2D8A56]/15 text-[#2D8A56] border-[#2D8A56]/20",
    draft: "bg-[#D4952B]/15 text-[#D4952B] border-[#D4952B]/20",
    stale: "bg-[#C0392B]/15 text-[#C0392B] border-[#C0392B]/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.draft}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function SOPDetailClient({
  sop,
  categoryName,
  versions,
  relatedSops,
  isAdmin,
}: SOPDetailClientProps) {
  const router = useRouter();

  async function handleMarkStale() {
    const supabase = sopClient();
    await supabase.from("sop_staleness_flags").insert({
      sop_id: sop.id,
      flag_type: "manual",
      description: "Manually flagged as stale by admin",
      status: "open",
    });
    await supabase
      .from("sops")
      .update({ status: "stale" })
      .eq("id", sop.id);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/sops" className="hover:text-foreground transition">
            Knowledge Base
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          {categoryName && (
            <>
              <span>{categoryName}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
          <span className="text-muted-foreground">{sop.title}</span>
        </nav>

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-3xl font-semibold text-foreground">
                {sop.title}
              </h1>
              <StatusBadge status={sop.status} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {sop.department && (
                <Badge
                  variant="outline"
                  className="border-border bg-muted text-muted-foreground text-xs"
                >
                  {sop.department}
                </Badge>
              )}
              {categoryName && (
                <Badge
                  variant="outline"
                  className="border-border bg-muted/50 text-muted-foreground text-xs"
                >
                  {categoryName}
                </Badge>
              )}
              <span>v{sop.version}</span>
              <span>Updated {formatDate(sop.updated_at)}</span>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              {sop.status !== "stale" && (
                <button
                  onClick={handleMarkStale}
                  className="flex items-center gap-1.5 rounded-lg border border-[#C0392B]/30 bg-transparent px-3 py-2 text-xs font-medium text-[#C0392B] transition hover:bg-[#C0392B]/10"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Mark Stale
                </button>
              )}
              <Link
                href={`/sops/${sop.slug}/edit`}
                className="flex items-center gap-1.5 rounded-lg border border-primary bg-transparent px-3 py-2 text-sm font-medium text-primary transition hover:bg-accent"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            </div>
          )}
        </div>

        {/* Content + Sidebar */}
        <div className="flex gap-8">
          <div className="min-w-0 flex-1">
            <div className="rounded-xl border border-border bg-card p-6 lg:p-8">
              <SOPContent content={sop.content} />
            </div>
          </div>

          {/* Right sidebar */}
          <div className="hidden w-64 shrink-0 space-y-4 xl:block">
            {/* Tags */}
            {sop.tags && sop.tags.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {sop.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Version History */}
            <SOPVersionHistory versions={versions} />

            {/* Related SOPs */}
            {relatedSops.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  Related SOPs
                </h4>
                <div className="space-y-2">
                  {relatedSops.map((r) => (
                    <Link
                      key={r.id}
                      href={`/sops/${r.slug}`}
                      className="block rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      {r.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
