"use client";

import React, { useState, useCallback, useTransition, useMemo, useEffect, lazy, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDateShort, formatCompactCurrency, formatPhoneNumber } from "@/lib/format";
import { getUserColor, colorVariants } from "@/lib/user-colors";
import { showSuccess, showError } from "@/lib/toast";
import {
  Layers,
  Phone,
  Mail,
  Shield,
  Users,
  Plus,
  Loader2,
  X,
  MoreHorizontal,
  ChevronDown,
  FolderOpen,
  FolderPlus,
  Building2,
  Trash2,
  Send,
  FileText,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DealOverviewSummary } from "@/components/pipeline/DealOverviewSummary";
import { EmptyState } from "@/components/shared/EmptyState";

import { useDocumentsTabData } from "@/components/pipeline/tabs/DocumentsTab/useDocumentsTabData";
import { useCommercialUwData } from "@/components/pipeline/tabs/useCommercialUwData";
import { useDealNavigation } from "@/hooks/useDealNavigation";

// Lazy-load heavy tab components (only downloaded when user navigates to that tab)
const DocumentsTab = lazy(() => import("@/components/pipeline/tabs/DocumentsTab").then(m => ({ default: m.DocumentsTab })));
const PropertyTab = lazy(() => import("@/components/pipeline/tabs/PropertyTab").then(m => ({ default: m.PropertyTab })));
const PeopleTab = lazy(() => import("@/components/pipeline/tabs/PeopleTab").then(m => ({ default: m.default })));
const UnderwritingTab = lazy(() => import("@/components/pipeline/tabs/UnderwritingTab").then(m => ({ default: m.UnderwritingTab })));
import {
  InlineLayoutProvider,
  useInlineLayout,
  InlineLayoutToolbar,
  TabEditPopover,
} from "@/components/inline-layout-editor";
import { useDealLayout } from "@/hooks/useDealLayout";
import { Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { reorderTabs } from "@/lib/actions/layout-actions";

import {
  type UnifiedDeal,
  type UnifiedStage,
  type StageConfig,
  STAGES,
  ORIGINATION_STAGES,
  SERVICING_STAGES,
  isServicingStage,
  isClosedStage,
  showServicingUI,
  getStageLabel,
  CAPITAL_SIDE_COLORS,
  ASSET_CLASS_LABELS,
  ACTIVE_ASSET_CLASS_OPTIONS,
  type AssetClass,
  daysInStage,
} from "@/components/pipeline/pipeline-types";
import {
  advanceStageAction,
  regressStageAction,
  updateDealStatusAction,
  updateUwDataAction,
} from "@/app/(authenticated)/(admin)/pipeline/actions";
import { normalizeAssetClass, isCommercialDeal, type VisibilityContext } from "@/lib/visibility-engine";
import { InlineField } from "@/components/ui/inline-field";
import { ApprovalBanner } from "@/components/pipeline/ApprovalBanner";
import { getDealDisplayConfig, getDealFlavor } from "@/lib/pipeline/deal-display-config";
import { ResidentialAnalysisTab } from "@/components/pipeline/tabs/ResidentialAnalysisTab";
import { EmailComposeSheet } from "@/components/crm/email-compose-sheet";
import { useSoftphoneMaybe } from "@/lib/twilio/softphone-context";

const ActionCenterTab = lazy(() => import("@/components/pipeline/tabs/ActionCenterTab").then(m => ({ default: m.ActionCenterTab })));
const FundraisingTab = lazy(() => import("@/components/fundraising/FundraisingTab").then(m => ({ default: m.FundraisingTab })));
const ServicingTab = lazy(() => import("@/components/pipeline/tabs/ServicingTab").then(m => ({ default: m.ServicingTab })));
const PaymentsTab = lazy(() => import("@/components/pipeline/tabs/PaymentsTab").then(m => ({ default: m.PaymentsTab })));
import {
  logQuickActionV2,
  addDealTeamMember,
  removeDealTeamMember,
  createDealDriveFolder,
  deleteUnifiedDealSuperAdmin,
  removeDealContact,
  assignBrokerContact,
  removeDealTeamContactAction,
} from "./actions";
import { SubmitForApprovalDialog } from "@/components/approvals/submit-for-approval-dialog";
import { SendFormDialog } from "@/components/pipeline/SendFormDialog";
import { GenerateDocumentDialog } from "@/components/documents/GenerateDocumentDialog";
import type { ApprovalEntityType } from "@/lib/approvals/types";
import type { Profile } from "@/lib/tasks";
import type { DealTeamContact } from "@/app/types/deal-team";
import type { SelectableContact } from "@/components/pipeline/deal-header/types";
import { useContactSelection } from "@/components/pipeline/deal-header/useContactSelection";
import { ContactSelectionBar } from "@/components/pipeline/deal-header/ContactSelectionBar";
import { AssignPartyDialog } from "@/components/pipeline/deal-header/AssignPartyDialog";
import { AddDealTeamDialog } from "@/components/deal-team/AddDealTeamDialog";

// ─── Lazy Tab Loading Fallback ───

function TabLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

// ─── Types ───

export interface DealTeamMember {
  id: string;
  deal_id: string;
  profile_id: string;
  role: string;
  created_at: string;
}

const TEAM_ROLE_OPTIONS = [
  "Assigned To",
  "Originator",
  "Processor",
  "Underwriter",
  "Closer",
  "Team Member",
] as const;

const KEY_ROLES = ["Originator", "Processor", "Underwriter"] as const;

export interface DealContactRow {
  id: string;
  deal_id: string;
  contact_id: string;
  role: "primary" | "co_borrower";
  is_guarantor: boolean;
  sort_order: number;
  contact?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    company_name: string | null;
  } | null;
}

// ─── Props ───

interface DealDetailPageProps {
  deal: UnifiedDeal;
  stageConfigs: StageConfig[];
  teamMembers: Profile[];
  dealTeamMembers: DealTeamMember[];
  dealTeamContacts: DealTeamContact[];
  dealContacts: DealContactRow[];
  currentUserId: string;
  currentUserName: string;
  isSuperAdmin?: boolean;
  approvalInfo?: {
    approvalId: string | null;
    status: string | null;
    submittedBy: string | null;
    submitterName: string | null;
    decisionNotes: string | null;
    submissionNotes: string | null;
  } | null;
}

// ─── Main Component ───

export function DealDetailPage(props: DealDetailPageProps) {
  return (
    <InlineLayoutProvider>
      <DealDetailPageInner {...props} />
    </InlineLayoutProvider>
  );
}

function DealDetailPageInner({
  deal,
  stageConfigs,
  teamMembers,
  dealTeamMembers,
  dealTeamContacts,
  dealContacts,
  currentUserId,
  currentUserName,
  isSuperAdmin = false,
  approvalInfo,
}: DealDetailPageProps) {
  const showFundraisingTab = deal.stage === "execution" || isClosedStage(deal.stage);
  const showServicingTabs = showServicingUI(deal.stage);
  const hasAssetClass = !!deal.asset_class;
  const isResidential = normalizeAssetClass(deal.asset_class) === "residential_1_4";
  const showAnalysisTab = hasAssetClass && isResidential;
  const showUnderwritingTab = hasAssetClass && !isResidential;
  const UNIVERSAL_TABS = [
    "Action Center",
    "Overview",
    "People",
    "Property",
    ...(showAnalysisTab ? ["Analysis"] : []),
    ...(showUnderwritingTab ? ["Underwriting"] : []),
    ...(showServicingTabs ? ["Servicing"] : []),
    ...(showServicingTabs ? ["Payments"] : []),
    "Documents",
    ...(showFundraisingTab ? ["Fundraising"] : []),
  ] as const;
  const tabs = UNIVERSAL_TABS;

  // Inline layout editor
  const inlineLayout = useInlineLayout();
  const layout = useDealLayout();

  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  // Backward compatibility: redirect old tab params
  const resolvedTabParam = (() => {
    const t = tabParam?.toLowerCase();
    if (t === "contacts" || t === "borrower") return "people";
    if (t === "conditions" || t === "diligence" || t === "forms") return "documents";
    if (t === "tasks" || t === "activity" || t === "notes" || t === "messages") return "action center";
    return tabParam;
  })();
  const initialTab =
    tabs.find((t) => t.toLowerCase() === resolvedTabParam?.toLowerCase()) ??
    tabs[0];
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Track which tabs have been visited so we can keep them mounted
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(
    () => new Set([initialTab])
  );


  // Backward compatibility: replace old tab params in URL
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const tab = searchParams.get("tab")?.toLowerCase();
    const redirectMap: Record<string, string> = {
      contacts: "people",
      borrower: "people",
      conditions: "documents",
      diligence: "documents",
      forms: "documents",
    };
    if (tab && redirectMap[tab]) {
      const params = new URLSearchParams(window.location.search);
      params.set("tab", redirectMap[tab]);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, [searchParams]);

  const visibilityContext = useMemo<VisibilityContext>(() => ({
    asset_class: normalizeAssetClass(deal.asset_class),
    dealValues: {
      loan_type: (deal.uw_data?.loan_type as string) ?? "",
      loan_purpose: (deal.uw_data?.loan_purpose as string) ?? "",
      acquisition_type: (deal.uw_data?.acquisition_type as string) ?? "",
      exit_strategy: (deal.uw_data?.exit_strategy as string) ?? "",
    },
  }), [deal.asset_class, deal.uw_data]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setLoadedTabs((prev) => {
      if (prev.has(tab)) return prev;
      return new Set(prev).add(tab);
    });
    inlineLayout.setActiveTabKey(tab.toLowerCase());
    // Update URL without triggering Next.js navigation
    const params = new URLSearchParams(window.location.search);
    if (tab === tabs[0]) {
      params.delete("tab");
    } else {
      params.set("tab", tab.toLowerCase());
    }
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [tabs, inlineLayout]);

  const displayId = deal.deal_number ?? deal.id.slice(0, 8);
  const days = deal.days_in_stage ?? daysInStage(deal.stage_entered_at);
  const dealConfig = getDealDisplayConfig(deal);
  const shortLabel = dealConfig.shortLabel;

  // Stage change with optimistic update
  const [stageJumping, startStageJump] = useTransition();
  const [optimisticStage, setOptimisticStage] = useState(deal.stage);
  useEffect(() => { setOptimisticStage(deal.stage); }, [deal.stage]);

  const handleStageChange = useCallback(
    (targetStage: string) => {
      if (targetStage === optimisticStage) return;

      const previousStage = optimisticStage;
      const label = getStageLabel(targetStage);

      // Use ALL_STAGES order for advance/regress detection
      const stageOrder: string[] = [...ORIGINATION_STAGES.map(s => s.key), ...SERVICING_STAGES.map(s => s.key)];
      const currentIdx = stageOrder.indexOf(previousStage);
      const targetIdx = stageOrder.indexOf(targetStage);

      setOptimisticStage(targetStage as UnifiedStage);

      startStageJump(async () => {
        const action = targetIdx < currentIdx ? regressStageAction : advanceStageAction;
        const res = await action(deal.id, targetStage);
        if (res.error) {
          setOptimisticStage(previousStage);
          showError(`Could not change stage: ${res.error}`);
        } else {
          showSuccess(`Moved to ${label}`);
        }
      });
    },
    [deal.id, optimisticStage]
  );

  // Derive metrics for condensed header
  const currentStageIndex = STAGES.findIndex((s) => s.key === optimisticStage);
  const currentStageName = (() => {
    if (optimisticStage === "closed") return "Closed Won";
    if (optimisticStage === "closed_lost") return "Closed Lost";
    return getStageLabel(optimisticStage);
  })();
  const uwData = deal.uw_data as Record<string, unknown> | null;

  // Optimistic header metrics state
  const [optimisticLoanAmount, setOptimisticLoanAmount] = useState<number | null>(
    (uwData?.loan_amount as number | null) ?? deal.amount ?? null
  );
  const [optimisticAssetClassKey, setOptimisticAssetClassKey] = useState<string | null>(
    (uwData?.property_type as string | null) ?? deal.asset_class ?? null
  );
  const [optimisticCloseDate, setOptimisticCloseDate] = useState<string | null>(
    (uwData?.close_date as string | null) ?? deal.close_date ?? null
  );

  // Sync from server data when deal prop changes
  useEffect(() => {
    const ud = deal.uw_data as Record<string, unknown> | null;
    setOptimisticLoanAmount((ud?.loan_amount as number | null) ?? deal.amount ?? null);
    setOptimisticAssetClassKey((ud?.property_type as string | null) ?? deal.asset_class ?? null);
    setOptimisticCloseDate((ud?.close_date as string | null) ?? deal.close_date ?? null);
  }, [deal.uw_data, deal.amount, deal.asset_class, deal.close_date]);

  const handleMetricSave = useCallback(async (key: string, value: string) => {
    // Optimistic update
    if (key === "loan_amount") setOptimisticLoanAmount(Number(value) || null);
    if (key === "property_type") setOptimisticAssetClassKey(value || null);
    if (key === "close_date") setOptimisticCloseDate(value || null);

    const res = await updateUwDataAction(deal.id, key, key === "loan_amount" ? Number(value) || 0 : value);
    if (res?.error) {
      showError(`Could not save field`);
      // Rollback
      const ud = deal.uw_data as Record<string, unknown> | null;
      if (key === "loan_amount") setOptimisticLoanAmount((ud?.loan_amount as number | null) ?? deal.amount ?? null);
      if (key === "property_type") setOptimisticAssetClassKey((ud?.property_type as string | null) ?? deal.asset_class ?? null);
      if (key === "close_date") setOptimisticCloseDate((ud?.close_date as string | null) ?? deal.close_date ?? null);
    }
  }, [deal.id, deal.uw_data, deal.amount, deal.asset_class, deal.close_date]);

  const loanAmount = optimisticLoanAmount;
  const assetClass = optimisticAssetClassKey
    ? (ASSET_CLASS_LABELS[optimisticAssetClassKey as AssetClass] ?? optimisticAssetClassKey)
    : null;
  const expectedClose = optimisticCloseDate;

  return (
    <div className="flex flex-col h-full -mb-20 md:-mb-6 lg:-mb-8 overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden max-w-[1680px]">

        {/* ── Condensed Deal Header ── */}
        <DealHeader
          deal={deal}
          shortLabel={shortLabel}
          days={days}
          dealTeamMembers={dealTeamMembers}
          dealTeamContacts={dealTeamContacts}
          dealContacts={dealContacts}
          teamMembers={teamMembers}
          currentUserId={currentUserId}
          isSuperAdmin={isSuperAdmin}
          displayId={displayId}
          dealLabel={dealConfig.label}
          effectiveStage={optimisticStage}
          currentStageIndex={currentStageIndex}
          currentStageName={currentStageName}
          stageJumping={stageJumping}
          onStageChange={handleStageChange}
          assetClass={assetClass}
          assetClassKey={optimisticAssetClassKey}
          loanAmount={loanAmount}
          expectedClose={expectedClose as string | null | undefined}
          onMetricSave={handleMetricSave}
        />

        {/* Tab Bar */}
        <div className="flex items-center justify-between px-3 md:px-6 py-2 flex-shrink-0 overflow-hidden">
          <div className="flex gap-0.5 rounded-[10px] p-[3px] bg-muted border rq-scroll-x">
            {tabs.map((tab) => {
              const tabButton = (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border-none px-3.5 py-[7px] text-[13px] cursor-pointer transition-all duration-150 shrink-0 whitespace-nowrap",
                    activeTab === tab
                      ? "bg-background text-foreground font-medium shadow-sm"
                      : "bg-transparent text-muted-foreground hover:text-foreground",
                    inlineLayout.state.isEditing && "hover:ring-1 hover:ring-primary/30"
                  )}
                >
                  {tab === "People" ? (
                    <>
                      <Users className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                      {tab}
                    </>
                  ) : (
                    tab
                  )}
                  {inlineLayout.state.isEditing && (
                    <Pencil className="h-2.5 w-2.5 text-muted-foreground/50 ml-0.5" />
                  )}
                </button>
              );

              // Wrap with TabEditPopover + reorder arrows when editing.
              if (inlineLayout.state.isEditing) {
                const layoutTab = layout.tabs.find(
                  (t) => t.label.toLowerCase() === tab.toLowerCase() || t.key === tab.toLowerCase()
                );
                if (layoutTab) {
                  const tabIdx = layout.tabs.indexOf(layoutTab);
                  const handleReorder = async (direction: "left" | "right") => {
                    const swapIdx = direction === "left" ? tabIdx - 1 : tabIdx + 1;
                    if (swapIdx < 0 || swapIdx >= layout.tabs.length) return;
                    const newOrders = layout.tabs.map((t, i) => {
                      if (i === tabIdx) return { tab_key: t.key, tab_order: layout.tabs[swapIdx].order };
                      if (i === swapIdx) return { tab_key: t.key, tab_order: layout.tabs[tabIdx].order };
                      return { tab_key: t.key, tab_order: t.order };
                    });
                    const result = await reorderTabs("deal_detail", newOrders);
                    if (result.error) {
                      showError(`Failed to reorder tabs: ${result.error}`);
                    } else {
                      layout.refetch();
                    }
                  };

                  return (
                    <div key={tab} className="flex items-center gap-0">
                      <button
                        onClick={() => handleReorder("left")}
                        disabled={tabIdx === 0}
                        className="flex items-center justify-center h-5 w-4 rounded-l bg-transparent text-muted-foreground/40 hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer border-0"
                        title="Move tab left"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                      <div className="flex items-center gap-0 rounded-lg">
                        <button
                          onClick={() => handleTabChange(tab)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-lg border-none px-3.5 py-[7px] text-[13px] cursor-pointer transition-all duration-150 shrink-0 whitespace-nowrap",
                            activeTab === tab
                              ? "bg-background text-foreground font-medium shadow-sm"
                              : "bg-transparent text-muted-foreground hover:text-foreground",
                            "hover:ring-1 hover:ring-primary/30"
                          )}
                        >
                          {tab === "People" ? (
                            <>
                              <Building2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                              {tab}
                            </>
                          ) : (
                            tab
                          )}
                        </button>
                        <TabEditPopover
                          tabKey={layoutTab.key}
                          tabLabel={layoutTab.label}
                          tabIcon={layoutTab.icon}
                          tabLocked={layoutTab.locked}
                          pageType="deal_detail"
                          onUpdated={() => layout.refetch()}
                        >
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted border-0 cursor-pointer transition-colors"
                            title="Edit tab"
                          >
                            <Pencil className="h-2.5 w-2.5" />
                          </button>
                        </TabEditPopover>
                      </div>
                      <button
                        onClick={() => handleReorder("right")}
                        disabled={tabIdx >= layout.tabs.length - 1}
                        className="flex items-center justify-center h-5 w-4 rounded-r bg-transparent text-muted-foreground/40 hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer border-0"
                        title="Move tab right"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  );
                }
              }

              return tabButton;
            })}
          </div>

        </div>

        {/* Tab bar separator — inset to match content padding, with spacing below */}
        <div className="mx-3 md:mx-6 border-b mb-4" />

        {/* Inline Layout Toolbar (shown when editing) */}
        <InlineLayoutToolbar onSaveComplete={() => layout.refetch()} tabs={layout.tabs} />

        {/* Approval Banner */}
        <ApprovalBanner
          dealId={deal.id}
          dealName={deal.name}
          stage={deal.stage}
          approvalStatus={deal.approval_status ?? null}
          isSuperAdmin={isSuperAdmin}
          decisionNotes={approvalInfo?.decisionNotes}
          submitterName={approvalInfo?.submitterName}
        />

        {/* Closed Lost Banner */}
        {deal.status === "lost" && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 dark:border-red-800 dark:bg-red-950/50">
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-red-700 dark:text-red-400">Closed Lost</span>
              {deal.loss_reason && (
                <p className="text-sm text-red-600/80 dark:text-red-400/70 mt-0.5 line-clamp-2">{deal.loss_reason}</p>
              )}
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className={cn(
            "h-full min-h-0 min-w-0 flex flex-col",
            activeTab === "Action Center" ? "overflow-hidden" : "overflow-y-auto pb-8 gap-4"
          )}>
          {loadedTabs.has("Action Center") && (
            <div className={activeTab !== "Action Center" ? "hidden" : "flex-1 min-h-0 flex flex-col"}>
              <SectionErrorBoundary fallbackTitle="Could not load action center">
                <Suspense fallback={<TabLoadingFallback />}>
                  <ActionCenterTab
                    dealId={deal.id}
                    primaryContactId={deal.primary_contact_id ?? null}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                    dealStage={deal.stage ?? "lead"}
                  />
                </Suspense>
              </SectionErrorBoundary>
            </div>
          )}
          {loadedTabs.has("Overview") && (
            <div className={activeTab !== "Overview" ? "hidden" : undefined}>
              <SectionErrorBoundary fallbackTitle="Could not load overview">
                <DealOverviewSummary dealId={deal.id} deal={deal} />
              </SectionErrorBoundary>
            </div>
          )}
          {loadedTabs.has("Property") && (
            <div className={activeTab !== "Property" ? "hidden" : undefined}>
              <SectionErrorBoundary fallbackTitle="Could not load property">
              <Suspense fallback={<TabLoadingFallback />}>
                <PropertyTab
                  dealId={deal.id}
                  propertyId={deal.property_id}
                  propertyData={{
                    ...((deal.property_data as Record<string, unknown>) ?? {}),
                    ...Object.fromEntries(
                      Object.entries(deal.uw_data ?? {}).filter(([k]) =>
                        ["property_type", "property_address", "property_city", "property_state", "property_zip", "property_county", "number_of_units", "year_built", "total_sf", "parcel_id", "flood_zone_type", "purchase_price", "appraised_value"].includes(k)
                      )
                    ),
                  }}
                  visibilityContext={visibilityContext}
                  assetClass={deal.asset_class}
                />
              </Suspense>
              </SectionErrorBoundary>
            </div>
          )}
          {loadedTabs.has("Analysis") && (
            <div className={activeTab !== "Analysis" ? "hidden" : undefined}>
              <SectionErrorBoundary fallbackTitle="Could not load analysis">
                <ResidentialAnalysisTab
                  dealId={deal.id}
                  uwData={(deal.uw_data as Record<string, unknown>) ?? {}}
                />
              </SectionErrorBoundary>
            </div>
          )}
          {loadedTabs.has("Underwriting") && (
            <div className={activeTab !== "Underwriting" ? "hidden" : undefined}>
              <SectionErrorBoundary fallbackTitle="Could not load underwriting">
                <Suspense fallback={<TabLoadingFallback />}>
                  <UnderwritingContent
                    deal={deal}
                  />
                </Suspense>
              </SectionErrorBoundary>
            </div>
          )}
          {showServicingTabs && loadedTabs.has("Servicing") && (
            <div className={activeTab !== "Servicing" ? "hidden" : undefined}>
              <SectionErrorBoundary fallbackTitle="Could not load servicing">
                <Suspense fallback={<TabLoadingFallback />}>
                  <ServicingTab deal={deal} />
                </Suspense>
              </SectionErrorBoundary>
            </div>
          )}
          {showServicingTabs && loadedTabs.has("Payments") && (
            <div className={activeTab !== "Payments" ? "hidden" : undefined}>
              <SectionErrorBoundary fallbackTitle="Could not load payments">
                <Suspense fallback={<TabLoadingFallback />}>
                  <PaymentsTab dealId={deal.id} />
                </Suspense>
              </SectionErrorBoundary>
            </div>
          )}
          {loadedTabs.has("People") && (
            <div className={activeTab !== "People" ? "hidden" : undefined}>
              <SectionErrorBoundary fallbackTitle="Could not load people">
                <Suspense fallback={<TabLoadingFallback />}>
                  <PeopleTab
                    dealId={deal.id}
                    deal={deal}
                    dealTeamMembers={dealTeamMembers}
                    teamMembers={teamMembers}
                  />
                </Suspense>
              </SectionErrorBoundary>
            </div>
          )}
          {loadedTabs.has("Documents") && (
            <div className={activeTab !== "Documents" ? "hidden" : undefined}>
              <SectionErrorBoundary fallbackTitle="Could not load documents">
              <Suspense fallback={<TabLoadingFallback />}>
                <DocumentsTabWithData
                  deal={deal}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                />
              </Suspense>
              </SectionErrorBoundary>
            </div>
          )}
          {showFundraisingTab && loadedTabs.has("Fundraising") && (
            <div className={activeTab !== "Fundraising" ? "hidden" : undefined}>
              <SectionErrorBoundary fallbackTitle="Could not load fundraising">
              <Suspense fallback={<TabLoadingFallback />}>
                <FundraisingTab
                  dealId={deal.id}
                  dealName={(deal as { name?: string }).name ?? ""}
                  fundraiseSlug={deal.fundraise_slug ?? null}
                  fundraiseEnabled={deal.fundraise_enabled ?? false}
                  fundraiseTarget={deal.fundraise_target ?? null}
                  fundraiseHardCap={deal.fundraise_hard_cap ?? null}
                  fundraiseDescription={deal.fundraise_description ?? null}
                  fundraiseAmountOptions={deal.fundraise_amount_options ?? null}
                  fundraiseHeroImageUrl={deal.fundraise_hero_image_url ?? null}
                  fundraiseDeckUrl={deal.fundraise_deck_url ?? null}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                />
              </Suspense>
              </SectionErrorBoundary>
            </div>
          )}
          </div>

        </div>
      </div>

    </div>
  );
}

// ─── Header (expanded: team popover, actions dropdown, advance CTA) ───

/** Builds a prefixed email subject for deal-context emails. */
function buildDealEmailSubject(displayId: string, dealName: string | null): string {
  if (!dealName) return `${displayId} `;
  const MAX_NAME_LENGTH = 45;
  let name = dealName;
  if (name.length > MAX_NAME_LENGTH) {
    const truncated = name.slice(0, MAX_NAME_LENGTH);
    const lastBreak = Math.max(truncated.lastIndexOf(","), truncated.lastIndexOf(" "));
    name = lastBreak > 20 ? truncated.slice(0, lastBreak) : truncated;
  }
  return `${displayId} ${name} - `;
}

// ─── Asset class dropdown maps (for header inline editing) ───
const HEADER_AC_LABELS = ACTIVE_ASSET_CLASS_OPTIONS.map((o) => o.label);
const HEADER_AC_LABEL_TO_KEY = Object.fromEntries(
  ACTIVE_ASSET_CLASS_OPTIONS.map((o) => [o.label, o.key])
);
const HEADER_AC_KEY_TO_LABEL = ASSET_CLASS_LABELS as Record<string, string>;

function DealHeader({
  deal,
  shortLabel,
  days,
  dealTeamMembers,
  dealTeamContacts,
  dealContacts,
  teamMembers,
  currentUserId,
  isSuperAdmin,
  displayId,
  dealLabel,
  effectiveStage,
  currentStageIndex,
  currentStageName,
  stageJumping,
  onStageChange,
  assetClass,
  assetClassKey,
  loanAmount,
  expectedClose,
  onMetricSave,
}: {
  deal: UnifiedDeal;
  shortLabel: string;
  days: number;
  dealTeamMembers: DealTeamMember[];
  dealTeamContacts: DealTeamContact[];
  dealContacts: DealContactRow[];
  teamMembers: Profile[];
  currentUserId: string;
  isSuperAdmin: boolean;
  displayId: string;
  dealLabel: string;
  effectiveStage: string;
  currentStageIndex: number;
  currentStageName: string;
  stageJumping: boolean;
  onStageChange: (stage: string) => void;
  assetClass: string | null;
  assetClassKey: string | null;
  loanAmount: number | null;
  expectedClose: string | null | undefined;
  onMetricSave: (key: string, value: string) => void;
}) {
  const router = useRouter();
  const dealNav = useDealNavigation(deal.id, deal.deal_number);

  // Dialog state (moved from old sidebar)
  const [logCallOpen, setLogCallOpen] = useState(false);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [teamAssignOpen, setTeamAssignOpen] = useState(false);

  // Form states
  const [callContact, setCallContact] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailNotes, setEmailNotes] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("Team Member");
  const [roleLocked, setRoleLocked] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Deal Parties dialog state
  const [assignPartyOpen, setAssignPartyOpen] = useState(false);
  const [assignPartyType, setAssignPartyType] = useState<"borrower" | "broker">("borrower");
  const [assignDealTeamOpen, setAssignDealTeamOpen] = useState(false);
  const [assignDealTeamRole, setAssignDealTeamRole] = useState<string>("");

  const [creatingDrive, setCreatingDrive] = useState(false);
  const [deleteDealOpen, setDeleteDealOpen] = useState(false);
  const [deleteDealLoading, setDeleteDealLoading] = useState(false);

  // Closed Lost dialog state
  const [closedLostOpen, setClosedLostOpen] = useState(false);
  const [lossDescription, setLossDescription] = useState("");
  const [isClosingLost, setIsClosingLost] = useState(false);

  // Send Form dialog state
  const [sendFormOpen, setSendFormOpen] = useState(false);
  // Generate Document dialog state
  const [generateDocOpen, setGenerateDocOpen] = useState(false);
  const [dealConditions, setDealConditions] = useState<Array<{ id: string; condition_name: string; status: string }>>([]);

  // Email composer state (for contact popover and selection-based send)
  const [emailComposeOpen, setEmailComposeOpen] = useState(false);
  const [emailToContact, setEmailToContact] = useState<{
    email: string;
    name: string;
    contactId: string;
    ccEmails?: string[];
  } | null>(null);

  // Form recipients from contact selection
  const [formRecipients, setFormRecipients] = useState<Array<{ id: string; name: string; email: string }>>([]);

  // Fetch deal conditions for Send Form dialog
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("unified_deal_conditions")
      .select("id, condition_name, status")
      .eq("deal_id", deal.id)
      .then(({ data }) => {
        if (data) setDealConditions(data);
      });
  }, [deal.id]);

  // Softphone for click-to-call
  const softphone = useSoftphoneMaybe();

  // Contact avatars for header
  const borrower = deal.primary_contact
    ? {
        id: deal.primary_contact.id,
        name: `${deal.primary_contact.first_name ?? ""} ${deal.primary_contact.last_name ?? ""}`.trim(),
        email: deal.primary_contact.email,
        phone: deal.primary_contact.phone,
        role: "Borrower" as const,
      }
    : null;

  const brokerRaw = (deal as unknown as Record<string, unknown>).broker_contact as {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    broker_company?: { name: string } | null;
  } | null;

  const broker = brokerRaw
    ? {
        id: brokerRaw.id,
        name: `${brokerRaw.first_name ?? ""} ${brokerRaw.last_name ?? ""}`.trim(),
        email: brokerRaw.email,
        phone: brokerRaw.phone,
        role: "Broker" as const,
        company: brokerRaw.broker_company?.name ?? null,
      }
    : null;

  const headerContacts = [borrower, broker].filter(Boolean) as Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: "Borrower" | "Broker";
    company?: string | null;
  }>;

  const resolvedMembers = dealTeamMembers.map((dtm) => {
    const profile = teamMembers.find((t) => t.id === dtm.profile_id);
    return { ...dtm, full_name: profile?.full_name ?? "Unknown" };
  });

  // Build unified selectable contacts list
  const allContacts = useMemo<SelectableContact[]>(() => {
    const list: SelectableContact[] = [];
    const getInitials = (name: string) =>
      (name || "??").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

    // Primary borrower
    if (deal.primary_contact) {
      const pc = deal.primary_contact;
      const name = `${pc.first_name ?? ""} ${pc.last_name ?? ""}`.trim() || "Unknown";
      list.push({
        id: pc.id,
        name,
        initials: getInitials(name),
        email: pc.email ?? null,
        phone: pc.phone ?? null,
        role: "Borrower",
        category: "external",
        source: "borrower",
        crmContactId: pc.id,
        colorSeed: pc.id,
      });
    }

    // Co-borrowers from deal_contacts
    for (const dc of dealContacts) {
      if (dc.contact_id === deal.primary_contact?.id) continue; // skip primary (already added above)
      const c = dc.contact;
      if (!c) continue;
      const name = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "Unknown";
      list.push({
        id: dc.id,
        name,
        initials: getInitials(name),
        email: c.email ?? null,
        phone: c.phone ?? null,
        role: dc.role === "primary" ? "Borrower" : "Co-Borrower",
        category: "external",
        source: "borrower",
        crmContactId: c.id,
        colorSeed: c.id,
      });
    }

    // Broker
    if (brokerRaw) {
      const name = `${brokerRaw.first_name ?? ""} ${brokerRaw.last_name ?? ""}`.trim() || "Unknown";
      list.push({
        id: `broker-${brokerRaw.id}`,
        name,
        initials: getInitials(name),
        email: brokerRaw.email ?? null,
        phone: brokerRaw.phone ?? null,
        role: "Broker",
        category: "external",
        source: "broker",
        crmContactId: brokerRaw.id,
        colorSeed: brokerRaw.id,
      });
    }

    // External deal team contacts
    if (dealTeamContacts) {
      for (const dtc of dealTeamContacts) {
        const contact = dtc.contact;
        const name = contact
          ? `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim()
          : dtc.manual_name || "Unknown";
        const email = contact?.email ?? dtc.manual_email ?? null;
        // Skip duplicates with borrower or broker
        if (deal.primary_contact && contact?.id === deal.primary_contact.id) continue;
        if (brokerRaw && contact?.id === brokerRaw.id) continue;

        list.push({
          id: dtc.id,
          name: name || "Unknown",
          initials: getInitials(name || "Unknown"),
          email,
          phone: contact?.phone ?? dtc.manual_phone ?? null,
          role: dtc.role || "Team",
          category: "external",
          source: "deal_team",
          crmContactId: contact?.id ?? undefined,
          colorSeed: dtc.id,
        });
      }
    }

    // Internal team members
    for (const dtm of resolvedMembers) {
      const profile = teamMembers.find((t) => t.id === dtm.profile_id);
      list.push({
        id: dtm.profile_id,
        name: dtm.full_name || "Unknown",
        initials: getInitials(dtm.full_name || "Unknown"),
        email: profile?.email ?? null,
        phone: null,
        role: dtm.role || "Team",
        category: "internal",
        source: "internal_team",
        colorSeed: dtm.profile_id,
      });
    }

    return list;
  }, [deal.primary_contact, dealContacts, brokerRaw, dealTeamContacts, resolvedMembers, teamMembers]);

  // Contact selection state
  const contactSelection = useContactSelection(allContacts);

  // Escape key clears contact selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && contactSelection.hasSelection) {
        contactSelection.clearSelection();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- using stable destructured properties; contactSelection object is not memoized
  }, [contactSelection.hasSelection, contactSelection.clearSelection]);

  const handleCreateDriveFolder = useCallback(async () => {
    setCreatingDrive(true);
    try {
      const result = await createDealDriveFolder(deal.id);
      if (result.error) {
        showError(result.error);
      } else {
        showSuccess("Google Drive folder created");
        router.refresh();
      }
    } finally {
      setCreatingDrive(false);
    }
  }, [deal.id, router]);

  const handleLogCall = useCallback(async () => {
    setActionLoading(true);
    try {
      const desc = `Call logged${callContact ? ` with ${callContact}` : ""}${callNotes ? `: ${callNotes}` : ""}`;
      await logQuickActionV2(deal.id, "call_logged", desc, {
        contact: callContact,
        notes: callNotes,
      });
      setLogCallOpen(false);
      setCallContact("");
      setCallNotes("");
      showSuccess("Call logged");
      router.refresh();
    } finally {
      setActionLoading(false);
    }
  }, [deal.id, callContact, callNotes, router]);

  const handleSendEmail = useCallback(async () => {
    setActionLoading(true);
    try {
      const desc = `Email logged${emailSubject ? `: ${emailSubject}` : ""}`;
      await logQuickActionV2(deal.id, "email_sent", desc, {
        subject: emailSubject,
        notes: emailNotes,
      });
      setSendEmailOpen(false);
      setEmailSubject("");
      setEmailNotes("");
      showSuccess("Email logged");
      router.refresh();
    } finally {
      setActionLoading(false);
    }
  }, [deal.id, emailSubject, emailNotes, router]);

  const handleAddTeamMember = useCallback(async () => {
    setActionLoading(true);
    try {
      const result = await addDealTeamMember(deal.id, selectedProfileId, selectedRole);
      if (result.error) {
        showError(`Failed to add: ${result.error}`);
      } else {
        showSuccess("Team member added");
        router.refresh();
      }
      setTeamAssignOpen(false);
      setSelectedProfileId("");
      setSelectedRole("Team Member");
    } finally {
      setActionLoading(false);
    }
  }, [deal.id, selectedProfileId, selectedRole, router]);

  const handleRemoveTeamMember = useCallback(async (memberId: string) => {
    setActionLoading(true);
    try {
      const result = await removeDealTeamMember(deal.id, memberId);
      if (result.error) {
        showError(`Failed to remove: ${result.error}`);
      } else {
        showSuccess("Team member removed");
        router.refresh();
      }
    } finally {
      setActionLoading(false);
    }
  }, [deal.id, router]);

  // ─── Deal Parties Handlers ───

  const handleRemoveBorrower = useCallback(async (contactId: string) => {
    setActionLoading(true);
    try {
      const result = await removeDealContact(deal.id, contactId);
      if (result.error) {
        showError(`Could not remove borrower: ${result.error}`);
      } else {
        showSuccess("Borrower removed");
        router.refresh();
      }
    } finally {
      setActionLoading(false);
    }
  }, [deal.id, router]);

  const handleRemoveBroker = useCallback(async () => {
    setActionLoading(true);
    try {
      const result = await assignBrokerContact(deal.id, null);
      if (result.error) {
        showError(`Could not remove broker: ${result.error}`);
      } else {
        showSuccess("Broker removed");
        router.refresh();
      }
    } finally {
      setActionLoading(false);
    }
  }, [deal.id, router]);

  const handleRemoveDealParty = useCallback(async (dtcId: string) => {
    setActionLoading(true);
    try {
      const result = await removeDealTeamContactAction(dtcId, deal.id);
      if (result.error) {
        showError(`Could not remove: ${result.error}`);
      } else {
        showSuccess("Contact removed");
        router.refresh();
      }
    } finally {
      setActionLoading(false);
    }
  }, [deal.id, router]);

  const handleConfirmDeleteDeal = useCallback(async () => {
    setDeleteDealLoading(true);
    try {
      const result = await deleteUnifiedDealSuperAdmin(deal.id);
      if ("error" in result) {
        showError(result.error);
        return;
      }
      showSuccess("Deal deleted");
      setDeleteDealOpen(false);
      router.push("/pipeline");
      router.refresh();
    } finally {
      setDeleteDealLoading(false);
    }
  }, [deal.id, router]);

  // Approval data
  const approvalBorrowerName = deal.primary_contact
    ? `${deal.primary_contact.first_name} ${deal.primary_contact.last_name}`.trim()
    : deal.company?.name ?? deal.name;
  const approvalEntityType: ApprovalEntityType = "loan";
  const dealSnapshot: Record<string, unknown> = {
    borrower_name: approvalBorrowerName,
    loan_amount: deal.amount,
    property_type: (deal.uw_data as Record<string, unknown>)?.property_type,
    loan_type: (deal.uw_data as Record<string, unknown>)?.loan_type,
    type: getDealFlavor(deal),
    stage: deal.stage,
    ltv: (deal.uw_data as Record<string, unknown>)?.ltv,
    interest_rate: (deal.uw_data as Record<string, unknown>)?.interest_rate,
  };
  const entityData: Record<string, unknown> = {
    ...deal.uw_data,
    loan_amount: deal.amount,
    borrower_name: approvalBorrowerName,
    type: (deal.uw_data as Record<string, unknown>)?.loan_type ?? null,
    borrower_id: deal.primary_contact_id ?? null,
  };

  const googleDriveUrl = (deal as unknown as Record<string, unknown>).google_drive_folder_url as string | undefined;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 md:gap-4 px-3 md:px-6 py-2.5 border-b flex-shrink-0">
        {/* Prev/Next navigation (visible when navigating from pipeline) */}
        {dealNav.totalDeals > 0 && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={dealNav.goToPrev}
              disabled={!dealNav.hasPrev}
              className="flex items-center justify-center h-7 w-7 rounded-md border bg-background text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed rq-transition cursor-pointer"
              title="Previous deal (←)"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={dealNav.goToNext}
              disabled={!dealNav.hasNext}
              className="flex items-center justify-center h-7 w-7 rounded-md border bg-background text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed rq-transition cursor-pointer"
              title="Next deal (→)"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="text-[10px] text-muted-foreground ml-1 tabular-nums">
              {dealNav.currentIndex + 1}/{dealNav.totalDeals}
            </span>
          </div>
        )}

        {/* A. Icon */}
        <div className="h-9 w-9 rounded-[10px] bg-primary/5 border flex items-center justify-center flex-shrink-0">
          <Layers className="h-[18px] w-[18px] text-muted-foreground" />
        </div>

        {/* B. Identity */}
        <div className="flex flex-col min-w-0">
          <div className="text-[11px] text-muted-foreground leading-tight">
            <Link href="/pipeline" className="hover:underline">Pipeline</Link>
            {" / "}
            <Link href="/pipeline" className="hover:underline">{dealLabel}</Link>
            {" / "}
            <span className="text-foreground/70">{displayId}</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-[17px] font-bold leading-tight truncate m-0">
              {deal.name || "Untitled Deal"}
            </h1>
            <Badge
              variant="outline"
              className={cn(
                "text-[9.5px] px-2 py-0 uppercase tracking-wide shrink-0",
                CAPITAL_SIDE_COLORS[deal.capital_side]
              )}
            >
              {shortLabel}
            </Badge>
            {deal.status === "lost" && (
              <Badge
                variant="outline"
                className="text-[9.5px] px-2 py-0 uppercase tracking-wide shrink-0 bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
              >
                Closed Lost
              </Badge>
            )}
          </div>
        </div>

        {/* C. Stage selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md shrink-0",
                "border border-transparent rq-transition",
                "hover:border-border hover:bg-muted/40",
                "focus:border-primary/60 focus:bg-background focus:ring-1 focus:ring-primary/20 focus:outline-none",
                deal.status === "lost" && "opacity-40 pointer-events-none",
                stageJumping && "pointer-events-none"
              )}
              disabled={deal.status === "lost"}
            >
              <div className={cn(
                "h-2 w-2 rounded-full shrink-0",
                currentStageIndex > 0 ? "bg-emerald-500" : "bg-foreground"
              )} />
              <span className="text-xs font-semibold">{currentStageName}</span>
              <span className="text-[10.5px] text-muted-foreground">({days}d)</span>
              {stageJumping
                ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                : <ChevronDown className="h-3 w-3 text-muted-foreground" />
              }
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {(() => {
              // Show servicing stages when deal is in execution or any closed_* stage
              const dealStage = deal.stage;
              const showServicing = dealStage === "execution" || isClosedStage(dealStage) || isServicingStage(dealStage);
              const allStageOrder: string[] = [...ORIGINATION_STAGES.map(s => s.key), ...SERVICING_STAGES.map(s => s.key)];
              const currentOrderIdx = allStageOrder.indexOf(effectiveStage);

              return (
                <>
                  {/* Origination stages */}
                  {ORIGINATION_STAGES.map((stage) => {
                    const orderIdx = allStageOrder.indexOf(stage.key);
                    const isCurrent = stage.key === effectiveStage;
                    const isCompleted = orderIdx < currentOrderIdx;
                    return (
                      <DropdownMenuItem
                        key={stage.key}
                        disabled={isCurrent || stageJumping}
                        onSelect={() => onStageChange(stage.key)}
                        className={cn("gap-2", isCurrent && "font-semibold bg-muted/50")}
                      >
                        <div className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          isCompleted && "bg-emerald-500",
                          isCurrent && "bg-foreground ring-2 ring-foreground/15",
                          !isCompleted && !isCurrent && "bg-muted border border-border"
                        )} />
                        {stage.label}
                        {isCurrent && <Check className="h-3.5 w-3.5 ml-auto text-muted-foreground" />}
                      </DropdownMenuItem>
                    );
                  })}

                  {/* Servicing stages (shown conditionally) */}
                  {showServicing && (
                    <>
                      <DropdownMenuSeparator />
                      {SERVICING_STAGES.map((stage) => {
                        const isCurrent = stage.key === effectiveStage;
                        const orderIdx = allStageOrder.indexOf(stage.key);
                        const isCompleted = orderIdx < currentOrderIdx;
                        return (
                          <DropdownMenuItem
                            key={stage.key}
                            disabled={isCurrent || stageJumping}
                            onSelect={() => onStageChange(stage.key)}
                            className={cn(
                              "gap-2",
                              isCurrent && "font-semibold bg-muted/50",
                              !isCurrent && "text-emerald-600 dark:text-emerald-400"
                            )}
                          >
                            <div className={cn(
                              "h-2 w-2 rounded-full shrink-0",
                              isCompleted && "bg-emerald-500",
                              isCurrent && "bg-foreground ring-2 ring-foreground/15",
                              !isCompleted && !isCurrent && "bg-emerald-500/40 border border-emerald-500/60"
                            )} />
                            Closed - {stage.label}
                            {isCurrent && <Check className="h-3.5 w-3.5 ml-auto text-muted-foreground" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </>
                  )}

                  {/* Closed Lost */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={stageJumping || deal.status === "lost"}
                    onSelect={() => setClosedLostOpen(true)}
                    className="gap-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-500/10"
                  >
                    <div className="h-2 w-2 rounded-full shrink-0 bg-red-500/40 border border-red-500/60" />
                    Closed Lost
                  </DropdownMenuItem>
                </>
              );
            })()}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* D. Actions (ml-auto pushes to right) */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Contact Selection Bar + Team Management */}
          <div className="flex items-center gap-1.5">
            <ContactSelectionBar
              contacts={allContacts}
              selectedIds={contactSelection.selectedIds}
              onToggle={contactSelection.toggle}
              onClearSelection={contactSelection.clearSelection}
              hasSelection={contactSelection.hasSelection}
            />

            {/* Team management popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="px-4 py-3 border-b">
                  <h4 className="text-sm font-medium">Deal Team</h4>
                </div>
              <div className="py-2 px-2 max-h-[480px] overflow-y-auto">
                {/* Key role slots */}
                {KEY_ROLES.map((role) => {
                  const member = resolvedMembers.find((m) => m.role === role);
                  return (
                    <div
                      key={role}
                      className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
                    >
                      {member ? (
                        <>
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-[10px] font-medium">
                            {member.full_name
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <div className="text-xs font-medium text-foreground truncate">
                              {member.full_name}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              {role}
                            </div>
                          </div>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 bg-transparent border-0 cursor-pointer"
                            onClick={() => handleRemoveTeamMember(member.id)}
                            disabled={actionLoading}
                          >
                            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        </>
                      ) : (
                        <button
                          className="flex items-center gap-2.5 flex-1 min-w-0 bg-transparent border-0 cursor-pointer p-0"
                          onClick={() => {
                            setSelectedProfileId("");
                            setSelectedRole(role);
                            setRoleLocked(true);
                            setTeamAssignOpen(true);
                          }}
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-dashed border-border">
                            <Plus className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <div className="text-xs text-muted-foreground text-left">
                            Assign {role}
                          </div>
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Other members */}
                {resolvedMembers.filter((m) => !(KEY_ROLES as readonly string[]).includes(m.role)).length > 0 && (
                  <>
                    <div className="px-2 pt-2 pb-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                        Other Members
                      </p>
                    </div>
                    {resolvedMembers
                      .filter((m) => !(KEY_ROLES as readonly string[]).includes(m.role))
                      .map((member) => (
                        <div
                          key={member.id}
                          className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-[10px] font-medium">
                            {member.full_name
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <div className="text-xs font-medium text-foreground truncate">
                              {member.full_name}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              {member.role}
                            </div>
                          </div>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 bg-transparent border-0 cursor-pointer"
                            onClick={() => handleRemoveTeamMember(member.id)}
                            disabled={actionLoading}
                          >
                            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      ))}
                  </>
                )}

                {/* ─── Deal Parties Section ─── */}
                <div className="border-t mt-2 pt-2">
                  <div className="px-2 pb-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      Deal Parties
                    </p>
                  </div>

                  {/* Borrowers (up to 4) */}
                  {dealContacts.map((dc) => {
                    const c = dc.contact;
                    const name = c
                      ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "Unknown"
                      : "Unknown";
                    const roleLabel = dc.role === "primary" ? "Borrower" : "Co-Borrower";
                    return (
                      <div
                        key={dc.id}
                        className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white text-[10px] font-medium">
                          {name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="text-left min-w-0 flex-1">
                          <div className="text-xs font-medium text-foreground truncate">{name}</div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{roleLabel}</div>
                        </div>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 bg-transparent border-0 cursor-pointer"
                          onClick={() => handleRemoveBorrower(dc.contact_id)}
                          disabled={actionLoading}
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    );
                  })}
                  {dealContacts.length < 4 && (
                    <button
                      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted w-full bg-transparent border-0 cursor-pointer"
                      onClick={() => {
                        setAssignPartyType("borrower");
                        setAssignPartyOpen(true);
                      }}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-dashed border-border">
                        <Plus className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="text-xs text-muted-foreground text-left">Assign Borrower</div>
                    </button>
                  )}

                  {/* Broker (1) */}
                  {brokerRaw ? (
                    <div className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white text-[10px] font-medium">
                        {`${brokerRaw.first_name ?? ""} ${brokerRaw.last_name ?? ""}`.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <div className="text-xs font-medium text-foreground truncate">
                          {`${brokerRaw.first_name ?? ""} ${brokerRaw.last_name ?? ""}`.trim() || "Unknown"}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Broker</div>
                      </div>
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 bg-transparent border-0 cursor-pointer"
                        onClick={() => handleRemoveBroker()}
                        disabled={actionLoading}
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted w-full bg-transparent border-0 cursor-pointer"
                      onClick={() => {
                        setAssignPartyType("broker");
                        setAssignPartyOpen(true);
                      }}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-dashed border-border">
                        <Plus className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="text-xs text-muted-foreground text-left">Assign Broker</div>
                    </button>
                  )}

                  {/* Title Co Rep (1) */}
                  {(() => {
                    const titleContact = dealTeamContacts.find((c) => c.role === "Title Company");
                    if (titleContact) {
                      const name = titleContact.contact
                        ? `${titleContact.contact.first_name ?? ""} ${titleContact.contact.last_name ?? ""}`.trim()
                        : titleContact.manual_name || "Unknown";
                      return (
                        <div className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white text-[10px] font-medium">
                            {(name || "Unknown").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <div className="text-xs font-medium text-foreground truncate">{name || "Unknown"}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Title Co</div>
                          </div>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 bg-transparent border-0 cursor-pointer"
                            onClick={() => handleRemoveDealParty(titleContact.id)}
                            disabled={actionLoading}
                          >
                            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      );
                    }
                    return (
                      <button
                        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted w-full bg-transparent border-0 cursor-pointer"
                        onClick={() => {
                          setAssignDealTeamRole("Title Company");
                          setAssignDealTeamOpen(true);
                        }}
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-dashed border-border">
                          <Plus className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="text-xs text-muted-foreground text-left">Assign Title Co Rep</div>
                      </button>
                    );
                  })()}

                  {/* Insurance Agent (1) */}
                  {(() => {
                    const insuranceContact = dealTeamContacts.find((c) => c.role === "Insurance Agent");
                    if (insuranceContact) {
                      const name = insuranceContact.contact
                        ? `${insuranceContact.contact.first_name ?? ""} ${insuranceContact.contact.last_name ?? ""}`.trim()
                        : insuranceContact.manual_name || "Unknown";
                      return (
                        <div className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white text-[10px] font-medium">
                            {(name || "Unknown").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <div className="text-xs font-medium text-foreground truncate">{name || "Unknown"}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Insurance</div>
                          </div>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 bg-transparent border-0 cursor-pointer"
                            onClick={() => handleRemoveDealParty(insuranceContact.id)}
                            disabled={actionLoading}
                          >
                            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      );
                    }
                    return (
                      <button
                        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted w-full bg-transparent border-0 cursor-pointer"
                        onClick={() => {
                          setAssignDealTeamRole("Insurance Agent");
                          setAssignDealTeamOpen(true);
                        }}
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-dashed border-border">
                          <Plus className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="text-xs text-muted-foreground text-left">Assign Insurance Agent</div>
                      </button>
                    );
                  })()}
                </div>
              </div>
              <div className="border-t px-3 py-2.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-xs gap-1"
                  onClick={() => {
                    setSelectedProfileId("");
                    setSelectedRole("Team Member");
                    setRoleLocked(false);
                    setTeamAssignOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3" />
                  Add Team Member
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          </div>

          {/* Google Drive Button */}
          <TooltipProvider>
          {googleDriveUrl ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => {
                    // Fire-and-forget: sync any unsynced docs to Drive
                    createDealDriveFolder(deal.id, { backfill: true }).catch(() => {});
                    window.open(googleDriveUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  <FolderOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open Google Drive Folder</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-dashed"
                  onClick={handleCreateDriveFolder}
                  disabled={creatingDrive}
                >
                  {creatingDrive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FolderPlus className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Create Google Drive Folder</TooltipContent>
            </Tooltip>
          )}
          </TooltipProvider>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <MoreHorizontal className="h-4 w-4" />
                Actions
                {contactSelection.hasSelection && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                    {contactSelection.selectedContacts.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setLogCallOpen(true)}>
                <Phone className="h-4 w-4 mr-2" />
                Log Call
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                if (contactSelection.hasSelection) {
                  const firstExternal = contactSelection.selectedExternal.find((c) => c.email);
                  if (firstExternal) {
                    // Collect internal team member emails for CC
                    const internalCcEmails = contactSelection.selectedInternal
                      .filter((c) => c.email)
                      .map((c) => c.email!);
                    setEmailToContact({
                      email: firstExternal.email!,
                      name: firstExternal.name,
                      contactId: firstExternal.crmContactId ?? firstExternal.id,
                      ccEmails: internalCcEmails.length > 0 ? internalCcEmails : undefined,
                    });
                    setEmailComposeOpen(true);
                  } else {
                    setSendEmailOpen(true);
                  }
                } else {
                  setSendEmailOpen(true);
                }
              }}>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
                {contactSelection.hasSelection && (
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {contactSelection.selectedContacts.length} selected
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                if (contactSelection.hasSelection) {
                  setFormRecipients(
                    contactSelection.selectedExternal
                      .filter((c) => c.email)
                      .map((c) => ({
                        id: c.crmContactId ?? c.id,
                        name: c.name,
                        email: c.email!,
                      }))
                  );
                } else {
                  setFormRecipients([]);
                }
                setSendFormOpen(true);
              }}>
                <Send className="h-4 w-4 mr-2" />
                Send Form
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGenerateDocOpen(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Generate Document
              </DropdownMenuItem>
              <SubmitForApprovalDialog
                entityType={approvalEntityType}
                entityId={deal.id}
                entityData={entityData}
                dealSnapshot={dealSnapshot}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Shield className="h-4 w-4 mr-2" />
                    Request Approval
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuSeparator />
              {deal.status === "lost" ? (
                <DropdownMenuItem
                  onClick={async () => {
                    const res = await updateDealStatusAction(deal.id, "active");
                    if (res.error) {
                      showError("Could not reopen deal", res.error);
                    } else {
                      showSuccess("Deal reopened");
                      router.refresh();
                    }
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reopen Deal
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={() => setClosedLostOpen(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Mark as Closed Lost
                </DropdownMenuItem>
              )}
              {isSuperAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => setDeleteDealOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>

      {/* ── ROW 2: Metrics Bar ── */}
      <div className="hidden md:flex items-center gap-6 px-3 md:px-6 py-2 border-b flex-shrink-0 bg-muted/20">
        <TooltipProvider>
          {/* Asset Type */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Asset</span>
                <InlineField
                  type="select"
                  value={HEADER_AC_KEY_TO_LABEL[assetClassKey ?? ""] ?? assetClass ?? ""}
                  options={HEADER_AC_LABELS}
                  onSave={(v) => onMetricSave("property_type", HEADER_AC_LABEL_TO_KEY[v] ?? v)}
                  className="font-semibold"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {HEADER_AC_KEY_TO_LABEL[assetClassKey ?? ""] ?? assetClass ?? "Not Set"}
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-border shrink-0" />

          {/* Loan Amount */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Loan</span>
                <InlineField
                  type="currency"
                  value={loanAmount}
                  formatValue={(v) => formatCompactCurrency(Number(v) || null)}
                  onSave={(v) => onMetricSave("loan_amount", v)}
                  className="font-semibold"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {loanAmount ? formatCompactCurrency(Number(loanAmount) || null) : "Not Set"}
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-border shrink-0" />

          {/* Close Date */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Close</span>
                <InlineField
                  type="date"
                  value={expectedClose ? String(expectedClose).split("T")[0] : null}
                  onSave={(v) => onMetricSave("close_date", v)}
                  formatValue={(v) => {
                    if (!v) return "—";
                    const [y, m, d] = String(v).split("-");
                    const dt = new Date(Number(y), Number(m) - 1, Number(d));
                    return formatDateShort(dt.toISOString());
                  }}
                  placeholder="—"
                  className="font-semibold"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {expectedClose ? (() => {
                const [y, m, d] = String(expectedClose).split("T")[0].split("-");
                const dt = new Date(Number(y), Number(m) - 1, Number(d));
                return formatDateShort(dt.toISOString());
              })() : "Not Set"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* ── Dialogs (rendered outside header layout, triggered by dropdown) ── */}

      {/* Delete deal (super admin) */}
      <Dialog open={deleteDealOpen} onOpenChange={setDeleteDealOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this deal?</DialogTitle>
            <DialogDescription>
              This permanently removes the deal from the pipeline, including related records that
              are stored only for this deal. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDealOpen(false)} disabled={deleteDealLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteDeal} disabled={deleteDealLoading}>
              {deleteDealLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Delete deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Closed Lost */}
      <Dialog open={closedLostOpen} onOpenChange={(open) => {
        if (!open) { setClosedLostOpen(false); setLossDescription(""); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Deal as Closed Lost</DialogTitle>
            <DialogDescription>
              This deal will be removed from the active pipeline. All records will be preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium">Why was this deal lost? *</label>
            <Textarea
              className="mt-2"
              placeholder="Describe why this deal was lost..."
              value={lossDescription}
              onChange={(e) => setLossDescription(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setClosedLostOpen(false); setLossDescription(""); }} disabled={isClosingLost}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!lossDescription.trim() || isClosingLost}
              onClick={async () => {
                setIsClosingLost(true);
                const res = await updateDealStatusAction(deal.id, "lost", lossDescription.trim());
                if (res.error) {
                  showError("Could not mark deal as lost", res.error);
                  setIsClosingLost(false);
                } else {
                  showSuccess("Deal marked as Closed Lost");
                  setClosedLostOpen(false);
                  setLossDescription("");
                  setIsClosingLost(false);
                  router.push("/pipeline");
                }
              }}
            >
              {isClosingLost && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Mark as Closed Lost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Call */}
      <Dialog open={logCallOpen} onOpenChange={setLogCallOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Call</DialogTitle>
            <DialogDescription>Record a phone call for this deal.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Contact Name</label>
              <Input value={callContact} onChange={(e) => setCallContact(e.target.value)} placeholder="Who did you speak with?" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea value={callNotes} onChange={(e) => setCallNotes(e.target.value)} placeholder="Call notes..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogCallOpen(false)}>Cancel</Button>
            <Button onClick={handleLogCall} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Log Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email */}
      <Dialog open={sendEmailOpen} onOpenChange={setSendEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Email</DialogTitle>
            <DialogDescription>Record an email sent for this deal.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Subject</label>
              <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Email subject" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea value={emailNotes} onChange={(e) => setEmailNotes(e.target.value)} placeholder="Email summary..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendEmailOpen(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Log Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Form */}
      <SendFormDialog
        open={sendFormOpen}
        onOpenChange={setSendFormOpen}
        dealId={deal.id}
        conditions={dealConditions}
        recipients={formRecipients}
        onConditionsMarked={(ids) => {
          setDealConditions((prev) =>
            prev.map((c) => ids.includes(c.id) ? { ...c, status: "requested" } : c)
          );
        }}
      />

      {/* Generate Document */}
      <GenerateDocumentDialog
        recordType="deal"
        recordId={deal.id}
        recordLabel={deal.name || undefined}
        open={generateDocOpen}
        onOpenChange={setGenerateDocOpen}
        conditions={dealConditions}
        onConditionsMarked={(ids) => {
          setDealConditions((prev) =>
            prev.map((c) => ids.includes(c.id) ? { ...c, status: "submitted" } : c)
          );
        }}
      />

      {/* Team Assignment */}
      <Dialog open={teamAssignOpen} onOpenChange={(open) => { setTeamAssignOpen(open); if (!open) setRoleLocked(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Select a team member and their role on this deal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Team Member</label>
              <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                <SelectTrigger><SelectValue placeholder="Select team member..." /></SelectTrigger>
                <SelectContent>
                  {teamMembers
                    .filter((p) => !dealTeamMembers.some((dtm) => dtm.profile_id === p.id))
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole} disabled={roleLocked}>
                <SelectTrigger><SelectValue placeholder="Select role..." /></SelectTrigger>
                <SelectContent>
                  {TEAM_ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeamAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTeamMember} disabled={actionLoading || !selectedProfileId || !selectedRole}>
              {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Borrower / Broker Dialog */}
      <AssignPartyDialog
        dealId={deal.id}
        open={assignPartyOpen}
        onClose={() => { setAssignPartyOpen(false); router.refresh(); }}
        partyType={assignPartyType}
        existingBorrowerCount={dealContacts.length}
        excludeContactIds={dealContacts.map((dc) => dc.contact_id)}
      />

      {/* Assign Title Co / Insurance Agent Dialog */}
      <AddDealTeamDialog
        dealId={deal.id}
        open={assignDealTeamOpen}
        onClose={() => { setAssignDealTeamOpen(false); router.refresh(); }}
        onAdd={() => { setAssignDealTeamOpen(false); router.refresh(); }}
        editContact={null}
        initialRole={assignDealTeamRole}
        roleLocked
      />

      {/* Contact email composer (from header popover) */}
      {emailToContact && (
        <EmailComposeSheet
          open={emailComposeOpen}
          onOpenChange={(open) => {
            setEmailComposeOpen(open);
            if (!open) setEmailToContact(null);
          }}
          toEmail={emailToContact.email}
          toName={emailToContact.name}
          linkedContactId={emailToContact.contactId}
          initialCc={emailToContact.ccEmails}
          linkedLoanId={deal.id}
          currentUserId={currentUserId}
          initialSubject={buildDealEmailSubject(displayId, deal.name)}
        />
      )}
    </>
  );
}

// ─── Underwriting Content ───

function UnderwritingContent({
  deal,
}: {
  deal: UnifiedDeal;
}) {
  const router = useRouter();
  const isCommercial = isCommercialDeal(deal);
  const sheetUrl =
    deal.google_sheet_url ??
    (deal.google_sheet_id
      ? `https://docs.google.com/spreadsheets/d/${deal.google_sheet_id}/edit`
      : null);

  if (isCommercial) {
    return (
      <CommercialUwWithData dealId={deal.id} sheetUrl={sheetUrl} />
    );
  }
  return (
    <div className="rq-tab-content">
      <EmptyState
        icon={AlertTriangle}
        title="Could not load underwriting model"
        description="The underwriting record could not be initialized. Try refreshing the page."
        action={{ label: "Refresh", onClick: () => router.refresh() }}
      />
    </div>
  );
}

// ─── Client-Side Data Wrappers ───

function CommercialUwWithData({ dealId, sheetUrl }: { dealId: string; sheetUrl: string | null }) {
  const { data, loading, error } = useCommercialUwData(dealId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        {error ?? "No underwriting data available"}
      </div>
    );
  }

  return <UnderwritingTab data={data} dealId={dealId} sheetUrl={sheetUrl} />;
}

function DocumentsTabWithData({
  deal,
  currentUserId,
  currentUserName,
}: {
  deal: UnifiedDeal;
  currentUserId: string;
  currentUserName: string;
}) {
  const googleDriveFolderId = (deal as unknown as Record<string, unknown>).google_drive_folder_id as string | null;
  const { documents, conditions, loading, refetch } = useDocumentsTabData(deal.id, googleDriveFolderId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <DocumentsTab
      documents={documents}
      conditions={conditions}
      dealId={deal.id}
      dealName={(deal as { name?: string }).name ?? undefined}
      googleDriveFolderUrl={(deal as unknown as Record<string, unknown>).google_drive_folder_url as string | null}
      googleDriveFolderId={googleDriveFolderId}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      onUploadComplete={refetch}
      dealDocData={{
        id: deal.id,
        name: (deal as { name?: string }).name ?? "Deal",
        amount: (deal as unknown as Record<string, unknown>).amount as number | undefined,
        asset_class: deal.asset_class ?? undefined,
        capital_side: deal.capital_side ?? undefined,
        stage: deal.stage,
        property_data: (deal as unknown as Record<string, unknown>).property_data as Record<string, unknown> | undefined,
        uw_data: (deal.uw_data ?? undefined) as Record<string, unknown> | undefined,
      }}
    />
  );
}

