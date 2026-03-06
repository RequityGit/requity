"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-screen bg-muted">
      {/* Breadcrumb */}
      <div className="bg-card border-b border-border px-7 py-2.5 flex items-center gap-2">
        <Link
          href="/admin/crm"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </Link>
        <Link
          href="/admin/crm"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Contacts
        </Link>
        <ChevronRight size={12} className="text-muted-foreground/50" />
        <span className="text-xs text-foreground font-medium">{fullName}</span>
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
            contactTypes={contactTypes}
          />

          {/* Tabs Card — shadcn underline pattern */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="bg-transparent h-auto p-0 gap-0 rounded-none flex justify-start min-w-max border-b border-border w-full">
              {tabs.map((t) => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground px-4 py-2.5 text-sm font-medium gap-1.5 whitespace-nowrap"
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

            <TabsContent value="overview" className="mt-5">
              <DetailOverviewTab
                contact={contact}
                borrower={borrower}
                investor={investor}
                loans={loans}
                commitments={investorCommitments}
                isSuperAdmin={isSuperAdmin}
              />
            </TabsContent>

            <TabsContent value="activity" className="mt-5">
              <DetailActivityTab
                contactId={contact.id}
                activities={activities}
                currentUserId={currentUserId}
              />
            </TabsContent>

            <TabsContent value="emails" className="mt-5">
              <DetailEmailsTab emails={emails} />
            </TabsContent>

            <TabsContent value="deals" className="mt-5">
              <DetailDealsTab
                loans={loans}
                commitments={investorCommitments}
              />
            </TabsContent>

            <TabsContent value="entities" className="mt-5">
              <DetailEntitiesTab entities={entities} />
            </TabsContent>

            <TabsContent value="tasks" className="mt-5">
              <DetailTasksTab
                tasks={tasks}
                contactId={contact.id}
                contactName={fullName}
                currentUserId={currentUserId}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-5">
              <DetailNotesTab
                contactId={contact.id}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                teamMembers={teamMembers}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div
          className="hidden lg:flex py-5 pr-6"
          style={{
            width: 280,
            minWidth: 280,
            maxWidth: 280,
            flexDirection: "column",
            gap: 10,
          }}
        >
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
