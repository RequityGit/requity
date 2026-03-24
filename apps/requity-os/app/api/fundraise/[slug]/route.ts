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
      "id, name, amount, property_data, fundraise_slug, fundraise_enabled, fundraise_target, fundraise_description, fundraise_amount_options, fundraise_hero_image_url, fundraise_deck_url" as never
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

  return NextResponse.json({ deal: data });
}
