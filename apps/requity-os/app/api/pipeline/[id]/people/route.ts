import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getBorrowingEntityByDealId,
  getBorrowerMembersByDealId,
} from "@/app/services/borrower.server";
import { getDealTeamContacts } from "@/app/services/deal-team.server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error ?? "Unauthorized" }, { status: 401 });
  }

  const { id: dealId } = await params;
  const admin = createAdminClient();

  try {
    const [entity, members, thirdParties] = await Promise.all([
      getBorrowingEntityByDealId(admin, dealId),
      getBorrowerMembersByDealId(admin, dealId),
      getDealTeamContacts(admin, dealId),
    ]);

    // Broker contact: fetched from unified_deals.broker_contact_id -> crm_contacts join
    let broker: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      phone: string | null;
      broker_company: { name: string } | null;
    } | null = null;

    const { data: dealRow } = await admin
      .from("unified_deals" as never)
      .select("broker_contact_id, uw_data" as never)
      .eq("id" as never, dealId as never)
      .single();

    const brokerContactId = (dealRow as Record<string, unknown> | null)?.broker_contact_id as string | null;
    const uwData = (dealRow as Record<string, unknown> | null)?.uw_data as Record<string, unknown> | null;

    if (brokerContactId) {
      const { data: brokerData } = await admin
        .from("crm_contacts" as never)
        .select("id, first_name, last_name, email, phone, broker_company:crm_companies(name)" as never)
        .eq("id" as never, brokerContactId as never)
        .single();
      if (brokerData) {
        broker = brokerData as typeof broker;
      }
    }

    // Broker extra fields from uw_data
    const brokerExtra = {
      broker_nmls: (uwData?.broker_nmls as string) ?? "",
      broker_fee_pct: (uwData?.broker_fee_pct as string) ?? "",
      broker_notes: (uwData?.broker_notes as string) ?? "",
    };

    return NextResponse.json({
      entity,
      members,
      broker,
      brokerExtra,
      thirdParties,
    });
  } catch (err) {
    console.error("GET /api/pipeline/[id]/people error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load people data" },
      { status: 500 }
    );
  }
}
