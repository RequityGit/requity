"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { TabBtn } from "./contact-detail-shared";
import { ContactDetailHeader } from "./contact-detail-header";
import { ContactDetailSidebar } from "./contact-detail-sidebar";
import { DetailOverviewTab } from "./tabs/detail-overview-tab";
import { DetailActivityTab } from "./tabs/detail-activity-tab";
import { DetailEmailsTab } from "./tabs/detail-emails-tab";
import { DetailDealsTab } from "./tabs/detail-deals-tab";
import { DetailEntitiesTab } from "./tabs/detail-entities-tab";
import { DetailTasksTab } from "./tabs/detail-tasks-tab";
import { DetailNotesTab } from "./tabs/detail-notes-tab";
import type {
  ContactData,
  RelationshipData,
  ActivityData,
  EmailData,
  LoanData,
  InvestorCommitmentData,
  TeamMember,
  CompanyData,
  BorrowerData,
  InvestorProfileData,
  EntityData,
  TaskData,
} from "./types";

interface ContactDetailClientProps {
  contact: ContactData;
  relationships: RelationshipData[];
  activities: ActivityData[];
  emails: EmailData[];
  loans: LoanData[];
  investorCommitments: InvestorCommitmentData[];
  teamMembers: TeamMember[];
  company: CompanyData | null;
  borrower: BorrowerData | null;
  investor: InvestorProfileData | null;
  entities: EntityData[];
  tasks: TaskData[];
  currentUserId: string;
  currentUserName: string;
  assignedToName: string | null;
  sourceLabel: string | null;
  isSuperAdmin: boolean;
}

export function ContactDetailClient({
  contact,
  relationships,
  activities,
  emails,
  loans,
  investorCommitments,
  teamMembers,
  company,
  borrower,
  investor,
  entities,
  tasks,
  currentUserId,
  currentUserName,
  assignedToName,
  sourceLabel,
  isSuperAdmin,
}: ContactDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const fullName =
    [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
    "Unnamed Contact";

  const openTasks = useMemo(
    () => tasks.filter((t) => t.status !== "completed"),
    [tasks]
  );

  // Notes count (activities of type "note")
  const noteActivities = useMemo(
    () => activities.filter((a) => a.activity_type === "note"),
    [activities]
  );

  const tabs = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "activity", label: "Activity", count: activities.length },
      { id: "emails", label: "Emails", count: emails.length },
      {
        id: "deals",
        label: "Deals & Loans",
        count: loans.length + investorCommitments.length,
      },
      { id: "entities", label: "Entities", count: entities.length },
      { id: "tasks", label: "Tasks", count: openTasks.length },
      { id: "notes", label: "Notes", count: noteActivities.length },
    ],
    [activities.length, emails.length, loans.length, investorCommitments.length, entities.length, openTasks.length, noteActivities.length]
  );

  const tabParam = searchParams.get("tab");
  const isValidTab = tabs.some((t) => t.id === tabParam);
  const initialTab = isValidTab ? tabParam! : "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      const params = new URLSearchParams(searchParams.toString());
      if (value === "overview") {
        params.delete("tab");
      } else {
        params.set("tab", value);
      }
      const newUrl = params.toString()
        ? `?${params.toString()}`
        : window.location.pathname;
      router.replace(newUrl, { scroll: false });
    },
    [router, searchParams]
  );

  // Sync with URL changes
  useEffect(() => {
    const newTab = searchParams.get("tab") || "overview";
    if (tabs.some((t) => t.id === newTab) && newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [searchParams, tabs, activeTab]);

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E5E5E7] px-7 py-2.5 flex items-center gap-2">
        <Link
          href="/admin/crm"
          className="text-[#8B8B8B] hover:text-[#1A1A1A] transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </Link>
        <Link
          href="/admin/crm"
          className="text-xs text-[#8B8B8B] hover:text-[#1A1A1A] transition-colors"
        >
          Contacts
        </Link>
        <ChevronRight size={12} className="text-[#C5C5C5]" />
        <span className="text-xs text-[#1A1A1A] font-medium">{fullName}</span>
      </div>

      <div className="flex max-w-[1400px] mx-auto">
        {/* Main Content */}
        <div className="flex-1 min-w-0 px-6 py-5 pb-10">
          {/* Header Card */}
          <ContactDetailHeader
            contact={contact}
            fullName={fullName}
            company={company}
            assignedToName={assignedToName}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />

          {/* Tab Bar */}
          <div className="border-b border-[#E5E5E7] mb-5 flex overflow-x-auto">
            {tabs.map((t) => (
              <TabBtn
                key={t.id}
                label={t.label}
                count={t.count}
                active={activeTab === t.id}
                onClick={() => handleTabChange(t.id)}
              />
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <DetailOverviewTab
              contact={contact}
              borrower={borrower}
              investor={investor}
              loans={loans}
              commitments={investorCommitments}
              isSuperAdmin={isSuperAdmin}
            />
          )}
          {activeTab === "activity" && (
            <DetailActivityTab
              contactId={contact.id}
              activities={activities}
              currentUserId={currentUserId}
            />
          )}
          {activeTab === "emails" && <DetailEmailsTab emails={emails} />}
          {activeTab === "deals" && (
            <DetailDealsTab loans={loans} commitments={investorCommitments} />
          )}
          {activeTab === "entities" && <DetailEntitiesTab entities={entities} />}
          {activeTab === "tasks" && (
            <DetailTasksTab
              tasks={tasks}
              contactId={contact.id}
              currentUserId={currentUserId}
            />
          )}
          {activeTab === "notes" && (
            <DetailNotesTab
              contactId={contact.id}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              teamMembers={teamMembers}
            />
          )}
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block w-80 shrink-0 py-5 pr-6">
          <ContactDetailSidebar
            contact={contact}
            relationships={relationships}
            assignedToName={assignedToName}
            sourceLabel={sourceLabel}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        </div>
      </div>
    </div>
  );
}
