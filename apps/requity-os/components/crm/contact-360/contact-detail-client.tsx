"use client";

import { useState, useCallback, useRef } from "react";
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
import { ContactDetailHeader } from "./contact-detail-header";
import { ContactDetailSidebar } from "./contact-detail-sidebar";
import { EmailComposeSheet } from "@/components/crm/email-compose-sheet";
import { DetailOverviewTab } from "./tabs/detail-overview-tab";
import { CollapsibleBorrowerSection } from "./sections/collapsible-borrower-section";
import { CollapsibleInvestorSection } from "./sections/collapsible-investor-section";
import { CollapsibleTasksSection } from "./sections/collapsible-tasks-section";
import { TimelineSection } from "./sections/timeline-section";
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
  userRole: string;
  sectionOrder: SectionLayout[];
  sectionFields: Record<string, FieldLayout[]>;
  primaryBorrowerEntity: Record<string, unknown> | null;
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
  userRole,
  sectionOrder,
  sectionFields,
  primaryBorrowerEntity,
}: ContactDetailClientProps) {
  const fullName =
    [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
    "Unnamed Contact";

  const [emailComposeOpen, setEmailComposeOpen] = useState(false);
  const [logCallTrigger, setLogCallTrigger] = useState(0);

  const tasksRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const contactTypes = (() => {
    const fromRelationships = relationships
      .filter((r) => r.is_active)
      .map((r) => r.relationship_type);
    const fromContactTypes = contact.contact_types ?? [];
    const all = new Set([...fromRelationships, ...fromContactTypes]);
    return Array.from(all);
  })();

  const scrollToSection = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleTabChange = useCallback(
    (tab: string) => {
      if (tab === "tasks") {
        scrollToSection(tasksRef);
      } else if (tab === "activity" || tab === "notes") {
        scrollToSection(timelineRef);
      }
    },
    [scrollToSection]
  );

  const handleLogCall = useCallback(() => {
    scrollToSection(timelineRef);
    setLogCallTrigger((prev) => prev + 1);
  }, [scrollToSection]);

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-3">
        <Link
          href="/contacts"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </Link>
        <Breadcrumb className="text-[13px]">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/contacts">Contacts</Link>
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

          {/* All sections stacked vertically */}
          <div className="mt-4 flex flex-col gap-5">
            {/* Contact Profile + Address */}
            <DetailOverviewTab
              contact={contact}
              isSuperAdmin={isSuperAdmin}
              userRole={userRole}
              sectionOrder={sectionOrder}
              sectionFields={sectionFields}
              teamMembers={teamMembers}
              allCompanies={allCompanies}
            />

            {/* Borrower (collapsible, only if exists) */}
            {borrower && (
              <CollapsibleBorrowerSection
                contact={contact}
                borrower={borrower}
                loans={loans}
                entities={entities}
                isSuperAdmin={isSuperAdmin}
                userRole={userRole}
                sectionOrder={sectionOrder}
                sectionFields={sectionFields}
                primaryBorrowerEntity={primaryBorrowerEntity}
              />
            )}

            {/* Investor (collapsible, only if exists) */}
            {investor && (
              <CollapsibleInvestorSection
                contact={contact}
                investor={investor}
                commitments={investorCommitments}
                entities={entities}
                isSuperAdmin={isSuperAdmin}
                userRole={userRole}
                sectionOrder={sectionOrder}
                sectionFields={sectionFields}
              />
            )}

            {/* Tasks (collapsible) */}
            <CollapsibleTasksSection
              ref={tasksRef}
              tasks={tasks}
              contactId={contact.id}
              contactName={fullName}
              profiles={profiles}
              currentUserId={currentUserId}
            />

            {/* Timeline (Notes + Activity) */}
            <TimelineSection
              ref={timelineRef}
              contactId={contact.id}
              activities={activities}
              emails={emails}
              currentUserId={currentUserId}
              onComposeEmail={() => setEmailComposeOpen(true)}
              logCallTrigger={logCallTrigger}
            />
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
