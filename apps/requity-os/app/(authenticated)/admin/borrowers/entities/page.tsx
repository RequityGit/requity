import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { AllEntitiesTable } from "@/components/admin/all-entities-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function AllEntitiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: entitiesData } = await admin
    .from("borrower_entities")
    .select("id, entity_name, entity_type, state_of_formation, borrower_id, created_at")
    .order("entity_name");

  // Get all borrowers referenced by entities
  const borrowerIds = Array.from(
    new Set((entitiesData || []).map((e: any) => e.borrower_id))
  );

  let borrowerNames: Record<string, string> = {};
  if (borrowerIds.length > 0) {
    const { data: borrowersData } = await admin
      .from("borrowers")
      .select("id, first_name, last_name, crm_contact_id")
      .in("id", borrowerIds);

    // Resolve CRM contact names
    const crmIds = (borrowersData || [])
      .map((b: any) => b.crm_contact_id)
      .filter(Boolean);

    let crmNames: Record<string, string> = {};
    if (crmIds.length > 0) {
      const { data: contacts } = await admin
        .from("crm_contacts")
        .select("id, first_name, last_name")
        .in("id", crmIds);
      (contacts || []).forEach((c: any) => {
        crmNames[c.id] = `${c.first_name || ""} ${c.last_name || ""}`.trim();
      });
    }

    (borrowersData || []).forEach((b: any) => {
      const crmName = b.crm_contact_id ? crmNames[b.crm_contact_id] : null;
      borrowerNames[b.id] =
        crmName ||
        `${b.first_name || ""} ${b.last_name || ""}`.trim() ||
        "Unknown";
    });
  }

  const entities = (entitiesData || []).map((e: any) => ({
    id: e.id,
    entity_name: e.entity_name,
    entity_type: e.entity_type,
    state_of_formation: e.state_of_formation,
    borrower_id: e.borrower_id,
    borrower_name: borrowerNames[e.borrower_id] || "Unknown",
    created_at: e.created_at,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/crm?tab=borrowers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Borrowers
          </Button>
        </Link>
      </div>

      <PageHeader
        title="All Entities"
        description="Browse all borrower entities across all borrowers."
      />

      <AllEntitiesTable entities={entities} />
    </div>
  );
}
