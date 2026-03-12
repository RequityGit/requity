"use client";

import { useState, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { StageStepper } from "./StageStepper";
import { UnderwritingPanel } from "./UnderwritingPanel";
import {
  advanceStageAction,
  addDealNoteAction,
} from "@/app/(authenticated)/admin/pipeline-v2/actions";
import {
  type UnifiedDeal,
  type UnifiedCardType,
  type DealActivity,
  STAGES,
  CARD_TYPE_SHORT_LABELS,
  CAPITAL_SIDE_COLORS,
  ASSET_CLASS_LABELS,
  type AssetClass,
  formatCurrency,
} from "./pipeline-types";
import { toast } from "sonner";

interface DealDrawerProps {
  deal: UnifiedDeal | null;
  cardType: UnifiedCardType | null;
  activities: DealActivity[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DealDrawer({
  deal,
  cardType,
  activities,
  open,
  onOpenChange,
}: DealDrawerProps) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [noteText, setNoteText] = useState("");
  const [advancing, startAdvance] = useTransition();
  const [addingNote, startAddNote] = useTransition();

  if (!deal || !cardType) return null;

  const currentStageIndex = STAGES.findIndex((s) => s.key === deal.stage);
  const nextStage = STAGES[currentStageIndex + 1];

  function handleAdvanceStage() {
    if (!nextStage || !deal) return;
    startAdvance(async () => {
      const result = await advanceStageAction(deal.id, nextStage.key);
      if (result.error) {
        toast.error(`Cannot advance: ${result.error}`);
      } else {
        toast.success(`Advanced to ${nextStage.label}`);
      }
    });
  }

  function handleAddNote() {
    if (!noteText.trim() || !deal) return;
    startAddNote(async () => {
      const result = await addDealNoteAction(deal.id, noteText.trim());
      if (result.error) {
        toast.error(`Failed to add note: ${result.error}`);
      } else {
        setNoteText("");
        toast.success("Note added");
      }
    });
  }

  const tabs = cardType.detail_tabs;

  // Build UW field groups for overview
  const uwFieldMap = new Map(cardType.uw_fields.map((f) => [f.key, f]));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[640px] p-0 flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b space-y-3">
          <SheetHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <SheetTitle className="text-lg">{deal.name}</SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  {deal.deal_number && (
                    <span className="text-xs text-muted-foreground num">
                      {deal.deal_number}
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      CAPITAL_SIDE_COLORS[deal.capital_side]
                    )}
                  >
                    {CARD_TYPE_SHORT_LABELS[cardType.slug] ?? cardType.label}
                  </Badge>
                  {deal.asset_class && (
                    <span className="text-xs text-muted-foreground">
                      {ASSET_CLASS_LABELS[deal.asset_class as AssetClass]}
                    </span>
                  )}
                </div>
              </div>
              {deal.amount != null && (
                <span className="text-lg font-semibold num shrink-0">
                  {formatCurrency(deal.amount)}
                </span>
              )}
            </div>
          </SheetHeader>
          <StageStepper currentStage={deal.stage} />
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-6 border-b">
            <TabsList className="h-auto p-0 bg-transparent gap-0">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-xs"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              {/* Overview Tab */}
              <TabsContent value="Overview" className="mt-0 space-y-6">
                {cardType.detail_field_groups.map((group) => (
                  <div key={group.label} className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {group.fields.map((fieldKey) => {
                        const fieldDef = uwFieldMap.get(fieldKey);
                        const value = deal.uw_data[fieldKey];
                        return (
                          <div key={fieldKey}>
                            <p className="text-xs text-muted-foreground">
                              {fieldDef?.label ?? fieldKey}
                            </p>
                            <p className="text-sm num">
                              {formatFieldValue(value, fieldDef?.type)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

              </TabsContent>

              {/* Underwriting Tab */}
              <TabsContent value="Underwriting" className="mt-0">
                <UnderwritingPanel
                  cardType={cardType}
                  dealId={deal.id}
                  uwData={deal.uw_data}
                />
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="Activity" className="mt-0 space-y-4">
                {activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No activity yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activities.map((a) => (
                      <div
                        key={a.id}
                        className="flex gap-3 text-sm border-l-2 border-border pl-4 py-1"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{a.title}</p>
                          {a.description && (
                            <p className="text-muted-foreground mt-0.5">
                              {a.description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap num">
                          {new Date(a.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="Notes" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddNote}
                      disabled={!noteText.trim() || addingNote}
                    >
                      {addingNote ? "Adding..." : "Add Note"}
                    </Button>
                  </div>
                </div>
                {activities
                  .filter((a) => a.activity_type === "note")
                  .map((a) => (
                    <div key={a.id} className="rounded-md border p-3 text-sm">
                      <p>{a.description}</p>
                      <p className="text-xs text-muted-foreground mt-2 num">
                        {new Date(a.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
              </TabsContent>

              {/* Tasks Tab */}
              <TabsContent value="Tasks" className="mt-0">
                <p className="text-sm text-muted-foreground py-4">
                  Tasks feature coming soon.
                </p>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="Documents" className="mt-0">
                <p className="text-sm text-muted-foreground py-4">
                  Documents feature coming soon.
                </p>
              </TabsContent>

              {/* Due Diligence Tab (Equity) */}
              <TabsContent value="Due Diligence" className="mt-0">
                <p className="text-sm text-muted-foreground py-4">
                  Due diligence tracking coming soon.
                </p>
              </TabsContent>

              {/* Investors Tab (Equity) */}
              <TabsContent value="Investors" className="mt-0">
                <p className="text-sm text-muted-foreground py-4">
                  Investor allocation coming soon.
                </p>
              </TabsContent>

              {/* Draw Schedule Tab (RTL) */}
              <TabsContent value="Draw Schedule" className="mt-0">
                <p className="text-sm text-muted-foreground py-4">
                  Draw schedule coming soon.
                </p>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        {/* Bottom bar */}
        {nextStage && deal.stage !== "closed" && (
          <div className="p-4 border-t flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => {
              setActiveTab("Notes");
            }}>
              Add Note
            </Button>
            <Button
              size="sm"
              onClick={handleAdvanceStage}
              disabled={advancing}
            >
              {advancing
                ? "Advancing..."
                : `Advance to ${nextStage.label}`}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function formatFieldValue(
  value: unknown,
  type?: string
): string {
  if (value == null || value === "") return "--";
  if (type === "currency" && typeof value === "number")
    return formatCurrency(value);
  if (type === "percent" && typeof value === "number")
    return `${Number(value).toFixed(2)}%`;
  if (type === "boolean") return value ? "Yes" : "No";
  return String(value).replace(/_/g, " ");
}
