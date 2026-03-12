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
  FIELD_KEY_TO_PROP,
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
  userRole: string;
  sectionOrder: SectionLayout[];
  sectionFields: Record<string, FieldLayout[]>;
  teamMembers: TeamMember[];
  allCompanies: CompanyData[];
  primaryBorrowerEntity: Record<string, unknown> | null;
}

// --- Conditional logic operator evaluation ---
function evaluateOperator(
  operator: string,
  sourceValue: unknown,
  ruleValue: unknown
): boolean {
  switch (operator) {
    case "equals":
      return String(sourceValue ?? "") === String(ruleValue ?? "");
    case "not_equals":
      return String(sourceValue ?? "") !== String(ruleValue ?? "");
    case "contains": {
      const str = String(sourceValue ?? "").toLowerCase();
      const search = String(ruleValue ?? "").toLowerCase();
      return str.includes(search);
    }
    case "is_empty":
      return sourceValue === null || sourceValue === undefined || sourceValue === "";
    case "is_not_empty":
      return sourceValue !== null && sourceValue !== undefined && sourceValue !== "";
    case "greater_than":
      return Number(sourceValue) > Number(ruleValue);
    case "less_than":
      return Number(sourceValue) < Number(ruleValue);
    default:
      return true;
  }
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
  userRole,
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

  // Data source registry keyed by source_object_key (field-level resolution)
  type SaveFn = (field: string, value: string | number | boolean | string[] | null) => Promise<void>;
  const dataSourceMap = useMemo<Record<string, { data: Record<string, unknown>; save: SaveFn }>>(() => {
    const map: Record<string, { data: Record<string, unknown>; save: SaveFn }> = {
      contact: { data: contactData, save: updateContactField },
    };
    if (borrower) {
      map.borrower = { data: borrowerData, save: updateBorrowerField };
    }
    if (investor) {
      map.investor = { data: investorData, save: updateInvestorField };
    }
    if (primaryBorrowerEntity) {
      map.borrower_entity = { data: entityData, save: updateBorrowerEntityField };
    }
    return map;
  }, [contactData, borrowerData, investorData, entityData, borrower, investor, primaryBorrowerEntity, updateContactField, updateBorrowerField, updateInvestorField, updateBorrowerEntityField]);

  // ---------------------------------------------------------------------------
  // Conditional Logic + Permissions Evaluation
  // ---------------------------------------------------------------------------

  /**
   * Evaluate conditional_rules for a section's fields against current data.
   * Returns a Set of field_keys that should be hidden.
   */
  const getHiddenFieldKeys = useCallback((sectionKey: string): Set<string> => {
    const fields = sectionFields[sectionKey];
    if (!fields?.length) return new Set();

    const mergedData = buildMergedDataForSection(sectionKey);
    if (!mergedData) return new Set();

    const hidden = new Set<string>();
    for (const f of fields) {
      if (!f.conditional_rules || f.conditional_rules.length === 0) continue;

      let visible = true;
      const showRules = f.conditional_rules.filter((r) => r.action === "show");
      const hideRules = f.conditional_rules.filter((r) => r.action === "hide");

      // "show" rules: field is hidden unless ALL pass
      if (showRules.length > 0) {
        visible = showRules.every((rule) => {
          const sourceVal = mergedData[rule.source_field];
          return evaluateOperator(rule.operator, sourceVal, rule.value);
        });
      }

      // "hide" rules: if ALL pass, hide the field
      if (hideRules.length > 0) {
        const allPass = hideRules.every((rule) => {
          const sourceVal = mergedData[rule.source_field];
          return evaluateOperator(rule.operator, sourceVal, rule.value);
        });
        if (allPass) visible = false;
      }

      if (!visible) hidden.add(f.field_key);
    }

    return hidden;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionFields]);

  /**
   * Get field_keys that should not be viewable by the current role (permissions filter).
   * Also returns a set of field_keys that are read-only for the current role.
   */
  const getPermissionFilters = useCallback((sectionKey: string): { hiddenByPermission: Set<string>; readOnlyByPermission: Set<string> } => {
    const fields = sectionFields[sectionKey];
    const hiddenByPermission = new Set<string>();
    const readOnlyByPermission = new Set<string>();

    if (!fields?.length) return { hiddenByPermission, readOnlyByPermission };

    // Super admins bypass all field permissions
    if (isSuperAdmin) return { hiddenByPermission, readOnlyByPermission };

    for (const f of fields) {
      if (!f.permissions || Object.keys(f.permissions).length === 0) continue;
      const rolePerm = f.permissions[userRole];
      if (!rolePerm) continue; // No specific rule for this role = default visible+editable

      if (rolePerm.view === false) {
        hiddenByPermission.add(f.field_key);
      } else if (rolePerm.edit === false) {
        readOnlyByPermission.add(f.field_key);
      }
    }

    return { hiddenByPermission, readOnlyByPermission };
  }, [sectionFields, isSuperAdmin, userRole]);

  /**
   * Combine conditional logic + permissions into final hidden/readOnly sets for a section.
   */
  const getFieldFilters = useCallback((sectionKey: string) => {
    const conditionalHidden = getHiddenFieldKeys(sectionKey);
    const { hiddenByPermission, readOnlyByPermission } = getPermissionFilters(sectionKey);

    // Merge hidden sets
    const allHidden = new Set<string>(conditionalHidden);
    hiddenByPermission.forEach((k) => allHidden.add(k));

    return { hiddenFieldKeys: allHidden, readOnlyFieldKeys: readOnlyByPermission };
  }, [getHiddenFieldKeys, getPermissionFilters]);

  // Legacy section_key -> source_object_key fallback (for sections without per-field source)
  const SECTION_KEY_TO_SOURCE: Record<string, string> = {
    contact_profile: "contact",
    borrower_profile: "borrower",
    investor_profile: "investor",
    borrower_entity: "borrower_entity",
  };

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
    if (!fields?.length) return [];

    const mergedData = buildMergedDataForSection(sectionKey);
    if (!mergedData) return [];

    // Apply conditional logic + permissions to determine which fields to show/hide in edit
    const { hiddenFieldKeys, readOnlyFieldKeys } = getFieldFilters(sectionKey);

    // For edit dialogs, hide both conditionally-hidden AND read-only fields
    const editHidden = new Set(hiddenFieldKeys);
    readOnlyFieldKeys.forEach((k) => editHidden.add(k));

    let editFields = buildEditFields(fields, mergedData, isSuperAdmin, editHidden);

    // Inject special options for FK fields regardless of which section they're in
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

    return editFields;
  }, [sectionFields, dataSourceMap, isSuperAdmin, teamMembers, localCompanies, getFieldFilters]);

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

  // Build a merged data object for a section's fields by pulling each field's value
  // from the correct data source based on source_object_key
  function buildMergedDataForSection(sectionKey: string): Record<string, unknown> | null {
    const fields = sectionFields[sectionKey];
    if (!fields?.length) return null;

    const merged: Record<string, unknown> = {};
    let hasAnySource = false;

    for (const f of fields) {
      const sourceKey = f.source_object_key ?? SECTION_KEY_TO_SOURCE[sectionKey] ?? "contact";
      const source = dataSourceMap[sourceKey];
      if (!source) continue;
      hasAnySource = true;

      // Copy the field value (using FIELD_KEY_TO_PROP mapping for mismatches)
      const propKey = FIELD_KEY_TO_PROP[f.field_key] ?? f.field_key;
      merged[propKey] = source.data[propKey];

      // Also copy display-resolved keys (e.g., assigned_to_display, company_id_display)
      const displayKey = `${propKey}_display`;
      if (displayKey in source.data) {
        merged[displayKey] = source.data[displayKey];
      }
    }

    return hasAnySource ? merged : null;
  }

  function renderFieldSection(section: SectionLayout): ReactNode {
    const fields = sectionFields[section.section_key];
    if (!fields?.length) return null;

    const mergedData = buildMergedDataForSection(section.section_key);
    if (!mergedData) return null;

    // Apply conditional logic + permissions filtering
    const { hiddenFieldKeys } = getFieldFilters(section.section_key);

    const Icon = getSectionIcon(section.section_icon);
    return (
      <SectionCard
        key={section.section_key}
        title={section.section_label}
        icon={Icon}
        action={<SectionEditButton onClick={() => setEditingSectionKey(section.section_key)} />}
      >
        {renderDynamicFields(fields, mergedData, isSuperAdmin, hiddenFieldKeys)}
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

  // Route saves per-field to the correct table based on source_object_key
  const editingSave = useCallback(async (
    fieldName: string,
    value: string | number | boolean | string[] | null,
  ) => {
    if (!editingSectionKey) return;
    const fields = sectionFields[editingSectionKey];
    // Find the field definition to determine its source
    const fieldDef = fields?.find((f) => {
      const propKey = FIELD_KEY_TO_PROP[f.field_key] ?? f.field_key;
      return propKey === fieldName || f.field_key === fieldName;
    });
    const sourceKey = fieldDef?.source_object_key ?? SECTION_KEY_TO_SOURCE[editingSectionKey] ?? "contact";
    const saveFn = dataSourceMap[sourceKey]?.save ?? updateContactField;
    await saveFn(fieldName, value);
  }, [editingSectionKey, sectionFields, dataSourceMap, updateContactField]);

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
