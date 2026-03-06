import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  Home,
  Building2,
  LinkIcon,
  Archive,
  Clock,
  CheckCircle2,
  GitBranch,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewScenarioButton } from "./new-scenario-button";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["rtl", "dscr", "commercial"] as const;

const MODEL_LABELS: Record<string, string> = {
  rtl: "Fix & Flip / RTL",
  dscr: "DSCR Calculator",
  commercial: "Commercial Underwriting",
};

const MODEL_ICONS: Record<string, typeof Building2> = {
  commercial: Building2,
  rtl: Home,
  dscr: TrendingUp,
};

export default async function ScenariosPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { user } = await requireAdmin();
  if (!user) redirect("/login");

  const { type } = await params;
  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    redirect("/admin/models");
  }

  const admin = createAdminClient();
  const supabase = await createClient();

  // Fetch all scenarios for this model type (non-deleted)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: scenarios } = await (admin as any)
    .from("model_scenarios")
    .select("*")
    .eq("model_type", type)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Fetch version counts per scenario
  const scenarioIds = ((scenarios ?? []) as { id: string }[]).map((s) => s.id);
  let versionCounts: Record<string, number> = {};
  let activeVersionMap: Record<string, string | null> = {};

  if (scenarioIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: versions } = await (admin as any)
      .from("loan_underwriting_versions")
      .select("scenario_id, id, is_active")
      .in("scenario_id", scenarioIds);

    for (const v of versions ?? []) {
      const sid = (v as { scenario_id: string }).scenario_id;
      versionCounts[sid] = (versionCounts[sid] || 0) + 1;
      if ((v as { is_active: boolean }).is_active) {
        activeVersionMap[sid] = (v as { id: string }).id;
      }
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

  // Resolve linked deal names
  const oppIds = (scenarios ?? [])
    .map((s: { opportunity_id: string | null }) => s.opportunity_id)
    .filter(Boolean) as string[];
  const loanIds = (scenarios ?? [])
    .map((s: { loan_id: string | null }) => s.loan_id)
    .filter(Boolean) as string[];

  const dealNames: Record<string, string> = {};
  if (oppIds.length > 0) {
    const { data: opps } = await admin
      .from("opportunities")
      .select("id, deal_name")
      .in("id", oppIds);
    for (const o of opps ?? []) {
      dealNames[(o as { id: string }).id] = (o as { deal_name: string | null }).deal_name || "Unnamed Opportunity";
    }
  }
  if (loanIds.length > 0) {
    const { data: loans } = await admin
      .from("loans")
      .select("id, loan_number, property_address")
      .in("id", loanIds);
    for (const l of loans ?? []) {
      dealNames[(l as { id: string }).id] =
        (l as { property_address: string | null }).property_address ||
        (l as { loan_number: string | null }).loan_number ||
        "Unnamed Loan";
    }
  }

  const Icon = MODEL_ICONS[type] || TrendingUp;

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-2 mb-4">
        <Link href={`/admin/models/${type}`}>
          <Button variant="ghost" size="sm" className="h-8 text-xs">
            <ArrowLeft size={14} className="mr-1" />
            {MODEL_LABELS[type]}
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Scenarios"
        description={`Versioned underwriting scenarios for ${MODEL_LABELS[type]}. Create standalone runs or link them to deals.`}
        action={
          <NewScenarioButton modelType={type} />
        }
      />

      {/* Scenarios list */}
      {(!scenarios || scenarios.length === 0) ? (
        <div className="rounded-lg border border-border bg-muted/30 py-16 flex flex-col items-center gap-3">
          <GitBranch size={24} className="text-muted-foreground" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">
            No scenarios yet. Create one to start underwriting.
          </p>
          <NewScenarioButton modelType={type} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {(scenarios as ScenarioRow[]).map((s) => {
            const count = versionCounts[s.id] || 0;
            const hasActiveVersion = !!activeVersionMap[s.id];
            const linkedDealId = s.opportunity_id || s.loan_id;
            const linkedDealName = linkedDealId ? dealNames[linkedDealId] : null;
            const isOpportunity = !!s.opportunity_id;

            return (
              <Link
                key={s.id}
                href={`/admin/models/${type}/scenarios/${s.id}`}
                className="group rounded-lg border border-border bg-card hover:border-primary/20 hover:bg-primary/[0.02] transition-all px-5 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={14} className="text-muted-foreground shrink-0" strokeWidth={1.5} />
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {s.name}
                      </h3>
                      <Badge
                        variant={s.status === "active" ? "outline" : "secondary"}
                        className="text-[9px] h-4 px-1.5"
                      >
                        {s.status}
                      </Badge>
                      {hasActiveVersion && (
                        <Badge className="text-[9px] h-4 px-1.5 bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle2 size={8} className="mr-0.5" />
                          Active
                        </Badge>
                      )}
                    </div>

                    {s.description && (
                      <p className="text-[12px] text-muted-foreground mb-1.5 truncate">
                        {s.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <GitBranch size={10} strokeWidth={1.5} />
                        <span className="num">{count}</span> version{count !== 1 ? "s" : ""}
                      </span>
                      <span>·</span>
                      <span>{authorMap[s.created_by] || "Unknown"}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 num">
                        <Clock size={10} strokeWidth={1.5} />
                        {formatDate(s.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Deal link badge */}
                  {linkedDealName ? (
                    <div className="flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2.5 py-1.5 shrink-0">
                      <LinkIcon size={10} className="text-blue-500" strokeWidth={1.5} />
                      <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 max-w-[180px] truncate">
                        {linkedDealName}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[8px] h-3.5 px-1 ml-1"
                      >
                        {isOpportunity ? "Opportunity" : "Loan"}
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 shrink-0">
                      <span className="text-[11px] text-muted-foreground">Standalone</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
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
  status: string;
  opportunity_id: string | null;
  loan_id: string | null;
  active_version_id: string | null;
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
