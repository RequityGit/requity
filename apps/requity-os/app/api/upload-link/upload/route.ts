import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
          visibility: "external",
        } as never)
        .select("id" as never)
        .single();

      if (insertResult.error) {
        await admin.storage.from("loan-documents").remove([storagePath]);
        errors.push({ name: file.name, error: "Failed to save document record" });
        continue;
      }

      const documentId = (insertResult.data as { id: string } | null)?.id ?? "";

      if (conditionId) {
        await admin
          .from("unified_deal_conditions")
          .update({ status: "submitted", submitted_at: new Date().toISOString() })
          .eq("id", conditionId)
          .eq("status", "pending");
      }

      await admin
        .from("secure_upload_links")
        .update({ upload_count: (link.upload_count || 0) + uploaded.length + 1 })
        .eq("id", link.id);

      uploaded.push({ name: file.name, documentId });
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
