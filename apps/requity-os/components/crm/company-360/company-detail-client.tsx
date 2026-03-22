"use client";

import { useState, useMemo, useCallback } from "react";
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary";
import { useSearchParams } from "next/navigation";
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
import { EmailComposeSheet } from "@/components/crm/email-compose-sheet";
import { CompanyDetailHeader } from "./company-detail-header";
import { CompanyDetailSidebar } from "./company-detail-sidebar";
import { CompanyOverviewTab } from "./tabs/overview-tab";
import { CrmInlineEditorWrapper } from "@/components/inline-layout-editor/CrmInlineEditorWrapper";
import { CompanyContactsTab } from "./tabs/contacts-tab";
import { CompanyActivityTab } from "./tabs/activity-tab";
import { CompanyDealsTab } from "./tabs/deals-tab";
import { CompanyFilesTab } from "./tabs/files-tab";
import { CompanyTasksTab } from "./tabs/tasks-tab";
import { UnifiedNotes } from "@/components/shared/UnifiedNotes";
import { useCompany360Lazy } from "@/hooks/useCompany360Lazy";
import type {
  CompanyDetailData,
  CompanyContactData,
  CompanyActivityData,
  CompanyFileData,
  CompanyTaskData,
  CompanyWireData,
  CompanyFollowerData,
  TabBadgeCounts,
} from "./types";
import type {
  SectionLayout,
  FieldLayout,
} from "@/components/crm/contact-360/types";

type OverviewPayload = {
  wireInstructions: CompanyWireData | null;
  files: CompanyFileData[];
};
type ActivitiesPayload = { activities: CompanyActivityData[] };
type FilesPayload = { files: CompanyFileData[] };
type TasksPayload = { tasks: CompanyTaskData[] };

interface CompanyDetailClientProps {
  company: CompanyDetailData;
  contacts: CompanyContactData[];
  primaryContact: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    user_function: string | null;
  } | null;
  followers: CompanyFollowerData[];
  counts: TabBadgeCounts;
  lastActivityAt: string | null;
  currentUserId: string;
  currentUserName: string;
  teamMembers: { id: string; full_name: string }[];
  sectionOrder: SectionLayout[];
  sectionFields: Record<string, FieldLayout[]>;
  isSuperAdmin?: boolean;
}

export function CompanyDetailClient({
  company,
  contacts,
  primaryContact,
  followers,
  counts,
  lastActivityAt,
  currentUserId,
  currentUserName,
  teamMembers,
  sectionOrder,
  sectionFields,
  isSuperAdmin = false,
}: CompanyDetailClientProps) {
  const searchParams = useSearchParams();
  const [emailComposeOpen, setEmailComposeOpen] = useState(false);
  const [logCallTrigger, setLogCallTrigger] = useState(0);

  const tabs = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "contacts", label: "Contacts", count: counts.contacts },
      { id: "notes", label: "Notes", count: counts.notes },
      { id: "tasks", label: "Tasks", count: counts.openTasks },
      { id: "deals", label: "Deals & Quotes", count: counts.deals || undefined },
      { id: "files", label: "Files", count: counts.files },
      { id: "activity", label: "Activity", count: counts.activities },
    ],
    [counts]
  );

  const tabParam = searchParams.get("tab");
  const isValidTab = tabs.some((t) => t.id === tabParam);
  const initialTab = isValidTab ? tabParam! : "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(
    () => new Set([initialTab])
  );

  const overviewQ = useCompany360Lazy<OverviewPayload>(company.id, "overview", true);
  const activitiesQ = useCompany360Lazy<ActivitiesPayload>(
    company.id,
    "activities",
    loadedTabs.has("activity")
  );
  const filesQ = useCompany360Lazy<FilesPayload>(
    company.id,
    "files",
    loadedTabs.has("files")
  );
  const tasksQ = useCompany360Lazy<TasksPayload>(
    company.id,
    "tasks",
    loadedTabs.has("tasks")
  );

  const wireInstructions = overviewQ.data?.wireInstructions ?? null;
  const overviewFiles = overviewQ.data?.files ?? [];
  const activities = activitiesQ.data?.activities ?? [];
  const filesForTab = filesQ.data?.files ?? [];
  const tasks = tasksQ.data?.tasks ?? [];

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      setLoadedTabs((prev) => {
        if (prev.has(value)) return prev;
        return new Set(prev).add(value);
      });
      const params = new URLSearchParams(window.location.search);
      if (value === "overview") {
        params.delete("tab");
      } else {
        params.set("tab", value);
      }
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState(null, "", newUrl);
    },
    []
  );

  const handleLogCall = useCallback(() => {
    handleTabChange("activity");
    setLogCallTrigger((prev) => prev + 1);
  }, [handleTabChange]);

  return (
    <div className="min-h-screen">
      <div className="flex items-center gap-2 mb-3">
        <Link
          href="/companies"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </Link>
        <Breadcrumb className="text-[13px]">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/companies">Companies</Link>
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
        <div className="flex-1 min-w-0">
          <CompanyDetailHeader
            company={company}
            primaryContact={primaryContact}
            lastActivityAt={lastActivityAt}
          />

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

          {loadedTabs.has("overview") && (
            <div className={activeTab !== "overview" ? "hidden" : undefined}>
              <SectionErrorBoundary fallbackTitle="Could not load overview">
                <CrmInlineEditorWrapper pageType="company_detail" isSuperAdmin={isSuperAdmin}>
                  <CompanyOverviewTab
                    company={company}
                    wireInstructions={wireInstructions}
                    files={overviewFiles}
                    sectionOrder={sectionOrder}
                    sectionFields={sectionFields}
                  />
                </CrmInlineEditorWrapper>
              </SectionErrorBoundary>
            </div>
          )}
          {loadedTabs.has("contacts") && (
            <div className={activeTab !== "contacts" ? "hidden" : undefined}>
              <SectionErrorBoundary fallbackTitle="Could not load contacts">
                <CompanyContactsTab
                  contacts={contacts}
                  companyId={company.id}
                  companyName={company.name}
                  primaryContactId={company.primary_contact_id}
                  teamMembers={teamMembers}
                  currentUserId={currentUserId}
                />
              </SectionErrorBoundary>
            </div>
          )}
          {loadedTabs.has("notes") && (
            <div className={activeTab !== "notes" ? "hidden" : undefined}>
              <SectionErrorBoundary fallbackTitle="Could not load notes">
                <UnifiedNotes
                  entityType="company"
                  entityId={company.id}
                />
              </SectionErrorBoundary>
            </div>
          )}
          {loadedTabs.has("tasks") && (
            <div className={activeTab !== "tasks" ? "hidden" : undefined}>
              <SectionErrorBoundary fallbackTitle="Could not load tasks">
                <CompanyTasksTab
                  tasks={tasks}
                  companyId={company.id}
                  companyName={company.name}
                  currentUserId={currentUserId}
                  profiles={teamMembers.map((m) => ({
                    id: m.id,
                    full_name: m.full_name,
                    avatar_url: null,
                  }))}
                  loading={tasksQ.loading}
                />
              </SectionErrorBoundary>
            </div>
          )}
          {loadedTabs.has("deals") && (
            <div className={activeTab !== "deals" ? "hidden" : undefined}>
              <SectionErrorBoundary fallbackTitle="Could not load deals">
                <CompanyDealsTab company={company} />
              </SectionErrorBoundary>
            </div>
          )}
          {loadedTabs.has("files") && (
            <div className={activeTab !== "files" ? "hidden" : undefined}>
              <SectionErrorBoundary fallbackTitle="Could not load files">
                <CompanyFilesTab
                  files={filesForTab}
                  companyId={company.id}
                  loading={filesQ.loading}
                  onRefresh={filesQ.refresh}
                />
              </SectionErrorBoundary>
            </div>
          )}
          {loadedTabs.has("activity") && (
            <div className={activeTab !== "activity" ? "hidden" : undefined}>
              <SectionErrorBoundary fallbackTitle="Could not load activity">
                <CompanyActivityTab
                  companyId={company.id}
                  activities={activities}
                  currentUserId={currentUserId}
                  logCallTrigger={logCallTrigger}
                  loading={activitiesQ.loading}
                />
              </SectionErrorBoundary>
            </div>
          )}
        </div>

        <div className="hidden lg:block w-[320px] shrink-0 pt-6 pl-6">
          <CompanyDetailSidebar
            company={company}
            contacts={contacts}
            followers={followers}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            teamMembers={teamMembers}
            onTabChange={handleTabChange}
            onComposeEmail={() => setEmailComposeOpen(true)}
            onLogCall={handleLogCall}
          />
        </div>
      </div>

      <EmailComposeSheet
        open={emailComposeOpen}
        onOpenChange={setEmailComposeOpen}
        toEmail={company.email || ""}
        toName={company.name}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />
    </div>
  );
}
