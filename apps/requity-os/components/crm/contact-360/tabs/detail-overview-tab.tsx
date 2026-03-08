"use client";

import { useState, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Landmark, TrendingUp, User, Shield, FileText } from "lucide-react";
import {
  SectionCard,
  SectionEditButton,
  MetricCard,
} from "../contact-detail-shared";
import {
  CrmEditSectionDialog,
} from "@/components/crm/crm-edit-section-dialog";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
import {
  renderDynamicFields,
  buildEditFields,
} from "@/components/crm/shared-field-renderer";
import type {
  ContactData,
  BorrowerData,
  InvestorProfileData,
  LoanData,
  InvestorCommitmentData,
  SectionLayout,
  FieldLayout,
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
}

// Default section order used when no layout data exists in the database
const DEFAULT_SECTION_ORDER: SectionLayout[] = [
  { section_key: "borrower_summary", display_order: 0, is_visible: true, visibility_rule: "has_borrower" },
  { section_key: "investor_summary", display_order: 1, is_visible: true, visibility_rule: "has_investor" },
  { section_key: "borrower_profile", display_order: 2, is_visible: true, visibility_rule: "has_borrower" },
  { section_key: "investor_profile", display_order: 3, is_visible: true, visibility_rule: "has_investor" },
  { section_key: "contact_profile", display_order: 4, is_visible: true, visibility_rule: null },
  { section_key: "description", display_order: 5, is_visible: true, visibility_rule: null },
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
}: DetailOverviewTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [editContactOpen, setEditContactOpen] = useState(false);
  const [editBorrowerOpen, setEditBorrowerOpen] = useState(false);
  const [editInvestorOpen, setEditInvestorOpen] = useState(false);
  const [editDescriptionOpen, setEditDescriptionOpen] = useState(false);

  async function updateBorrowerField(
    field: string,
    value: string | number | boolean | null
  ) {
    if (!borrower) return;
    const { error } = await supabase
      .from("borrowers")
      .update({ [field]: value })
      .eq("id", borrower.id);
    if (error) {
      toast({
        title: "Error saving",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
    toast({ title: "Saved" });
    router.refresh();
  }

  async function updateInvestorField(
    field: string,
    value: string | number | boolean | null
  ) {
    if (!investor) return;
    const { error } = await supabase
      .from("investors")
      .update({ [field]: value })
      .eq("id", investor.id);
    if (error) {
      toast({
        title: "Error saving",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
    toast({ title: "Saved" });
    router.refresh();
  }

  async function updateContactField(
    field: string,
    value: string | number | boolean | null
  ) {
    const { error } = await supabase
      .from("crm_contacts")
      .update({ [field]: value })
      .eq("id", contact.id);
    if (error) {
      toast({
        title: "Error saving",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
    toast({ title: "Saved" });
    router.refresh();
  }

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

  // Resolve which sections to render and in what order
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
      .sort((a, b) => a.display_order - b.display_order)
      .map((s) => s.section_key);
  }, [sectionOrder, hasBorrower, hasInvestor]);

  // Data objects for dynamic field rendering
  const contactData = contact as unknown as Record<string, unknown>;
  const borrowerData = (borrower ?? {}) as Record<string, unknown>;
  const investorData = (investor ?? {}) as Record<string, unknown>;

  // Build edit dialog field lists from layout data
  const contactEditFields = useMemo(
    () => sectionFields.contact_profile?.length
      ? buildEditFields(sectionFields.contact_profile, contactData, isSuperAdmin)
      : [],
    [sectionFields, contactData, isSuperAdmin]
  );

  const borrowerEditFields = useMemo(
    () => sectionFields.borrower_profile?.length && borrower
      ? buildEditFields(sectionFields.borrower_profile, borrowerData, isSuperAdmin)
      : [],
    [sectionFields, borrowerData, borrower, isSuperAdmin]
  );

  const investorEditFields = useMemo(
    () => sectionFields.investor_profile?.length && investor
      ? buildEditFields(sectionFields.investor_profile, investorData, isSuperAdmin)
      : [],
    [sectionFields, investorData, investor, isSuperAdmin]
  );

  // Build section content map: section_key -> JSX
  const sectionContent: Record<string, ReactNode> = {
    borrower_summary:
      hasBorrower && loans.length > 0 ? (
        <SectionCard title="Borrower Summary" icon={Landmark} key="borrower_summary">
          <div className="flex gap-5 flex-wrap">
            <MetricCard
              label="Total Loans"
              value={loans.length}
              sub={`${activeLoans.length} active`}
            />
            <MetricCard
              label="Loan Volume"
              value={formatCurrency(totalVolume)}
              mono
            />
            <MetricCard
              label="Avg Rate"
              value={avgRate > 0 ? formatPercent(avgRate) : "—"}
              mono
            />
            <MetricCard label="Active Opps" value={activeLoans.length} />
            <MetricCard
              label="First Loan"
              value={firstLoan ? formatDate(firstLoan.created_at) : "—"}
            />
          </div>
        </SectionCard>
      ) : null,

    investor_summary:
      hasInvestor && commitments.length > 0 ? (
        <SectionCard title="Investor Summary" icon={TrendingUp} key="investor_summary">
          <div className="flex gap-5 flex-wrap">
            <MetricCard
              label="Total Committed"
              value={formatCurrency(totalCommitted)}
              mono
            />
            <MetricCard
              label="Funded"
              value={formatCurrency(totalFunded)}
              mono
            />
            <MetricCard
              label="Unfunded"
              value={formatCurrency(totalUnfunded)}
              mono
            />
            <MetricCard label="Active Funds" value={activeFunds} />
          </div>
        </SectionCard>
      ) : null,

    borrower_profile: hasBorrower ? (
      <SectionCard title="Borrower Profile" icon={User} action={<SectionEditButton onClick={() => setEditBorrowerOpen(true)} />} key="borrower_profile">
        {sectionFields.borrower_profile?.length
          ? renderDynamicFields(sectionFields.borrower_profile, borrowerData, isSuperAdmin)
          : null}
      </SectionCard>
    ) : null,

    investor_profile: hasInvestor ? (
      <SectionCard title="Investor Profile" icon={Shield} action={<SectionEditButton onClick={() => setEditInvestorOpen(true)} />} key="investor_profile">
        {sectionFields.investor_profile?.length
          ? renderDynamicFields(sectionFields.investor_profile, investorData, isSuperAdmin)
          : null}
      </SectionCard>
    ) : null,

    contact_profile: (
      <SectionCard title="Contact Profile" icon={FileText} action={<SectionEditButton onClick={() => setEditContactOpen(true)} />} key="contact_profile">
        {sectionFields.contact_profile?.length
          ? renderDynamicFields(sectionFields.contact_profile, contactData, isSuperAdmin)
          : null}
      </SectionCard>
    ),

    description: (
      <SectionCard title="Description" icon={FileText} action={<SectionEditButton onClick={() => setEditDescriptionOpen(true)} />} key="description">
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
    ),
  };

  return (
    <div className="flex flex-col gap-5">
      {resolvedSections.map((key) => sectionContent[key])}

      {/* Section Edit Dialogs */}
      <CrmEditSectionDialog
        open={editContactOpen}
        onOpenChange={setEditContactOpen}
        title="Contact Profile"
        fields={contactEditFields}
        onSave={updateContactField}
      />
      {hasBorrower && (
        <CrmEditSectionDialog
          open={editBorrowerOpen}
          onOpenChange={setEditBorrowerOpen}
          title="Borrower Profile"
          fields={borrowerEditFields}
          onSave={updateBorrowerField}
        />
      )}
      {hasInvestor && (
        <CrmEditSectionDialog
          open={editInvestorOpen}
          onOpenChange={setEditInvestorOpen}
          title="Investor Profile"
          fields={investorEditFields}
          onSave={updateInvestorField}
        />
      )}
      <CrmEditSectionDialog
        open={editDescriptionOpen}
        onOpenChange={setEditDescriptionOpen}
        title="Description"
        fields={[{ label: "Description", fieldName: "notes", fieldType: "textarea", value: contact.notes }]}
        onSave={updateContactField}
      />
    </div>
  );
}
