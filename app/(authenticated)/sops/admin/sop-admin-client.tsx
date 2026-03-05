"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  HelpCircle,
  AlertTriangle,
  MessageCircle,
  ArrowLeft,
  Eye,
  X,
  Check,
  Plus,
} from "lucide-react";
import { sopClient } from "@/lib/sops/client";

interface FlagWithSOP {
  id: string;
  sop_id: string;
  flag_type: string;
  description: string | null;
  status: string;
  created_at: string;
  sops: { title: string; slug: string } | null;
}

interface UncoveredQuestion {
  id: string;
  question: string;
  created_at: string;
}

interface TopViewedSOP {
  path: string;
  slug: string;
  count: number;
}

interface SOPAdminClientProps {
  totalPublished: number;
  questionsAsked: number;
  unansweredQuestions: number;
  openFlagCount: number;
  flags: FlagWithSOP[];
  uncoveredQuestions: UncoveredQuestion[];
  topViewed: TopViewedSOP[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function SOPAdminClient({
  totalPublished,
  questionsAsked,
  unansweredQuestions,
  openFlagCount,
  flags,
  uncoveredQuestions,
  topViewed,
}: SOPAdminClientProps) {
  const router = useRouter();

  async function handleDismissFlag(flagId: string) {
    const supabase = sopClient();
    await supabase
      .from("sop_staleness_flags")
      .update({ status: "dismissed" })
      .eq("id", flagId);
    router.refresh();
  }

  async function handleResolveFlag(flagId: string) {
    const supabase = sopClient();
    await supabase
      .from("sop_staleness_flags")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", flagId);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <Link
          href="/sops"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Knowledge Base
        </Link>

        <h1 className="mb-8 text-3xl font-semibold text-foreground">
          SOP Analytics &amp; Management
        </h1>

        {/* Metrics Row */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Published SOPs"
            value={totalPublished}
            icon={FileText}
            color="bg-[#2D8A56]/15 text-[#2D8A56]"
          />
          <MetricCard
            title="Questions (30d)"
            value={questionsAsked}
            icon={MessageCircle}
            color="bg-accent text-primary"
          />
          <MetricCard
            title="Unanswered"
            value={unansweredQuestions}
            icon={HelpCircle}
            color="bg-[#D4952B]/15 text-[#D4952B]"
          />
          <MetricCard
            title="Stale Flags"
            value={openFlagCount}
            icon={AlertTriangle}
            color="bg-[#C0392B]/15 text-[#C0392B]"
          />
        </div>

        {/* Staleness Flags Table */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Open Staleness Flags
          </h2>
          {flags.length > 0 ? (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      SOP
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Flagged
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {flags.map((flag) => (
                    <tr
                      key={flag.id}
                      className="border-b border-border/50 last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        {flag.sops ? (
                          <Link
                            href={`/sops/${flag.sops.slug}`}
                            className="text-foreground hover:text-foreground transition"
                          >
                            {flag.sops.title}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[#C0392B]/10 px-2 py-0.5 text-xs font-medium text-[#C0392B]">
                          {flag.flag_type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {flag.description ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(flag.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {flag.sops && (
                            <Link
                              href={`/sops/${flag.sops.slug}`}
                              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                              title="Review"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          )}
                          <button
                            onClick={() => handleResolveFlag(flag.id)}
                            className="rounded-md p-1.5 text-[#2D8A56] transition hover:bg-[#2D8A56]/10"
                            title="Resolve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDismissFlag(flag.id)}
                            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-[#C0392B]"
                            title="Dismiss"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-muted-foreground">
                No open staleness flags. All SOPs are up to date.
              </p>
            </div>
          )}
        </section>

        {/* Question Gap Analysis */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Questions Without SOP Coverage
          </h2>
          {uncoveredQuestions.length > 0 ? (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Question
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Asked
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {uncoveredQuestions.map((q) => (
                    <tr
                      key={q.id}
                      className="border-b border-border/50 last:border-b-0"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {q.question}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(q.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/sops/new?prefill=${encodeURIComponent(q.question)}`}
                          className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs font-medium text-primary transition hover:bg-muted"
                        >
                          <Plus className="h-3 w-3" />
                          Generate SOP
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-muted-foreground">
                All questions have SOP coverage. Great job!
              </p>
            </div>
          )}
        </section>

        {/* Most Viewed SOPs */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Most Viewed SOPs
          </h2>
          {topViewed.length > 0 ? (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      SOP Path
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Views
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topViewed.map((v) => (
                    <tr
                      key={v.path}
                      className="border-b border-border/50 last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={v.path}
                          className="text-foreground hover:text-foreground transition"
                        >
                          {v.slug}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right num text-foreground">
                        {v.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-muted-foreground">
                No SOP view data yet. Views will appear as users browse the
                Knowledge Base.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
