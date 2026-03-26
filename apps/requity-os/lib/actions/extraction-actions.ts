"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

// ─── Temp Extraction Upload (for New Deal document auto-fill) ───

export async function createTempExtractionUploadUrl(
  fileName: string
): Promise<{
  signedUrl: string | null;
  token: string | null;
  storagePath: string | null;
  error: string | null;
}> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth)
      return { signedUrl: null, token: null, storagePath: null, error: auth.error ?? "Unauthorized" };

    if (!fileName)
      return { signedUrl: null, token: null, storagePath: null, error: "Missing fileName" };

    const admin = createAdminClient();
    const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const storagePath = `temp-extractions/${auth.user.id}/${safeName}`;

    const { data, error } = await admin.storage
      .from("loan-documents")
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      console.error("createTempExtractionUploadUrl error:", error);
      return {
        signedUrl: null,
        token: null,
        storagePath: null,
        error: error?.message ?? "Failed to create upload URL",
      };
    }

    return {
      signedUrl: data.signedUrl,
      token: data.token,
      storagePath,
      error: null,
    };
  } catch (err: unknown) {
    console.error("createTempExtractionUploadUrl error:", err);
    return {
      signedUrl: null,
      token: null,
      storagePath: null,
      error: err instanceof Error ? err.message : "Failed to create upload URL",
    };
  }
}

export async function cleanupTempExtraction(
  storagePath: string
): Promise<{ error: string | null }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    if (!storagePath.startsWith("temp-extractions/")) {
      return { error: "Invalid storage path" };
    }

    const admin = createAdminClient();
    const { error } = await admin.storage
      .from("loan-documents")
      .remove([storagePath]);

    if (error) {
      console.error("cleanupTempExtraction error:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err: unknown) {
    console.error("cleanupTempExtraction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to cleanup temp file" };
  }
}
