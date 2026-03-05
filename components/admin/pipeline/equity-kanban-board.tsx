"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { EQUITY_LOSS_REASONS } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import { moveEquityStageAction } from "@/app/(authenticated)/admin/pipeline/actions";
import {
  GripVertical,
  Clock,
  User,
  Target,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { StageConfig } from "./unified-pipeline";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface EquityDealRow {
  id: string;
  deal_name: string;
  deal_number: string | null;
  stage: string;
  stage_changed_at: string | null;
  source: string | null;
  asking_price: number | null;
  offer_price: number | null;
  purchase_price: number | null;
  expected_close_date: string | null;
  actual_close_date: string | null;
  assigned_to: string | null;
  value_add_strategy: string | null;
  target_irr: number | null;
  investment_thesis: string | null;
  loss_reason: string | null;
  created_at: string;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  property_zip: string | null;
  asset_type: string | null;
  property_type: string | null;
  number_of_units: number | null;
  lot_size_acres: number | null;
  assigned_to_profile_id: string | null;
  completed_tasks: number | null;
  total_tasks: number | null;
  days_in_stage: number | null;
  underwriting_status: string | null;
  going_in_cap_rate: number | null;
  stabilized_cap_rate: number | null;
  levered_irr: number | null;
  equity_multiple: number | null;
  assigned_to_name?: string | null;
}

interface EquityKanbanBoardProps {
  stageConfigs: StageConfig[];
  deals: EquityDealRow[];
  view: "board" | "list";
}

export function EquityKanbanBoard({
  stageConfigs,
  deals: initialDeals,
  view,
}: EquityKanbanBoardProps) {
  const [deals, setDeals] = useState(initialDeals);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [deadDialog, setDeadDialog] = useState<{
    open: boolean;
    dealId: string;
  }>({ open: false, dealId: "" });
  const [lossReason, setLossReason] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const nonTerminalStages = stageConfigs.filter((s) => !s.is_terminal);
  const allStageKeys = nonTerminalStages.map((s) => s.stage_key);

  function getDaysInStage(changedAt: string | null): number {
    if (!changedAt) return 0;
    const diff = Date.now() - new Date(changedAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  function getDaysColor(days: number): string {
    if (days <= 7)
      return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300";
    if (days <= 21)
      return "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
    return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300";
  }

  function getDisplayPrice(deal: EquityDealRow): number | null {
    return deal.purchase_price || deal.offer_price || deal.asking_price;
  }

  // ── Stage Moves ───────────────────────────────────────────────────

  async function moveToStage(dealId: string, newStage: string) {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    if (newStage === "dead") {
      setDeadDialog({ open: true, dealId });
      return;
    }

    setMovingId(dealId);
    const result = await moveEquityStageAction(dealId, newStage);
    if (result.error) {
      toast({
        title: "Error moving deal",
        description: result.error,
        variant: "destructive",
      });
    } else {
      setDeals((prev) =>
        prev.map((d) =>
          d.id === dealId
            ? {
                ...d,
                stage: newStage,
                stage_changed_at: new Date().toISOString(),
              }
            : d
        )
      );
      const label =
        nonTerminalStages.find((s) => s.stage_key === newStage)?.label ||
        newStage;
      toast({ title: `Deal moved to ${label}` });
    }
    setMovingId(null);
  }

  async function handleMarkDead() {
    if (!lossReason) {
      toast({ title: "Loss reason required", variant: "destructive" });
      return;
    }
    setMovingId(deadDialog.dealId);
    const result = await moveEquityStageAction(
      deadDialog.dealId,
      "dead",
      lossReason
    );
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      setDeals((prev) =>
        prev.map((d) =>
          d.id === deadDialog.dealId ? { ...d, stage: "dead" } : d
        )
      );
      toast({ title: "Deal marked as Dead" });
    }
    setMovingId(null);
    setDeadDialog({ open: false, dealId: "" });
    setLossReason("");
  }

  // ── Drag & Drop ───────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, stage: string) {
    e.preventDefault();
    if (draggedId) {
      moveToStage(draggedId, stage);
    }
    setDraggedId(null);
  }

  // ── List View ─────────────────────────────────────────────────────

  if (view === "list") {
    return (
      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Deal
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Stage
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Asset Type
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Price
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Location
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Assigned
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  IRR
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Days
                </th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => {
                const days = getDaysInStage(deal.stage_changed_at);
                const price = getDisplayPrice(deal);
                const stageConfig = nonTerminalStages.find(
                  (s) => s.stage_key === deal.stage
                );
                return (
                  <tr
                    key={deal.id}
                    className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() =>
                      router.push(`/admin/equity-pipeline/${deal.id}`)
                    }
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground truncate max-w-[200px]">
                        {deal.deal_name || "Untitled"}
                      </p>
                      {deal.deal_number && (
                        <p className="text-[10px] text-muted-foreground">
                          {deal.deal_number}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${stageConfig?.color ?? "bg-slate-100 text-slate-800"}`}
                      >
                        {stageConfig?.label ?? deal.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {deal.asset_type || "—"}
                    </td>
                    <td className="px-4 py-3 text-right num text-foreground">
                      {price ? formatCurrency(price) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[150px]">
                      {[deal.property_city, deal.property_state]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {deal.assigned_to_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {deal.target_irr ? `${deal.target_irr}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${getDaysColor(days)}`}
                      >
                        {days}d
                      </span>
                    </td>
                  </tr>
                );
              })}
              {deals.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No deals found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Board View ────────────────────────────────────────────────────

  return (
    <>
      <div className="overflow-x-auto pb-4">
        <div
          className="flex gap-3"
          style={{ minWidth: `${nonTerminalStages.length * 240}px` }}
        >
          {nonTerminalStages.map((config) => {
            const stageDeals = deals.filter(
              (d) => d.stage === config.stage_key
            );
            const totalVolume = stageDeals.reduce(
              (sum, d) => sum + (getDisplayPrice(d) || 0),
              0
            );
            const stageIdx = allStageKeys.indexOf(config.stage_key);

            return (
              <div
                key={config.stage_key}
                className="flex-1 min-w-[230px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, config.stage_key)}
              >
                <div className="bg-muted rounded-lg p-3">
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">
                        {config.label}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {stageDeals.length}
                      </Badge>
                    </div>
                    {stageDeals.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatCurrency(totalVolume)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 min-h-[100px]">
                    {stageDeals.map((deal) => {
                      const canMoveLeft = stageIdx > 0;
                      const canMoveRight =
                        stageIdx < allStageKeys.length - 1;
                      const days = getDaysInStage(deal.stage_changed_at);
                      const isMoving = movingId === deal.id;
                      const price = getDisplayPrice(deal);
                      const taskProgress =
                        deal.total_tasks && deal.total_tasks > 0
                          ? `${deal.completed_tasks ?? 0}/${deal.total_tasks}`
                          : null;

                      return (
                        <Card
                          key={deal.id}
                          className={`cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all ${isMoving ? "opacity-50" : ""}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, deal.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-1">
                              <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() =>
                                  router.push(
                                    `/admin/equity-pipeline/${deal.id}`
                                  )
                                }
                              >
                                <p className="text-sm font-medium text-foreground truncate">
                                  {deal.deal_name || "Untitled Deal"}
                                </p>
                                {deal.deal_number && (
                                  <p className="text-[10px] text-muted-foreground">
                                    {deal.deal_number}
                                  </p>
                                )}
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs font-semibold text-foreground">
                                    {price ? formatCurrency(price) : "—"}
                                  </span>
                                  {deal.asset_type && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {deal.asset_type}
                                    </span>
                                  )}
                                </div>
                                {deal.property_city && (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {deal.property_city}
                                    {deal.property_state
                                      ? `, ${deal.property_state}`
                                      : ""}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span
                                    className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${getDaysColor(days)}`}
                                  >
                                    <Clock className="h-2.5 w-2.5" />
                                    {days}d
                                  </span>
                                  {taskProgress && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                      <CheckCircle2 className="h-2.5 w-2.5" />
                                      {taskProgress}
                                    </span>
                                  )}
                                  {deal.target_irr && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                      <Target className="h-2.5 w-2.5" />
                                      {deal.target_irr}% IRR
                                    </span>
                                  )}
                                </div>
                                {/* UW Metrics */}
                                {(deal.going_in_cap_rate ||
                                  deal.levered_irr) && (
                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                    {deal.going_in_cap_rate && (
                                      <span>
                                        Cap: {deal.going_in_cap_rate}%
                                      </span>
                                    )}
                                    {deal.levered_irr && (
                                      <span>IRR: {deal.levered_irr}%</span>
                                    )}
                                  </div>
                                )}
                                {deal.assigned_to_name && (
                                  <div className="flex items-center gap-1 mt-1.5">
                                    <User className="h-2.5 w-2.5 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground truncate">
                                      {deal.assigned_to_name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between mt-2 pt-2 border-t">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={!canMoveLeft || isMoving}
                                onClick={() =>
                                  moveToStage(
                                    deal.id,
                                    allStageKeys[stageIdx - 1]
                                  )
                                }
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={!canMoveRight || isMoving}
                                onClick={() =>
                                  moveToStage(
                                    deal.id,
                                    allStageKeys[stageIdx + 1]
                                  )
                                }
                              >
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dead Deal Dialog */}
      <Dialog
        open={deadDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeadDialog({ open: false, dealId: "" });
            setLossReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Deal as Dead</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Loss Reason *</label>
            <Select value={lossReason} onValueChange={setLossReason}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {EQUITY_LOSS_REASONS.map(
                  (r: { value: string; label: string }) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeadDialog({ open: false, dealId: "" });
                setLossReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleMarkDead}
              disabled={!lossReason}
            >
              Mark as Dead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
