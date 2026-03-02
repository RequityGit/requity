import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DealDetailClient } from "@/components/admin/originations/deal-detail-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function DealDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const opportunityId = params.id;

  // Check if the user is a super admin
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  const isSuperAdmin = (roles ?? []).some((r: { role: string }) => r.role === "super_admin");

  // Fetch all data in parallel
  const [
    oppResult,
    teamResult,
    allBorrowersResult,
  ] = await Promise.all([
    admin
      .from("opportunities")
      .select("*")
      .eq("id", opportunityId)
      .single(),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "admin")
      .order("full_name"),
    admin
      .from("borrowers")
      .select("id, first_name, last_name, email, crm_contact_id")
      .order("last_name"),
  ]);

  if (oppResult.error || !oppResult.data) {
    notFound();
  }

  const opportunity = oppResult.data;

  // Fetch related data based on opportunity relationships
  const [
    propertyResult,
    entityResult,
    borrowersResult,
    snapshotsResult,
  ] = await Promise.all([
    // Property
    opportunity.property_id
      ? admin
          .from("properties")
          .select("*")
          .eq("id", opportunity.property_id)
          .single()
      : Promise.resolve({ data: null, error: null }),
    // Borrowing entity
    opportunity.borrower_entity_id
      ? admin
          .from("borrower_entities")
          .select("*")
          .eq("id", opportunity.borrower_entity_id)
          .single()
      : Promise.resolve({ data: null, error: null }),
    // Opportunity borrowers with borrower + crm_contacts data
    admin
      .from("opportunity_borrowers")
      .select("*")
      .eq("opportunity_id", opportunityId)
      .order("sort_order"),
    // Financial snapshots
    admin
      .from("property_financial_snapshots")
      .select("*")
      .eq("opportunity_id", opportunityId)
      .order("effective_date", { ascending: false }),
  ]);

  // Fetch entity owners if entity exists
  let entityOwners: any[] = [];
  if (opportunity.borrower_entity_id) {
    const { data: owners } = await admin
      .from("entity_owners")
      .select("*")
      .eq("entity_id", opportunity.borrower_entity_id);

    if (owners && owners.length > 0) {
      // Get borrower names for owners
      const ownerBorrowerIds = owners.map((o: any) => o.borrower_id);
      const { data: ownerBorrowers } = await admin
        .from("borrowers")
        .select("id, first_name, last_name, crm_contact_id")
        .in("id", ownerBorrowerIds);

      // Try to get names from crm_contacts
      const crmContactIds = (ownerBorrowers || [])
        .map((b: any) => b.crm_contact_id)
        .filter(Boolean);

      let crmNames: Record<string, string> = {};
      if (crmContactIds.length > 0) {
        const { data: contacts } = await admin
          .from("crm_contacts")
          .select("id, first_name, last_name")
          .in("id", crmContactIds);
        (contacts || []).forEach((c: any) => {
          crmNames[c.id] = `${c.first_name || ""} ${c.last_name || ""}`.trim();
        });
      }

      const borrowerNameMap: Record<string, string> = {};
      (ownerBorrowers || []).forEach((b: any) => {
        const crmName = b.crm_contact_id ? crmNames[b.crm_contact_id] : null;
        borrowerNameMap[b.id] =
          crmName || `${b.first_name || ""} ${b.last_name || ""}`.trim() || "Unknown";
      });

      entityOwners = owners.map((o: any) => ({
        ...o,
        borrower_name: borrowerNameMap[o.borrower_id] || "Unknown",
      }));
    }
  }

  // Enrich opportunity borrowers with borrower names
  const oppBorrowerIds = (borrowersResult.data || []).map(
    (ob: any) => ob.borrower_id
  );
  let enrichedBorrowers: any[] = [];

  if (oppBorrowerIds.length > 0) {
    const { data: borrowerDetails } = await admin
      .from("borrowers")
      .select("id, first_name, last_name, email, phone, crm_contact_id, credit_score, is_us_citizen, marital_status, experience_count")
      .in("id", oppBorrowerIds);

    // Get CRM contact info
    const borrowerCrmIds = (borrowerDetails || [])
      .map((b: any) => b.crm_contact_id)
      .filter(Boolean);

    let crmContactMap: Record<string, any> = {};
    if (borrowerCrmIds.length > 0) {
      const { data: crmContacts } = await admin
        .from("crm_contacts")
        .select("id, first_name, last_name, email, phone")
        .in("id", borrowerCrmIds);
      (crmContacts || []).forEach((c: any) => {
        crmContactMap[c.id] = c;
      });
    }

    const borrowerMap: Record<string, any> = {};
    (borrowerDetails || []).forEach((b: any) => {
      const crm = b.crm_contact_id ? crmContactMap[b.crm_contact_id] : null;
      borrowerMap[b.id] = {
        ...b,
        borrower_name: crm
          ? `${crm.first_name || ""} ${crm.last_name || ""}`.trim()
          : `${b.first_name || ""} ${b.last_name || ""}`.trim() || "Unknown",
        email: crm?.email || b.email,
        phone: crm?.phone || b.phone,
      };
    });

    enrichedBorrowers = (borrowersResult.data || []).map((ob: any) => ({
      ...ob,
      ...(borrowerMap[ob.borrower_id] || {}),
    }));
  }

  // Team members
  const teamMembers = (teamResult.data || []).map(
    (t: { id: string; full_name: string | null }) => ({
      id: t.id,
      full_name: t.full_name || "Unknown",
    })
  );

  // All borrowers for add-borrower dialog
  const allBorrowersForSelect = (allBorrowersResult.data || []).map(
    (b: any) => ({
      id: b.id,
      name: `${b.first_name || ""} ${b.last_name || ""}`.trim() || "Unknown",
      email: b.email || "",
    })
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/admin/originations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Pipeline
          </Button>
        </Link>
      </div>

      <DealDetailClient
        opportunity={opportunity}
        property={propertyResult.data}
        entity={entityResult.data}
        entityOwners={entityOwners}
        borrowers={enrichedBorrowers}
        snapshots={snapshotsResult.data || []}
        teamMembers={teamMembers}
        allBorrowers={allBorrowersForSelect}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
