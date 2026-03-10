"use client";

import { useState, useCallback, useTransition } from "react";
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
import { toast } from "sonner";
import {
  Layers,
  Clock,
  Zap,
  ArrowUpRight,
  Phone,
  Mail,
  Shield,
  Calendar,
  Users,
  CalendarDays,
  Plus,
  Loader2,
  FileText,
} from "lucide-react";
import { GenerateDocumentDialog } from "@/components/documents/GenerateDocumentDialog";
import { StageStepper } from "@/components/pipeline-v2/StageStepper";
import { EditableOverview } from "@/components/pipeline-v2/EditableOverview";
import { UnderwritingPanel } from "@/components/pipeline-v2/UnderwritingPanel";
import { DocumentsTab } from "@/components/pipeline-v2/tabs/DocumentsTab";
import { DealTasks } from "@/components/tasks/deal-tasks";
import { ConditionsTab } from "@/components/pipeline-v2/tabs/ConditionsTab";
import { PropertyTab } from "@/components/pipeline-v2/tabs/PropertyTab";
import { ContactsTab } from "@/components/pipeline-v2/tabs/ContactsTab";
import { FinancialsTab, type CommercialUWData as FinancialsUWData } from "@/components/pipeline-v2/tabs/FinancialsTab";
import { CommercialUnderwritingTab, type CommercialUWData } from "@/components/pipeline-v2/tabs/CommercialUnderwritingTab";
import { GridProForma } from "@/components/pipeline-v2/GridProForma";
import {
  type UnifiedDeal,
  type UnifiedCardType,
  type StageConfig,
  type ChecklistItem,
  type DealCondition,
  type DealActivity,
  STAGES,
  CARD_TYPE_SHORT_LABELS,
  CAPITAL_SIDE_COLORS,
  ASSET_CLASS_LABELS,
  type AssetClass,
  formatCurrency,
  daysInStage,
} from "@/components/pipeline-v2/pipeline-types";
import {
  advanceStageAction,
} from "@/app/(authenticated)/admin/pipeline-v2/actions";
import { DealActivityTab } from "@/components/pipeline-v2/tabs/DealActivityTab";
import { UnifiedNotes } from "@/components/shared/UnifiedNotes";
import { logQuickActionV2, assignTeamMemberV2, saveGridOverrides } from "./actions";
import { SubmitForApprovalDialog } from "@/components/approvals/submit-for-approval-dialog";
import { LoanApprovalSection } from "@/components/approvals/loan-approval-section";
import type { ApprovalEntityType } from "@/lib/approvals/types";
import type { OpsTask, Profile } from "@/lib/tasks";
import type { ActivityData, EmailData } from "@/components/crm/contact-360/types";

// ─── Props ───

interface DealDetailPageProps {
  deal: UnifiedDeal;
  cardType: UnifiedCardType;
  stageConfigs: StageConfig[];
  checklist: ChecklistItem[];
  conditions: DealCondition[];
  activities: DealActivity[];
  crmActivities: ActivityData[];
  crmEmails: EmailData[];
  teamMembers: Profile[];
  currentUserId: string;
  currentUserName: string;
  documents: Record<string, unknown>[];
  tasks: OpsTask[];
  commercialUWData: CommercialUWData | null;
}

// ─── Main Component ───

export function DealDetailPage({
  deal,
  cardType,
  stageConfigs,
  checklist,
  conditions,
  activities,
  crmActivities,
  crmEmails,
  teamMembers,
  currentUserId,
  currentUserName,
  documents,
  tasks,
  commercialUWData,
}: DealDetailPageProps) {
  // Universal 10-tab layout — same for ALL card types
  const UNIVERSAL_TABS = [
    "Overview",
    "Property",
    "Financials",
    "Underwriting",
    "Contacts",
    "Conditions",
    "Documents",
    "Tasks",
    "Activity",
    "Notes",
  ] as const;
  const tabs = UNIVERSAL_TABS;

  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab = tabs.find((t) => t.toLowerCase() === tabParam?.toLowerCase()) ?? tabs[0];
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Track which tabs have been visited so we can keep them mounted
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(
    () => new Set([initialTab])
  );

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setLoadedTabs((prev) => {
      if (prev.has(tab)) return prev;
      return new Set(prev).add(tab);
    });
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
  }, [tabs]);

  const displayId = deal.deal_number ?? deal.id.slice(0, 8);
  const days = deal.days_in_stage ?? daysInStage(deal.stage_entered_at);
  const shortLabel = CARD_TYPE_SHORT_LABELS[cardType.slug] ?? cardType.label;

  // Derive borrower name for approval section
  const borrowerName = deal.primary_contact
    ? `${deal.primary_contact.first_name} ${deal.primary_contact.last_name}`.trim()
    : deal.company?.name ?? deal.name;

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-3 text-[13px]">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/pipeline">Pipeline</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/pipeline">{cardType.label}</Link>
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
          assignedName={
            teamMembers.find((t) => t.id === deal.assigned_to)?.full_name
          }
        />

        {/* Stage Stepper */}
        <div className="mt-6 rounded-xl border bg-card px-5 py-4">
          <StageStepper currentStage={deal.stage} />
        </div>

        {/* Inline Approval Status */}
        <div className="mt-4">
          <LoanApprovalSection
            loanId={deal.id}
            loanData={{
              loan_amount: deal.amount,
              property_type: (deal.uw_data as Record<string, unknown>)?.property_type,
              loan_type: (deal.uw_data as Record<string, unknown>)?.loan_type,
              type: cardType.slug,
              ltv: (deal.uw_data as Record<string, unknown>)?.ltv,
              interest_rate: (deal.uw_data as Record<string, unknown>)?.interest_rate,
              borrower_id: deal.primary_contact_id,
            }}
            borrowerName={borrowerName}
          />
        </div>

        {/* Tab Bar */}
        <div className="mt-6 mb-6">
          <div className="inline-flex gap-0.5 rounded-[10px] p-[3px] bg-muted border">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border-none px-3.5 py-[7px] text-[13px] cursor-pointer transition-all duration-150",
                  activeTab === tab
                    ? "bg-background text-foreground font-medium shadow-sm"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area: main + sidebar */}
        <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
          {/* Left: Tab Content — visited tabs stay mounted to preserve state */}
          <div className="flex flex-col gap-5 min-w-0">
            {loadedTabs.has("Overview") && (
              <div className={activeTab !== "Overview" ? "hidden" : undefined}>
                <EditableOverview
                  dealId={deal.id}
                  uwData={{
                    ...deal.uw_data,
                    expected_close_date: deal.expected_close_date,
                  }}
                  cardType={cardType}
                  checklist={checklist}
                />
              </div>
            )}
            {loadedTabs.has("Property") && (
              <div className={activeTab !== "Property" ? "hidden" : undefined}>
                <PropertyTab
                  dealId={deal.id}
                  propertyData={(deal.property_data as Record<string, unknown>) ?? {}}
                  cardType={cardType}
                />
              </div>
            )}
            {loadedTabs.has("Financials") && (
              <div className={activeTab !== "Financials" ? "hidden" : undefined}>
                <FinancialsContent
                  deal={deal}
                  cardType={cardType}
                  commercialUWData={commercialUWData}
                  currentUserId={currentUserId}
                />
              </div>
            )}
            {loadedTabs.has("Underwriting") && (
              <div className={activeTab !== "Underwriting" ? "hidden" : undefined}>
                <UnderwritingContent
                  deal={deal}
                  cardType={cardType}
                  commercialUWData={commercialUWData}
                />
              </div>
            )}
            {loadedTabs.has("Contacts") && (
              <div className={activeTab !== "Contacts" ? "hidden" : undefined}>
                <ContactsTab
                  deal={deal}
                  dealId={deal.id}
                  uwData={(deal.uw_data as Record<string, unknown>) ?? {}}
                  cardType={cardType}
                />
              </div>
            )}
            {loadedTabs.has("Conditions") && (
              <div className={activeTab !== "Conditions" ? "hidden" : undefined}>
                <ConditionsTab conditions={conditions} dealId={deal.id} />
              </div>
            )}
            {loadedTabs.has("Documents") && (
              <div className={activeTab !== "Documents" ? "hidden" : undefined}>
                <DocumentsTab
                  documents={documents as unknown as { id: string; deal_id: string; document_name: string; file_url: string; file_size_bytes: number | null; mime_type: string | null; category: string | null; uploaded_by: string | null; created_at: string; review_status: string | null; storage_path: string | null; _uploaded_by_name?: string | null }[]}
                  dealId={deal.id}
                />
              </div>
            )}
            {loadedTabs.has("Tasks") && (
              <div className={activeTab !== "Tasks" ? "hidden" : undefined}>
                <DealTasks
                  dealId={deal.id}
                  dealLabel={deal.deal_number ?? deal.name}
                  dealEntityType="deal"
                  tasks={tasks}
                  profiles={teamMembers}
                  currentUserId={currentUserId}
                />
              </div>
            )}
            {loadedTabs.has("Activity") && (
              <div className={activeTab !== "Activity" ? "hidden" : undefined}>
                <DealActivityTab
                  dealId={deal.id}
                  dealActivities={activities}
                  crmActivities={crmActivities}
                  crmEmails={crmEmails}
                  currentUserId={currentUserId}
                  primaryContactId={deal.primary_contact_id ?? null}
                />
              </div>
            )}
            {loadedTabs.has("Notes") && (
              <div className={activeTab !== "Notes" ? "hidden" : undefined}>
                <UnifiedNotes
                  entityType="deal"
                  entityId={deal.id}
                  dealId={deal.id}
                  showInternalToggle={true}
                  showFilters={true}
                  showPinning={true}
                />
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <DealSidebar
            deal={deal}
            cardType={cardType}
            stageConfigs={stageConfigs}
            teamMembers={teamMembers}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Header ───

function DealHeader({
  deal,
  shortLabel,
  days,
  assignedName,
}: {
  deal: UnifiedDeal;
  shortLabel: string;
  days: number;
  assignedName?: string;
}) {
  const currentStage = STAGES.find((s) => s.key === deal.stage);

  return (
    <div className="flex items-start justify-between gap-5">
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
            <Badge variant="outline" className="text-[10px] uppercase">
              {currentStage?.label ?? deal.stage}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
            {deal.deal_number && (
              <span className="num">{deal.deal_number}</span>
            )}
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
          </div>
        </div>
      </div>

      {/* Assigned */}
      {assignedName && (
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Assigned
            </span>
            <span className="text-xs text-foreground">{assignedName}</span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-medium">
            {assignedName
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Financials Content ───

function FinancialsContent({
  deal,
  cardType,
  commercialUWData,
  currentUserId,
}: {
  deal: UnifiedDeal;
  cardType: UnifiedCardType;
  commercialUWData: CommercialUWData | null;
  currentUserId: string;
}) {
  if (commercialUWData) {
    return (
      <FinancialsTab
        data={commercialUWData as FinancialsUWData}
        dealId={deal.id}
        currentUserId={currentUserId}
      />
    );
  }
  if (cardType.uw_grid?.rows?.length) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-1">Grid Pro Forma</h3>
          <p className="text-xs text-muted-foreground">
            Click any cell to override its value or formula.
          </p>
        </div>
        <GridProForma
          template={cardType.uw_grid}
          uwData={deal.uw_data}
          overrides={deal.uw_grid_overrides ?? {}}
          onOverridesChange={async (overrides) => {
            const result = await saveGridOverrides(deal.id, overrides);
            if (result.error) {
              toast.error(result.error);
            }
          }}
        />
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <p className="text-sm text-muted-foreground">
        Financial modeling is available for commercial deals. Use the
        Underwriting tab for standard deal metrics.
      </p>
    </div>
  );
}

// ─── Underwriting Content ───

function UnderwritingContent({
  deal,
  cardType,
  commercialUWData,
}: {
  deal: UnifiedDeal;
  cardType: UnifiedCardType;
  commercialUWData: CommercialUWData | null;
}) {
  const isCommercial = cardType.slug === "comm_debt";
  if (isCommercial && commercialUWData) {
    return (
      <CommercialUnderwritingTab
        data={commercialUWData}
        dealId={deal.id}
      />
    );
  }
  return (
    <UnderwritingPanel
      cardType={cardType}
      dealId={deal.id}
      uwData={deal.uw_data}
    />
  );
}

// ─── Sidebar ───

function DealSidebar({
  deal,
  cardType,
  stageConfigs,
  teamMembers,
  currentUserId,
  currentUserName,
}: {
  deal: UnifiedDeal;
  cardType: UnifiedCardType;
  stageConfigs: StageConfig[];
  teamMembers: Profile[];
  currentUserId: string;
  currentUserName: string;
}) {
  const router = useRouter();
  const [advancing, startAdvance] = useTransition();

  // Quick action dialogs
  const [logCallOpen, setLogCallOpen] = useState(false);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [scheduleClosingOpen, setScheduleClosingOpen] = useState(false);
  const [teamAssignOpen, setTeamAssignOpen] = useState(false);

  // Form states
  const [callContact, setCallContact] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailNotes, setEmailNotes] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState(
    deal.assigned_to ?? ""
  );
  const [actionLoading, setActionLoading] = useState(false);

  // Next stage
  const currentStageIndex = STAGES.findIndex((s) => s.key === deal.stage);
  const nextStage = STAGES[currentStageIndex + 1];

  function handleAdvanceStage() {
    if (!nextStage) return;
    startAdvance(async () => {
      const result = await advanceStageAction(deal.id, nextStage.key);
      if (result.error) {
        toast.error(`Cannot advance: ${result.error}`);
      } else {
        toast.success(`Advanced to ${nextStage.label}`);
        router.refresh();
      }
    });
  }

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
      toast.success("Call logged");
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
      toast.success("Email logged");
      router.refresh();
    } finally {
      setActionLoading(false);
    }
  }, [deal.id, emailSubject, emailNotes, router]);

  const handleScheduleClosing = useCallback(async () => {
    setActionLoading(true);
    try {
      await logQuickActionV2(
        deal.id,
        "closing_scheduled",
        `Closing scheduled for ${closingDate}${closingNotes ? `: ${closingNotes}` : ""}`,
        { date: closingDate, notes: closingNotes }
      );
      setScheduleClosingOpen(false);
      setClosingDate("");
      setClosingNotes("");
      toast.success("Closing scheduled");
      router.refresh();
    } finally {
      setActionLoading(false);
    }
  }, [deal.id, closingDate, closingNotes, router]);

  const handleAssignTeam = useCallback(async () => {
    if (!selectedProfileId) return;
    setActionLoading(true);
    try {
      const result = await assignTeamMemberV2(
        deal.id,
        selectedProfileId || null
      );
      if (result.error) {
        toast.error(`Failed to assign: ${result.error}`);
      } else {
        toast.success("Team member assigned");
        router.refresh();
      }
      setTeamAssignOpen(false);
    } finally {
      setActionLoading(false);
    }
  }, [deal.id, selectedProfileId, router]);

  const assignedMember = teamMembers.find((t) => t.id === deal.assigned_to);

  const dates = [
    { label: "Created", value: deal.created_at },
    { label: "Last Updated", value: deal.updated_at },
    { label: "Est. Close", value: deal.expected_close_date },
    { label: "Actual Close", value: deal.actual_close_date },
  ];

  // Approval dialog data
  const approvalBorrowerName = deal.primary_contact
    ? `${deal.primary_contact.first_name} ${deal.primary_contact.last_name}`.trim()
    : deal.company?.name ?? deal.name;

  const approvalEntityType: ApprovalEntityType = "loan";

  const dealSnapshot: Record<string, unknown> = {
    borrower_name: approvalBorrowerName,
    loan_amount: deal.amount,
    property_type: (deal.uw_data as Record<string, unknown>)?.property_type,
    loan_type: (deal.uw_data as Record<string, unknown>)?.loan_type,
    type: cardType.slug,
    stage: deal.stage,
    ltv: (deal.uw_data as Record<string, unknown>)?.ltv,
    interest_rate: (deal.uw_data as Record<string, unknown>)?.interest_rate,
  };

  const entityData: Record<string, unknown> = {
    ...deal.uw_data,
    loan_amount: deal.amount,
    borrower_name: approvalBorrowerName,
    // Map opportunity fields to the names the loan approval checklist expects
    type: (deal.uw_data as Record<string, unknown>)?.loan_type ?? null,
    borrower_id: deal.primary_contact_id ?? null,
  };

  return (
    <div className="flex w-full flex-col gap-4 sticky top-5">
      {/* Quick Actions */}
      <SidebarSection title="Quick Actions" icon={Zap}>
        <div className="flex flex-col gap-0.5">
          {nextStage && deal.stage !== "closed" && (
            <QuickAction
              icon={ArrowUpRight}
              label={`Advance to ${nextStage.label}`}
              accent
              onClick={handleAdvanceStage}
              loading={advancing}
            />
          )}
          <QuickAction
            icon={Phone}
            label="Log Call"
            onClick={() => setLogCallOpen(true)}
          />
          <QuickAction
            icon={Mail}
            label="Send Email"
            onClick={() => setSendEmailOpen(true)}
          />
          <GenerateDocumentDialog
            recordType="deal"
            recordId={deal.id}
            recordLabel={deal.name}
            trigger={
              <button
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg border-none px-2.5 py-2 text-left text-[13px] font-medium cursor-pointer transition-colors duration-150 bg-transparent",
                  "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <FileText className="h-4 w-4" />
                Generate Document
              </button>
            }
          />
          <SubmitForApprovalDialog
            entityType={approvalEntityType}
            entityId={deal.id}
            entityData={entityData}
            dealSnapshot={dealSnapshot}
            trigger={
              <button
                className="flex w-full items-center gap-2.5 rounded-lg border-none px-2.5 py-2 text-left text-[13px] font-medium cursor-pointer transition-colors duration-150 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Shield className="h-4 w-4" />
                Request Approval
              </button>
            }
          />
          <QuickAction
            icon={Calendar}
            label="Schedule Closing"
            onClick={() => setScheduleClosingOpen(true)}
          />
        </div>
      </SidebarSection>

      {/* Team */}
      <SidebarSection title="Team" icon={Users}>
        <button
          className="flex items-center gap-2.5 w-full bg-transparent border-0 cursor-pointer rounded-lg px-1 -mx-1 py-1 transition-colors hover:bg-muted"
          onClick={() => {
            setSelectedProfileId(deal.assigned_to ?? "");
            setTeamAssignOpen(true);
          }}
        >
          {assignedMember ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-[10px] font-medium">
              {assignedMember.full_name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-dashed border-border">
              <Plus className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
          <div className="text-left">
            <div
              className={cn(
                "text-xs font-medium",
                assignedMember
                  ? "text-foreground"
                  : "text-muted-foreground italic"
              )}
            >
              {assignedMember?.full_name ?? "Unassigned"}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Assigned To
            </div>
          </div>
        </button>
      </SidebarSection>

      {/* Key Dates */}
      <SidebarSection title="Key Dates" icon={CalendarDays}>
        <div className="flex flex-col">
          {dates.map((d) => (
            <div
              key={d.label}
              className="flex justify-between py-1.5 border-b border-border/50 last:border-0"
            >
              <span className="text-xs text-muted-foreground">{d.label}</span>
              <span
                className={cn(
                  "text-xs num",
                  d.value ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {d.value
                  ? new Date(d.value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "\u2014"}
              </span>
            </div>
          ))}
        </div>
      </SidebarSection>

      {/* ── Dialogs ── */}

      {/* Log Call */}
      <Dialog open={logCallOpen} onOpenChange={setLogCallOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Call</DialogTitle>
            <DialogDescription>
              Record a phone call for this deal.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Contact Name
              </label>
              <Input
                value={callContact}
                onChange={(e) => setCallContact(e.target.value)}
                placeholder="Who did you speak with?"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Call notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogCallOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogCall} disabled={actionLoading}>
              {actionLoading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              )}
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
            <DialogDescription>
              Record an email sent for this deal.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Subject</label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea
                value={emailNotes}
                onChange={(e) => setEmailNotes(e.target.value)}
                placeholder="Email summary..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendEmailOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={actionLoading}>
              {actionLoading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              )}
              Log Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Closing */}
      <Dialog
        open={scheduleClosingOpen}
        onOpenChange={setScheduleClosingOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Closing</DialogTitle>
            <DialogDescription>
              Set the closing date for this deal.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Closing Date
              </label>
              <Input
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Closing notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setScheduleClosingOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleScheduleClosing}
              disabled={actionLoading || !closingDate}
            >
              {actionLoading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              )}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Assignment */}
      <Dialog open={teamAssignOpen} onOpenChange={setTeamAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Team Member</DialogTitle>
            <DialogDescription>
              Select a team member to assign to this deal.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Select
              value={selectedProfileId}
              onValueChange={setSelectedProfileId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team member..." />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTeamAssignOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignTeam}
              disabled={actionLoading || !selectedProfileId}
            >
              {actionLoading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              )}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sidebar Section ───

function SidebarSection({
  title,
  icon: Ic,
  children,
}: {
  title: string;
  icon: typeof Zap;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Ic className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Quick Action Button ───

function QuickAction({
  icon: Ic,
  label,
  accent,
  onClick,
  loading,
}: {
  icon: typeof ArrowUpRight;
  label: string;
  accent?: boolean;
  onClick?: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg border-none px-2.5 py-2 text-left text-[13px] font-medium cursor-pointer transition-colors duration-150 bg-transparent",
        accent
          ? "text-primary hover:bg-primary/10"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Ic className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}

