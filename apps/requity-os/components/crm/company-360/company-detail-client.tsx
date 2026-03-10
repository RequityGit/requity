"use client";

import { useState, useMemo, useCallback } from "react";
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
import { CompanyContactsTab } from "./tabs/contacts-tab";
import { CompanyActivityTab } from "./tabs/activity-tab";
import { CompanyDealsTab } from "./tabs/deals-tab";
import { CompanyFilesTab } from "./tabs/files-tab";
import { CompanyTasksTab } from "./tabs/tasks-tab";
import { UnifiedNotes } from "@/components/shared/UnifiedNotes";
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
import type {
  SectionLayout,
  FieldLayout,
} from "@/components/crm/contact-360/types";

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
  teamMembers: { id: string; full_name: string }[];
  sectionOrder: SectionLayout[];
  sectionFields: Record<string, FieldLayout[]>;
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
  teamMembers,
  sectionOrder,
  sectionFields,
}: CompanyDetailClientProps) {
  const searchParams = useSearchParams();
  const [emailComposeOpen, setEmailComposeOpen] = useState(false);

  const openTasks = useMemo(
    () => tasks.filter((t) => t.status !== "completed").length,
    [tasks]
  );

  const tabs = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "contacts", label: "Contacts", count: counts.contacts },
      { id: "notes", label: "Notes", count: counts.notes },
      { id: "tasks", label: "Tasks", count: openTasks },
      { id: "deals", label: "Deals & Quotes", count: counts.deals || undefined },
      { id: "files", label: "Files", count: counts.files },
      { id: "activity", label: "Activity", count: counts.activities },
    ],
    [counts, openTasks]
  );

  const tabParam = searchParams.get("tab");
  const isValidTab = tabs.some((t) => t.id === tabParam);
  const initialTab = isValidTab ? tabParam! : "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Track which tabs have been visited so we can keep them mounted
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(
    () => new Set([initialTab])
  );

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      setLoadedTabs((prev) => {
        if (prev.has(value)) return prev;
        return new Set(prev).add(value);
      });
      // Use history.replaceState to update URL without triggering Next.js navigation
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

          {/* Tab content: visited tabs stay mounted (hidden) to preserve state & subscriptions */}
          {loadedTabs.has("overview") && (
            <div className={activeTab !== "overview" ? "hidden" : undefined}>
              <CompanyOverviewTab
                company={company}
                wireInstructions={wireInstructions}
                files={files}
                sectionOrder={sectionOrder}
                sectionFields={sectionFields}
              />
            </div>
          )}
          {loadedTabs.has("contacts") && (
            <div className={activeTab !== "contacts" ? "hidden" : undefined}>
              <CompanyContactsTab
                contacts={contacts}
                companyId={company.id}
                companyName={company.name}
                primaryContactId={company.primary_contact_id}
                teamMembers={teamMembers}
                currentUserId={currentUserId}
              />
            </div>
          )}
          {loadedTabs.has("notes") && (
            <div className={activeTab !== "notes" ? "hidden" : undefined}>
              <UnifiedNotes
                entityType="company"
                entityId={company.id}
              />
            </div>
          )}
          {loadedTabs.has("tasks") && (
            <div className={activeTab !== "tasks" ? "hidden" : undefined}>
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
              />
            </div>
          )}
          {loadedTabs.has("deals") && (
            <div className={activeTab !== "deals" ? "hidden" : undefined}>
              <CompanyDealsTab company={company} />
            </div>
          )}
          {loadedTabs.has("files") && (
            <div className={activeTab !== "files" ? "hidden" : undefined}>
              <CompanyFilesTab
                files={files}
                companyId={company.id}
              />
            </div>
          )}
          {loadedTabs.has("activity") && (
            <div className={activeTab !== "activity" ? "hidden" : undefined}>
              <CompanyActivityTab
                companyId={company.id}
                activities={activities}
                currentUserId={currentUserId}
              />
            </div>
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
            onComposeEmail={() => setEmailComposeOpen(true)}
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
