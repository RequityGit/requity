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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ContactDetailHeader } from "./contact-detail-header";
import { ContactDetailSidebar } from "./contact-detail-sidebar";
import { EmailComposeSheet } from "@/components/crm/email-compose-sheet";
import { DetailOverviewTab } from "./tabs/detail-overview-tab";
import { DetailActivityTab } from "./tabs/detail-activity-tab";
import { DetailDealsTab } from "./tabs/detail-deals-tab";
import { DetailEntitiesTab } from "./tabs/detail-entities-tab";
import { DetailTasksTab } from "./tabs/detail-tasks-tab";
import { UnifiedNotes } from "@/components/shared/UnifiedNotes";
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
  SectionLayout,
  FieldLayout,
} from "./types";
import type { OpsTask, Profile } from "@/lib/tasks";

interface ContactDetailClientProps {
  contact: ContactData;
  relationships: RelationshipData[];
  activities: ActivityData[];
  emails: EmailData[];
  loans: LoanData[];
  investorCommitments: InvestorCommitmentData[];
  teamMembers: TeamMember[];
  profiles: Profile[];
  company: CompanyData | null;
  allCompanies: CompanyData[];
  borrower: BorrowerData | null;
  investor: InvestorProfileData | null;
  entities: EntityData[];
  tasks: OpsTask[];
  currentUserId: string;
  currentUserName: string;
  assignedToName: string | null;
  sourceLabel: string | null;
  isSuperAdmin: boolean;
  sectionOrder: SectionLayout[];
  sectionFields: Record<string, FieldLayout[]>;
}

export function ContactDetailClient({
  contact,
  relationships,
  activities,
  emails,
  loans,
  investorCommitments,
  teamMembers,
  profiles,
  company,
  allCompanies,
  borrower,
  investor,
  entities,
  tasks,
  currentUserId,
  currentUserName,
  assignedToName,
  sourceLabel,
  isSuperAdmin,
  sectionOrder,
  sectionFields,
}: ContactDetailClientProps) {
  const searchParams = useSearchParams();

  const fullName =
    [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
    "Unnamed Contact";

  const openTasks = useMemo(
    () => tasks.filter((t) => t.status !== "Complete"),
    [tasks]
  );

  const noteActivities = useMemo(
    () => activities.filter((a) => a.activity_type === "note"),
    [activities]
  );

  // Derive contact type tags from relationships + contact_types
  const contactTypes = useMemo(() => {
    const fromRelationships = relationships
      .filter((r) => r.is_active)
      .map((r) => r.relationship_type);
    const fromContactTypes = contact.contact_types ?? [];
    const all = new Set([...fromRelationships, ...fromContactTypes]);
    return Array.from(all);
  }, [relationships, contact.contact_types]);

  const tabs = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "notes", label: "Notes", count: noteActivities.length },
      { id: "tasks", label: "Tasks", count: openTasks.length },
      {
        id: "deals",
        label: "Deals & Loans",
        count: loans.length + investorCommitments.length,
      },
      { id: "entities", label: "Entities", count: entities.length },
      { id: "activity", label: "Activity", count: activities.length + emails.length },
    ],
    [
      activities.length,
      emails.length,
      loans.length,
      investorCommitments.length,
      entities.length,
      openTasks.length,
      noteActivities.length,
    ]
  );

  const tabParam = searchParams.get("tab");
  const isValidTab = tabs.some((t) => t.id === tabParam);
  const initialTab = isValidTab ? tabParam! : "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [emailComposeOpen, setEmailComposeOpen] = useState(false);
  const [logCallTrigger, setLogCallTrigger] = useState(
    () => (searchParams.get("action") === "log-call" && initialTab === "activity") ? 1 : 0
  );

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

  const handleLogCall = useCallback(() => {
    handleTabChange("activity");
    // Increment trigger to signal the activity tab to open the log-call form
    setLogCallTrigger((prev) => prev + 1);
  }, [handleTabChange]);

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-3">
        <Link
          href="/admin/crm"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </Link>
        <Breadcrumb className="text-[13px]">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin/crm">Contacts</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">{fullName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex max-w-[1400px] mx-auto">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header Card */}
          <ContactDetailHeader
            contact={contact}
            fullName={fullName}
            company={company}
            assignedToName={assignedToName}
            contactTypes={contactTypes}
          />

          {/* Tabs — shadcn underline pattern */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-3">
            <TabsList className="bg-transparent h-auto p-0 gap-0 rounded-none flex justify-start min-w-max border-b border-border w-full">
              {tabs.map((t) => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground px-4 py-3 text-sm font-medium gap-1.5 whitespace-nowrap"
                >
                  {t.label}
                  {t.count != null && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4 font-bold"
                    >
                      {t.count}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

          </Tabs>

          {/* Tab content rendered outside Tabs to avoid unmount/remount.
              Visited tabs stay mounted (hidden) to preserve state & subscriptions. */}
          <div className="mt-4">
            {loadedTabs.has("overview") && (
              <div className={activeTab !== "overview" ? "hidden" : undefined}>
                <DetailOverviewTab
                  contact={contact}
                  borrower={borrower}
                  investor={investor}
                  loans={loans}
                  commitments={investorCommitments}
                  isSuperAdmin={isSuperAdmin}
                  sectionOrder={sectionOrder}
                  sectionFields={sectionFields}
                  teamMembers={teamMembers}
                  allCompanies={allCompanies}
                />
              </div>
            )}

            {loadedTabs.has("notes") && (
              <div className={activeTab !== "notes" ? "hidden" : undefined}>
                <UnifiedNotes
                  entityType="contact"
                  entityId={contact.id}
                />
              </div>
            )}

            {loadedTabs.has("tasks") && (
              <div className={activeTab !== "tasks" ? "hidden" : undefined}>
                <DetailTasksTab
                  tasks={tasks}
                  contactId={contact.id}
                  contactName={fullName}
                  profiles={profiles}
                  currentUserId={currentUserId}
                />
              </div>
            )}

            {loadedTabs.has("deals") && (
              <div className={activeTab !== "deals" ? "hidden" : undefined}>
                <DetailDealsTab
                  loans={loans}
                  commitments={investorCommitments}
                />
              </div>
            )}

            {loadedTabs.has("entities") && (
              <div className={activeTab !== "entities" ? "hidden" : undefined}>
                <DetailEntitiesTab entities={entities} />
              </div>
            )}

            {loadedTabs.has("activity") && (
              <div className={activeTab !== "activity" ? "hidden" : undefined}>
                <DetailActivityTab
                  contactId={contact.id}
                  activities={activities}
                  emails={emails}
                  currentUserId={currentUserId}
                  onComposeEmail={() => setEmailComposeOpen(true)}
                  logCallTrigger={logCallTrigger}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:flex flex-col gap-4 w-[300px] min-w-[300px] max-w-[300px] pl-6">
          <ContactDetailSidebar
            contact={contact}
            relationships={relationships}
            assignedToName={assignedToName}
            sourceLabel={sourceLabel}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onComposeEmail={() => setEmailComposeOpen(true)}
            onTabChange={handleTabChange}
            onLogCall={handleLogCall}
          />
        </div>
      </div>

      <EmailComposeSheet
        open={emailComposeOpen}
        onOpenChange={setEmailComposeOpen}
        toEmail={contact.email || ""}
        toName={fullName}
        linkedContactId={contact.id}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />
    </div>
  );
}
