import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
      "id, name, fundraise_slug, fundraise_enabled, fundraise_target, fundraise_description, fundraise_amount_options" as never
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
