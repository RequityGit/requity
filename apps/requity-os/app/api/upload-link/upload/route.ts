import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nq } from "@/lib/notifications";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/zip",
  "application/x-zip-compressed",
]);

function isAllowedType(mimeType: string): boolean {
  if (ALLOWED_TYPES.has(mimeType)) return true;
  if (mimeType.startsWith("image/")) return true;
  return false;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const token = formData.get("token") as string | null;
    const conditionId = formData.get("conditionId") as string | null;
    const staged = formData.get("staged") === "true";

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: link, error: linkError } = await admin
      .from("secure_upload_links")
      .select("id, deal_id, status, expires_at, max_uploads, upload_count")
      .eq("token", token)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: "Invalid upload link" }, { status: 403 });
    }

    if (link.status === "revoked") {
      return NextResponse.json({ error: "This upload link has been revoked" }, { status: 403 });
    }

    if (new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: "This upload link has expired" }, { status: 403 });
    }

    const files: File[] = formData.getAll("files").filter(
      (v): v is File => v instanceof File
    );

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (link.max_uploads && link.upload_count + files.length > link.max_uploads) {
      const remaining = link.max_uploads - link.upload_count;
      return NextResponse.json(
        { error: `Upload limit reached. You can upload ${remaining} more file${remaining === 1 ? "" : "s"}.` },
        { status: 400 }
      );
    }

    const uploaded: { name: string; documentId: string }[] = [];
    const errors: { name: string; error: string }[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        errors.push({ name: file.name, error: "File exceeds 50 MB limit" });
        continue;
      }

      const mimeType = file.type || "application/octet-stream";
      if (mimeType !== "application/octet-stream" && !isAllowedType(mimeType)) {
        errors.push({ name: file.name, error: "File type not allowed" });
        continue;
      }

      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const storagePath = conditionId
        ? `deals/${link.deal_id}/conditions/${conditionId}/${safeName}`
        : `deals/${link.deal_id}/uploads/${safeName}`;

      const { data: uploadUrl, error: uploadUrlError } = await admin.storage
        .from("loan-documents")
        .createSignedUploadUrl(storagePath);

      if (uploadUrlError || !uploadUrl) {
        errors.push({ name: file.name, error: "Failed to create upload URL" });
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const uploadRes = await fetch(uploadUrl.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": mimeType },
        body: arrayBuffer,
      });

      if (!uploadRes.ok) {
        errors.push({ name: file.name, error: "Failed to upload file to storage" });
        continue;
      }

      const signedUrlResult = await admin.storage
        .from("loan-documents")
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

      const fileUrl = signedUrlResult?.data?.signedUrl ?? storagePath;

      const insertResult = await admin
        .from("unified_deal_documents" as never)
        .insert({
          deal_id: link.deal_id,
          ...(conditionId ? { condition_id: conditionId } : {}),
          document_name: file.name,
          file_url: fileUrl,
          storage_path: storagePath,
          file_size_bytes: file.size,
          mime_type: mimeType,
          uploaded_by: null,
          review_status: "pending",
          visibility: "internal",
          submission_status: staged ? "staged" : "final",
        } as never)
        .select("id" as never)
        .single();

      if (insertResult.error) {
        await admin.storage.from("loan-documents").remove([storagePath]);
        errors.push({ name: file.name, error: "Failed to save document record" });
        continue;
      }

      const documentId = (insertResult.data as { id: string } | null)?.id ?? "";

      // Only auto-submit condition if NOT staged (backward compat for non-checklist uploads)
      if (conditionId && !staged) {
        await admin
          .from("unified_deal_conditions")
          .update({ status: "submitted", submitted_at: new Date().toISOString() })
          .eq("id", conditionId)
          .eq("status", "pending");

        // Fire-and-forget: Auto-trigger AI condition review for direct (non-staged) uploads
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.URL || "";
        const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
        if (appUrl && svcKey && documentId) {
          fetch(`${appUrl}/api/deals/${link.deal_id}/review-condition-document`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${svcKey}`,
            },
            body: JSON.stringify({
              document_id: documentId,
              condition_id: conditionId,
            }),
          }).catch((err) => {
            console.error(`upload/auto-ai-review failed for doc ${documentId}:`, err);
          });
        }
      }

      await admin
        .from("secure_upload_links")
        .update({ upload_count: (link.upload_count || 0) + uploaded.length + 1 })
        .eq("id", link.id);

      uploaded.push({ name: file.name, documentId });

      // Fire-and-forget: sync to Google Drive
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceRoleKey && documentId) {
        fetch(`${supabaseUrl}/functions/v1/sync-document-to-drive`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            document_id: documentId,
            deal_id: link.deal_id,
            storage_path: storagePath,
            file_name: file.name,
            mime_type: mimeType,
          }),
        }).catch(() => {});
      }
    }

    // Notify deal team when at least one file was uploaded (skip for staged uploads)
    if (uploaded.length > 0 && !staged) {
      try {
        const dealId = link.deal_id as string;
        const { data: deal } = await admin
          .from("unified_deals")
          .select("name")
          .eq("id", dealId)
          .single();
        const dealName = (deal as { name?: string } | null)?.name ?? "Deal";

        let conditionName: string | null = null;
        if (conditionId) {
          const { data: cond } = await admin
            .from("unified_deal_conditions")
            .select("condition_name")
            .eq("id", conditionId)
            .single();
          conditionName = (cond as { condition_name?: string } | null)?.condition_name ?? null;
        }

        const fileList =
          uploaded.length === 1
            ? uploaded[0].name
            : uploaded.map((u) => u.name).join(", ");
        const title =
          conditionName != null
            ? `New document(s) for ${dealName}: ${conditionName}`
            : `New document(s) uploaded for ${dealName}`;
        const body =
          uploaded.length === 1
            ? `1 file: ${fileList}`
            : `${uploaded.length} files: ${fileList}`;

        const { data: teamRows } = await admin
          .from("deal_team_members")
          .select("profile_id")
          .eq("deal_id", dealId);
        const profileIds = Array.from(
          new Set(
            (teamRows ?? [])
              .map((r: { profile_id: string | null }) => r.profile_id)
              .filter((id): id is string => Boolean(id))
          )
        );

        for (const profileId of profileIds) {
          try {
            await nq(admin).notifications().insert({
              user_id: profileId,
              notification_slug: "borrower-document-uploaded",
              title,
              body,
              priority: "normal",
              action_url: `/pipeline/${dealId}?tab=Diligence`,
            } as never);
          } catch (notifErr) {
            console.error("upload-link/upload: failed to notify", profileId, notifErr);
          }
        }
      } catch (notifErr) {
        console.error("upload-link/upload: notification setup failed", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      uploaded,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("upload-link/upload error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Remove a staged document before submission.
 * Body: { token: string; documentId: string }
 *
 * Only allows deletion of documents with submission_status = "staged".
 * Removes the file from Supabase Storage and deletes the DB record.
 */
export async function DELETE(request: Request) {
  try {
    const { token, documentId } = (await request.json()) as {
      token: string;
      documentId: string;
    };

    if (!token || !documentId) {
      return NextResponse.json(
        { error: "Missing token or documentId" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Validate the upload link
    const { data: link, error: linkError } = await admin
      .from("secure_upload_links")
      .select("id, deal_id, status, expires_at")
      .eq("token", token)
      .single();

    if (linkError || !link) {
      return NextResponse.json(
        { error: "Invalid upload link" },
        { status: 403 }
      );
    }

    if (link.status === "revoked") {
      return NextResponse.json(
        { error: "This upload link has been revoked" },
        { status: 403 }
      );
    }

    if (new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This upload link has expired" },
        { status: 403 }
      );
    }

    // Fetch the document - must belong to this deal and be staged
    const { data: doc, error: docError } = await admin
      .from("unified_deal_documents" as never)
      .select("id, storage_path, submission_status, deal_id" as never)
      .eq("id" as never, documentId as never)
      .single();

    const docRow = doc as {
      id: string;
      storage_path: string | null;
      submission_status: string;
      deal_id: string;
    } | null;

    if (docError || !docRow) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (docRow.deal_id !== link.deal_id) {
      return NextResponse.json(
        { error: "Document does not belong to this upload link" },
        { status: 403 }
      );
    }

    if (docRow.submission_status !== "staged") {
      return NextResponse.json(
        { error: "Only staged documents can be removed" },
        { status: 400 }
      );
    }

    // Remove from Supabase Storage
    if (docRow.storage_path) {
      await admin.storage
        .from("loan-documents")
        .remove([docRow.storage_path]);
    }

    // Delete the DB record
    await admin
      .from("unified_deal_documents" as never)
      .delete()
      .eq("id" as never, documentId as never);

    // Decrement upload count on the link
    const { data: currentLink } = await admin
      .from("secure_upload_links")
      .select("upload_count")
      .eq("id", link.id)
      .single();

    if (currentLink) {
      const currentCount = (currentLink as { upload_count: number }).upload_count || 0;
      if (currentCount > 0) {
        await admin
          .from("secure_upload_links")
          .update({ upload_count: currentCount - 1 })
          .eq("id", link.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("upload-link/upload DELETE error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
