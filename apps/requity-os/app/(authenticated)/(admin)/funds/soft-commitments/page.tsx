import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionData } from "@/lib/auth/session-cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { SoftCommitmentsClient } from "@/components/fundraising/SoftCommitmentsClient";
import type { SoftCommitment } from "@/lib/fundraising/types";

export const dynamic = "force-dynamic";

export default async function SoftCommitmentsPage() {
  const session = await getSessionData();
  if (!session) redirect("/login");

  const admin = createAdminClient();

  // Fetch all soft commitments with deal name
  const { data: rawCommitments, error } = await admin
    .from("soft_commitments" as never)
    .select(
      "*, deal:unified_deals!soft_commitments_deal_id_fkey(id, name, fundraise_slug), contact:crm_contacts!soft_commitments_contact_id_fkey(contact_number)" as never
    )
    .order("submitted_at" as never, { ascending: false } as never);

  if (error) {
    console.error("Error fetching soft commitments:", error);
  }

  const commitments = (rawCommitments ?? []) as unknown as SoftCommitment[];

  // Fetch deals that have fundraising enabled (for filter dropdown)
  const { data: rawDeals } = await admin
    .from("unified_deals" as never)
    .select("id, name, fundraise_slug" as never)
    .eq("fundraise_enabled" as never, true as never)
    .order("name" as never);

  const deals = (rawDeals ?? []) as { id: string; name: string; fundraise_slug: string | null }[];

  return (
    <div className="rq-page-content">
      <PageHeader
        title="Soft Commitments"
        description="Track and manage investor interest across fundraising deals"
      />
      <SoftCommitmentsClient commitments={commitments} deals={deals} />
    </div>
  );
}
