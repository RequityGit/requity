"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { TabBtn } from "@/components/crm/contact-360/contact-detail-shared";
import { CompanyDetailHeader } from "./company-detail-header";
import { CompanyDetailSidebar } from "./company-detail-sidebar";
import { CompanyOverviewTab } from "./tabs/overview-tab";
import { CompanyContactsTab } from "./tabs/contacts-tab";
import { CompanyActivityTab } from "./tabs/activity-tab";
import { CompanyDealsTab } from "./tabs/deals-tab";
import { CompanyFilesTab } from "./tabs/files-tab";
import { CompanyTasksTab } from "./tabs/tasks-tab";
import { CompanyNotesTab } from "./tabs/notes-tab";
import type {
  CompanyDetailData,
  CompanyContactData,
  CompanyActivityData,
  CompanyFileData,
  CompanyTaskData,
  CompanyNoteData,
  CompanyWireData,
  CompanyFollowerData,
  TabBadgeCounts,
} from "./types";

interface CompanyDetailClientProps {
  company: CompanyDetailData;
  contacts: CompanyContactData[];
  primaryContact: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    user_function: string | null;
  } | null;
  activities: CompanyActivityData[];
  files: CompanyFileData[];
  tasks: CompanyTaskData[];
  notes: CompanyNoteData[];
  wireInstructions: CompanyWireData | null;
  followers: CompanyFollowerData[];
  counts: TabBadgeCounts;
  currentUserId: string;
  currentUserName: string;
}

export function CompanyDetailClient({
  company,
  contacts,
  primaryContact,
  activities,
  files,
  tasks,
  notes,
  wireInstructions,
  followers,
  counts,
  currentUserId,
  currentUserName,
}: CompanyDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const openTasks = useMemo(
    () => tasks.filter((t) => t.status !== "completed").length,
    [tasks]
  );

  const tabs = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "contacts", label: "Contacts", count: counts.contacts },
      { id: "activity", label: "Activity", count: counts.activities },
      { id: "deals", label: "Deals & Quotes", count: counts.deals || undefined },
      { id: "files", label: "Files", count: counts.files },
      { id: "tasks", label: "Tasks", count: openTasks },
      { id: "notes", label: "Notes", count: counts.notes },
    ],
    [counts, openTasks]
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

  useEffect(() => {
    const newTab = searchParams.get("tab") || "overview";
    if (tabs.some((t) => t.id === newTab) && newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [searchParams, tabs, activeTab]);

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-3">
        <Link
          href="/admin/crm?view=companies"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </Link>
        <Breadcrumb className="text-[13px]">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin/crm?view=companies">Companies</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">{company.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex max-w-[1400px] mx-auto">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header Card */}
          <CompanyDetailHeader
            company={company}
            primaryContact={primaryContact}
            lastActivityAt={activities[0]?.created_at || null}
          />

          {/* Tab Bar */}
          <div className="border-b border-border mb-6 flex overflow-x-auto">
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
            <CompanyOverviewTab
              company={company}
              wireInstructions={wireInstructions}
              files={files}
            />
          )}
          {activeTab === "contacts" && (
            <CompanyContactsTab
              contacts={contacts}
              companyId={company.id}
              primaryContactId={company.primary_contact_id}
            />
          )}
          {activeTab === "activity" && (
            <CompanyActivityTab
              companyId={company.id}
              activities={activities}
              currentUserId={currentUserId}
            />
          )}
          {activeTab === "deals" && (
            <CompanyDealsTab company={company} />
          )}
          {activeTab === "files" && (
            <CompanyFilesTab
              files={files}
              companyId={company.id}
            />
          )}
          {activeTab === "tasks" && (
            <CompanyTasksTab
              tasks={tasks}
              companyId={company.id}
              currentUserId={currentUserId}
            />
          )}
          {activeTab === "notes" && (
            <CompanyNotesTab
              notes={notes}
              companyId={company.id}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
            />
          )}
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block w-[320px] shrink-0 pt-6 pl-6">
          <CompanyDetailSidebar
            company={company}
            contacts={contacts}
            followers={followers}
            files={files}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onTabChange={handleTabChange}
          />
        </div>
      </div>
    </div>
  );
}
