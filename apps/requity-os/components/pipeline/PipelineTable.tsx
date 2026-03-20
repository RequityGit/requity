"use client";

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
  type UnifiedDeal,
  type UnifiedCardType,
  type StageConfig,
  CARD_TYPE_SHORT_LABELS,
  CAPITAL_SIDE_COLORS,
  ASSET_CLASS_LABELS,
  type AssetClass,
  formatCurrency,
  daysInStage,
  getAlertLevel,
} from "./pipeline-types";

interface PipelineTableProps {
  deals: UnifiedDeal[];
  cardTypes: UnifiedCardType[];
  stageConfigs: StageConfig[];
  onDealClick: (deal: UnifiedDeal) => void;
}

export function PipelineTable({
  deals,
  cardTypes,
  stageConfigs,
  onDealClick,
}: PipelineTableProps) {
  const cardTypeMap = new Map(cardTypes.map((ct) => [ct.id, ct]));
  const stageConfigMap = new Map(stageConfigs.map((sc) => [sc.stage, sc]));

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
            <TableHead className="text-right">Days</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No deals found
              </TableCell>
            </TableRow>
          ) : (
            [...deals]
              .sort((a, b) => (b.amount ?? -Infinity) - (a.amount ?? -Infinity))
              .map((deal) => {
              const ct = cardTypeMap.get(deal.card_type_id);
              if (!ct) return null;
              const days = daysInStage(deal.stage_entered_at);
              const alertLevel = getAlertLevel(days, stageConfigMap.get(deal.stage));

              return (
                <TableRow
                  key={deal.id}
                  className="cursor-pointer hover:bg-muted/50"
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
                      {CARD_TYPE_SHORT_LABELS[ct.slug] ?? ct.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {deal.asset_class
                      ? ASSET_CLASS_LABELS[deal.asset_class as AssetClass]
                      : "--"}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium num">
                    {formatCurrency(deal.amount)}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs capitalize">{deal.stage}</span>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right text-sm num",
                      alertLevel === "alert" && "text-[#B23225] font-medium",
                      alertLevel === "warn" && "text-[#B8822A]"
                    )}
                  >
                    {days}d
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
