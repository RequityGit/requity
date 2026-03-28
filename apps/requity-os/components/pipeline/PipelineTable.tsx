"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatCompactCurrency,
  formatPercent,
  formatDateShort,
} from "@/lib/format";
import {
  type UnifiedDeal,
  type StageConfig,
  CAPITAL_SIDE_COLORS,
  ASSET_CLASS_LABELS,
  type AssetClass,
  formatCurrency,
  daysInStage,
  getAlertLevel,
  isServicingStage,
} from "./pipeline-types";
import { getDealDisplayConfig } from "@/lib/pipeline/deal-display-config";

interface PipelineTableProps {
  deals: UnifiedDeal[];
  stageConfigs: StageConfig[];
  onDealClick: (deal: UnifiedDeal) => void;
  showLossReason?: boolean;
}

function getNextPaymentColor(nextPaymentDue: string | null | undefined): string {
  if (!nextPaymentDue) return "";
  const [y, m, d] = nextPaymentDue.split("-").map(Number);
  const due = new Date(y!, m! - 1, d!);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((due.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return "text-red-600 dark:text-red-400 font-medium";
  if (diffDays <= 7) return "text-amber-600 dark:text-amber-400";
  return "";
}

function getMaturityDays(maturityDate: string | null | undefined): { days: number; color: string } | null {
  if (!maturityDate) return null;
  const [y, m, d] = maturityDate.split("-").map(Number);
  const mat = new Date(y!, m! - 1, d!);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.ceil((mat.getTime() - now.getTime()) / 86400000);
  let color = "";
  if (days < 30) color = "text-red-600 dark:text-red-400 font-bold";
  else if (days < 90) color = "text-amber-600 dark:text-amber-400";
  return { days, color };
}

const SERVICING_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  current: { label: "Current", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  delinquent: { label: "Delinquent", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  default: { label: "Default", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
  paid_off: { label: "Paid Off", className: "bg-muted text-muted-foreground border-border" },
};

export function PipelineTable({
  deals,
  stageConfigs,
  onDealClick,
  showLossReason,
}: PipelineTableProps) {
  const router = useRouter();
  const stageConfigMap = new Map(stageConfigs.map((sc) => [sc.stage, sc]));
  const totalCols = (showLossReason ? 7 : 6) + 6; // +6 for servicing columns

  return (
    <div className="rounded-md border mobile-scroll">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Deal</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Asset</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Stage</TableHead>
            {showLossReason && <TableHead>Loss Reason</TableHead>}
            <TableHead className="text-right">Days</TableHead>
            {/* Servicing columns */}
            <TableHead className="text-right">UPB</TableHead>
            <TableHead className="text-right">Rem. Draw</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead>Next Pmt</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Maturity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={totalCols} className="text-center text-muted-foreground py-8">
                No deals found
              </TableCell>
            </TableRow>
          ) : (
            [...deals]
              .sort((a, b) => (b.amount ?? -Infinity) - (a.amount ?? -Infinity))
              .map((deal) => {
              const dealConfig = getDealDisplayConfig(deal);
              const days = daysInStage(deal.stage_entered_at);
              const alertLevel = getAlertLevel(days, stageConfigMap.get(deal.stage));
              const servicing = isServicingStage(deal.stage);
              const maturityDate = deal.current_maturity_date ?? deal.maturity_date;
              const maturityInfo = servicing ? getMaturityDays(maturityDate) : null;
              const now = new Date();
              now.setHours(0, 0, 0, 0);

              // Flag badges (servicing deals only)
              const isPastDue = servicing && deal.next_payment_due && deal.servicing_status !== "paid_off" && (() => {
                const [y, m, d] = deal.next_payment_due!.split("-").map(Number);
                return new Date(y!, m! - 1, d!) < now;
              })();
              const isMatured = servicing && maturityDate && (() => {
                const [y, m, d] = maturityDate.split("-").map(Number);
                return new Date(y!, m! - 1, d!) < now;
              })();
              const isMaturingSoon = servicing && maturityInfo && !isMatured && maturityInfo.days <= 60;

              return (
                <TableRow
                  key={deal.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onPointerEnter={() =>
                    router.prefetch(`/pipeline/${deal.deal_number || deal.id}`)
                  }
                  onClick={() => onDealClick(deal)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{deal.name}</p>
                      {deal.deal_number && (
                        <p className="text-xs text-muted-foreground num">
                          {deal.deal_number}
                        </p>
                      )}
                      {/* Flag badges */}
                      {servicing && (isPastDue || isMatured || isMaturingSoon || deal._has_pending_draw) && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {isPastDue && (
                            <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              Past Due
                            </span>
                          )}
                          {isMatured && (
                            <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              Matured
                            </span>
                          )}
                          {isMaturingSoon && (
                            <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                              Maturing Soon
                            </span>
                          )}
                          {deal._has_pending_draw && (
                            <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              Draw Pending
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        CAPITAL_SIDE_COLORS[deal.capital_side]
                      )}
                    >
                      {dealConfig.shortLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {deal.asset_class
                      ? ASSET_CLASS_LABELS[deal.asset_class as AssetClass]
                      : "\u2014"}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium num">
                    {formatCurrency(deal.amount)}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs capitalize">{deal.stage}</span>
                  </TableCell>
                  {showLossReason && (
                    <TableCell className="max-w-[300px]">
                      <span className="text-xs text-muted-foreground line-clamp-2">
                        {deal.loss_reason || "\u2014"}
                      </span>
                    </TableCell>
                  )}
                  <TableCell
                    className={cn(
                      "text-right text-sm num",
                      alertLevel === "alert" && "text-[#B23225] font-medium",
                      alertLevel === "warn" && "text-[#B8822A]"
                    )}
                  >
                    {days}d
                  </TableCell>
                  {/* Servicing columns */}
                  <TableCell className="text-right text-sm num">
                    {servicing ? formatCompactCurrency(deal._upb) : "\u2014"}
                  </TableCell>
                  <TableCell className="text-right text-sm num">
                    {servicing
                      ? deal._remaining_draw == null
                        ? "\u2014"
                        : deal._remaining_draw === 0
                          ? <span className="text-muted-foreground">$0</span>
                          : formatCompactCurrency(deal._remaining_draw)
                      : "\u2014"}
                  </TableCell>
                  <TableCell className="text-right text-sm num">
                    {servicing && deal.interest_rate != null
                      ? formatPercent(deal.interest_rate)
                      : "\u2014"}
                  </TableCell>
                  <TableCell className={cn("text-sm", servicing ? getNextPaymentColor(deal.next_payment_due) : "")}>
                    {servicing && deal.next_payment_due
                      ? formatDateShort(deal.next_payment_due)
                      : "\u2014"}
                  </TableCell>
                  <TableCell>
                    {servicing && deal.servicing_status ? (() => {
                      const badge = SERVICING_STATUS_BADGE[deal.servicing_status] ?? { label: deal.servicing_status, className: "bg-muted text-muted-foreground border-border" };
                      return (
                        <Badge variant="outline" className={cn("text-[10px] font-semibold", badge.className)}>
                          {badge.label}
                        </Badge>
                      );
                    })() : "\u2014"}
                  </TableCell>
                  <TableCell className={cn("text-right text-sm num", maturityInfo?.color)}>
                    {servicing && maturityInfo
                      ? `${maturityInfo.days}d`
                      : "\u2014"}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
