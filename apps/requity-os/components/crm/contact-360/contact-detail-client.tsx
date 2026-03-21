"use client";

import { useState, useCallback, useRef, useMemo } from "react";
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
import { CrmInlineEditorWrapper } from "@/components/inline-layout-editor/CrmInlineEditorWrapper";
import { CollapsiblePipelineDealsSection } from "./sections/collapsible-pipeline-deals-section";
import { CollapsibleBorrowerSection } from "./sections/collapsible-borrower-section";
import { CollapsibleInvestorSection } from "./sections/collapsible-investor-section";
import { CollapsibleTasksSection } from "./sections/collapsible-tasks-section";
import { TimelineSection } from "./sections/timeline-section";
import { useContact360Lazy } from "@/hooks/useContact360Lazy";
import type {
  ContactData,
  RelationshipData,
  LoanData,
  InvestorCommitmentData,
  PipelineDealData,
  TeamMember,
  CompanyData,
  BorrowerData,
  InvestorProfileData,
  EntityData,
  SectionLayout,
  FieldLayout,
  Contact360TabCounts,
} from "./types";
import type { OpsTask, Profile } from "@/lib/tasks";

type PipelinePayload = { pipelineDeals: PipelineDealData[] };
type TasksPayload = { tasks: OpsTask[]; profiles: Profile[] };
type BorrowerPayload = {
  loans: LoanData[];
  entities: EntityData[];
  primaryBorrowerEntity: Record<string, unknown> | null;
};
type InvestorPayload = {
  investorCommitments: InvestorCommitmentData[];
  investingEntities: EntityData[];
};

interface ContactDetailClientProps {
  contact: ContactData;
  relationships: RelationshipData[];
  tabCounts: Contact360TabCounts;
  teamMembers: TeamMember[];
  profiles: Profile[];
  company: CompanyData | null;
  allCompanies: CompanyData[];
  borrower: BorrowerData | null;
  investor: InvestorProfileData | null;
  currentUserId: string;
  currentUserName: string;
  assignedToName: string | null;
  sourceLabel: string | null;
  isSuperAdmin: boolean;
  userRole: string;
  sectionOrder: SectionLayout[];
  sectionFields: Record<string, FieldLayout[]>;
}

export function ContactDetailClient({
  contact,
  relationships,
  tabCounts,
  teamMembers,
  profiles,
  company,
  allCompanies,
  borrower,
  investor,
  currentUserId,
  currentUserName,
  assignedToName,
  sourceLabel,
  isSuperAdmin,
  userRole,
  sectionOrder,
  sectionFields,
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

  const activeRelTypes = useMemo(
    () => relationships.filter((r) => r.is_active).map((r) => r.relationship_type),
    [relationships]
  );

  const loadPipeline = tabCounts.pipelineDeals > 0;
  const loadBorrower = !!borrower && activeRelTypes.includes("borrower");
  const loadInvestor = !!investor && activeRelTypes.includes("investor");

  const pipelineQ = useContact360Lazy<PipelinePayload>(contact.id, "pipeline", loadPipeline);
  const tasksQ = useContact360Lazy<TasksPayload>(contact.id, "tasks", true);
  const borrowerQ = useContact360Lazy<BorrowerPayload>(contact.id, "borrower", loadBorrower);
  const investorQ = useContact360Lazy<InvestorPayload>(contact.id, "investor", loadInvestor);

  const pipelineDeals = pipelineQ.data?.pipelineDeals ?? [];
  const tasks = tasksQ.data?.tasks ?? [];
  const taskProfiles = tasksQ.data?.profiles ?? profiles;
  const loans = borrowerQ.data?.loans ?? [];
  const borrowerEntities = borrowerQ.data?.entities ?? [];
  const primaryBorrowerEntity = borrowerQ.data?.primaryBorrowerEntity ?? null;
  const investorCommitments = investorQ.data?.investorCommitments ?? [];
  const investingEntities = investorQ.data?.investingEntities ?? [];

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
        <div className="flex-1 min-w-0">
          <ContactDetailHeader
            contact={contact}
            fullName={fullName}
            company={company}
            assignedToName={assignedToName}
            contactTypes={contactTypes}
          />

          <div className="mt-4 flex flex-col gap-5">
            <CrmInlineEditorWrapper pageType="contact_detail" isSuperAdmin={isSuperAdmin}>
            <DetailOverviewTab
              contact={contact}
              isSuperAdmin={isSuperAdmin}
              userRole={userRole}
              sectionOrder={sectionOrder}
              sectionFields={sectionFields}
              teamMembers={teamMembers}
              allCompanies={allCompanies}
            />

            <CollapsiblePipelineDealsSection
              deals={pipelineDeals}
              loading={pipelineQ.loading}
              dealCount={tabCounts.pipelineDeals}
            />

            {borrower && (
              <CollapsibleBorrowerSection
                contact={contact}
                borrower={borrower}
                loans={loans}
                entities={borrowerEntities}
                isSuperAdmin={isSuperAdmin}
                userRole={userRole}
                sectionOrder={sectionOrder}
                sectionFields={sectionFields}
                primaryBorrowerEntity={primaryBorrowerEntity}
                loading={borrowerQ.loading}
                loanCount={tabCounts.loans}
              />
            )}

            {investor && (
              <CollapsibleInvestorSection
                contact={contact}
                investor={investor}
                commitments={investorCommitments}
                entities={investingEntities}
                isSuperAdmin={isSuperAdmin}
                userRole={userRole}
                sectionOrder={sectionOrder}
                sectionFields={sectionFields}
                loading={investorQ.loading}
                commitmentCount={tabCounts.investorCommitments}
              />
            )}

            <CollapsibleTasksSection
              ref={tasksRef}
              tasks={tasks}
              contactId={contact.id}
              contactName={fullName}
              profiles={taskProfiles}
              currentUserId={currentUserId}
              loading={tasksQ.loading}
              taskCount={tabCounts.tasks}
              onRefreshTasks={tasksQ.refresh}
            />

            <TimelineSection
              ref={timelineRef}
              contactId={contact.id}
              currentUserId={currentUserId}
              onComposeEmail={() => setEmailComposeOpen(true)}
              logCallTrigger={logCallTrigger}
            />
            </CrmInlineEditorWrapper>
          </div>
        </div>

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
