"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";
import { showInfo } from "@/lib/toast";
import {
  Clock,
  CalendarClock,
  ShieldCheck,
  ArrowRightLeft,
  DollarSign,
  FileText,
  CreditCard,
  Timer,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import type { UnifiedDeal } from "@/components/pipeline/pipeline-types";

interface ServicingTabProps {
  deal: UnifiedDeal;
}

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
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "default":
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
    case "default": return "Default";
    case "paid_off": return "Paid Off";
    default: return "Unknown";
  }
}

function comingSoon() {
  showInfo("Coming soon");
}

export function ServicingTab({ deal }: ServicingTabProps) {
  const maturityInfo = useMemo(() => getMaturityInfo(deal), [deal]);
  const showNoteSale = deal.stage === "closed_pre_sale" || deal.stage === "closed_sold";

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
                <span className="font-medium num">{formatCurrency(deal.amount)}</span>
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
                <div className="text-sm font-medium">{deal.note_sold_to ?? "—"}</div>
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
            <Button variant="outline" size="sm" onClick={comingSoon} className="gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Record Payment
            </Button>
            <Button variant="outline" size="sm" onClick={comingSoon} className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Request Extension
            </Button>
            <Button variant="outline" size="sm" onClick={comingSoon} className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Initiate Payoff
            </Button>
            <Button variant="outline" size="sm" onClick={comingSoon} className="gap-1.5">
              <ArrowRightLeft className="h-3.5 w-3.5" />
              List for Sale
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
