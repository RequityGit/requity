import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- table pending migration
const fromUW = (sb: any) => sb.from("commercial_uw");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { dealId } = await params;
  const supabase = await createClient();

  const { data, error } = await fromUW(supabase)
    .select("*")
    .eq("deal_id", dealId)
    .order("version", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { dealId } = await params;
  const supabase = await createClient();
  const body = await request.json();

  // Get next version number
  const { data: existing } = await fromUW(supabase)
    .select("version")
    .eq("deal_id", dealId)
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion = existing && existing.length > 0 ? existing[0].version + 1 : 1;

  const { data, error } = await fromUW(supabase)
    .insert({
      deal_id: dealId,
      version: nextVersion,
      status: "draft",
      data: body.data || {},
      created_by: body.createdBy || "system",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
