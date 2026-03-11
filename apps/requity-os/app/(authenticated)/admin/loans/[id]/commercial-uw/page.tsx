import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CommercialUWClient } from "@/components/admin/commercial-uw/commercial-uw-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: { id: string };
}

export default async function CommercialUWPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id: loanId } = await params;

  // Fetch loan — query without FK join to avoid silent failures
  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .select("id, loan_number, property_address, property_type, type, purchase_price, loan_amount, borrower_id")
    .eq("id", loanId)
    .single();

  if (loanError) {
    console.error("Commercial UW loan query error:", loanError.message, loanError.code);
  }

  if (!loan) notFound();

  // Fetch borrower name — contact fields now live on crm_contacts
  let borrowerJoin: { first_name: string | null; last_name: string | null } | null = null;
  if (loan.borrower_id) {
    const { data: bRow } = await supabase
      .from("borrowers")
      .select("crm_contact_id")
      .eq("id", loan.borrower_id)
      .maybeSingle();
    if (bRow?.crm_contact_id) {
      const { data: contact } = await (supabase as any)
        .from("crm_contacts")
        .select("first_name, last_name")
        .eq("id", bRow.crm_contact_id)
        .maybeSingle();
      borrowerJoin = contact ?? null;
    }
  }

  // Fetch existing underwriting (if any)
  const { data: uw } = await supabase
    .from("commercial_underwriting")
    .select("*")
    .eq("loan_id", loanId)
    .single();

  // Fetch rent roll, occupancy, ancillary, proforma, upload mappings if UW exists
  let rentRoll: unknown[] = [];
  let occupancyRows: unknown[] = [];
  let ancillaryRows: unknown[] = [];
  let proformaYears: unknown[] = [];
  let uploadMappings: unknown[] = [];

  if (uw) {
    const [rrResult, occResult, ancResult, pfResult, umResult] = await Promise.all([
      supabase
        .from("commercial_rent_roll")
        .select("*")
        .eq("underwriting_id", uw.id)
        .order("sort_order"),
      supabase
        .from("commercial_occupancy_income")
        .select("*")
        .eq("underwriting_id", uw.id)
        .order("sort_order"),
      supabase
        .from("commercial_ancillary_income")
        .select("*")
        .eq("underwriting_id", uw.id)
        .order("sort_order"),
      supabase
        .from("commercial_proforma_years")
        .select("*")
        .eq("underwriting_id", uw.id)
        .order("year"),
      supabase
        .from("commercial_upload_mappings")
        .select("id, upload_type, original_filename, column_mapping, row_count, parsed_data, created_at")
        .eq("underwriting_id", uw.id)
        .order("created_at", { ascending: false }),
    ]);
    rentRoll = rrResult.data ?? [];
    occupancyRows = occResult.data ?? [];
    ancillaryRows = ancResult.data ?? [];
    proformaYears = pfResult.data ?? [];
    uploadMappings = umResult.data ?? [];
  }

  // Fetch T12 historicals data
  const { data: t12Versions } = await supabase
    .from("t12_versions")
    .select("*")
    .eq("loan_id", loanId)
    .order("version_number", { ascending: false });

  const activeT12Version = t12Versions?.find((v) => v.is_active);
  let t12Upload = null;
  let t12LineItems: unknown[] = [];
  let t12Mappings: unknown[] = [];
  let t12Overrides: unknown[] = [];
  let t12PreviousMappings: Record<string, { category: string; is_excluded: boolean; exclusion_reason: string | null }> = {};

  if (activeT12Version) {
    const [uploadResult, lineItemsResult, mappingsResult, overridesResult] =
      await Promise.all([
        supabase
          .from("t12_uploads")
          .select("*")
          .eq("id", activeT12Version.t12_upload_id)
          .single(),
        supabase
          .from("t12_line_items")
          .select("*")
          .eq("t12_upload_id", activeT12Version.t12_upload_id)
          .order("sort_order"),
        supabase
          .from("t12_field_mappings")
          .select("*")
          .eq("t12_upload_id", activeT12Version.t12_upload_id),
        supabase
          .from("t12_overrides")
          .select("*")
          .eq("t12_upload_id", activeT12Version.t12_upload_id),
      ]);

    t12Upload = uploadResult.data;
    t12LineItems = lineItemsResult.data ?? [];
    t12Mappings = mappingsResult.data ?? [];
    t12Overrides = overridesResult.data ?? [];

    // Build previous mappings for re-upload auto-mapping
    if (lineItemsResult.data && mappingsResult.data) {
      for (const mapping of mappingsResult.data) {
        const lineItem = lineItemsResult.data.find(
          (li: { id: string }) => li.id === mapping.t12_line_item_id
        );
        if (lineItem) {
          t12PreviousMappings[
            (lineItem as { original_row_label: string }).original_row_label
              .toLowerCase()
              .trim()
          ] = {
            category: mapping.mapped_category,
            is_excluded: mapping.is_excluded ?? false,
            exclusion_reason: mapping.exclusion_reason,
          };
        }
      }
    }
  }

  // Fetch expense defaults
  const { data: expenseDefaults } = await supabase
    .from("commercial_expense_defaults")
    .select("*")
    .order("property_type");

  const borrowerName = borrowerJoin
    ? `${borrowerJoin.first_name ?? ""} ${borrowerJoin.last_name ?? ""}`.trim() || "—"
    : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/admin/pipeline/${loanId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Loan
          </Button>
        </Link>
      </div>

      <PageHeader
        title={`Commercial Underwriting — ${loan.loan_number ?? "New"}`}
        description={`${loan.property_address ?? "No address"} — ${borrowerName}`}
      />

      <CommercialUWClient
        loanId={loanId}
        loan={{
          loan_number: loan.loan_number,
          property_address: loan.property_address,
          property_type: loan.property_type,
          purchase_price: loan.purchase_price,
          loan_amount: loan.loan_amount,
        }}
        existingUW={uw}
        existingRentRoll={rentRoll}
        existingOccupancy={occupancyRows}
        existingAncillary={ancillaryRows}
        existingProforma={proformaYears}
        existingUploadMappings={uploadMappings}
        expenseDefaults={expenseDefaults ?? []}
        existingT12Upload={t12Upload}
        existingT12LineItems={t12LineItems as never[]}
        existingT12Mappings={t12Mappings as never[]}
        existingT12Versions={t12Versions ?? []}
        existingT12Overrides={t12Overrides as never[]}
        existingT12PreviousMappings={t12PreviousMappings}
      />
    </div>
  );
}
