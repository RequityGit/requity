import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { IntakeQueue } from "@/components/pipeline-v2/IntakeQueue";

export const dynamic = "force-dynamic";

export default async function IntakePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const admin = createAdminClient();

  // Fetch pending/processing/ready items + recently resolved (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [activeResult, recentResult, cardTypesResult] = await Promise.all([
    admin
      .from("email_intake_queue")
      .select("*")
      .in("status", ["pending", "processing", "ready"])
      .order("created_at", { ascending: false }),
    admin
      .from("email_intake_queue")
      .select("*")
      .in("status", ["deal_created", "attached", "dismissed"])
      .gte("resolved_at", sevenDaysAgo)
      .order("resolved_at", { ascending: false })
      .limit(20),
    admin
      .from("unified_card_types")
      .select("id, label, slug, capital_side, card_icon, uw_fields"),
  ]);

  const activeItems = (activeResult.data || []) as IntakeQueueItem[];
  const recentItems = (recentResult.data || []) as IntakeQueueItem[];
  const cardTypes = (cardTypesResult.data || []) as CardType[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Intake"
        description="Review forwarded emails and create deals from extracted data."
      />
      <IntakeQueue
        activeItems={activeItems}
        recentItems={recentItems}
        cardTypes={cardTypes}
      />
    </div>
  );
}

export interface IntakeQueueItem {
  id: string;
  crm_email_id: string | null;
  gmail_message_id: string;
  from_email: string;
  from_name: string | null;
  subject: string | null;
  body_preview: string | null;
  received_at: string;
  status: string;
  attachments: Array<{
    filename: string;
    storage_path: string;
    mime_type: string;
    size_bytes: number;
    extraction_status: string;
  }>;
  extraction_summary: string | null;
  extracted_deal_fields: Record<string, { value: string | number | boolean; confidence: number; source: string }> | null;
  extracted_uw_fields: Record<string, { value: string | number | boolean; confidence: number; source: string }> | null;
  suggested_card_type_id: string | null;
  matched_contact_id: string | null;
  resolved_deal_id: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CardType {
  id: string;
  label: string;
  slug: string | null;
  capital_side: string;
  card_icon: string | null;
  uw_fields: Array<{
    key: string;
    label: string;
    type: string;
    options?: string[];
  }> | null;
}
