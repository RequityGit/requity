import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getBorrowingEntityByDealId,
  getBorrowerMembersByDealId,
} from "@/app/services/borrower.server";

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
    const [entity, members] = await Promise.all([
      getBorrowingEntityByDealId(admin, dealId),
      getBorrowerMembersByDealId(admin, dealId),
    ]);

    return NextResponse.json({ entity, members });
  } catch (err) {
    console.error("GET /api/pipeline/[id]/borrower error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load borrower data" },
      { status: 500 }
    );
  }
}
