import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- table pending migration
const fromUW = (sb: any) => sb.from("commercial_uw");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; uwId: string }> }
) {
  const { uwId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await fromUW(supabase)
    .select("*")
    .eq("id", uwId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; uwId: string }> }
) {
  const { uwId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { data, error } = await fromUW(supabase)
    .update({
      data: body.data,
      status: body.status || "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", uwId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; uwId: string }> }
) {
  const { uwId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await fromUW(supabase)
    .delete()
    .eq("id", uwId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
