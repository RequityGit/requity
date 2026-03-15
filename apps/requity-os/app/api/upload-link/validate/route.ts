import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { valid: false, reason: "missing_token" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: link, error } = await admin
      .from("secure_upload_links")
      .select("id, deal_id, mode, label, instructions, expires_at, max_uploads, upload_count, status, include_general_upload")
      .eq("token", token)
      .single();

    if (error || !link) {
      return NextResponse.json({ valid: false, reason: "not_found" });
    }

    if (link.status === "revoked") {
      return NextResponse.json({ valid: false, reason: "revoked" });
    }

    if (new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, reason: "expired" });
    }

    if (link.max_uploads && link.upload_count >= link.max_uploads) {
      return NextResponse.json({ valid: false, reason: "max_uploads_reached" });
    }

    const { data: deal } = await admin
      .from("unified_deals")
      .select("name")
      .eq("id", link.deal_id)
      .single();

    const dealName = deal?.name ?? "Document Upload";

    let conditions: {
      id: string;
      condition_name: string;
      borrower_description: string | null;
      category: string | null;
      status: string;
      document_count: number;
    }[] = [];

    if (link.mode === "checklist") {
      const { data: linkConditions } = await admin
        .from("secure_upload_link_conditions")
        .select("condition_id, sort_order")
        .eq("upload_link_id", link.id)
        .order("sort_order");

      if (linkConditions && linkConditions.length > 0) {
        const conditionIds = linkConditions.map((lc) => lc.condition_id);

        const { data: conditionRows } = await admin
          .from("unified_deal_conditions")
          .select("id, condition_name, borrower_description, category, status")
          .in("id", conditionIds);

        const { data: docCounts } = await admin
          .from("unified_deal_documents")
          .select("condition_id")
          .eq("deal_id", link.deal_id)
          .in("condition_id", conditionIds)
          .is("deleted_at", null);

        const countMap = new Map<string, number>();
        if (docCounts) {
          for (const d of docCounts) {
            if (d.condition_id) {
              countMap.set(d.condition_id, (countMap.get(d.condition_id) || 0) + 1);
            }
          }
        }

        const orderMap = new Map(linkConditions.map((lc) => [lc.condition_id, lc.sort_order]));
        conditions = (conditionRows || [])
          .map((c) => ({
            id: c.id,
            condition_name: c.condition_name,
            borrower_description: c.borrower_description,
            category: c.category,
            status: c.status,
            document_count: countMap.get(c.id) || 0,
          }))
          .sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0));
      }
    }

    const remaining = link.max_uploads
      ? link.max_uploads - link.upload_count
      : null;

    return NextResponse.json({
      valid: true,
      dealName,
      mode: link.mode,
      label: link.label,
      instructions: link.instructions,
      includeGeneralUpload: link.include_general_upload,
      remainingUploads: remaining,
      conditions,
    });
  } catch (err) {
    console.error("upload-link/validate error:", err instanceof Error ? err.message : err);
    if (err instanceof Error && err.stack) console.error(err.stack);
    return NextResponse.json(
      { valid: false, reason: "server_error" },
      { status: 500 }
    );
  }
}
