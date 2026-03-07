"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRouter } from "next/navigation";
import { Header } from "./Header";
import { Stepper } from "./Stepper";
import { Sidebar } from "./Sidebar";
import { DealKpiStrip } from "./DealKpiStrip";
import { OverviewTab } from "./tabs/OverviewTab";
import { ConditionsTab } from "./tabs/ConditionsTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { ActivityTab } from "./tabs/ActivityTab";
import { UnderwritingTab } from "./tabs/UnderwritingTab";
import { TasksTab, type DealTask } from "./tabs/TasksTab";
import { FinancialsTab } from "./tabs/FinancialsTab";
import { BorrowerTab } from "./tabs/BorrowerTab";
import { UnifiedNotes } from "@/components/shared/UnifiedNotes";
import { CommercialOverviewTab, type CommercialUWData } from "./tabs/CommercialOverviewTab";
import { CommercialUnderwritingTab } from "./tabs/CommercialUnderwritingTab";
import { updateDealField, updateRelatedField } from "./update-deal-action";
import { LoanApprovalSection } from "@/components/approvals/loan-approval-section";
import { advanceStage, advanceOpportunityStage } from "./actions";
import { useToast } from "@/components/ui/use-toast";
import {
  T,
  getDefaultTab,
  type DealData,
  type StageHistoryEntry,
  type PipelineStage,
  type UWVersion,
  type ConditionData,
  type DocumentData,
  type ActivityData,
} from "./components";

export interface TeamProfile {
  id: string;
  full_name: string;
}

interface DealDetailProps {
  deal: DealData;
  stageHistory: StageHistoryEntry[];
  pipelineStages: PipelineStage[];
  uwVersions: UWVersion[];
  conditions: ConditionData[];
  documents: DocumentData[];
  activity: ActivityData[];
  dealTasks: DealTask[];
  isOpportunity: boolean;
  currentUserId: string;
  currentUserName: string;
  currentUserInitials: string;
  adminProfiles?: TeamProfile[];
  commercialUW?: CommercialUWData | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  propertyFinancials?: any;
  propertyId?: string | null;
}

interface TabConfig {
  key: string;
  label: string;
  count?: number;
}

export function DealDetail({
  deal: initialDeal,
  stageHistory,
  pipelineStages,
  uwVersions,
  conditions,
  documents,
  activity,
  dealTasks,
  isOpportunity,
  currentUserId,
  currentUserName,
  currentUserInitials,
  adminProfiles,
  commercialUW,
  propertyFinancials,
  propertyId,
}: DealDetailProps) {
  const [tab, setTab] = useState(getDefaultTab(initialDeal.stage));
  const [deal, setDeal] = useState<DealData>(initialDeal);
  const [updatingStage, setUpdatingStage] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSave = useCallback(
    async (field: string, value: string | number | null): Promise<boolean> => {
      const result = await updateDealField(deal.id, { [field]: value }, isOpportunity);
      if (result.error) {
        console.error("Failed to update field:", result.error);
        toast({
          title: "Failed to save",
          description: result.error,
          variant: "destructive",
        });
        return false;
      }
      setDeal((prev) => ({ ...prev, [field]: value }));
      router.refresh();
      return true;
    },
    [deal.id, isOpportunity, router, toast]
  );

  const handleSaveRelated = useCallback(
    async (
      table: string,
      id: string,
      field: string,
      value: string | number | null
    ): Promise<boolean> => {
      const result = await updateRelatedField(table, id, field, value);
      if (result.error) {
        console.error("Failed to update related field:", result.error);
        toast({
          title: "Failed to save",
          description: result.error,
          variant: "destructive",
        });
        return false;
      }
      if (table === "borrower_entities") {
        if (field === "entity_name") setDeal((prev) => ({ ...prev, _entity_name: value as string }));
        if (field === "entity_type") setDeal((prev) => ({ ...prev, _entity_type: value as string }));
      }
      if (table === "borrowers") {
        if (field === "credit_score") setDeal((prev) => ({ ...prev, _borrower_credit_score: value as number }));
        if (field === "experience_count") setDeal((prev) => ({ ...prev, _borrower_experience: value as number }));
        if (field === "verified_liquidity") setDeal((prev) => ({ ...prev, _borrower_liquidity: value as number }));
      }
      router.refresh();
      return true;
    },
    [router, toast]
  );

  const handleStageClick = useCallback(
    async (toStage: string) => {
      if (updatingStage || toStage === deal.stage) return;
      setUpdatingStage(true);
      try {
        const result = isOpportunity
          ? await advanceOpportunityStage(deal.id, deal.stage, toStage, currentUserId, currentUserName)
          : await advanceStage(deal.id, deal.stage, toStage, currentUserId, currentUserName);
        if (result.error) {
          console.error("Stage change error:", result.error);
          toast({
            title: "Failed to change stage",
            description: result.error,
            variant: "destructive",
          });
        } else {
          setDeal((prev) => ({ ...prev, stage: toStage }));
          router.refresh();
        }
      } finally {
        setUpdatingStage(false);
      }
    },
    [deal.id, deal.stage, isOpportunity, currentUserId, currentUserName, updatingStage, router]
  );

  const onSave = handleSave;
  const onSaveRelated = handleSaveRelated;

  const openConditions = conditions.filter(
    (c) =>
      c.status !== "cleared" &&
      c.status !== "approved" &&
      c.status !== "waived"
  ).length;

  const openTaskCount = dealTasks.filter((t) => t.status !== "Complete").length;

  const tabs: TabConfig[] = [
    { key: "overview", label: "Overview" },
    { key: "financials", label: "Financials" },
    { key: "underwriting", label: "Underwriting" },
    { key: "borrower", label: "Borrower" },
    { key: "conditions", label: "Conditions", count: openConditions || undefined },
    { key: "documents", label: "Documents", count: documents.length || undefined },
    { key: "tasks", label: "Tasks", count: openTaskCount || undefined },
    { key: "activity", label: "Activity" },
    { key: "notes", label: "Notes" },
  ];

  const isCommercial = deal.type === "commercial" || deal.loan_type === "commercial";

  const renderTab = () => {
    switch (tab) {
      case "overview":
        if (isCommercial && commercialUW) {
          return <CommercialOverviewTab data={commercialUW} dealId={deal.id} currentUserId={currentUserId} propertyFinancials={propertyFinancials} propertyId={propertyId ?? null} />;
        }
        return <OverviewTab deal={deal} onSave={onSave} onSaveRelated={onSaveRelated} />;
      case "financials":
        return (
          <FinancialsTab
            commercialUW={commercialUW}
            propertyFinancials={propertyFinancials}
            deal={deal}
          />
        );
      case "underwriting":
        if (isCommercial && commercialUW) {
          return <CommercialUnderwritingTab data={commercialUW} />;
        }
        return (
          <UnderwritingTab
            dealId={deal.id}
            dealType={deal.type ?? null}
            uwVersions={uwVersions}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            isOpportunity={isOpportunity}
          />
        );
      case "borrower":
        return <BorrowerTab deal={deal} />;
      case "conditions":
        return <ConditionsTab conditions={conditions} />;
      case "documents":
        return <DocumentsTab documents={documents} />;
      case "tasks":
        return (
          <TasksTab
            tasks={dealTasks}
            dealId={deal.id}
            currentUserId={currentUserId}
            adminProfiles={adminProfiles}
          />
        );
      case "activity":
        return <ActivityTab activity={activity} />;
      case "notes":
        return (
          <UnifiedNotes
            entityType="deal"
            entityId={deal.id}
            loanId={isOpportunity ? undefined : deal.id}
            opportunityId={isOpportunity ? deal.id : (deal as DealData & { opportunity_id?: string }).opportunity_id}
            showInternalToggle
            showFilters
          />
        );
      default:
        return null;
    }
  };

  const displayId = deal.loan_number || deal.id?.slice(0, 8);

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
              <Link href="/admin/pipeline/debt">Debt</Link>
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
        <Header deal={deal} stages={pipelineStages} isOpportunity={isOpportunity} />

        {/* Stage Tracker */}
        <div className="mt-6">
          <Stepper deal={deal} stages={pipelineStages} onStageClick={handleStageClick} updatingStage={updatingStage} />
        </div>

        {/* Inline Approval Status */}
        <div className="mt-4">
          <LoanApprovalSection
            loanId={deal.id}
            loanData={deal}
            borrowerName={deal._borrower_name || "Unknown"}
          />
        </div>

        {/* KPI Strip */}
        <div className="mt-5">
          <DealKpiStrip
            loanAmount={deal.loan_amount}
            ltv={deal.ltv}
            currentDSCR={deal.dscr_ratio}
            proFormaDSCR={null}
            interestRate={deal.interest_rate}
            termMonths={deal.loan_term_months ?? deal.term_months}
          />
        </div>

        {/* Tab Bar */}
        <div className="mt-5 mb-5">
          <div
            className="inline-flex gap-0.5 rounded-[10px] p-[3px]"
            style={{
              backgroundColor: T.bg.surface,
              border: `1px solid ${T.bg.border}`,
            }}
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-1.5 rounded-lg border-none px-3.5 py-[7px] text-[13px] cursor-pointer transition-all duration-150"
                style={{
                  backgroundColor: tab === t.key ? T.bg.elevated : "transparent",
                  color: tab === t.key ? T.text.primary : T.text.muted,
                  fontWeight: tab === t.key ? 550 : 400,
                  boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
                }}
              >
                {t.label}
                {t.count != null && (
                  <span
                    className="text-[10px] font-semibold rounded-[5px] px-[5px] py-px num"
                    style={{
                      backgroundColor: tab === t.key ? T.accent.blue + "22" : T.bg.border,
                      color: tab === t.key ? T.accent.blue : T.text.muted,
                    }}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
          {/* Left Column */}
          <div className="flex flex-col gap-5 min-w-0">
            {renderTab()}
          </div>

          {/* Right Sidebar */}
          <Sidebar
            deal={deal}
            stages={pipelineStages}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onSave={onSave}
            adminProfiles={adminProfiles}
            isOpportunity={isOpportunity}
          />
        </div>
      </div>
    </div>
  );
}
