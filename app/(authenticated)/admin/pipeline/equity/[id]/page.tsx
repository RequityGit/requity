import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  User,
  FileText,
} from "lucide-react";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import {
  EQUITY_STAGE_LABELS,
  EQUITY_STAGE_COLORS,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EquityDealDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch the deal with property info from the pipeline view
  const [dealResult, propertyResult, tasksResult, stageHistoryResult] =
    await Promise.all([
      admin
        .from("equity_deals")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single(),
      admin
        .from("equity_deals")
        .select("property_id")
        .eq("id", id)
        .single()
        .then(async (res) => {
          if (res.data?.property_id) {
            return admin
              .from("properties")
              .select("*")
              .eq("id", res.data.property_id)
              .single();
          }
          return { data: null, error: null };
        }),
      admin
        .from("equity_deal_tasks")
        .select("*")
        .eq("deal_id", id)
        .order("sort_order"),
      admin
        .from("equity_deal_stage_history")
        .select("*")
        .eq("deal_id", id)
        .order("changed_at", { ascending: false }),
    ]);

  if (dealResult.error || !dealResult.data) {
    notFound();
  }

  const deal = dealResult.data;
  const property = propertyResult?.data ?? null;
  const tasks = tasksResult.data ?? [];
  const stageHistory = stageHistoryResult.data ?? [];

  // Fetch assigned user profile
  let assignedToName: string | null = null;
  if (deal.assigned_to) {
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", deal.assigned_to)
      .single();
    assignedToName = profile?.full_name ?? null;
  }

  const stageLabel = EQUITY_STAGE_LABELS[deal.stage] ?? deal.stage;
  const stageColor = EQUITY_STAGE_COLORS[deal.stage] ?? "bg-slate-100 text-slate-800";

  const completedTasks = tasks.filter((t: any) => t.status === "completed").length;
  const totalTasks = tasks.length;

  const propertyAddress = property
    ? [property.address_line1, property.city, property.state, property.zip]
        .filter(Boolean)
        .join(", ")
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/pipeline/equity">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Pipeline
          </Button>
        </Link>
      </div>

      <PageHeader
        title={deal.deal_name}
        description={
          <div className="flex items-center gap-3 mt-1">
            <Badge className={stageColor}>{stageLabel}</Badge>
            {deal.deal_number && (
              <span className="text-xs text-muted-foreground num">
                {deal.deal_number}
              </span>
            )}
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Asking Price</p>
            <p className="text-lg font-semibold num">
              {deal.asking_price ? formatCurrency(deal.asking_price) : "TBD"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Offer Price</p>
            <p className="text-lg font-semibold num">
              {deal.offer_price ? formatCurrency(deal.offer_price) : "TBD"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Target IRR</p>
            <p className="text-lg font-semibold num">
              {deal.target_irr != null ? formatPercent(deal.target_irr) : "TBD"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Tasks</p>
            <p className="text-lg font-semibold num">
              {completedTasks}/{totalTasks}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" strokeWidth={1.5} />
              Deal Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Source</dt>
                <dd className="font-medium capitalize">
                  {deal.source?.replace(/_/g, " ") ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Assigned To</dt>
                <dd className="font-medium flex items-center gap-1">
                  <User className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {assignedToName ?? "Unassigned"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Purchase Price</dt>
                <dd className="font-medium num">
                  {deal.purchase_price
                    ? formatCurrency(deal.purchase_price)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Expected Close</dt>
                <dd className="font-medium num">
                  {formatDate(deal.expected_close_date)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Actual Close</dt>
                <dd className="font-medium num">
                  {formatDate(deal.actual_close_date)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="font-medium num">{formatDate(deal.created_at)}</dd>
              </div>
              {deal.loss_reason && (
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Loss Reason</dt>
                  <dd className="font-medium text-red-600 capitalize">
                    {deal.loss_reason.replace(/_/g, " ")}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Property Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" strokeWidth={1.5} />
              Property
            </CardTitle>
          </CardHeader>
          <CardContent>
            {property ? (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Address</dt>
                  <dd className="font-medium">{propertyAddress ?? "—"}</dd>
                </div>
                {property.asset_type && (
                  <div>
                    <dt className="text-muted-foreground">Asset Type</dt>
                    <dd className="font-medium capitalize">
                      {property.asset_type.replace(/_/g, " ")}
                    </dd>
                  </div>
                )}
                {property.property_type && (
                  <div>
                    <dt className="text-muted-foreground">Property Type</dt>
                    <dd className="font-medium capitalize">
                      {property.property_type.replace(/_/g, " ")}
                    </dd>
                  </div>
                )}
                {property.number_of_units && (
                  <div>
                    <dt className="text-muted-foreground">Units</dt>
                    <dd className="font-medium num">{property.number_of_units}</dd>
                  </div>
                )}
                {property.lot_size_acres && (
                  <div>
                    <dt className="text-muted-foreground">Lot Size</dt>
                    <dd className="font-medium num">
                      {property.lot_size_acres} acres
                    </dd>
                  </div>
                )}
                {property.year_built && (
                  <div>
                    <dt className="text-muted-foreground">Year Built</dt>
                    <dd className="font-medium num">{property.year_built}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">No property linked.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Investment Thesis & Strategy */}
      {(deal.investment_thesis || deal.value_add_strategy) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {deal.investment_thesis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" strokeWidth={1.5} />
                  Investment Thesis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {deal.investment_thesis}
                </p>
              </CardContent>
            </Card>
          )}
          {deal.value_add_strategy && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" strokeWidth={1.5} />
                  Value-Add Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {deal.value_add_strategy}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tasks */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Tasks ({completedTasks}/{totalTasks} complete)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {tasks.map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        task.status === "completed"
                          ? "bg-green-500"
                          : task.status === "in_progress"
                            ? "bg-blue-500"
                            : task.status === "blocked"
                              ? "bg-red-500"
                              : "bg-slate-300"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        task.status === "completed"
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {task.task_name}
                    </span>
                    {task.is_critical_path && (
                      <Badge variant="outline" className="text-xs">
                        Critical
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task.due_date && (
                      <span className="num">{formatDate(task.due_date)}</span>
                    )}
                    <Badge variant="secondary" className="text-xs capitalize">
                      {task.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stage History */}
      {stageHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" strokeWidth={1.5} />
              Stage History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stageHistory.map((entry: any) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="num text-xs text-muted-foreground w-24 shrink-0">
                    {formatDate(entry.changed_at)}
                  </span>
                  <Badge
                    className={`text-xs ${
                      EQUITY_STAGE_COLORS[entry.from_stage] ??
                      "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {EQUITY_STAGE_LABELS[entry.from_stage] ?? entry.from_stage}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge
                    className={`text-xs ${
                      EQUITY_STAGE_COLORS[entry.to_stage] ??
                      "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {EQUITY_STAGE_LABELS[entry.to_stage] ?? entry.to_stage}
                  </Badge>
                  {entry.duration_in_previous_stage && (
                    <span className="text-xs text-muted-foreground num">
                      ({entry.duration_in_previous_stage})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {(deal.notes || deal.internal_notes) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deal.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">General Notes</p>
                <p className="text-sm whitespace-pre-wrap">{deal.notes}</p>
              </div>
            )}
            {deal.internal_notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Internal Notes</p>
                <p className="text-sm whitespace-pre-wrap">{deal.internal_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
