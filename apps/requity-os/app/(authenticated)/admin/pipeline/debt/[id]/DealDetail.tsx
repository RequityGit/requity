"use client";

import { useState, useCallback } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "./Header";
import { Stepper } from "./Stepper";
import { Sidebar } from "./Sidebar";
import { OverviewTab } from "./tabs/OverviewTab";
import { ConditionsTab } from "./tabs/ConditionsTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { ActivityTab } from "./tabs/ActivityTab";
import { CommentsTab } from "./tabs/CommentsTab";
import { UnderwritingTab } from "./tabs/UnderwritingTab";
import { DealChatTab } from "@/components/deal/deal-chat-tab";
import { TasksTab, type DealTask } from "./tabs/TasksTab";
import { updateDealField, updateRelatedField } from "./update-deal-action";
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
  type CommentData,
  type ChatMessage,
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
  comments: CommentData[];
  chatMessages: ChatMessage[];
  dealTasks: DealTask[];
  isOpportunity: boolean;
  currentUserId: string;
  currentUserName: string;
  currentUserInitials: string;
  adminProfiles?: TeamProfile[];
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
  comments,
  chatMessages,
  dealTasks,
  isOpportunity,
  currentUserId,
  currentUserName,
  currentUserInitials,
  adminProfiles,
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
      // Update local state for computed display fields
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
    { key: "underwriting", label: "Underwriting" },
    { key: "conditions", label: "Conditions", count: openConditions || undefined },
    { key: "documents", label: "Documents", count: documents.length || undefined },
    { key: "tasks", label: "Tasks", count: openTaskCount || undefined },
    { key: "activity", label: "Activity" },
    { key: "comments", label: "Comments", count: comments.length || undefined },
    { key: "chat", label: "Chat" },
  ];

  const renderTab = () => {
    switch (tab) {
      case "overview":
        return <OverviewTab deal={deal} onSave={onSave} onSaveRelated={onSaveRelated} />;
      case "underwriting":
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
      case "comments":
        return (
          <CommentsTab
            comments={comments}
            loanId={deal.id}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserInitials={currentUserInitials}
            isOpportunity={isOpportunity}
          />
        );
      case "chat":
        return (
          <DealChatTab
            loanId={deal.id}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
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
      <div
        className="mb-3 flex items-center gap-1.5 text-[13px]"
        style={{ color: T.text.muted }}
      >
        <Link
          href="/admin/pipeline"
          className="no-underline hover:underline"
          style={{ color: T.accent.blue }}
        >
          Pipeline
        </Link>
        <ChevronRight size={12} color={T.text.muted} />
        <Link
          href="/admin/pipeline/debt"
          className="no-underline hover:underline"
          style={{ color: T.accent.blue }}
        >
          Debt
        </Link>
        <ChevronRight size={12} color={T.text.muted} />
        <span style={{ color: T.text.secondary }}>{displayId}</span>
      </div>

      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <Header deal={deal} stages={pipelineStages} isOpportunity={isOpportunity} />

        {/* Stage Tracker */}
        <div className="mt-6">
          <Stepper deal={deal} stages={pipelineStages} onStageClick={handleStageClick} updatingStage={updatingStage} />
        </div>

        {/* Tab Bar */}
        <div className="mt-6 mb-6">
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
