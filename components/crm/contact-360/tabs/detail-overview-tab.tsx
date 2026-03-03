"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Landmark, TrendingUp, User, Shield, FileText } from "lucide-react";
import { SectionCard, MetricCard, FieldRow, EditableFieldRow, DotPill, MonoValue } from "../contact-detail-shared";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
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

  async function updateBorrowerField(field: string, value: string | number | boolean | null) {
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
  }

  async function updateInvestorField(field: string, value: string | number | boolean | null) {
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
  }

  async function updateContactField(field: string, value: string | number | boolean | null) {
    const { error } = await supabase
      .from("crm_contacts")
      .update({ [field]: value })
      .eq("id", contact.id);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Saved" });
    router.refresh();
  }
  const activeLoans = loans.filter(
    (l) => l.stage && !["paid_off", "payoff", "denied", "withdrawn"].includes(l.stage)
  );
  const totalVolume = loans.reduce((s, l) => s + (l.loan_amount || 0), 0);
  const rates = loans
    .map((l) => l.interest_rate)
    .filter((r): r is number => r != null);
  const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  const firstLoan = loans.length > 0
    ? loans.reduce((oldest, l) =>
        new Date(l.created_at) < new Date(oldest.created_at) ? l : oldest
      )
    : null;

  const totalCommitted = commitments.reduce((s, c) => s + (c.commitment_amount || 0), 0);
  const totalFunded = commitments.reduce((s, c) => s + (c.funded_amount || 0), 0);
  const totalUnfunded = commitments.reduce((s, c) => s + (c.unfunded_amount || 0), 0);
  const activeFunds = commitments.filter((c) => c.status === "active").length;

  const hasBorrower = !!borrower;
  const hasInvestor = !!investor;

  return (
    <div className="flex flex-col gap-5">
      {/* Borrower Summary */}
      {hasBorrower && loans.length > 0 && (
        <SectionCard title="Borrower Summary" icon={Landmark}>
          <div className="flex gap-5 flex-wrap">
            <MetricCard label="Total Loans" value={loans.length} sub={`${activeLoans.length} active`} />
            <MetricCard label="Loan Volume" value={formatCurrency(totalVolume)} mono />
            <MetricCard label="Avg Rate" value={avgRate > 0 ? formatPercent(avgRate) : "—"} mono />
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
            <MetricCard label="Total Committed" value={formatCurrency(totalCommitted)} mono />
            <MetricCard label="Funded" value={formatCurrency(totalFunded)} mono />
            <MetricCard label="Unfunded" value={formatCurrency(totalUnfunded)} mono />
            <MetricCard label="Active Funds" value={activeFunds} />
          </div>
        </SectionCard>
      )}

      {/* Borrower Profile */}
      {hasBorrower && (
        <SectionCard title="Borrower Profile" icon={User}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
            <EditableFieldRow
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
                ) : null
              }
              rawValue={borrower.credit_score}
              fieldType="number"
              mono
              onSave={(v) => updateBorrowerField("credit_score", v)}
            />
            <EditableFieldRow
              label="Credit Report Date"
              value={formatDate(borrower.credit_report_date)}
              rawValue={borrower.credit_report_date}
              fieldType="date"
              onSave={(v) => updateBorrowerField("credit_report_date", v)}
            />
            <EditableFieldRow
              label="RE Experience"
              value={
                borrower.experience_count != null
                  ? `${borrower.experience_count} transactions`
                  : null
              }
              rawValue={borrower.experience_count}
              fieldType="number"
              onSave={(v) => updateBorrowerField("experience_count", v)}
            />
            <EditableFieldRow
              label="Date of Birth"
              value={formatDate(borrower.date_of_birth)}
              rawValue={borrower.date_of_birth}
              fieldType="date"
              onSave={(v) => updateBorrowerField("date_of_birth", v)}
            />
            <EditableFieldRow
              label="US Citizen"
              value={borrower.is_us_citizen != null ? (borrower.is_us_citizen ? "Yes" : "No") : null}
              rawValue={borrower.is_us_citizen}
              fieldType="boolean"
              onSave={(v) => updateBorrowerField("is_us_citizen", v)}
            />
            <EditableFieldRow
              label="Marital Status"
              value={borrower.marital_status}
              rawValue={borrower.marital_status}
              fieldType="select"
              selectOptions={[
                { label: "Single", value: "single" },
                { label: "Married", value: "married" },
                { label: "Divorced", value: "divorced" },
                { label: "Widowed", value: "widowed" },
                { label: "Separated", value: "separated" },
              ]}
              onSave={(v) => updateBorrowerField("marital_status", v)}
            />
            {isSuperAdmin && (
              <>
                <FieldRow
                  label="SSN (last 4)"
                  value={
                    borrower.ssn_last_four
                      ? <MonoValue>{`●●●-●●-${borrower.ssn_last_four}`}</MonoValue>
                      : "—"
                  }
                  mono
                />
                <div />
              </>
            )}
            <EditableFieldRow
              label="Stated Liquidity"
              value={formatCurrency(borrower.stated_liquidity)}
              rawValue={borrower.stated_liquidity}
              fieldType="currency"
              mono
              onSave={(v) => updateBorrowerField("stated_liquidity", v)}
            />
            <EditableFieldRow
              label="Verified Liquidity"
              value={formatCurrency(borrower.verified_liquidity)}
              rawValue={borrower.verified_liquidity}
              fieldType="currency"
              mono
              onSave={(v) => updateBorrowerField("verified_liquidity", v)}
            />
            <EditableFieldRow
              label="Stated Net Worth"
              value={formatCurrency(borrower.stated_net_worth)}
              rawValue={borrower.stated_net_worth}
              fieldType="currency"
              mono
              onSave={(v) => updateBorrowerField("stated_net_worth", v)}
            />
            <EditableFieldRow
              label="Verified Net Worth"
              value={formatCurrency(borrower.verified_net_worth)}
              rawValue={borrower.verified_net_worth}
              fieldType="currency"
              mono
              onSave={(v) => updateBorrowerField("verified_net_worth", v)}
            />
          </div>
        </SectionCard>
      )}

      {/* Investor Profile */}
      {hasInvestor && (
        <SectionCard title="Investor Profile" icon={Shield}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
            <EditableFieldRow
              label="Accreditation"
              value={
                investor.accreditation_status ? (
                  <DotPill
                    color={investor.accreditation_status === "verified" ? "#22A861" : "#E5930E"}
                    label={investor.accreditation_status.charAt(0).toUpperCase() + investor.accreditation_status.slice(1)}
                    small
                  />
                ) : null
              }
              rawValue={investor.accreditation_status}
              fieldType="select"
              selectOptions={[
                { label: "Pending", value: "pending" },
                { label: "Verified", value: "verified" },
                { label: "Expired", value: "expired" },
                { label: "Not Accredited", value: "not_accredited" },
              ]}
              onSave={(v) => updateInvestorField("accreditation_status", v)}
            />
            <EditableFieldRow
              label="Verified At"
              value={formatDate(investor.accreditation_verified_at)}
              rawValue={investor.accreditation_verified_at}
              fieldType="date"
              onSave={(v) => updateInvestorField("accreditation_verified_at", v)}
            />
          </div>
        </SectionCard>
      )}

      {/* Contact Profile */}
      <SectionCard title="Contact Profile" icon={FileText}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
          <EditableFieldRow
            label="First Name"
            value={contact.first_name}
            rawValue={contact.first_name}
            fieldType="text"
            onSave={(v) => updateContactField("first_name", v)}
          />
          <EditableFieldRow
            label="Last Name"
            value={contact.last_name}
            rawValue={contact.last_name}
            fieldType="text"
            onSave={(v) => updateContactField("last_name", v)}
          />
          <EditableFieldRow
            label="Email"
            value={contact.email}
            rawValue={contact.email}
            fieldType="text"
            onSave={(v) => updateContactField("email", v)}
          />
          <EditableFieldRow
            label="Phone"
            value={contact.phone}
            rawValue={contact.phone}
            fieldType="text"
            onSave={(v) => updateContactField("phone", v)}
          />
          <EditableFieldRow
            label="Address"
            value={contact.address_line1}
            rawValue={contact.address_line1}
            fieldType="text"
            onSave={(v) => updateContactField("address_line1", v)}
          />
          <EditableFieldRow
            label="City"
            value={contact.city}
            rawValue={contact.city}
            fieldType="text"
            onSave={(v) => updateContactField("city", v)}
          />
          <EditableFieldRow
            label="State"
            value={contact.state}
            rawValue={contact.state}
            fieldType="text"
            onSave={(v) => updateContactField("state", v)}
          />
          <EditableFieldRow
            label="Zip"
            value={contact.zip}
            rawValue={contact.zip}
            fieldType="text"
            onSave={(v) => updateContactField("zip", v)}
          />
          <EditableFieldRow
            label="Lifecycle Stage"
            value={contact.lifecycle_stage ? contact.lifecycle_stage.charAt(0).toUpperCase() + contact.lifecycle_stage.slice(1) : null}
            rawValue={contact.lifecycle_stage}
            fieldType="select"
            selectOptions={[
              { label: "Uncontacted", value: "uncontacted" },
              { label: "Prospect", value: "prospect" },
              { label: "Active", value: "active" },
              { label: "Past", value: "past" },
            ]}
            onSave={(v) => updateContactField("lifecycle_stage", v)}
          />
          <EditableFieldRow
            label="Status"
            value={contact.status ? contact.status.charAt(0).toUpperCase() + contact.status.slice(1) : null}
            rawValue={contact.status}
            fieldType="select"
            selectOptions={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
              { label: "Converted", value: "converted" },
              { label: "Lost", value: "lost" },
              { label: "Do Not Contact", value: "do_not_contact" },
            ]}
            onSave={(v) => updateContactField("status", v)}
          />
          <EditableFieldRow
            label="Source"
            value={contact.source ? contact.source.charAt(0).toUpperCase() + contact.source.slice(1).replace(/_/g, " ") : null}
            rawValue={contact.source}
            fieldType="select"
            selectOptions={[
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
            ]}
            onSave={(v) => updateContactField("source", v)}
          />
          <EditableFieldRow
            label="Company"
            value={contact.company_name}
            rawValue={contact.company_name}
            fieldType="text"
            onSave={(v) => updateContactField("company_name", v)}
          />
        </div>
      </SectionCard>

      {/* Internal Notes */}
      {contact.notes && (
        <SectionCard title="Internal Notes" icon={FileText}>
          <p className="text-[13px] text-[#6B6B6B] leading-relaxed whitespace-pre-wrap">
            {contact.notes}
          </p>
        </SectionCard>
      )}
    </div>
  );
}
