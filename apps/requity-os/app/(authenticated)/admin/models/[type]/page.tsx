import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Home,
  TrendingUp,
  FlaskConical,
  GitBranch,
  ArrowRight,
  Plus,
  LinkIcon,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["commercial", "rtl", "dscr"] as const;
type ModelType = (typeof VALID_TYPES)[number];

const MODEL_META: Record<
  ModelType,
  {
    label: string;
    icon: typeof Building2;
    description: string;
  }
> = {
  commercial: {
    label: "Commercial Underwriting",
    icon: Building2,
    description:
      "A multi-table relational model for commercial real estate loans — rent rolls, T12 historicals, pro forma projections, and financing analysis.",
  },
  rtl: {
    label: "Fix & Flip / RTL",
    icon: Home,
    description:
      "Fix & flip calculator with LTV, LTARV, rehab budgets, holding costs, and borrower ROI projections.",
  },
  dscr: {
    label: "DSCR Calculator",
    icon: TrendingUp,
    description:
      "Debt service coverage ratio calculator for rental properties — income analysis, DSCR computation, and investor yield metrics.",
  },
};

export default async function ModelTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { user } = await requireAdmin();
  if (!user) redirect("/login");

  const { type } = await params;
  if (!VALID_TYPES.includes(type as ModelType)) notFound();

  const meta = MODEL_META[type as ModelType];
  const Icon = meta.icon;

  const admin = createAdminClient();
  const supabase = await createClient();

  // Fetch recent scenarios for this model type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: scenarios } = await (admin as any)
    .from("model_scenarios")
    .select("*")
    .eq("model_type", type)
    .is("deleted_at", null)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(5);

  // Fetch version counts per scenario
  const scenarioIds = (scenarios ?? []).map((s: { id: string }) => s.id);
  const versionCounts: Record<string, number> = {};

  if (scenarioIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: versions } = await (admin as any)
      .from("loan_underwriting_versions")
      .select("scenario_id")
      .in("scenario_id", scenarioIds);

    for (const v of versions ?? []) {
      const sid = (v as { scenario_id: string }).scenario_id;
      versionCounts[sid] = (versionCounts[sid] || 0) + 1;
    }
  }

  // Resolve author names
  const authorIds = Array.from(
    new Set((scenarios ?? []).map((s: { created_by: string }) => s.created_by).filter(Boolean))
  ) as string[];
  const authorMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", authorIds);
    for (const p of profiles ?? []) {
      authorMap[(p as { id: string }).id] = (p as { full_name: string }).full_name ?? "Unknown";
    }
  }

  // Aggregate stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allScenarios } = await (admin as any)
    .from("model_scenarios")
    .select("id, opportunity_id, loan_id")
    .eq("model_type", type)
    .is("deleted_at", null);

  const totalScenarios = allScenarios?.length ?? 0;

  const { data: totalVersions } = await admin
    .from("loan_underwriting_versions")
    .select("id")
    .eq("model_type", type)
    .eq("is_sandbox", false)
    .is("deleted_at", null);

  const linkedCount = (allScenarios ?? []).filter(
    (s: { opportunity_id: string | null; loan_id: string | null }) => s.opportunity_id || s.loan_id
  ).length;

  return (
    <div className="p-6 max-w-5xl">
      <PageHeader
        title={meta.label}
        description={meta.description}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[12px]" asChild>
              <Link href={`/admin/models/${type}/sandbox`}>
                <FlaskConical size={13} className="mr-1" strokeWidth={1.5} />
                Sandbox
              </Link>
            </Button>
            <Button size="sm" className="h-8 text-[12px]" asChild>
              <Link href={`/admin/models/${type}/scenarios`}>
                <GitBranch size={13} className="mr-1" strokeWidth={1.5} />
                All Scenarios
              </Link>
            </Button>
          </div>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-1">
            Scenarios
          </div>
          <div className="text-xl font-semibold num text-foreground">
            {totalScenarios}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-1">
            Total Versions
          </div>
          <div className="text-xl font-semibold num text-foreground">
            {totalVersions?.length ?? 0}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-1">
            Linked to Deals
          </div>
          <div className="text-xl font-semibold num text-foreground">
            {linkedCount}
          </div>
        </div>
      </div>

      {/* Recent scenarios */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Recent Scenarios</h2>
          <Button variant="ghost" size="sm" className="h-7 text-[11px]" asChild>
            <Link href={`/admin/models/${type}/scenarios`}>
              View all
              <ArrowRight size={10} className="ml-1" />
            </Link>
          </Button>
        </div>

        {(!scenarios || scenarios.length === 0) ? (
          <div className="rounded-lg border border-dashed border-border py-10 flex flex-col items-center gap-3">
            <GitBranch size={20} className="text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              No scenarios yet. Create your first one to start underwriting.
            </p>
            <Button size="sm" className="h-8 text-[12px]" asChild>
              <Link href={`/admin/models/${type}/scenarios`}>
                <Plus size={13} className="mr-1" />
                New Scenario
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {(scenarios as ScenarioRow[]).map((s) => {
              const count = versionCounts[s.id] || 0;
              const hasLink = !!(s.opportunity_id || s.loan_id);

              return (
                <Link
                  key={s.id}
                  href={`/admin/models/${type}/scenarios/${s.id}`}
                  className="group flex items-center justify-between rounded-lg border border-border bg-card hover:border-primary/20 hover:bg-primary/[0.02] transition-all px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon size={14} className="text-muted-foreground shrink-0" strokeWidth={1.5} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {s.name}
                        </span>
                        {hasLink && (
                          <LinkIcon size={10} className="text-blue-500 shrink-0" strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        <span className="num">{count}v</span>
                        <span>·</span>
                        <span>{authorMap[s.created_by] || "Unknown"}</span>
                        <span>·</span>
                        <span className="num">{formatDate(s.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    strokeWidth={1.5}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Quick Actions
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[12px]" asChild>
            <Link href={`/admin/models/${type}/scenarios`}>
              <Plus size={13} className="mr-1" />
              New Scenario
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[12px]" asChild>
            <Link href={`/admin/models/${type}/sandbox`}>
              <FlaskConical size={13} className="mr-1" strokeWidth={1.5} />
              Open Sandbox
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ScenarioRow {
  id: string;
  name: string;
  description: string | null;
  model_type: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: string;
  opportunity_id: string | null;
  loan_id: string | null;
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
