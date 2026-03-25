import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Public GET: fetch deal fundraise info by slug (no auth required) */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("unified_deals" as never)
    .select(
      "id, name, amount, property_data, fundraise_slug, fundraise_enabled, fundraise_target, fundraise_description, fundraise_amount_options, fundraise_hero_image_url, fundraise_deck_url, fundraise_hard_cap" as never
    )
    .eq("fundraise_slug" as never, slug as never)
    .eq("fundraise_enabled" as never, true as never)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Deal not found or fundraising not active" },
      { status: 404 }
    );
  }

  const deal = data as Record<string, unknown>;

  // Sum active commitments (pending + confirmed + subscribed) for this deal
  let totalCommitted = 0;
  if (deal.fundraise_hard_cap) {
    const { data: sumData } = await admin
      .from("soft_commitments" as never)
      .select("commitment_amount" as never)
      .eq("deal_id" as never, deal.id as never)
      .in("status" as never, ["pending", "confirmed", "subscribed"] as never);

    if (sumData) {
      totalCommitted = (sumData as { commitment_amount: number }[]).reduce(
        (sum, row) => sum + (row.commitment_amount ?? 0),
        0
      );
    }
  }

  return NextResponse.json({
    deal,
    fundraise_committed: totalCommitted,
  });
}
