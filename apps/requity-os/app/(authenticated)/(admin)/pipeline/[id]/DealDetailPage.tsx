"use client";

import React, { useState, useCallback, useTransition, useMemo, lazy, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import { cn } from "@/lib/utils";
import { formatDateShort } from "@/lib/format";
import { showSuccess, showError } from "@/lib/toast";
import {
  Layers,
  Clock,
  Phone,
  Mail,
  Shield,
  Users,
  CalendarDays,
  Plus,
  Loader2,
  FileText,
  X,
  ExternalLink,
  MoreHorizontal,
  ChevronDown,
  FolderOpen,
  Building2,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StageStepper } from "@/components/pipeline/StageStepper";
import { DealOverviewSummary } from "@/components/pipeline/DealOverviewSummary";
import { EditableOverview } from "@/components/pipeline/EditableOverview";
import { UnderwritingPanel } from "@/components/pipeline/UnderwritingPanel";
import { DealTasks } from "@/components/tasks/deal-tasks";
import { UnifiedNotes } from "@/components/shared/UnifiedNotes";
import type { CommercialUWData } from "@/components/pipeline/tabs/UnderwritingTab";

// Lazy-load heavy tab components (only downloaded when user navigates to that tab)
const DiligenceTab = lazy(() => import("@/components/pipeline/tabs/DiligenceTab").then(m => ({ default: m.DiligenceTab })));
const PropertyTab = lazy(() => import("@/components/pipeline/tabs/PropertyTab").then(m => ({ default: m.PropertyTab })));
const BorrowerContactsTab = lazy(() => import("@/components/borrower").then(m => ({ default: m.BorrowerContactsTab })));
const UnderwritingTab = lazy(() => import("@/components/pipeline/tabs/UnderwritingTab").then(m => ({ default: m.UnderwritingTab })));
import {
  InlineLayoutProvider,
  useInlineLayout,
  InlineLayoutToolbar,
  TabEditPopover,
} from "@/components/inline-layout-editor";
import { useDealLayout } from "@/hooks/useDealLayout";
import { Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { reorderTabs } from "@/app/(authenticated)/control-center/object-manager/actions";

import {
  type UnifiedDeal,
  type StageConfig,
  type DealCondition,
  STAGES,
  CAPITAL_SIDE_COLORS,
  ASSET_CLASS_LABELS,
  type AssetClass,
  formatCurrency,
  daysInStage,
} from "@/components/pipeline/pipeline-types";
import {
  advanceStageAction,
  regressStageAction,
} from "@/app/(authenticated)/(admin)/pipeline/actions";
import { normalizeAssetClass, isCommercialDeal, type VisibilityContext } from "@/lib/visibility-engine";
import { getDealDisplayConfig, getDealFlavor } from "@/lib/pipeline/deal-display-config";
import { ResidentialAnalysisTab } from "@/components/pipeline/tabs/ResidentialAnalysisTab";

const DealActivityTab = lazy(() => import("@/components/pipeline/tabs/DealActivityTab").then(m => ({ default: m.DealActivityTab })));
const DealMessagesPanel = lazy(() => import("@/components/pipeline/DealMessagesPanel").then(m => ({ default: m.DealMessagesPanel })));
const FormsTab = lazy(() => import("@/components/pipeline/tabs/FormsTab").then(m => ({ default: m.FormsTab })));
import { DealNotePreview } from "@/components/pipeline/DealNotePreview";
import type { DealPreviewNote } from "@/components/pipeline/DealNotePreview";
import {
  logQuickActionV2,
  addDealTeamMember,
  removeDealTeamMember,
  createDealDriveFolder,
  deleteUnifiedDealSuperAdmin,
} from "./actions";
import { SubmitForApprovalDialog } from "@/components/approvals/submit-for-approval-dialog";
import type { ApprovalEntityType } from "@/lib/approvals/types";
import type { OpsTask, Profile } from "@/lib/tasks";
import type { DealTeamContact } from "@/app/types/deal-team";

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

// ─── Props ───

interface DealDetailPageProps {
  deal: UnifiedDeal;
  stageConfigs: StageConfig[];
  conditions: DealCondition[];
  teamMembers: Profile[];
  dealTeamMembers: DealTeamMember[];
  dealTeamContacts: DealTeamContact[];
  currentUserId: string;
  currentUserName: string;
  documents: Record<string, unknown>[];
  tasks: OpsTask[];
  commercialUWData: CommercialUWData | null;
  pinnedNote: DealPreviewNote | null;
  recentNote: DealPreviewNote | null;
  isSuperAdmin?: boolean;
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
  conditions,
  teamMembers,
  dealTeamMembers,
  dealTeamContacts,
  currentUserId,
  currentUserName,
  documents,
  tasks,
  commercialUWData,
  pinnedNote,
  recentNote,
  isSuperAdmin = false,
}: DealDetailPageProps) {
  const UNIVERSAL_TABS = [
    "Overview",
    "Property",
    "Analysis",
    "Underwriting",
    "Borrower",
    "Forms",
    "Diligence",
    "Messages",
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
    if (t === "contacts") return "borrower";
    if (t === "conditions" || t === "documents") return "diligence";
    if (t === "tasks" || t === "activity" || t === "notes") return "overview";
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
      contacts: "borrower",
      conditions: "diligence",
      documents: "diligence",
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

  // Stage double-click navigation
  const [stageJumping, startStageJump] = useTransition();

  const handleStageDoubleClick = useCallback(
    (targetStage: string) => {
      if (targetStage === deal.stage) return;

      const currentIdx = STAGES.findIndex((s) => s.key === deal.stage);
      const targetIdx = STAGES.findIndex((s) => s.key === targetStage);
      const label = STAGES.find((s) => s.key === targetStage)?.label ?? targetStage;

      startStageJump(async () => {
        if (targetIdx < currentIdx) {
          const res = await regressStageAction(deal.id, targetStage);
          if (res.error) {
            showError(`Cannot move stage: ${res.error}`);
          } else {
            showSuccess(`Moved to ${label}`);
            router.refresh();
          }
        } else {
          const res = await advanceStageAction(deal.id, targetStage);
          if (res.error) {
            showError(`Cannot advance: ${res.error}`);
          } else {
            showSuccess(`Advanced to ${label}`);
            router.refresh();
          }
        }
      });
    },
    [deal.id, deal.stage, router]
  );

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-3 text-[13px]">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/pipeline">Pipeline</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/pipeline">{dealConfig.label}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{displayId}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <DealHeader
          deal={deal}
          shortLabel={shortLabel}
          days={days}
          dealTeamMembers={dealTeamMembers}
          teamMembers={teamMembers}
          currentUserId={currentUserId}
          isSuperAdmin={isSuperAdmin}
        />

        {/* Stage Stepper */}
        <div className="mt-6 rounded-xl border bg-card px-5 py-4">
          <StageStepper
            currentStage={deal.stage}
            interactive
            loading={stageJumping}
            onStageDoubleClick={handleStageDoubleClick}
          />
        </div>

        {/* Pinned / recent note preview strip — visible on all tabs */}
        <DealNotePreview
          pinnedNote={pinnedNote}
          recentNote={recentNote}
          onClickGoToNotes={() => handleTabChange("Overview")}
        />

        {/* Tab Bar */}
        <div className="mt-6 mb-6 flex items-center justify-between">
          <div className="inline-flex gap-0.5 rounded-[10px] p-[3px] bg-muted border">
            {tabs.map((tab) => {
              const tabButton = (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border-none px-3.5 py-[7px] text-[13px] cursor-pointer transition-all duration-150",
                    activeTab === tab
                      ? "bg-background text-foreground font-medium shadow-sm"
                      : "bg-transparent text-muted-foreground hover:text-foreground",
                    inlineLayout.state.isEditing && "hover:ring-1 hover:ring-primary/30"
                  )}
                >
                  {tab === "Borrower" ? (
                    <>
                      <Building2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
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
                            "flex items-center gap-1.5 rounded-lg border-none px-3.5 py-[7px] text-[13px] cursor-pointer transition-all duration-150",
                            activeTab === tab
                              ? "bg-background text-foreground font-medium shadow-sm"
                              : "bg-transparent text-muted-foreground hover:text-foreground",
                            "hover:ring-1 hover:ring-primary/30"
                          )}
                        >
                          {tab === "Borrower" ? (
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

          {/* Edit Layout toggle (super_admin only) */}
          {isSuperAdmin && !inlineLayout.state.isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => {
                inlineLayout.setActiveTabKey(activeTab.toLowerCase());
                inlineLayout.startEditing(layout.sections, layout.fields);
              }}
            >
              <Pencil className="h-3 w-3" />
              Edit Layout
            </Button>
          )}
        </div>

        {/* Inline Layout Toolbar (shown when editing) */}
        <InlineLayoutToolbar onSaveComplete={() => layout.refetch()} tabs={layout.tabs} />

        {/* Tab Content */}
        <div className="flex flex-col gap-4 min-w-0">
          {loadedTabs.has("Overview") && (
            <div className={activeTab !== "Overview" ? "hidden" : undefined}>
              <DealOverviewSummary dealId={deal.id} deal={deal} />

              {/* Tasks section */}
              <div className="mt-4">
                <DealTasks
                  dealId={deal.id}
                  dealLabel={deal.deal_number ?? deal.name}
                  dealEntityType="deal"
                  tasks={tasks}
                  profiles={teamMembers}
                  currentUserId={currentUserId}
                />
              </div>

              {/* Notes section */}
              <div className="mt-4">
                <UnifiedNotes
                  entityType="deal"
                  entityId={deal.id}
                  dealId={deal.id}
                  showInternalToggle={true}
                  showFilters={true}
                  showPinning={true}
                />
              </div>

              {/* Activity feed */}
              <div className="mt-4">
                <Suspense fallback={<TabLoadingFallback />}>
                  <DealActivityTab
                    dealId={deal.id}
                    currentUserId={currentUserId}
                    primaryContactId={deal.primary_contact_id ?? null}
                  />
                </Suspense>
              </div>
            </div>
          )}
          {loadedTabs.has("Property") && (
            <div className={activeTab !== "Property" ? "hidden" : undefined}>
              <Suspense fallback={<TabLoadingFallback />}>
                <PropertyTab
                  dealId={deal.id}
                  propertyData={{
                    ...((deal.property_data as Record<string, unknown>) ?? {}),
                    ...Object.fromEntries(
                      Object.entries(deal.uw_data ?? {}).filter(([k]) =>
                        ["property_type", "property_address", "property_city", "property_state", "property_zip", "property_county", "number_of_units", "year_built", "total_sf", "parcel_id", "flood_zone_type", "purchase_price", "appraised_value"].includes(k)
                      )
                    ),
                  }}
                  visibilityContext={visibilityContext}
                />
              </Suspense>
            </div>
          )}
          {loadedTabs.has("Analysis") && (
            <div className={activeTab !== "Analysis" ? "hidden" : undefined}>
              <ResidentialAnalysisTab
                dealId={deal.id}
                uwData={(deal.uw_data as Record<string, unknown>) ?? {}}
              />
            </div>
          )}
          {loadedTabs.has("Underwriting") && (
            <div className={activeTab !== "Underwriting" ? "hidden" : undefined}>
              <Suspense fallback={<TabLoadingFallback />}>
                <UnderwritingContent
                  deal={deal}
                  commercialUWData={commercialUWData}
                  visibilityContext={visibilityContext}
                />
              </Suspense>
            </div>
          )}
          {loadedTabs.has("Borrower") && (
            <div className={activeTab !== "Borrower" ? "hidden" : undefined}>
              <Suspense fallback={<TabLoadingFallback />}>
                <BorrowerContactsTab dealId={deal.id} />
              </Suspense>
            </div>
          )}
          {loadedTabs.has("Forms") && (
            <div className={activeTab !== "Forms" ? "hidden" : undefined}>
              <Suspense fallback={<TabLoadingFallback />}>
                <FormsTab dealId={deal.id} />
              </Suspense>
            </div>
          )}
          {loadedTabs.has("Diligence") && (
            <div className={activeTab !== "Diligence" ? "hidden" : undefined}>
              <Suspense fallback={<TabLoadingFallback />}>
                <DiligenceTab
                  documents={documents as unknown as { id: string; deal_id: string; document_name: string; file_url: string; file_size_bytes: number | null; mime_type: string | null; category: string | null; uploaded_by: string | null; created_at: string; review_status: string | null; storage_path: string | null; visibility?: string | null; _uploaded_by_name?: string | null; archived_at?: string | null; condition_id?: string | null }[]}
                  conditions={conditions}
                  dealId={deal.id}
                  dealName={(deal as { name?: string }).name ?? undefined}
                  dealStage={deal.stage}
                  googleDriveFolderUrl={(deal as unknown as Record<string, unknown>).google_drive_folder_url as string | null}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                />
              </Suspense>
            </div>
          )}
          {loadedTabs.has("Messages") && (
            <div className={activeTab !== "Messages" ? "hidden" : undefined}>
              <Suspense fallback={<TabLoadingFallback />}>
                <DealMessagesPanel
                  dealId={deal.id}
                  currentUserId={currentUserId}
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// ─── Header (expanded: team popover, actions dropdown, advance CTA) ───

function DealHeader({
  deal,
  shortLabel,
  days,
  dealTeamMembers,
  teamMembers,
  currentUserId,
  isSuperAdmin,
}: {
  deal: UnifiedDeal;
  shortLabel: string;
  days: number;
  dealTeamMembers: DealTeamMember[];
  teamMembers: Profile[];
  currentUserId: string;
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const currentStageIndex = STAGES.findIndex((s) => s.key === deal.stage);

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
  const [actionLoading, setActionLoading] = useState(false);

  const [creatingDrive, setCreatingDrive] = useState(false);
  const [deleteDealOpen, setDeleteDealOpen] = useState(false);
  const [deleteDealLoading, setDeleteDealLoading] = useState(false);

  const resolvedMembers = dealTeamMembers.map((dtm) => {
    const profile = teamMembers.find((t) => t.id === dtm.profile_id);
    return { ...dtm, full_name: profile?.full_name ?? "Unknown" };
  });

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
      <div className="flex items-start justify-between gap-5">
        {/* Left: Deal Identity */}
        <div className="flex gap-4 items-start">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="m-0 text-[22px] font-bold tracking-tight">
                {deal.name}
              </h1>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] uppercase",
                  CAPITAL_SIDE_COLORS[deal.capital_side]
                )}
              >
                {shortLabel}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
              {deal.asset_class && (
                <span>
                  {ASSET_CLASS_LABELS[deal.asset_class as AssetClass] ??
                    deal.asset_class}
                </span>
              )}
              {deal.amount != null && (
                <span className="num font-medium text-foreground">
                  {formatCurrency(deal.amount)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="num">{days}</span> days in stage
              </span>
              {(() => {
                const uwData = deal.uw_data as Record<string, unknown> | null;
                const closeDate = uwData?.expected_close_date ?? uwData?.closing_date ?? deal.expected_close_date;
                if (!closeDate) return null;
                return (
                  <>
                    <span className="text-border">|</span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Est. Close:{" "}
                      <span className="num text-foreground">
                        {(() => {
                          const [y, m, d] = String(closeDate).split("T")[0].split("-");
                          const dt = new Date(Number(y), Number(m) - 1, Number(d));
                          return formatDateShort(dt.toISOString());
                        })()}
                      </span>
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Right: Team Avatars + Actions + Advance CTA */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Team Avatar Stack with Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted border-0 bg-transparent cursor-pointer">
                <div className="flex -space-x-1.5">
                  {resolvedMembers.slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-medium ring-2 ring-background"
                      title={`${m.full_name} (${m.role})`}
                    >
                      {m.full_name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  ))}
                  {resolvedMembers.length > 3 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs font-medium ring-2 ring-background">
                      +{resolvedMembers.length - 3}
                    </div>
                  )}
                  {resolvedMembers.length === 0 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-border">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="px-4 py-3 border-b">
                <h4 className="text-sm font-medium">Deal Team</h4>
              </div>
              <div className="py-2 px-2 max-h-[320px] overflow-y-auto">
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
                        <>
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-dashed border-border">
                            <Plus className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <button
                            className="text-left min-w-0 flex-1 bg-transparent border-0 cursor-pointer p-0"
                            onClick={() => {
                              setSelectedProfileId("");
                              setSelectedRole(role);
                              setTeamAssignOpen(true);
                            }}
                          >
                            <div className="text-xs text-muted-foreground">
                              Assign {role}
                            </div>
                          </button>
                        </>
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
              </div>
              <div className="border-t px-3 py-2.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-xs gap-1"
                  onClick={() => {
                    setSelectedProfileId("");
                    setSelectedRole("Team Member");
                    setTeamAssignOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3" />
                  Add Team Member
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Google Drive Button */}
          {googleDriveUrl ? (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              title="Open Google Drive Folder"
              onClick={() => {
                // Fire-and-forget: sync any unsynced docs to Drive
                createDealDriveFolder(deal.id, { backfill: true }).catch(() => {});
                window.open(googleDriveUrl, "_blank", "noopener,noreferrer");
              }}
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={handleCreateDriveFolder}
              disabled={creatingDrive}
              title="Create Google Drive Folder"
            >
              {creatingDrive ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          )}

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <MoreHorizontal className="h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-normal">
                Communication
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setLogCallOpen(true)}>
                <Phone className="h-4 w-4 mr-2" />
                Log Call
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSendEmailOpen(true)}>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-normal">
                Approvals
              </DropdownMenuLabel>
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

      {/* Team Assignment */}
      <Dialog open={teamAssignOpen} onOpenChange={setTeamAssignOpen}>
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
              <Select value={selectedRole} onValueChange={setSelectedRole}>
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
    </>
  );
}

// ─── Underwriting Content ───

function UnderwritingContent({
  deal,
  commercialUWData,
  visibilityContext,
}: {
  deal: UnifiedDeal;
  commercialUWData: CommercialUWData | null;
  visibilityContext: VisibilityContext;
}) {
  const isCommercial = isCommercialDeal(deal);
  const sheetUrl =
    deal.google_sheet_url ??
    (deal.google_sheet_id
      ? `https://docs.google.com/spreadsheets/d/${deal.google_sheet_id}/edit`
      : null);
  if (isCommercial && commercialUWData) {
    return (
      <UnderwritingTab
        data={commercialUWData}
        dealId={deal.id}
        sheetUrl={sheetUrl}
      />
    );
  }
  return (
    <UnderwritingPanel
      dealId={deal.id}
      uwData={deal.uw_data}
      visibilityContext={visibilityContext}
    />
  );
}

