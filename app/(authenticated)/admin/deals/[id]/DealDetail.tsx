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
import { ChatTab } from "./tabs/ChatTab";
import { UnderwritingTab } from "./tabs/UnderwritingTab";
import { updateDealField } from "./update-deal-action";
import {
  getDefaultTab,
  type DealData,
  type StageHistoryEntry,
  type ConditionData,
  type DocumentData,
  type ActivityData,
  type CommentData,
  type ChatMessage,
} from "./components";

interface DealDetailProps {
  deal: DealData;
  stageHistory: StageHistoryEntry[];
  conditions: ConditionData[];
  documents: DocumentData[];
  activity: ActivityData[];
  comments: CommentData[];
  chatMessages: ChatMessage[];
  isOpportunity: boolean;
  currentUserInitials: string;
}

interface TabConfig {
  k: string;
  l: string;
  c?: number;
}

export function DealDetail({
  deal: initialDeal,
  stageHistory,
  conditions,
  documents,
  activity,
  comments,
  chatMessages,
  isOpportunity,
  currentUserInitials,
}: DealDetailProps) {
  const [tab, setTab] = useState(getDefaultTab(initialDeal.stage));
  const [deal, setDeal] = useState<DealData>(initialDeal);
  const router = useRouter();

  const handleSave = useCallback(
    async (field: string, value: string | number | null): Promise<boolean> => {
      if (isOpportunity) {
        // Opportunity editing not supported yet
        return false;
      }

      const result = await updateDealField(deal.id, { [field]: value });

      if (result.error) {
        console.error("Failed to update field:", result.error);
        return false;
      }

      // Optimistic update: update the local deal state
      setDeal((prev) => ({ ...prev, [field]: value }));

      // Refresh server data in the background
      router.refresh();
      return true;
    },
    [deal.id, isOpportunity, router]
  );

  // Only pass onSave for loans, not opportunities
  const onSave = isOpportunity ? undefined : handleSave;

  const openConditions = conditions.filter(
    (c) =>
      c.status !== "cleared" &&
      c.status !== "approved" &&
      c.status !== "waived"
  ).length;

  const tabs: TabConfig[] = [
    { k: "overview", l: "Overview" },
    { k: "conditions", l: "Conditions", c: openConditions },
    { k: "documents", l: "Documents", c: documents.length },
    { k: "activity", l: "Activity", c: activity.length },
    { k: "comments", l: "Comments", c: comments.length },
    { k: "chat", l: "Chat", c: chatMessages.length > 0 ? chatMessages.length : undefined },
    { k: "underwriting", l: "Underwriting" },
  ];

  const renderTab = () => {
    switch (tab) {
      case "overview":
        return <OverviewTab deal={deal} onSave={onSave} />;
      case "conditions":
        return <ConditionsTab conditions={conditions} />;
      case "documents":
        return <DocumentsTab documents={documents} />;
      case "activity":
        return <ActivityTab activity={activity} />;
      case "comments":
        return (
          <CommentsTab
            comments={comments}
            currentUserInitials={currentUserInitials}
          />
        );
      case "chat":
        return (
          <ChatTab
            messages={chatMessages}
            currentUserInitials={currentUserInitials}
          />
        );
      case "underwriting":
        return <UnderwritingTab />;
      default:
        return null;
    }
  };

  const displayId = deal.loan_number || deal.id?.slice(0, 8);

  return (
    <div className="font-sans">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-1.5 text-[13px] text-[#8B8B8B]">
        <Link
          href="/admin/pipeline"
          className="cursor-pointer text-[#3B82F6] no-underline hover:underline"
        >
          Deals
        </Link>
        <ChevronRight size={14} />
        <span>{displayId}</span>
      </div>

      {/* Header */}
      <Header
        deal={deal}
        stageHistory={stageHistory}
        isOpportunity={isOpportunity}
      />

      {/* Stage Stepper */}
      <div className="mt-3">
        <Stepper deal={deal} stageHistory={stageHistory} />
      </div>

      {/* Content + Sidebar */}
      <div className="mt-4 flex gap-4">
        <div className="min-w-0 flex-1">
          {/* Tab Bar */}
          <div className="mb-4 flex gap-5 overflow-x-auto border-b border-[#E5E5E7]">
            {tabs.map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 bg-transparent px-1 py-2.5 text-[13px] font-sans"
                style={{
                  fontWeight: tab === t.k ? 600 : 500,
                  color: tab === t.k ? "#1A1A1A" : "#6B6B6B",
                  borderBottomColor:
                    tab === t.k ? "#1A1A1A" : "transparent",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                }}
              >
                {t.l}
                {t.c != null && (
                  <span
                    className="rounded-full px-[7px] py-px text-[11px] font-semibold font-mono"
                    style={{
                      background: tab === t.k ? "#1A1A1A" : "#F0F0F2",
                      color: tab === t.k ? "#FFF" : "#6B6B6B",
                    }}
                  >
                    {t.c}
                  </span>
                )}
              </button>
            ))}
          </div>
          {renderTab()}
        </div>

        {/* Right Sidebar */}
        <Sidebar deal={deal} stageHistory={stageHistory} onSave={onSave} />
      </div>
    </div>
  );
}
