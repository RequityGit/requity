"use client";

import { useState, useMemo, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Landmark, TrendingUp, FileText } from "lucide-react";
import {
  SectionCard,
  SectionEditButton,
  MetricCard,
} from "../contact-detail-shared";
import {
  CrmEditSectionDialog,
  type CrmSectionField,
} from "@/components/crm/crm-edit-section-dialog";
import { QuickAddCompanyDialog } from "@/components/crm/quick-add-company-dialog";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
import {
  renderDynamicFields,
  buildEditFields,
} from "@/components/crm/shared-field-renderer";
import { getSectionIcon } from "@/lib/icon-map";
import type {
  ContactData,
  BorrowerData,
  InvestorProfileData,
  LoanData,
  InvestorCommitmentData,
  SectionLayout,
  FieldLayout,
  TeamMember,
  CompanyData,
} from "../types";

interface DetailOverviewTabProps {
  contact: ContactData;
  borrower: BorrowerData | null;
  investor: InvestorProfileData | null;
  loans: LoanData[];
  commitments: InvestorCommitmentData[];
  isSuperAdmin: boolean;
  sectionOrder: SectionLayout[];
  sectionFields: Record<string, FieldLayout[]>;
  teamMembers: TeamMember[];
  allCompanies: CompanyData[];
  primaryBorrowerEntity: Record<string, unknown> | null;
}

// Default section order used when no layout data exists in the database
const DEFAULT_SECTION_ORDER: SectionLayout[] = [
  { section_key: "borrower_summary", display_order: 0, is_visible: true, visibility_rule: "has_borrower", section_type: "system", section_label: "Borrower Summary", section_icon: "landmark" },
  { section_key: "investor_summary", display_order: 1, is_visible: true, visibility_rule: "has_investor", section_type: "system", section_label: "Investor Summary", section_icon: "trending-up" },
  { section_key: "borrower_profile", display_order: 2, is_visible: true, visibility_rule: "has_borrower", section_type: "fields", section_label: "Borrower Profile", section_icon: "user" },
  { section_key: "investor_profile", display_order: 3, is_visible: true, visibility_rule: "has_investor", section_type: "fields", section_label: "Investor Profile", section_icon: "shield" },
  { section_key: "contact_profile", display_order: 4, is_visible: true, visibility_rule: null, section_type: "fields", section_label: "Contact Profile", section_icon: "file-text" },
  { section_key: "borrower_entity", display_order: 5, is_visible: true, visibility_rule: "has_borrower", section_type: "fields", section_label: "Borrower Entity", section_icon: "building-2" },
  { section_key: "description", display_order: 6, is_visible: true, visibility_rule: null, section_type: "fields", section_label: "Description", section_icon: "file-text" },
];

export function DetailOverviewTab({
  contact,
  borrower,
  investor,
  loans,
  commitments,
  isSuperAdmin,
  sectionOrder,
  sectionFields,
  teamMembers,
  allCompanies,
  primaryBorrowerEntity,
}: DetailOverviewTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [editingSectionKey, setEditingSectionKey] = useState<string | null>(null);
  const [editDescriptionOpen, setEditDescriptionOpen] = useState(false);
  const [quickAddCompanyOpen, setQuickAddCompanyOpen] = useState(false);
  const [localCompanies, setLocalCompanies] = useState<CompanyData[]>(allCompanies);

  // --- Save functions ---

  const updateContactField = useCallback(async (
    field: string,
    value: string | number | boolean | string[] | null
  ) => {
    const updates: Record<string, unknown> = { [field]: value };
    if (field === "company_id") {
      const match = localCompanies.find((c) => c.id === value);
      updates.company_name = match?.name ?? null;
    }
    const { error } = await supabase
      .from("crm_contacts")
      .update(updates)
      .eq("id", contact.id);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Saved" });
    router.refresh();
  }, [contact.id, localCompanies, supabase, toast, router]);

  const updateBorrowerField = useCallback(async (
    field: string,
    value: string | number | boolean | string[] | null
  ) => {
    if (!borrower) return;
    const { error } = await supabase
      .from("borrowers")
      .update({ [field]: value })
      .eq("id", borrower.id);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Saved" });
    router.refresh();
  }, [borrower, supabase, toast, router]);

  const updateInvestorField = useCallback(async (
    field: string,
    value: string | number | boolean | string[] | null
  ) => {
    if (!investor) return;
    const { error } = await supabase
      .from("investors")
      .update({ [field]: value })
      .eq("id", investor.id);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Saved" });
    router.refresh();
  }, [investor, supabase, toast, router]);

  const updateBorrowerEntityField = useCallback(async (
    field: string,
    value: string | number | boolean | string[] | null
  ) => {
    if (!primaryBorrowerEntity?.id) return;
    const { error } = await supabase
      .from("borrower_entities")
      .update({ [field]: value })
      .eq("id", primaryBorrowerEntity.id as string);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Saved" });
    router.refresh();
  }, [primaryBorrowerEntity, supabase, toast, router]);

  // --- Computed metrics ---

  const activeLoans = loans.filter(
    (l) =>
      l.stage &&
      !["paid_off", "payoff", "denied", "withdrawn"].includes(l.stage)
  );
  const totalVolume = loans.reduce((s, l) => s + (l.loan_amount || 0), 0);
  const rates = loans
    .map((l) => l.interest_rate)
    .filter((r): r is number => r != null);
  const avgRate =
    rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  const firstLoan =
    loans.length > 0
      ? loans.reduce((oldest, l) =>
          new Date(l.created_at) < new Date(oldest.created_at) ? l : oldest
        )
      : null;

  const totalCommitted = commitments.reduce(
    (s, c) => s + (c.commitment_amount || 0),
    0
  );
  const totalFunded = commitments.reduce(
    (s, c) => s + (c.funded_amount || 0),
    0
  );
  const totalUnfunded = commitments.reduce(
    (s, c) => s + (c.unfunded_amount || 0),
    0
  );
  const activeFunds = commitments.filter((c) => c.status === "active").length;

  const hasBorrower = !!borrower;
  const hasInvestor = !!investor;

  // --- Section data registry ---

  const teamMemberLookup = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of teamMembers) map[m.id] = m.full_name;
    return map;
  }, [teamMembers]);

  const companyLookup = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of localCompanies) map[c.id] = c.name;
    return map;
  }, [localCompanies]);

  const contactData = useMemo(() => {
    const data = { ...contact } as Record<string, unknown>;
    if (contact.assigned_to && teamMemberLookup[contact.assigned_to]) {
      data.assigned_to_display = teamMemberLookup[contact.assigned_to];
    }
    if (contact.company_id && companyLookup[contact.company_id]) {
      data.company_id_display = companyLookup[contact.company_id];
    }
    return data;
  }, [contact, teamMemberLookup, companyLookup]);

  const borrowerData = useMemo(() => (borrower ?? {}) as Record<string, unknown>, [borrower]);
  const investorData = useMemo(() => (investor ?? {}) as Record<string, unknown>, [investor]);
  const entityData = useMemo(() => (primaryBorrowerEntity ?? {}) as Record<string, unknown>, [primaryBorrowerEntity]);

  // Map section_key -> { data, save }
  const sectionDataMap = useMemo(() => {
    const map: Record<string, {
      data: Record<string, unknown>;
      save: (field: string, value: string | number | boolean | string[] | null) => Promise<void>;
    }> = {};

    map.contact_profile = { data: contactData, save: updateContactField };

    if (borrower) {
      map.borrower_profile = { data: borrowerData, save: updateBorrowerField };
    }
    if (investor) {
      map.investor_profile = { data: investorData, save: updateInvestorField };
    }
    if (primaryBorrowerEntity) {
      map.borrower_entity = { data: entityData, save: updateBorrowerEntityField };
    }

    return map;
  }, [contactData, borrowerData, investorData, entityData, borrower, investor, primaryBorrowerEntity, updateContactField, updateBorrowerField, updateInvestorField, updateBorrowerEntityField]);

  // --- Resolve visible sections ---

  const resolvedSections = useMemo(() => {
    const layout = sectionOrder.length > 0 ? sectionOrder : DEFAULT_SECTION_ORDER;

    const visibilityContext: Record<string, boolean> = {
      has_borrower: hasBorrower,
      has_investor: hasInvestor,
    };

    return layout
      .filter((s) => s.is_visible)
      .filter((s) => {
        if (!s.visibility_rule) return true;
        return visibilityContext[s.visibility_rule] ?? true;
      })
      .sort((a, b) => a.display_order - b.display_order);
  }, [sectionOrder, hasBorrower, hasInvestor]);

  // --- Build edit fields for the currently editing section ---

  const buildGenericEditFields = useCallback((sectionKey: string): CrmSectionField[] => {
    const fields = sectionFields[sectionKey];
    const source = sectionDataMap[sectionKey];
    if (!fields || !source) return [];

    let editFields = buildEditFields(fields, source.data, isSuperAdmin);

    // Section-specific option injections
    if (sectionKey === "contact_profile") {
      editFields = editFields.map((f) => {
        if (f.fieldName === "assigned_to") {
          return {
            ...f,
            fieldType: "select" as const,
            options: teamMembers.map((m) => ({ label: m.full_name, value: m.id })),
          };
        }
        if (f.fieldName === "company_id") {
          return {
            ...f,
            fieldType: "select" as const,
            options: localCompanies.map((c) => ({ label: c.name, value: c.id })),
            onCreateNew: () => setQuickAddCompanyOpen(true),
            createNewLabel: "New Company",
          };
        }
        return f;
      });
    }

    return editFields;
  }, [sectionFields, sectionDataMap, isSuperAdmin, teamMembers, localCompanies]);

  // --- Render helpers ---

  function renderSystemSection(section: SectionLayout): ReactNode {
    if (section.section_key === "borrower_summary" && hasBorrower && loans.length > 0) {
      return (
        <SectionCard title="Borrower Summary" icon={Landmark} key="borrower_summary">
          <div className="flex gap-5 flex-wrap">
            <MetricCard label="Total Loans" value={loans.length} sub={`${activeLoans.length} active`} />
            <MetricCard label="Loan Volume" value={formatCurrency(totalVolume)} mono />
            <MetricCard label="Avg Rate" value={avgRate > 0 ? formatPercent(avgRate) : "\u2014"} mono />
            <MetricCard label="Active Opps" value={activeLoans.length} />
            <MetricCard label="First Loan" value={firstLoan ? formatDate(firstLoan.created_at) : "\u2014"} />
          </div>
        </SectionCard>
      );
    }
    if (section.section_key === "investor_summary" && hasInvestor && commitments.length > 0) {
      return (
        <SectionCard title="Investor Summary" icon={TrendingUp} key="investor_summary">
          <div className="flex gap-5 flex-wrap">
            <MetricCard label="Total Committed" value={formatCurrency(totalCommitted)} mono />
            <MetricCard label="Funded" value={formatCurrency(totalFunded)} mono />
            <MetricCard label="Unfunded" value={formatCurrency(totalUnfunded)} mono />
            <MetricCard label="Active Funds" value={activeFunds} />
          </div>
        </SectionCard>
      );
    }
    return null;
  }

  function renderDescriptionSection(section: SectionLayout): ReactNode {
    const Icon = getSectionIcon(section.section_icon);
    return (
      <SectionCard title={section.section_label} icon={Icon} action={<SectionEditButton onClick={() => setEditDescriptionOpen(true)} />} key="description">
        {contact.notes ? (
          <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {contact.notes}
          </p>
        ) : (
          <button
            onClick={() => setEditDescriptionOpen(true)}
            className="text-[13px] text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer bg-transparent border-0 p-0 text-left"
          >
            Click to add a description...
          </button>
        )}
      </SectionCard>
    );
  }

  function renderFieldSection(section: SectionLayout): ReactNode {
    const source = sectionDataMap[section.section_key];
    const fields = sectionFields[section.section_key];

    if (!source || !fields?.length) return null;

    const Icon = getSectionIcon(section.section_icon);
    return (
      <SectionCard
        key={section.section_key}
        title={section.section_label}
        icon={Icon}
        action={<SectionEditButton onClick={() => setEditingSectionKey(section.section_key)} />}
      >
        {renderDynamicFields(fields, source.data, isSuperAdmin)}
      </SectionCard>
    );
  }

  function renderSection(section: SectionLayout): ReactNode {
    if (section.section_type === "system") {
      return renderSystemSection(section);
    }
    if (section.section_key === "description") {
      return renderDescriptionSection(section);
    }
    return renderFieldSection(section);
  }

  // --- Editing section config ---

  const editingSectionMeta = editingSectionKey
    ? resolvedSections.find((s) => s.section_key === editingSectionKey)
    : null;

  const editingFields = editingSectionKey
    ? buildGenericEditFields(editingSectionKey)
    : [];

  const editingSave = editingSectionKey && sectionDataMap[editingSectionKey]
    ? sectionDataMap[editingSectionKey].save
    : updateContactField;

  return (
    <div className="flex flex-col gap-5">
      {resolvedSections.map((section) => renderSection(section))}

      {/* Generic field section edit dialog */}
      <CrmEditSectionDialog
        open={!!editingSectionKey}
        onOpenChange={(open) => { if (!open) setEditingSectionKey(null); }}
        title={editingSectionMeta?.section_label ?? editingSectionKey ?? ""}
        fields={editingFields}
        onSave={editingSave}
      />

      {/* Description edit dialog (separate since it's a simple textarea) */}
      <CrmEditSectionDialog
        open={editDescriptionOpen}
        onOpenChange={setEditDescriptionOpen}
        title="Description"
        fields={[{ label: "Description", fieldName: "notes", fieldType: "textarea", value: contact.notes }]}
        onSave={updateContactField}
      />

      <QuickAddCompanyDialog
        open={quickAddCompanyOpen}
        onOpenChange={setQuickAddCompanyOpen}
        onCompanyCreated={(company) => {
          setLocalCompanies((prev) => [...prev, { id: company.id, name: company.name, company_type: company.company_type }]);
        }}
      />
    </div>
  );
}
