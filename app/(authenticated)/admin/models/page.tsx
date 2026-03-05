import { redirect } from "next/navigation";
import Link from "next/link";
import { FlaskConical, Building2, Home, TrendingUp, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const MODEL_CONFIG = [
  {
    type: "commercial" as const,
    label: "Commercial",
    icon: Building2,
    description: "Multi-table underwriting for commercial loans — rent rolls, T12 historicals, pro forma projections, and financing analysis.",
    sandboxAvailable: false,
  },
  {
    type: "rtl" as const,
    label: "Fix & Flip / RTL",
    icon: Home,
    description: "Fix & flip calculator with LTV, LTARV, rehab budgets, holding costs, and borrower ROI projections.",
    sandboxAvailable: true,
  },
  {
    type: "dscr" as const,
    label: "DSCR Calculator",
    icon: TrendingUp,
    description: "Debt service coverage ratio calculator for rental properties — income analysis, DSCR computation, and investor yield metrics.",
    sandboxAvailable: true,
  },
];

export default async function ModelsOverviewPage() {
  const { user } = await requireAdmin();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch aggregate stats per model type
  const { data: stats } = await admin
    .from("loan_underwriting_versions")
    .select("model_type, computation_status")
    .eq("is_sandbox", false)
    .is("deleted_at", null);

  const statsByType: Record<string, { total: number; computed: number; incomplete: number; empty: number }> = {};
  for (const row of stats ?? []) {
    const mt = (row as { model_type: string }).model_type;
    const cs = (row as { computation_status: string | null }).computation_status ?? "empty";
    if (!statsByType[mt]) statsByType[mt] = { total: 0, computed: 0, incomplete: 0, empty: 0 };
    statsByType[mt].total++;
    if (cs === "computed") statsByType[mt].computed++;
    else if (cs === "incomplete") statsByType[mt].incomplete++;
    else statsByType[mt].empty++;
  }

  return (
    <div className="p-6 max-w-5xl">
      <PageHeader
        title="Models"
        description="Underwriting model reference and sandbox testing"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODEL_CONFIG.map((model) => {
          const s = statsByType[model.type] ?? { total: 0, computed: 0, incomplete: 0, empty: 0 };
          const Icon = model.icon;

          return (
            <div
              key={model.type}
              className="rounded-lg border border-border bg-card p-5 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Icon size={18} className="text-muted-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{model.label}</h3>
              </div>

              <p className="text-[12px] text-muted-foreground leading-relaxed flex-1">
                {model.description}
              </p>

              {/* Stats */}
              {s.total > 0 && (
                <div className="flex gap-3 text-[11px] num">
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{s.total}</span> versions
                  </span>
                  {s.computed > 0 && (
                    <span className="text-green-600 dark:text-green-400">
                      {s.computed} complete
                    </span>
                  )}
                  {s.incomplete > 0 && (
                    <span className="text-amber-600 dark:text-amber-400">
                      {s.incomplete} incomplete
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Button variant="outline" size="sm" className="h-8 text-[12px]" asChild>
                  <Link href={`/admin/models/${model.type}`}>
                    Details
                    <ArrowRight size={12} className="ml-1" strokeWidth={1.5} />
                  </Link>
                </Button>
                {model.sandboxAvailable ? (
                  <Button variant="outline" size="sm" className="h-8 text-[12px]" asChild>
                    <Link href={`/admin/models/${model.type}/sandbox`}>
                      <FlaskConical size={12} className="mr-1" strokeWidth={1.5} />
                      Sandbox
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="h-8 text-[12px]" disabled>
                    <FlaskConical size={12} className="mr-1" strokeWidth={1.5} />
                    Coming Soon
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
