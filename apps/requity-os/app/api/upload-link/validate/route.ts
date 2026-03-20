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
      .select("id, deal_id, mode, label, instructions, expires_at, max_uploads, upload_count, status, include_general_upload, contact_id")
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

    interface ConditionDoc {
      name: string;
      uploaded_at: string;
      staged: boolean;
      id: string;
    }

    let conditions: {
      id: string;
      condition_name: string;
      borrower_description: string | null;
      category: string | null;
      status: string;
      document_count: number;
      documents: ConditionDoc[];
      staged_count: number;
      borrower_feedback: string | null;
      feedback_updated_at: string | null;
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
          .select("id, condition_name, borrower_description, category, status, borrower_feedback, feedback_updated_at")
          .in("id", conditionIds) as { data: { id: string; condition_name: string; borrower_description: string | null; category: string | null; status: string; borrower_feedback: string | null; feedback_updated_at: string | null }[] | null };

        // Fetch full document details (name + timestamp + submission_status)
        const { data: docRows } = await admin
          .from("unified_deal_documents" as never)
          .select("id, condition_id, document_name, created_at, submission_status" as never)
          .eq("deal_id" as never, link.deal_id as never)
          .in("condition_id" as never, conditionIds as never)
          .is("deleted_at" as never, null as never)
          .order("created_at" as never, { ascending: false } as never);

        const docMap = new Map<string, ConditionDoc[]>();
        if (docRows) {
          for (const d of docRows as { id: string; condition_id: string | null; document_name: string; created_at: string; submission_status: string }[]) {
            if (d.condition_id) {
              const docs = docMap.get(d.condition_id) || [];
              docs.push({
                id: d.id,
                name: d.document_name,
                uploaded_at: d.created_at,
                staged: d.submission_status === "staged",
              });
              docMap.set(d.condition_id, docs);
            }
          }
        }

        const orderMap = new Map(linkConditions.map((lc) => [lc.condition_id, lc.sort_order]));
        conditions = (conditionRows || [])
          .map((c) => {
            const docs = docMap.get(c.id) || [];
            const stagedCount = docs.filter((d) => d.staged).length;
            return {
              id: c.id,
              condition_name: c.condition_name,
              borrower_description: c.borrower_description,
              category: c.category,
              status: c.status,
              document_count: docs.filter((d) => !d.staged).length,
              documents: docs,
              staged_count: stagedCount,
              borrower_feedback: c.borrower_feedback ?? null,
              feedback_updated_at: c.feedback_updated_at ?? null,
            };
          })
          .sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0));
      }
    }

    const remaining = link.max_uploads
      ? link.max_uploads - link.upload_count
      : null;

    // Resolve contact name if link is tied to a specific borrower
    let contactName: string | null = null;
    let contactId: string | null = link.contact_id ?? null;
    if (contactId) {
      const { data: contact } = await admin
        .from("crm_contacts")
        .select("first_name, last_name")
        .eq("id", contactId)
        .single();
      if (contact) {
        contactName = [contact.first_name, contact.last_name].filter(Boolean).join(" ");
      }
    }

    // Fetch all borrower contacts on this deal for the identity picker
    const { data: dealContactRows } = await admin
      .from("deal_contacts")
      .select("contact_id, role, contact:crm_contacts(id, first_name, last_name)")
      .eq("deal_id", link.deal_id) as { data: { contact_id: string; role: string; contact: { id: string; first_name: string | null; last_name: string | null } | null }[] | null };

    const dealContacts = (dealContactRows || []).map((dc) => ({
      id: dc.contact_id,
      name: [dc.contact?.first_name, dc.contact?.last_name].filter(Boolean).join(" ") || "Unknown",
      role: dc.role,
    }));

    return NextResponse.json({
      valid: true,
      dealId: link.deal_id,
      dealName,
      mode: link.mode,
      label: link.label,
      instructions: link.instructions,
      includeGeneralUpload: link.include_general_upload,
      remainingUploads: remaining,
      conditions,
      contactId,
      contactName,
      dealContacts,
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
