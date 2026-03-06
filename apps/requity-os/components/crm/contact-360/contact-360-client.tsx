"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  DollarSign,
  TrendingUp,
  Briefcase,
  Users,
  FileText,
  MessageSquare,
  Activity,
  ChevronLeft,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type {
  TabConfig,
  ContactData,
  RelationshipData,
  ActivityData,
  EmailData,
  LoanData,
  InvestorCommitmentData,
  TeamMember,
  CompanyData,
} from "./types";
import { ContactHeader } from "./contact-header";
import { RelationshipStats } from "./relationship-stats";
import { OverviewTab } from "./tabs/overview-tab";
import { LoansTab } from "./tabs/loans-tab";
import { InvestmentsTab } from "./tabs/investments-tab";
import { ServicingTab } from "./tabs/servicing-tab";
import { ReferralsTab } from "./tabs/referrals-tab";
import { DocumentsTab } from "./tabs/documents-tab";
import { NotesTab } from "./tabs/notes-tab";
import { ActivityTab } from "./tabs/activity-tab";
import { ContactDetailsSidebar } from "./sidebar/contact-details-sidebar";
import { RecentEmailsSidebar } from "./sidebar/recent-emails-sidebar";

// Tab configuration with conditional visibility
const TAB_CONFIG: TabConfig[] = [
  { id: "overview", label: "Overview", icon: User, showWhen: "always" },
  { id: "loans", label: "Loans", icon: DollarSign, showWhen: ["borrower"] },
  {
    id: "investments",
    label: "Investments",
    icon: TrendingUp,
    showWhen: ["investor"],
  },
  {
    id: "servicing",
    label: "Servicing",
    icon: Briefcase,
    showWhen: ["lender"],
  },
  { id: "referrals", label: "Referrals", icon: Users, showWhen: ["broker"] },
  {
    id: "documents",
    label: "Documents",
    icon: FileText,
    showWhen: ["borrower", "investor", "lender"],
  },
  { id: "notes", label: "Notes", icon: MessageSquare, showWhen: "always" },
  { id: "activity", label: "Activity", icon: Activity, showWhen: "always" },
];

function getVisibleTabs(activeRelationships: string[]): TabConfig[] {
  return TAB_CONFIG.filter((tab) => {
    if (tab.showWhen === "always") return true;
    return tab.showWhen.some((rel) => activeRelationships.includes(rel));
  });
}

interface Contact360ClientProps {
  contact: ContactData;
  relationships: RelationshipData[];
  activities: ActivityData[];
  emails: EmailData[];
  loans: LoanData[];
  investorCommitments: InvestorCommitmentData[];
  teamMembers: TeamMember[];
  company: CompanyData | null;
  currentUserId: string;
  currentUserName: string;
  assignedToName: string | null;
  sourceLabel: string | null;
  isSuperAdmin: boolean;
}

export function Contact360Client({
  contact,
  relationships,
  activities,
  emails,
  loans,
  investorCommitments,
  teamMembers,
  company,
  currentUserId,
  currentUserName,
  assignedToName,
  sourceLabel,
  isSuperAdmin,
}: Contact360ClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive active relationships
  const activeRelationships = useMemo(
    () =>
      relationships
        .filter((r) => r.is_active)
        .map((r) => r.relationship_type),
    [relationships]
  );

  // Get visible tabs
  const visibleTabs = useMemo(
    () => getVisibleTabs(activeRelationships),
    [activeRelationships]
  );

  // Determine initial tab from URL or default to overview
  const tabParam = searchParams.get("tab");
  const isValidTab = visibleTabs.some((t) => t.id === tabParam);
  const initialTab = isValidTab ? tabParam! : "overview";

  const [activeTab, setActiveTab] = useState(initialTab);

  // Track which tabs have been loaded for lazy loading
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(
    new Set(["overview"])
  );

  // Sync tab state with URL
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      setLoadedTabs((prev) => {
        const next = new Set(prev);
        next.add(value);
        return next;
      });
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

  // If active tab becomes invalid (relationship deactivated), fall back
  useEffect(() => {
    if (!visibleTabs.some((t) => t.id === activeTab)) {
      handleTabChange("overview");
    }
  }, [visibleTabs, activeTab, handleTabChange]);

  const fullName = [contact.first_name, contact.last_name]
    .filter(Boolean)
    .join(" ") || "Unnamed Contact";

  // Primary relationship for stats (first active by created_at)
  const primaryRelationship = useMemo(() => {
    const activeRels = relationships
      .filter((r) => r.is_active)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    return activeRels[0]?.relationship_type || null;
  }, [relationships]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/admin/crm"
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            Contacts
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground font-medium">{fullName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-border">
            <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <Link href={`/admin/crm/${contact.id}?edit=true`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg border-border"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Header with avatar, name, badges, quick actions */}
      <ContactHeader
        contact={contact}
        fullName={fullName}
        activeRelationships={activeRelationships}
        company={company}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />

      {/* Relationship Stats Row */}
      {activeRelationships.length > 0 && (
        <RelationshipStats
          primaryRelationship={primaryRelationship}
          activeRelationships={activeRelationships}
          loans={loans}
          investorCommitments={investorCommitments}
        />
      )}

      {/* Tabs + Content + Sidebar */}
      <div className="flex gap-6">
        {/* Main content area */}
        <div className="flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none p-0 h-auto gap-0">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground px-4 py-2.5 gap-1.5 text-sm font-medium"
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <OverviewTab
                contact={contact}
                activeRelationships={activeRelationships}
                loans={loans}
                investorCommitments={investorCommitments}
                activities={activities}
              />
            </TabsContent>

            {visibleTabs.some((t) => t.id === "loans") && (
              <TabsContent value="loans" className="mt-4">
                <LoansTab loans={loans} contactId={contact.id} borrowerId={contact.borrower_id} />
              </TabsContent>
            )}

            {visibleTabs.some((t) => t.id === "investments") && (
              <TabsContent value="investments" className="mt-4">
                <InvestmentsTab
                  commitments={investorCommitments}
                  contactId={contact.id}
                />
              </TabsContent>
            )}

            {visibleTabs.some((t) => t.id === "servicing") && (
              <TabsContent value="servicing" className="mt-4">
                <ServicingTab loans={loans} />
              </TabsContent>
            )}

            {visibleTabs.some((t) => t.id === "referrals") && (
              <TabsContent value="referrals" className="mt-4">
                <ReferralsTab />
              </TabsContent>
            )}

            {visibleTabs.some((t) => t.id === "documents") && (
              <TabsContent value="documents" className="mt-4">
                <DocumentsTab contactId={contact.id} />
              </TabsContent>
            )}

            <TabsContent value="notes" className="mt-4">
              <NotesTab
                contactId={contact.id}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                teamMembers={teamMembers}
              />
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <ActivityTab
                contactId={contact.id}
                activities={activities}
                currentUserId={currentUserId}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar (persistent across all tabs) */}
        <div className="hidden lg:block w-80 shrink-0 space-y-4">
          <ContactDetailsSidebar
            contact={contact}
            assignedToName={assignedToName}
            sourceLabel={sourceLabel}
          />
          <RecentEmailsSidebar
            emails={emails.slice(0, 3)}
            contactEmail={contact.email}
            contactName={fullName}
            contactId={contact.id}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        </div>
      </div>
    </div>
  );
}
