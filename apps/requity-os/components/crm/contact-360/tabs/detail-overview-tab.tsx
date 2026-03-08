"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Landmark, TrendingUp, User, Shield, FileText, Pencil } from "lucide-react";
import {
  SectionCard,
  MetricCard,
  FieldRow,
  MonoValue,
} from "../contact-detail-shared";
import {
  CrmEditSectionDialog,
  type CrmSectionField,
} from "@/components/crm/crm-edit-section-dialog";
import { formatCurrency, formatPercent, formatDate, formatPhoneNumber, formatPhoneInput } from "@/lib/format";
import type {
  ContactData,
  BorrowerData,
  InvestorProfileData,
  LoanData,
  InvestorCommitmentData,
} from "../types";

interface DetailOverviewTabProps {
  contact: ContactData;
  borrower: BorrowerData | null;
  investor: InvestorProfileData | null;
  loans: LoanData[];
  commitments: InvestorCommitmentData[];
  isSuperAdmin: boolean;
}

function SectionEditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors cursor-pointer border-0 text-muted-foreground bg-transparent hover:bg-muted hover:text-foreground"
    >
      <Pencil size={12} strokeWidth={1.5} />
      Edit
    </button>
  );
}

export function DetailOverviewTab({
  contact,
  borrower,
  investor,
  loans,
  commitments,
  isSuperAdmin,
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

  // --- Section field definitions for edit dialogs ---

  const contactFields: CrmSectionField[] = [
    { label: "First Name", fieldName: "first_name", fieldType: "text", value: contact.first_name },
    { label: "Last Name", fieldName: "last_name", fieldType: "text", value: contact.last_name },
    { label: "Email", fieldName: "email", fieldType: "text", value: contact.email },
    { label: "Phone", fieldName: "phone", fieldType: "text", value: formatPhoneInput(contact.phone ?? "") || contact.phone },
    { label: "Address", fieldName: "address_line1", fieldType: "text", value: contact.address_line1 },
    { label: "City", fieldName: "city", fieldType: "text", value: contact.city },
    { label: "State", fieldName: "state", fieldType: "text", value: contact.state },
    { label: "Zip", fieldName: "zip", fieldType: "text", value: contact.zip },
    {
      label: "Lifecycle Stage", fieldName: "lifecycle_stage", fieldType: "select", value: contact.lifecycle_stage,
      options: [
        { label: "Uncontacted", value: "uncontacted" },
        { label: "Prospect", value: "prospect" },
        { label: "Active", value: "active" },
        { label: "Past", value: "past" },
      ],
    },
    {
      label: "Status", fieldName: "status", fieldType: "select", value: contact.status,
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Converted", value: "converted" },
        { label: "Lost", value: "lost" },
        { label: "Do Not Contact", value: "do_not_contact" },
      ],
    },
    {
      label: "Source", fieldName: "source", fieldType: "select", value: contact.source,
      options: [
        { label: "Website", value: "website" },
        { label: "Referral", value: "referral" },
        { label: "Cold Call", value: "cold_call" },
        { label: "Email Campaign", value: "email_campaign" },
        { label: "Social Media", value: "social_media" },
        { label: "Event", value: "event" },
        { label: "Paid Ad", value: "paid_ad" },
        { label: "Organic", value: "organic" },
        { label: "Broker", value: "broker" },
        { label: "Repeat Client", value: "repeat_client" },
        { label: "Other", value: "other" },
      ],
    },
    { label: "Company", fieldName: "company_name", fieldType: "text", value: contact.company_name },
  ];

  const borrowerFields: CrmSectionField[] = borrower
    ? [
        { label: "Credit Score", fieldName: "credit_score", fieldType: "number", value: borrower.credit_score },
        { label: "Credit Report Date", fieldName: "credit_report_date", fieldType: "date", value: borrower.credit_report_date },
        { label: "RE Experience", fieldName: "experience_count", fieldType: "number", value: borrower.experience_count },
        { label: "Date of Birth", fieldName: "date_of_birth", fieldType: "date", value: borrower.date_of_birth, showYearNavigation: true },
        { label: "US Citizen", fieldName: "is_us_citizen", fieldType: "boolean", value: borrower.is_us_citizen },
        {
          label: "Marital Status", fieldName: "marital_status", fieldType: "select", value: borrower.marital_status,
          options: [
            { label: "Single", value: "single" },
            { label: "Married", value: "married" },
            { label: "Divorced", value: "divorced" },
            { label: "Widowed", value: "widowed" },
            { label: "Separated", value: "separated" },
          ],
        },
        { label: "Stated Liquidity", fieldName: "stated_liquidity", fieldType: "currency", value: borrower.stated_liquidity },
        { label: "Verified Liquidity", fieldName: "verified_liquidity", fieldType: "currency", value: borrower.verified_liquidity },
        { label: "Stated Net Worth", fieldName: "stated_net_worth", fieldType: "currency", value: borrower.stated_net_worth },
        { label: "Verified Net Worth", fieldName: "verified_net_worth", fieldType: "currency", value: borrower.verified_net_worth },
      ]
    : [];

  const investorFields: CrmSectionField[] = investor
    ? [
        {
          label: "Accreditation", fieldName: "accreditation_status", fieldType: "select", value: investor.accreditation_status,
          options: [
            { label: "Pending", value: "pending" },
            { label: "Verified", value: "verified" },
            { label: "Expired", value: "expired" },
            { label: "Not Accredited", value: "not_accredited" },
          ],
        },
        { label: "Verified At", fieldName: "accreditation_verified_at", fieldType: "date", value: investor.accreditation_verified_at },
      ]
    : [];

  return (
    <div className="flex flex-col gap-5">
      {/* Borrower Summary */}
      {hasBorrower && loans.length > 0 && (
        <SectionCard title="Borrower Summary" icon={Landmark}>
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
      )}

      {/* Investor Summary */}
      {hasInvestor && commitments.length > 0 && (
        <SectionCard title="Investor Summary" icon={TrendingUp}>
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
      )}

      {/* Borrower Profile */}
      {hasBorrower && (
        <SectionCard title="Borrower Profile" icon={User} action={<SectionEditButton onClick={() => setEditBorrowerOpen(true)} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
            <FieldRow
              label="Credit Score"
              value={
                borrower.credit_score != null ? (
                  <span
                    style={{
                      color:
                        borrower.credit_score >= 740
                          ? "#22A861"
                          : borrower.credit_score >= 680
                          ? "#E5930E"
                          : "#E5453D",
                    }}
                  >
                    {borrower.credit_score}
                  </span>
                ) : undefined
              }
              mono
            />
            <FieldRow label="Credit Report Date" value={formatDate(borrower.credit_report_date)} />
            <FieldRow
              label="RE Experience"
              value={
                borrower.experience_count != null
                  ? `${borrower.experience_count} transactions`
                  : undefined
              }
            />
            <FieldRow label="Date of Birth" value={formatDate(borrower.date_of_birth)} />
            <FieldRow
              label="US Citizen"
              value={
                borrower.is_us_citizen != null
                  ? borrower.is_us_citizen
                    ? "Yes"
                    : "No"
                  : undefined
              }
            />
            <FieldRow label="Marital Status" value={borrower.marital_status} />
            {isSuperAdmin && (
              <>
                <FieldRow
                  label="SSN (last 4)"
                  value={
                    borrower.ssn_last_four ? (
                      <MonoValue>{`●●●-●●-${borrower.ssn_last_four}`}</MonoValue>
                    ) : (
                      "—"
                    )
                  }
                  mono
                />
                <div />
              </>
            )}
            <FieldRow label="Stated Liquidity" value={formatCurrency(borrower.stated_liquidity)} mono />
            <FieldRow label="Verified Liquidity" value={formatCurrency(borrower.verified_liquidity)} mono />
            <FieldRow label="Stated Net Worth" value={formatCurrency(borrower.stated_net_worth)} mono />
            <FieldRow label="Verified Net Worth" value={formatCurrency(borrower.verified_net_worth)} mono />
          </div>
        </SectionCard>
      )}

      {/* Investor Profile */}
      {hasInvestor && (
        <SectionCard title="Investor Profile" icon={Shield} action={<SectionEditButton onClick={() => setEditInvestorOpen(true)} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
            <FieldRow
              label="Accreditation"
              value={
                investor.accreditation_status ? (
                  <Badge
                    variant="outline"
                    className="text-[11px] gap-1"
                    style={{
                      color:
                        investor.accreditation_status === "verified"
                          ? "#22A861"
                          : "#E5930E",
                      borderColor:
                        investor.accreditation_status === "verified"
                          ? "#22A86130"
                          : "#E5930E30",
                      backgroundColor:
                        investor.accreditation_status === "verified"
                          ? "#22A86108"
                          : "#E5930E08",
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          investor.accreditation_status === "verified"
                            ? "#22A861"
                            : "#E5930E",
                      }}
                    />
                    {investor.accreditation_status.charAt(0).toUpperCase() +
                      investor.accreditation_status.slice(1)}
                  </Badge>
                ) : undefined
              }
            />
            <FieldRow label="Verified At" value={formatDate(investor.accreditation_verified_at)} />
          </div>
        </SectionCard>
      )}

      {/* Contact Profile */}
      <SectionCard title="Contact Profile" icon={FileText} action={<SectionEditButton onClick={() => setEditContactOpen(true)} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
          <FieldRow label="First Name" value={contact.first_name} />
          <FieldRow label="Last Name" value={contact.last_name} />
          <FieldRow label="Email" value={contact.email} />
          <FieldRow label="Phone" value={formatPhoneNumber(contact.phone)} />
          <FieldRow label="Address" value={contact.address_line1} />
          <FieldRow label="City" value={contact.city} />
          <FieldRow label="State" value={contact.state} />
          <FieldRow label="Zip" value={contact.zip} />
          <FieldRow
            label="Lifecycle Stage"
            value={
              contact.lifecycle_stage
                ? contact.lifecycle_stage.charAt(0).toUpperCase() +
                  contact.lifecycle_stage.slice(1)
                : undefined
            }
          />
          <FieldRow
            label="Status"
            value={
              contact.status
                ? contact.status.charAt(0).toUpperCase() +
                  contact.status.slice(1)
                : undefined
            }
          />
          <FieldRow
            label="Source"
            value={
              contact.source
                ? contact.source.charAt(0).toUpperCase() +
                  contact.source.slice(1).replace(/_/g, " ")
                : undefined
            }
          />
          <FieldRow label="Company" value={contact.company_name} />
        </div>
      </SectionCard>

      {/* Description */}
      <SectionCard title="Description" icon={FileText} action={<SectionEditButton onClick={() => setEditDescriptionOpen(true)} />}>
        <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {contact.notes || "No description."}
        </p>
      </SectionCard>

      {/* Section Edit Dialogs */}
      <CrmEditSectionDialog
        open={editContactOpen}
        onOpenChange={setEditContactOpen}
        title="Contact Profile"
        fields={contactFields}
        onSave={updateContactField}
      />
      {hasBorrower && (
        <CrmEditSectionDialog
          open={editBorrowerOpen}
          onOpenChange={setEditBorrowerOpen}
          title="Borrower Profile"
          fields={borrowerFields}
          onSave={updateBorrowerField}
        />
      )}
      {hasInvestor && (
        <CrmEditSectionDialog
          open={editInvestorOpen}
          onOpenChange={setEditInvestorOpen}
          title="Investor Profile"
          fields={investorFields}
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
