"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, formatPercent, formatDateShort } from "@/lib/format";
import { showSuccess, showError, showInfo } from "@/lib/toast";
import {
  Clock,
  CalendarClock,
  ShieldCheck,
  ArrowRightLeft,
  DollarSign,
  FileText,
  CreditCard,
  Timer,
  HardHat,
  Activity,
  Plus,
  Loader2,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import type { UnifiedDeal } from "@/components/pipeline/pipeline-types";

interface ServicingTabProps {
  deal: UnifiedDeal;
}

// ─── Helpers ───

function getMaturityInfo(deal: UnifiedDeal) {
  const maturityDate = deal.current_maturity_date ?? deal.maturity_date;
  if (!maturityDate) return null;

  const [y, m, d] = maturityDate.split("-").map(Number);
  const maturity = new Date(y!, m! - 1, d!);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const daysRemaining = Math.floor((maturity.getTime() - now.getTime()) / 86400000);

  let color: "green" | "yellow" | "red" = "green";
  if (daysRemaining < 30) color = "red";
  else if (daysRemaining < 90) color = "yellow";

  return { daysRemaining, color, maturityDate };
}

function getServicingStatusColor(status: string | null | undefined) {
  switch (status) {
    case "current":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "late":
    case "delinquent":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "default":
    case "in_default":
      return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    case "paid_off":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function getServicingStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "current": return "Current";
    case "late": return "Late";
    case "delinquent": return "Delinquent";
    case "default":
    case "in_default": return "Default";
    case "paid_off": return "Paid Off";
    default: return "Unknown";
  }
}

function getDrawStatusBadge(status: string) {
  switch (status) {
    case "funded":
      return { label: "Funded", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
    case "approved":
      return { label: "Approved", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
    case "submitted":
    case "under_review":
      return { label: status === "submitted" ? "Submitted" : "Under Review", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
    case "rejected":
      return { label: "Rejected", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" };
    case "draft":
      return { label: "Draft", className: "bg-muted text-muted-foreground border-border" };
    default:
      return { label: status, className: "bg-muted text-muted-foreground border-border" };
  }
}

const EVENT_ICONS: Record<string, typeof Activity> = {
  payment_received: CreditCard,
  payment_missed: Clock,
  draw_submitted: HardHat,
  draw_approved: HardHat,
  draw_funded: DollarSign,
  payoff_requested: FileText,
  status_change: ShieldCheck,
  note: FileText,
};

// ─── Types ───

interface DrawRequest {
  id: string;
  draw_number: number;
  amount_requested: number;
  amount_approved: number | null;
  status: string;
  request_date: string | null;
  submitted_at: string | null;
  wire_date: string | null;
  wire_amount: number | null;
  completion_pct: number | null;
  description: string | null;
}

interface ConstructionBudget {
  id: string;
  name: string | null;
  total_budget: number | null;
  total_funded: number | null;
  status: string | null;
}

interface ServicingEvent {
  id: string;
  event_type: string;
  description: string | null;
  amount: number | null;
  created_at: string;
  created_by: string | null;
}

// ─── Main Component ───

export function ServicingTab({ deal }: ServicingTabProps) {
  const maturityInfo = useMemo(() => getMaturityInfo(deal), [deal]);
  const showNoteSale = deal.stage === "closed_pre_sale" || deal.stage === "closed_sold";

  // Draw requests + budgets
  const [draws, setDraws] = useState<DrawRequest[]>([]);
  const [budgets, setBudgets] = useState<ConstructionBudget[]>([]);
  const [events, setEvents] = useState<ServicingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDrawDialog, setShowNewDrawDialog] = useState(false);
  const [newDrawSubmitting, setNewDrawSubmitting] = useState(false);
  const [newDraw, setNewDraw] = useState({ amount: "", description: "" });

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const [drawsRes, budgetsRes, eventsRes] = await Promise.all([
      supabase
        .from("deal_draw_requests")
        .select("id, draw_number, amount_requested, amount_approved, status, request_date, submitted_at, wire_date, wire_amount, completion_pct, description")
        .eq("deal_id", deal.id)
        .order("draw_number", { ascending: false }),
      supabase
        .from("deal_construction_budgets")
        .select("id, name, total_budget, total_funded, status")
        .eq("deal_id", deal.id),
      supabase
        .from("deal_servicing_events")
        .select("id, event_type, description, amount, created_at, created_by")
        .eq("deal_id", deal.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    setDraws(drawsRes.data ?? []);
    setBudgets(budgetsRes.data ?? []);
    setEvents(eventsRes.data ?? []);
    setLoading(false);
  }, [deal.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeBudget = budgets.find(b => b.status === "active");
  const budgetTotal = activeBudget?.total_budget ?? 0;
  const budgetFunded = activeBudget?.total_funded ?? 0;
  const budgetRemaining = budgetTotal - budgetFunded;
  const budgetPct = budgetTotal > 0 ? Math.round((budgetFunded / budgetTotal) * 100) : 0;
  const hasDraws = draws.length > 0 || budgets.length > 0;

  async function handleSubmitDraw() {
    const amount = parseFloat(newDraw.amount.replace(/[^0-9.]/g, ""));
    if (!amount || amount <= 0) {
      showError("Enter a valid amount");
      return;
    }
    setNewDrawSubmitting(true);
    try {
      const supabase = createClient();
      const nextNumber = draws.length > 0 ? Math.max(...draws.map(d => d.draw_number)) + 1 : 1;
      const { error } = await supabase.from("deal_draw_requests").insert({
        deal_id: deal.id,
        draw_number: nextNumber,
        amount_requested: amount,
        description: newDraw.description || null,
        status: "submitted",
        submitted_at: new Date().toISOString(),
        construction_budget_id: activeBudget?.id ?? null,
      });
      if (error) throw error;

      // Log servicing event
      await supabase.from("deal_servicing_events").insert({
        deal_id: deal.id,
        event_type: "draw_submitted",
        description: `Draw #${nextNumber} submitted: ${formatCurrency(amount)}`,
        amount,
      });

      showSuccess("Draw request submitted");
      setShowNewDrawDialog(false);
      setNewDraw({ amount: "", description: "" });
      fetchData();
    } catch {
      showError("Could not submit draw request");
    } finally {
      setNewDrawSubmitting(false);
    }
  }

  return (
    <div className="rq-tab-content space-y-6">
      {/* Top KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Maturity Countdown */}
        <div className="rq-card-wrapper">
          <div className="rq-stat-card">
            <div className="flex items-center gap-2 mb-2.5">
              <CalendarClock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <span className="rq-micro-label">Maturity</span>
            </div>
            {maturityInfo ? (
              <div className="flex items-baseline gap-2">
                <span
                  className={cn(
                    "rq-stat-value",
                    maturityInfo.color === "green" && "rq-value-positive",
                    maturityInfo.color === "yellow" && "rq-value-warn",
                    maturityInfo.color === "red" && "rq-value-negative"
                  )}
                >
                  {maturityInfo.daysRemaining}d
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(maturityInfo.maturityDate)}
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">No maturity date set</span>
            )}
            {deal.extension_count != null && deal.extension_count > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                {deal.extension_count} extension{deal.extension_count > 1 ? "s" : ""} granted
              </div>
            )}
          </div>
        </div>

        {/* Servicing Status */}
        <div className="rq-card-wrapper">
          <div className="rq-stat-card">
            <div className="flex items-center gap-2 mb-2.5">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <span className="rq-micro-label">Servicing Status</span>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-sm font-semibold px-3 py-1",
                getServicingStatusColor(deal.servicing_status)
              )}
            >
              {getServicingStatusLabel(deal.servicing_status)}
            </Badge>
          </div>
        </div>

        {/* Funding Info */}
        <div className="rq-card-wrapper">
          <div className="rq-stat-card">
            <div className="flex items-center gap-2 mb-2.5">
              <DollarSign className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <span className="rq-micro-label">Loan Info</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Funded</span>
                <span className="font-medium num">{formatCurrency(deal.loan_amount ?? deal.amount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Funding Date</span>
                <span className="font-medium">{formatDate(deal.funding_date)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">First Payment</span>
                <span className="font-medium">{formatDate(deal.first_payment_date)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loan Terms Card */}
      <div className="rq-card-wrapper">
        <div className="rq-card-header">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <h4 className="rq-micro-label">Loan Terms</h4>
          </div>
        </div>
        <div className="rq-card">
          <div className="rq-field-grid">
            <div className="space-y-0">
              <span className="inline-field-label">Loan Amount</span>
              <div className="text-sm font-medium num">{formatCurrency(deal.loan_amount ?? deal.amount)}</div>
            </div>
            <div className="space-y-0">
              <span className="inline-field-label">Interest Rate</span>
              <div className="text-sm font-medium num">{deal.interest_rate != null ? formatPercent(deal.interest_rate) : "\u2014"}</div>
            </div>
            <div className="space-y-0">
              <span className="inline-field-label">Monthly Payment</span>
              <div className="text-sm font-medium num">{formatCurrency(deal.monthly_payment)}</div>
            </div>
            <div className="space-y-0">
              <span className="inline-field-label">Payment Frequency</span>
              <div className="text-sm font-medium capitalize">{deal.payment_frequency ?? "\u2014"}</div>
            </div>
            <div className="space-y-0">
              <span className="inline-field-label">Origination Date</span>
              <div className="text-sm font-medium">{formatDate(deal.origination_date)}</div>
            </div>
            <div className="space-y-0">
              <span className="inline-field-label">Loan Term</span>
              <div className="text-sm font-medium">{deal.loan_term_months != null ? `${deal.loan_term_months} months` : "\u2014"}</div>
            </div>
            <div className="space-y-0">
              <span className="inline-field-label">Next Payment Due</span>
              <div className="text-sm font-medium">{formatDate(deal.next_payment_due)}</div>
            </div>
            <div className="space-y-0">
              <span className="inline-field-label">Last Payment</span>
              <div className="text-sm font-medium">{formatDate(deal.last_payment_date)}</div>
            </div>
            <div className="space-y-0">
              <span className="inline-field-label">Maturity Date</span>
              <div className="text-sm font-medium">{formatDate(deal.current_maturity_date ?? deal.maturity_date)}</div>
            </div>
            <div className="space-y-0">
              <span className="inline-field-label">Servicing Status</span>
              <div className="text-sm font-medium capitalize">{deal.servicing_status ?? "\u2014"}</div>
            </div>
            <div className="space-y-0">
              <span className="inline-field-label">Per Diem Interest</span>
              <div className="text-sm font-medium num">{formatCurrency(deal.per_diem_interest)}</div>
            </div>
            <div className="space-y-0">
              <span className="inline-field-label">Late Charge</span>
              <div className="text-sm font-medium num">
                {deal.late_charge_pct != null ? formatPercent(deal.late_charge_pct) : "\u2014"}
                {deal.late_charge_grace_days != null && (
                  <span className="text-muted-foreground text-xs ml-1">({deal.late_charge_grace_days}d grace)</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Note Sale Details (conditional) */}
      {showNoteSale && (
        <div className="rq-card-wrapper">
          <div className="rq-card-header">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <h4 className="rq-micro-label">Note Sale</h4>
            </div>
          </div>
          <div className="rq-card">
            <div className="rq-field-grid">
              <div className="space-y-0">
                <span className="inline-field-label">Sold To</span>
                <div className="text-sm font-medium">{deal.note_sold_to ?? "\u2014"}</div>
              </div>
              <div className="space-y-0">
                <span className="inline-field-label">Sale Date</span>
                <div className="text-sm font-medium">{formatDate(deal.note_sale_date)}</div>
              </div>
              <div className="space-y-0">
                <span className="inline-field-label">Sale Price</span>
                <div className="text-sm font-medium num">{formatCurrency(deal.note_sale_price)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Draw Requests Section */}
      {(hasDraws || !loading) && (
        <div className="rq-card-wrapper">
          <div className="rq-card-header">
            <div className="flex items-center gap-2">
              <HardHat className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <h4 className="rq-micro-label">Draw Requests</h4>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowNewDrawDialog(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New Draw
            </Button>
          </div>

          {/* Budget summary bar */}
          {activeBudget && (
            <div className="px-5 py-3 border-b border-border">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Budget: {formatCurrency(budgetTotal)}</span>
                <span className="text-muted-foreground">Funded: {formatCurrency(budgetFunded)}</span>
                <span className="font-medium">Remaining: {formatCurrency(budgetRemaining)}</span>
                <span className="text-xs text-muted-foreground">{budgetPct}% utilized</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full rq-transition",
                    budgetPct >= 90 ? "bg-red-500" : budgetPct >= 70 ? "bg-amber-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${Math.min(budgetPct, 100)}%` }}
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : draws.length === 0 ? (
            <div className="py-6">
              <EmptyState
                compact
                icon={HardHat}
                title="No draw requests"
                description="No draw requests have been submitted for this deal."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="rq-th text-left">Draw #</th>
                    <th className="rq-th text-right">Requested</th>
                    <th className="rq-th text-right">Approved</th>
                    <th className="rq-th text-center">Status</th>
                    <th className="rq-th text-left">Request Date</th>
                    <th className="rq-th text-left">Wire Date</th>
                    <th className="rq-th text-right">Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {draws.map((draw) => {
                    const statusBadge = getDrawStatusBadge(draw.status);
                    return (
                      <tr key={draw.id} className="border-b border-border last:border-b-0 hover:bg-muted/30 rq-transition">
                        <td className="rq-td text-left num">{draw.draw_number}</td>
                        <td className="rq-td text-right num">{formatCurrency(draw.amount_requested)}</td>
                        <td className="rq-td text-right num">{formatCurrency(draw.amount_approved)}</td>
                        <td className="rq-td text-center">
                          <Badge variant="outline" className={cn("text-[10px] font-semibold", statusBadge.className)}>
                            {statusBadge.label}
                          </Badge>
                        </td>
                        <td className="rq-td text-left">{formatDate(draw.request_date ?? draw.submitted_at)}</td>
                        <td className="rq-td text-left">{formatDate(draw.wire_date)}</td>
                        <td className="rq-td text-right num">{draw.completion_pct != null ? `${draw.completion_pct}%` : "\u2014"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Servicing Events */}
      <div className="rq-card-wrapper">
        <div className="rq-card-header">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <h4 className="rq-micro-label">Servicing Events</h4>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <div className="py-6">
            <EmptyState
              compact
              icon={Activity}
              title="No events"
              description="No servicing events have been recorded yet."
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {events.map((event) => {
              const Icon = EVENT_ICONS[event.event_type] ?? Activity;
              return (
                <div key={event.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="mt-0.5 rounded-full bg-muted p-1.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{event.description ?? event.event_type}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {event.amount != null && (
                        <span className="text-xs font-medium num">{formatCurrency(event.amount)}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDateShort(event.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="rq-card-wrapper">
        <div className="rq-card-header">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <h4 className="rq-micro-label">Quick Actions</h4>
          </div>
        </div>
        <div className="rq-card">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => showInfo("Coming soon")} className="gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Record Payment
            </Button>
            <Button variant="outline" size="sm" onClick={() => showInfo("Coming soon")} className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Request Extension
            </Button>
            <Button variant="outline" size="sm" onClick={() => showInfo("Coming soon")} className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Initiate Payoff
            </Button>
            <Button variant="outline" size="sm" onClick={() => showInfo("Coming soon")} className="gap-1.5">
              <ArrowRightLeft className="h-3.5 w-3.5" />
              List for Sale
            </Button>
          </div>
        </div>
      </div>

      {/* New Draw Request Dialog */}
      <Dialog open={showNewDrawDialog} onOpenChange={setShowNewDrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Draw Request</DialogTitle>
            <DialogDescription>Submit a new draw request for this deal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-0">
              <span className="inline-field-label">Amount Requested</span>
              <Input
                type="text"
                placeholder="$0"
                value={newDraw.amount}
                onChange={(e) => setNewDraw(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-0">
              <span className="inline-field-label">Description</span>
              <Textarea
                placeholder="Describe the work completed..."
                value={newDraw.description}
                onChange={(e) => setNewDraw(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            {activeBudget && (
              <div className="text-xs text-muted-foreground">
                Budget: {formatCurrency(budgetTotal)} | Remaining: {formatCurrency(budgetRemaining)}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDrawDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitDraw} disabled={newDrawSubmitting}>
              {newDrawSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Submit Draw
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
