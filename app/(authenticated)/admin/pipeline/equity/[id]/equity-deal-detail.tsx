"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  EditSectionDialog,
  type SectionField,
} from "@/app/(authenticated)/admin/deals/[id]/EditSectionDialog";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import {
  EQUITY_STAGE_LABELS,
  EQUITY_DEAL_SOURCES,
  PROPERTY_TYPE_OPTIONS,
  EQUITY_LOSS_REASONS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Clock,
  Building2,
  Pencil,
  Zap,
  ArrowRight,
  FileText,
  Phone,
  Mail,
  XCircle,
  CalendarDays,
  Users,
  FlaskConical,
  BarChart3,
  FolderOpen,
  ScrollText,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Check,
  Loader2,
} from "lucide-react";
import {
  updateEquityDealField,
  updatePropertyField,
  advanceEquityStage,
  markEquityDealLost,
  saveCommercialUnderwriting,
} from "./actions";
import { EquityDealTasksTab } from "./equity-deal-tasks-tab";
import type { EquityDealTask, TaskProfile } from "./equity-deal-tasks-tab";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Equity pipeline stages (excluding closed_lost) ───
const EQUITY_STAGES = [
  { key: "new_deals", label: "New Deals" },
  { key: "underwritten_needs_review", label: "Underwritten Needs Review" },
  { key: "offer_placed", label: "Offer Placed" },
  { key: "under_contract", label: "Under Contract" },
  { key: "closed_won", label: "Closed Won" },
] as const;

interface EquityDealDetailProps {
  deal: any;
  property: any;
  tasks: any[];
  stageHistory: any[];
  equityUw: any;
  commercialUw: any;
  pipelineData: any;
  assignedToProfile: { full_name: string | null; id: string } | null;
  adminProfiles: TaskProfile[];
  currentUserId: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function cap(val: string | null | undefined): string {
  if (!val) return "—";
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function daysAgo(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function toOptions(arr: readonly { value: string; label: string }[]) {
  return arr.map((i) => ({ value: i.value, label: i.label }));
}

export function EquityDealDetail({
  deal: initialDeal,
  property: initialProperty,
  tasks,
  stageHistory,
  equityUw,
  commercialUw: initialCommercialUw,
  pipelineData,
  assignedToProfile,
  adminProfiles,
  currentUserId,
}: EquityDealDetailProps) {
  const router = useRouter();
  const [deal, setDeal] = useState(initialDeal);
  const [property, setProperty] = useState(initialProperty);
  const [uwData, setUwData] = useState<Record<string, any>>(
    initialCommercialUw ?? {}
  );
  const [uwSaving, setUwSaving] = useState(false);

  const [editDealOpen, setEditDealOpen] = useState(false);
  const [editPropertyOpen, setEditPropertyOpen] = useState(false);
  const [editNotesOpen, setEditNotesOpen] = useState(false);

  // Stage advancement
  const [advancing, setAdvancing] = useState(false);
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [lossReason, setLossReason] = useState("");
  const [markingLost, setMarkingLost] = useState(false);

  const completedTasks = tasks.filter(
    (t: any) => t.status === "completed"
  ).length;
  const totalTasks = tasks.length;

  const daysInStage =
    pipelineData?.days_in_stage ?? daysAgo(deal.stage_changed_at);

  const propertyAddress = property
    ? [property.address_line1, property.city, property.state, property.zip]
        .filter(Boolean)
        .join(", ")
    : null;

  const dealName =
    deal.deal_name ||
    property?.address_line1 ||
    propertyAddress?.split(",")[0] ||
    "Untitled Deal";

  // Find current stage index and next stage
  const currentStageIdx = EQUITY_STAGES.findIndex(
    (s) => s.key === deal.stage
  );
  const nextStage =
    currentStageIdx >= 0 && currentStageIdx < EQUITY_STAGES.length - 1
      ? EQUITY_STAGES[currentStageIdx + 1]
      : null;

  const isClosedLost = deal.stage === "closed_lost";

  // ─── Handlers ───

  const handleSaveDeal = useCallback(
    async (
      field: string,
      value: string | number | null
    ): Promise<boolean> => {
      const result = await updateEquityDealField(deal.id, { [field]: value });
      if (result.error) {
        console.error("Failed to update equity deal field:", result.error);
        return false;
      }
      setDeal((prev: any) => ({ ...prev, [field]: value }));
      router.refresh();
      return true;
    },
    [deal.id, router]
  );

  const handleSaveProperty = useCallback(
    async (
      table: string,
      id: string,
      field: string,
      value: string | number | null
    ): Promise<boolean> => {
      if (table !== "properties" || !id) return false;
      const result = await updatePropertyField(id, { [field]: value });
      if (result.error) {
        console.error("Failed to update property field:", result.error);
        return false;
      }
      setProperty((prev: any) => (prev ? { ...prev, [field]: value } : prev));
      router.refresh();
      return true;
    },
    [router]
  );

  const handleAdvanceStage = useCallback(async () => {
    if (!nextStage || advancing) return;
    setAdvancing(true);
    try {
      const result = await advanceEquityStage(
        deal.id,
        deal.stage,
        nextStage.key,
        currentUserId
      );
      if (result.error) {
        console.error("Advance stage error:", result.error);
      } else {
        router.refresh();
      }
    } finally {
      setAdvancing(false);
    }
  }, [deal.id, deal.stage, nextStage, advancing, currentUserId, router]);

  const handleMarkLost = useCallback(async () => {
    if (!lossReason || markingLost) return;
    setMarkingLost(true);
    try {
      const result = await markEquityDealLost(
        deal.id,
        lossReason,
        currentUserId
      );
      if (result.error) {
        console.error("Mark lost error:", result.error);
      } else {
        setLostDialogOpen(false);
        setLossReason("");
        router.refresh();
      }
    } finally {
      setMarkingLost(false);
    }
  }, [deal.id, lossReason, markingLost, currentUserId, router]);

  const handleSaveUw = useCallback(async () => {
    setUwSaving(true);
    try {
      const result = await saveCommercialUnderwriting(deal.id, uwData);
      if (result.error) {
        console.error("Save UW error:", result.error);
      } else {
        router.refresh();
      }
    } finally {
      setUwSaving(false);
    }
  }, [deal.id, uwData, router]);

  const updateUwField = (field: string, value: any) => {
    setUwData((prev) => ({ ...prev, [field]: value }));
  };

  // ─── Field definitions ───

  const dealFields: SectionField[] = [
    { label: "Deal Name", fieldName: "deal_name", fieldType: "text", value: deal.deal_name },
    { label: "Deal Number", fieldName: "deal_number", fieldType: "readonly", value: deal.deal_number },
    { label: "Source", fieldName: "source", fieldType: "select", options: toOptions(EQUITY_DEAL_SOURCES), value: deal.source },
    { label: "Asking Price", fieldName: "asking_price", fieldType: "currency", value: deal.asking_price },
    { label: "Offer Price", fieldName: "offer_price", fieldType: "currency", value: deal.offer_price },
    { label: "Purchase Price", fieldName: "purchase_price", fieldType: "currency", value: deal.purchase_price },
    { label: "Target IRR", fieldName: "target_irr", fieldType: "percent", value: deal.target_irr },
    { label: "Expected Close", fieldName: "expected_close_date", fieldType: "text", value: deal.expected_close_date },
    { label: "Actual Close", fieldName: "actual_close_date", fieldType: "text", value: deal.actual_close_date },
  ];

  const propertyFields: SectionField[] = property
    ? [
        { label: "Address", fieldName: "address_line1", fieldType: "text" as const, value: property.address_line1, relatedTable: "properties", relatedId: property.id },
        { label: "City", fieldName: "city", fieldType: "text" as const, value: property.city, relatedTable: "properties", relatedId: property.id },
        { label: "State", fieldName: "state", fieldType: "text" as const, value: property.state, relatedTable: "properties", relatedId: property.id },
        { label: "Zip", fieldName: "zip", fieldType: "text" as const, value: property.zip, relatedTable: "properties", relatedId: property.id },
        { label: "Asset Type", fieldName: "asset_type", fieldType: "text" as const, value: property.asset_type, relatedTable: "properties", relatedId: property.id },
        { label: "Property Type", fieldName: "property_type", fieldType: "select" as const, options: toOptions(PROPERTY_TYPE_OPTIONS), value: property.property_type, relatedTable: "properties", relatedId: property.id },
        { label: "Units", fieldName: "number_of_units", fieldType: "number" as const, value: property.number_of_units, relatedTable: "properties", relatedId: property.id },
        { label: "Lot Size (acres)", fieldName: "lot_size_acres", fieldType: "number" as const, value: property.lot_size_acres, relatedTable: "properties", relatedId: property.id },
      ]
    : [];

  const notesFields: SectionField[] = [
    { label: "Investment Thesis", fieldName: "investment_thesis", fieldType: "text", value: deal.investment_thesis },
    { label: "Value-Add Strategy", fieldName: "value_add_strategy", fieldType: "text", value: deal.value_add_strategy },
    { label: "General Notes", fieldName: "notes", fieldType: "text", value: deal.notes },
    { label: "Internal Notes", fieldName: "internal_notes", fieldType: "text", value: deal.internal_notes },
  ];

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <nav className="mb-3 flex items-center gap-1.5 text-[13px] text-muted-foreground font-medium">
        <Link
          href="/admin/pipeline"
          className="no-underline hover:underline text-foreground"
        >
          Pipeline
        </Link>
        <ChevronRight size={14} strokeWidth={1.5} className="text-muted-foreground" />
        <Link
          href="/admin/pipeline/equity"
          className="no-underline hover:underline text-foreground"
        >
          Equity
        </Link>
        <ChevronRight size={14} strokeWidth={1.5} className="text-muted-foreground" />
        <span>{deal.deal_number || deal.id?.slice(0, 8)}</span>
      </nav>

      <div className="max-w-[1400px] mx-auto">
        {/* ─── Header ─── */}
        <div className="flex items-start justify-between gap-5 mb-5">
          <div className="flex gap-3.5 items-center">
            <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center">
              <Building2 size={20} strokeWidth={1.5} className="text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className="text-xl md:text-2xl font-bold tracking-[-0.04em] text-foreground m-0">
                  {dealName}
                </h1>
                <Badge variant="info" className="text-[11px]">
                  EQUITY
                </Badge>
                {isClosedLost ? (
                  <StatusBadge status="closed_lost" />
                ) : (
                  <StatusBadge status={deal.stage} />
                )}
                {!isClosedLost && (
                  <Badge variant="success" className="text-[11px]">
                    OPPORTUNITY
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                {propertyAddress && <span>{propertyAddress}</span>}
                {propertyAddress && <span className="text-muted-foreground/50">·</span>}
                <Clock size={13} strokeWidth={1.5} />
                <span className="num">{daysInStage} days in stage</span>
              </div>
            </div>
          </div>
          {assignedToProfile && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-[0.05em]">
                Assigned To
              </span>
              <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold">
                {getInitials(assignedToProfile.full_name ?? "")}
              </div>
              <span className="text-[13px] text-foreground font-medium">
                {assignedToProfile.full_name ?? "Unknown"}
              </span>
            </div>
          )}
        </div>

        {/* ─── Stage Progress (LoanStageTracker pattern) ─── */}
        <Card className="mb-5">
          <CardContent className="py-5 px-7">
            {/* Desktop: horizontal */}
            <div className="hidden md:block">
              <div className="flex items-center">
                {EQUITY_STAGES.map((s, i) => {
                  const isPast = currentStageIdx >= 0 && i < currentStageIdx;
                  const isCurrent = i === currentStageIdx;

                  return (
                    <div key={s.key} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors",
                            isPast && "bg-green-600 border-green-600 text-white",
                            isCurrent && "bg-primary border-primary text-primary-foreground",
                            !isPast && !isCurrent && "bg-background border-border text-muted-foreground"
                          )}
                        >
                          {isPast ? <Check className="h-4 w-4" /> : i + 1}
                        </div>
                        <span
                          className={cn(
                            "text-[10px] mt-1.5 text-center leading-tight max-w-[120px]",
                            isCurrent
                              ? "font-semibold text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {s.label}
                        </span>
                      </div>
                      {i < EQUITY_STAGES.length - 1 && (
                        <div
                          className={cn(
                            "flex-1 h-0.5 mx-1.5 mb-6",
                            isPast ? "bg-green-600" : "bg-border"
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Mobile: vertical */}
            <div className="md:hidden">
              <div className="space-y-0">
                {EQUITY_STAGES.map((s, i) => {
                  const isPast = currentStageIdx >= 0 && i < currentStageIdx;
                  const isCurrent = i === currentStageIdx;
                  return (
                    <div key={s.key}>
                      <div className="flex items-center gap-3 py-1.5">
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium border-2 transition-colors flex-shrink-0",
                            isPast && "bg-green-600 border-green-600 text-white",
                            isCurrent && "bg-primary border-primary text-primary-foreground",
                            !isPast && !isCurrent && "bg-background border-border text-muted-foreground"
                          )}
                        >
                          {isPast ? <Check className="h-3.5 w-3.5" /> : i + 1}
                        </div>
                        <span
                          className={cn(
                            "text-sm",
                            isCurrent ? "font-semibold text-foreground" : isPast ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {s.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] text-primary font-medium ml-auto">
                            In Progress
                          </span>
                        )}
                      </div>
                      {i < EQUITY_STAGES.length - 1 && (
                        <div
                          className={cn(
                            "w-0.5 h-3 ml-[13px]",
                            isPast ? "bg-green-600" : "bg-border"
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── KPI Row ─── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-5">
          <KpiCard
            title="Asking Price"
            value={deal.asking_price ? formatCurrency(deal.asking_price) : "TBD"}
          />
          <KpiCard
            title="Offer Price"
            value={deal.offer_price ? formatCurrency(deal.offer_price) : "TBD"}
          />
          <KpiCard
            title="Target IRR"
            value={deal.target_irr != null ? formatPercent(deal.target_irr) : "TBD"}
          />
          <KpiCard
            title="Equity Multiple"
            value={
              equityUw?.equity_multiple != null
                ? `${equityUw.equity_multiple.toFixed(2)}x`
                : "—"
            }
          />
          <KpiCard
            title="Going-In Cap"
            value={
              equityUw?.going_in_cap_rate != null
                ? formatPercent(equityUw.going_in_cap_rate)
                : "—"
            }
          />
          <KpiCard
            title="Tasks"
            value={`${completedTasks}/${totalTasks}`}
          />
        </div>

        {/* ─── Tabs + Content ─── */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-5">
            <TabsTrigger value="overview" className="gap-1.5">
              <ScrollText size={15} strokeWidth={1.5} />
              Overview
            </TabsTrigger>
            <TabsTrigger value="underwriting" className="gap-1.5">
              <FlaskConical size={15} strokeWidth={1.5} />
              Underwriting
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1.5">
              <FolderOpen size={15} strokeWidth={1.5} />
              Documents
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1.5">
              <ScrollText size={15} strokeWidth={1.5} />
              Tasks
              <span className="text-[10px] num text-muted-foreground">
                {completedTasks}/{totalTasks}
              </span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <BarChart3 size={15} strokeWidth={1.5} />
              Activity
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-1.5 relative">
              <MessageSquare size={15} strokeWidth={1.5} />
              Comments
              <span
                className="inline-flex items-center justify-center rounded-full px-[7px] text-[10px] font-bold text-white min-w-[20px] h-[17px]"
                style={{ backgroundColor: "#F0719B" }}
              >
                0
              </span>
            </TabsTrigger>
          </TabsList>

          {/* ─── Main + Sidebar Grid ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
            {/* Left Column */}
            <div className="flex flex-col gap-4 min-w-0">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0 space-y-4">
                <OverviewTab
                  deal={deal}
                  property={property}
                  propertyAddress={propertyAddress}
                  onEditDeal={() => setEditDealOpen(true)}
                  onEditProperty={() => setEditPropertyOpen(true)}
                  onEditNotes={() => setEditNotesOpen(true)}
                  assignedToName={assignedToProfile?.full_name ?? null}
                />
              </TabsContent>

              {/* Underwriting Tab */}
              <TabsContent value="underwriting" className="mt-0">
                <UnderwritingTab
                  uwData={uwData}
                  equityUw={equityUw}
                  onFieldChange={updateUwField}
                  onSave={handleSaveUw}
                  saving={uwSaving}
                />
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="mt-0">
                <Card>
                  <CardContent className="py-12 text-center">
                    <FolderOpen size={28} strokeWidth={1.5} className="text-muted-foreground mx-auto mb-3" />
                    <p className="text-[13px] text-muted-foreground">
                      Document management — upload and organize deal files
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tasks Tab */}
              <TabsContent value="tasks" className="mt-0">
                <EquityDealTasksTab
                  initialTasks={tasks}
                  dealId={deal.id}
                  dealStage={deal.stage}
                  profiles={adminProfiles}
                  currentUserId={currentUserId}
                />
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="mt-0">
                <ActivityTab stageHistory={stageHistory} />
              </TabsContent>

              {/* Comments Tab */}
              <TabsContent value="comments" className="mt-0">
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare size={28} strokeWidth={1.5} className="text-muted-foreground mx-auto mb-3" />
                    <p className="text-[13px] text-muted-foreground">
                      Threaded comments on this deal
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>

            {/* ─── Right Sidebar ─── */}
            <div className="flex flex-col gap-4 sticky top-5">
              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap size={15} strokeWidth={1.5} className="text-muted-foreground" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col gap-0.5">
                    {nextStage && !isClosedLost && (
                      <button
                        onClick={handleAdvanceStage}
                        disabled={advancing}
                        className="flex w-full items-center gap-2.5 rounded-md border-0 bg-transparent px-2 py-2 text-left text-[13px] font-semibold text-primary cursor-pointer transition-colors hover:bg-muted"
                      >
                        {advancing ? (
                          <Loader2 size={15} strokeWidth={1.5} className="animate-spin" />
                        ) : (
                          <ArrowRight size={15} strokeWidth={1.5} />
                        )}
                        Advance to {nextStage.label}
                      </button>
                    )}
                    <SidebarAction icon={FileText} label="Term Sheet" />
                    <SidebarAction icon={Phone} label="Log Call" />
                    <SidebarAction icon={Mail} label="Send Email" />
                    {!isClosedLost && (
                      <button
                        onClick={() => setLostDialogOpen(true)}
                        className="flex w-full items-center gap-2.5 rounded-md border-0 bg-transparent px-2 py-2 text-left text-[13px] font-medium text-destructive cursor-pointer transition-colors hover:bg-muted"
                      >
                        <XCircle size={15} strokeWidth={1.5} />
                        Mark as Lost
                      </button>
                    )}
                    <SidebarAction icon={CalendarDays} label="Schedule Closing" />
                  </div>
                </CardContent>
              </Card>

              {/* Team */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users size={15} strokeWidth={1.5} className="text-muted-foreground" />
                    Team
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {assignedToProfile
                        ? getInitials(assignedToProfile.full_name ?? "")
                        : "?"}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-foreground">
                        {assignedToProfile?.full_name ?? "Unassigned"}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.04em]">
                        Assigned To
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Underwriting Model Indicator */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FlaskConical size={15} strokeWidth={1.5} className="text-muted-foreground" />
                    Underwriting Model
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-muted rounded-lg border border-border p-3">
                    <div className="text-xs font-semibold text-primary tracking-[0.03em]">
                      COMMERCIAL
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Active Model
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* UW Summary (visible alongside UW tab context) */}
              <UWSummaryCard equityUw={equityUw} />
            </div>
          </div>
        </Tabs>
      </div>

      {/* ─── Mark as Lost AlertDialog ─── */}
      <AlertDialog open={lostDialogOpen} onOpenChange={setLostDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Deal as Lost</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the deal to Closed Lost. Please select a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Select value={lossReason} onValueChange={setLossReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a loss reason..." />
              </SelectTrigger>
              <SelectContent>
                {EQUITY_LOSS_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkLost}
              disabled={!lossReason || markingLost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {markingLost && <Loader2 size={14} className="animate-spin mr-1.5" />}
              Mark as Lost
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Edit Dialogs ─── */}
      <EditSectionDialog
        open={editDealOpen}
        onOpenChange={setEditDealOpen}
        title="Deal Details"
        fields={dealFields}
        onSave={handleSaveDeal}
      />
      {property && (
        <EditSectionDialog
          open={editPropertyOpen}
          onOpenChange={setEditPropertyOpen}
          title="Property"
          fields={propertyFields}
          onSaveRelated={handleSaveProperty}
        />
      )}
      <EditSectionDialog
        open={editNotesOpen}
        onOpenChange={setEditNotesOpen}
        title="Notes & Strategy"
        fields={notesFields}
        onSave={handleSaveDeal}
      />
    </div>
  );
}

// ─── Sidebar Action Button ───
function SidebarAction({
  icon: Icon,
  label,
}: {
  icon: typeof FileText;
  label: string;
}) {
  return (
    <button className="flex w-full items-center gap-2.5 rounded-md border-0 bg-transparent px-2 py-2 text-left text-[13px] font-medium text-foreground cursor-pointer transition-colors hover:bg-muted">
      <Icon size={15} strokeWidth={1.5} className="text-muted-foreground" />
      {label}
    </button>
  );
}

// ─── Overview Tab ───
function OverviewTab({
  deal,
  property,
  propertyAddress,
  onEditDeal,
  onEditProperty,
  onEditNotes,
  assignedToName,
}: {
  deal: any;
  property: any;
  propertyAddress: string | null;
  onEditDeal: () => void;
  onEditProperty: () => void;
  onEditNotes: () => void;
  assignedToName: string | null;
}) {
  return (
    <>
      {/* Deal Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText size={16} strokeWidth={1.5} className="text-muted-foreground" />
              Deal Details
            </CardTitle>
            <EditButton onClick={onEditDeal} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-7">
            <KVRow label="Deal Number" value={deal.deal_number} />
            <KVRow label="Source" value={cap(deal.source)} />
            <KVRow label="Assigned To" value={assignedToName ?? "Unassigned"} />
            <KVRow
              label="Purchase Price"
              value={deal.purchase_price ? formatCurrency(deal.purchase_price) : "—"}
              mono
            />
            <KVRow label="Expected Close" value={formatDate(deal.expected_close_date)} mono />
            <KVRow label="Actual Close" value={formatDate(deal.actual_close_date)} mono />
          </div>
        </CardContent>
      </Card>

      {/* Property */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 size={16} strokeWidth={1.5} className="text-muted-foreground" />
              Property
            </CardTitle>
            {property && <EditButton onClick={onEditProperty} />}
          </div>
        </CardHeader>
        <CardContent>
          {property ? (
            <div className="grid grid-cols-2 gap-x-7">
              <KVRow label="Address" value={property.address_line1 ?? "—"} />
              <KVRow label="City" value={property.city ?? "—"} />
              <KVRow label="State" value={property.state ?? "—"} />
              <KVRow label="Zip" value={property.zip ?? "—"} mono />
              <KVRow label="Property Type" value={cap(property.property_type)} />
              <KVRow label="Units" value={property.number_of_units ?? "—"} mono />
              <KVRow label="Asset Type" value={cap(property.asset_type)} />
              <KVRow label="Lot Size (Acres)" value={property.lot_size_acres ?? "—"} mono />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No property linked.</p>
          )}
        </CardContent>
      </Card>

      {/* Investment Thesis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp size={16} strokeWidth={1.5} className="text-muted-foreground" />
              Investment Thesis
            </CardTitle>
            <EditButton onClick={onEditNotes} />
          </div>
        </CardHeader>
        <CardContent>
          {deal.investment_thesis ? (
            <p className="text-sm whitespace-pre-wrap">{deal.investment_thesis}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No thesis added.</p>
          )}
        </CardContent>
      </Card>

      {/* Value-Add Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign size={16} strokeWidth={1.5} className="text-muted-foreground" />
            Value-Add Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deal.value_add_strategy ? (
            <p className="text-sm whitespace-pre-wrap">{deal.value_add_strategy}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No strategy added.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Underwriting Tab ───
function UnderwritingTab({
  uwData,
  equityUw,
  onFieldChange,
  onSave,
  saving,
}: {
  uwData: Record<string, any>;
  equityUw: any;
  onFieldChange: (field: string, value: any) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical size={18} strokeWidth={1.5} className="text-muted-foreground" />
            Commercial Underwriting Model
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={onSave} disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin mr-1.5" />}
              Save Underwriting
            </Button>
            <Button variant="outline">Export PDF</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UWSection
            title="Revenue & Income (T-12)"
            colorClass="text-green-500"
            fields={[
              { label: "T-12 GPI", key: "t12_gpi", type: "currency" },
              { label: "Current Lease Income", key: "current_lease_income", type: "currency" },
              { label: "Stabilized Lease Income", key: "stabilized_lease_income", type: "currency" },
              { label: "Current Occupancy Revenue", key: "current_occupancy_revenue", type: "currency" },
              { label: "Stabilized Occupancy Revenue", key: "stabilized_occupancy_revenue", type: "currency" },
              { label: "Current Ancillary Income", key: "current_ancillary_income", type: "currency" },
              { label: "Stabilized Ancillary Income", key: "stabilized_ancillary_income", type: "currency" },
              { label: "T-12 Vacancy %", key: "t12_vacancy_pct", type: "percent" },
              { label: "Bad Debt %", key: "bad_debt_pct", type: "percent" },
            ]}
            data={uwData}
            onChange={onFieldChange}
          />
          <UWSection
            title="Operating Expenses (T-12)"
            colorClass="text-amber-500"
            fields={[
              { label: "Management Fee", key: "t12_mgmt_fee", type: "currency" },
              { label: "Real Estate Taxes", key: "t12_taxes", type: "currency" },
              { label: "Insurance", key: "t12_insurance", type: "currency" },
              { label: "Utilities", key: "t12_utilities", type: "currency" },
              { label: "Repairs & Maintenance", key: "t12_repairs", type: "currency" },
              { label: "Contract Services", key: "t12_contract_services", type: "currency" },
              { label: "Payroll", key: "t12_payroll", type: "currency" },
              { label: "Marketing", key: "t12_marketing", type: "currency" },
              { label: "G&A", key: "t12_ga", type: "currency" },
              { label: "Replacement Reserves", key: "t12_replacement_reserve", type: "currency" },
            ]}
            data={uwData}
            onChange={onFieldChange}
          />
          <UWSection
            title="Return Metrics"
            colorClass="text-blue-500"
            fields={[
              { label: "NOI (Year 1)", key: "noi_year1", type: "currency", readOnly: true },
              { label: "NOI (Stabilized)", key: "noi_stabilized", type: "currency", readOnly: true },
              { label: "Going-In Cap Rate", key: "going_in_cap_rate", type: "percent", readOnly: true },
              { label: "Stabilized Cap Rate", key: "stabilized_cap_rate", type: "percent", readOnly: true },
              { label: "Exit Cap Rate", key: "exit_cap_rate", type: "percent", readOnly: true },
              { label: "Levered IRR", key: "levered_irr", type: "percent", readOnly: true },
              { label: "Unlevered IRR", key: "unlevered_irr", type: "percent", readOnly: true },
              { label: "Equity Multiple", key: "equity_multiple", type: "number", readOnly: true },
              { label: "Cash-on-Cash", key: "cash_on_cash", type: "percent", readOnly: true },
            ]}
            data={equityUw ?? {}}
            onChange={() => {}}
          />
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UWSection
            title="Bridge Financing"
            colorClass="text-red-500"
            fields={[
              { label: "Loan Amount", key: "bridge_loan_amount", type: "currency" },
              { label: "Term (Months)", key: "bridge_term_months", type: "number" },
              { label: "Interest Rate", key: "bridge_rate", type: "percent" },
              { label: "Amortization (Months)", key: "bridge_amortization_months", type: "number" },
              { label: "IO Period (Months)", key: "bridge_io_months", type: "number" },
              { label: "Origination Points", key: "bridge_origination_pts", type: "percent" },
            ]}
            data={uwData}
            onChange={onFieldChange}
          />
          <UWSection
            title="Exit Financing"
            colorClass="text-muted-foreground"
            fields={[
              { label: "Exit Loan Amount", key: "exit_loan_amount", type: "currency" },
              { label: "Exit Rate", key: "exit_rate", type: "percent" },
              { label: "Amortization (Years)", key: "exit_amortization_years", type: "number" },
              { label: "IO Months", key: "exit_io_months", type: "number" },
              { label: "Exit Lender", key: "exit_lender_name", type: "text" },
            ]}
            data={uwData}
            onChange={onFieldChange}
          />
          <UWSection
            title="Growth Assumptions (Yr 1-5)"
            colorClass="text-purple-400"
            fields={[
              { label: "Rent Growth Yr1", key: "rent_growth_yr1", type: "percent" },
              { label: "Rent Growth Yr2", key: "rent_growth_yr2", type: "percent" },
              { label: "Rent Growth Yr3", key: "rent_growth_yr3", type: "percent" },
              { label: "Expense Growth Yr1", key: "expense_growth_yr1", type: "percent" },
              { label: "Expense Growth Yr2", key: "expense_growth_yr2", type: "percent" },
              { label: "Expense Growth Yr3", key: "expense_growth_yr3", type: "percent" },
              { label: "Stabilized Vacancy %", key: "stabilized_vacancy_pct", type: "percent" },
              { label: "Disposition Cost %", key: "disposition_cost_pct", type: "percent" },
            ]}
            data={uwData}
            onChange={onFieldChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── UW Section ───
interface UWField {
  label: string;
  key: string;
  type: "currency" | "percent" | "number" | "text";
  readOnly?: boolean;
}

function UWSection({
  title,
  colorClass,
  fields,
  data,
  onChange,
}: {
  title: string;
  colorClass: string;
  fields: UWField[];
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
}) {
  const formatDisplay = (val: any, type: string) => {
    if (val == null || val === "") return "—";
    const n = Number(val);
    if (isNaN(n)) return String(val);
    if (type === "currency") return formatCurrency(n);
    if (type === "percent") return formatPercent(n);
    return String(val);
  };

  return (
    <div className="bg-muted/50 rounded-lg border border-border p-4">
      <div className={cn("text-xs font-semibold mb-3 tracking-[0.02em]", colorClass)}>
        {title}
      </div>
      {fields.map((f) => (
        <div
          key={f.key}
          className="flex justify-between items-center py-[7px] border-b border-border last:border-0"
        >
          <span className="text-xs text-muted-foreground">{f.label}</span>
          {f.readOnly ? (
            <span className="text-xs font-medium num text-foreground">
              {formatDisplay(data[f.key], f.type)}
            </span>
          ) : (
            <Input
              type={f.type === "text" ? "text" : "number"}
              value={data[f.key] ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                onChange(
                  f.key,
                  f.type === "text"
                    ? v
                    : v === ""
                      ? null
                      : Number(v)
                );
              }}
              className="w-28 h-7 text-xs text-right num"
              step={f.type === "percent" ? "0.01" : f.type === "currency" ? "1" : "1"}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Activity Tab ───
function ActivityTab({ stageHistory }: { stageHistory: any[] }) {
  if (stageHistory.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ScrollText size={28} strokeWidth={1.5} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-[13px] text-muted-foreground">
            No activity recorded yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <ScrollText size={16} strokeWidth={1.5} className="text-muted-foreground" />
          Stage History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stageHistory.map((entry: any) => (
            <div key={entry.id} className="flex items-center gap-3 text-sm">
              <span className="num text-xs text-muted-foreground w-24 shrink-0">
                {formatDate(entry.changed_at)}
              </span>
              <StatusBadge status={entry.from_stage} />
              <span className="text-muted-foreground">→</span>
              <StatusBadge status={entry.to_stage} />
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
  );
}

// ─── UW Summary Sidebar Card ───
function UWSummaryCard({ equityUw }: { equityUw: any }) {
  const rows: [string, any, boolean?][] = [
    ["Status", equityUw?.status ?? "draft", true],
    ["Going-In Cap", equityUw?.going_in_cap_rate != null ? formatPercent(equityUw.going_in_cap_rate) : "—"],
    ["Stabilized Cap", equityUw?.stabilized_cap_rate != null ? formatPercent(equityUw.stabilized_cap_rate) : "—"],
    ["Levered IRR", equityUw?.levered_irr != null ? formatPercent(equityUw.levered_irr) : "—"],
    ["Equity Multiple", equityUw?.equity_multiple != null ? `${equityUw.equity_multiple.toFixed(2)}x` : "—"],
    ["Total Project Cost", equityUw?.total_project_cost != null ? formatCurrency(equityUw.total_project_cost) : "—"],
    ["Equity Required", equityUw?.equity_required != null ? formatCurrency(equityUw.equity_required) : "—"],
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 size={15} strokeWidth={1.5} className="text-muted-foreground" />
          UW Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {rows.map(([label, value, isStatus]) => (
          <div
            key={label as string}
            className="flex justify-between py-1.5 border-b border-border last:border-0"
          >
            <span className="text-xs text-muted-foreground">{label as string}</span>
            <span
              className={cn(
                "text-xs font-medium num",
                isStatus ? "text-amber-500" : "text-foreground"
              )}
            >
              {value as string}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Key-Value Row ───
function KVRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
}) {
  const display = value != null && value !== "" ? String(value) : "—";
  return (
    <div className="flex justify-between py-2 border-b border-border">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className={cn("text-[13px] font-medium text-foreground", mono && "num")}>
        {display}
      </span>
    </div>
  );
}

// ─── Edit Button ───
function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer border border-border text-muted-foreground bg-transparent hover:bg-muted hover:text-foreground"
    >
      <Pencil size={12} strokeWidth={1.5} />
      Edit
    </button>
  );
}
