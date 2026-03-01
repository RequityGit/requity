"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  const isAdmin = roles?.some(
    (r: { role: string }) => r.role === "admin" || r.role === "super_admin"
  );
  if (!isAdmin) redirect("/login");
  return user;
}

export async function createT12Upload(
  loanId: string,
  fileName: string,
  periodStart: string,
  periodEnd: string,
  sourceLabel: string | null
) {
  const user = await requireAdmin();
  const admin = createAdminClient();

  try {
    // Get next version number
    const { data: existingVersions } = await admin
      .from("t12_versions")
      .select("version_number")
      .eq("loan_id", loanId)
      .order("version_number", { ascending: false })
      .limit(1);

    const nextVersion = (existingVersions?.[0]?.version_number ?? 0) + 1;

    // Deactivate previous active versions
    await admin
      .from("t12_versions")
      .update({ is_active: false })
      .eq("loan_id", loanId)
      .eq("is_active", true);

    // Create upload record
    const { data: upload, error: uploadError } = await admin
      .from("t12_uploads")
      .insert({
        loan_id: loanId,
        file_name: fileName,
        file_url: "",
        period_start: periodStart,
        period_end: periodEnd,
        source_label: sourceLabel,
        uploaded_by: user.id,
        status: "pending_mapping",
      })
      .select("id")
      .single();

    if (uploadError || !upload) {
      console.error("Error creating T12 upload:", uploadError);
      return { error: uploadError?.message ?? "Failed to create upload" };
    }

    // Format version label
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const versionLabel = `T12 ${fmt(startDate)} – ${fmt(endDate)}`;

    // Create version record
    const { error: versionError } = await admin
      .from("t12_versions")
      .insert({
        loan_id: loanId,
        t12_upload_id: upload.id,
        version_number: nextVersion,
        version_label: versionLabel,
        is_active: true,
      });

    if (versionError) {
      console.error("Error creating T12 version:", versionError);
      return { error: versionError.message };
    }

    return { success: true, uploadId: upload.id, versionNumber: nextVersion };
  } catch (err) {
    console.error("Error creating T12 upload:", err);
    return { error: "Failed to create T12 upload" };
  }
}

export async function saveT12LineItems(
  uploadId: string,
  items: {
    original_row_label: string;
    original_category: string | null;
    amounts: (number | null)[];
    annual_total: number | null;
    is_income: boolean;
    sort_order: number;
  }[]
) {
  await requireAdmin();
  const admin = createAdminClient();

  try {
    // Delete existing line items for this upload
    await admin.from("t12_line_items").delete().eq("t12_upload_id", uploadId);

    if (items.length === 0) return { success: true, ids: [] };

    const rows = items.map((item) => ({
      t12_upload_id: uploadId,
      original_row_label: item.original_row_label,
      original_category: item.original_category,
      amount_month_1: item.amounts[0] ?? null,
      amount_month_2: item.amounts[1] ?? null,
      amount_month_3: item.amounts[2] ?? null,
      amount_month_4: item.amounts[3] ?? null,
      amount_month_5: item.amounts[4] ?? null,
      amount_month_6: item.amounts[5] ?? null,
      amount_month_7: item.amounts[6] ?? null,
      amount_month_8: item.amounts[7] ?? null,
      amount_month_9: item.amounts[8] ?? null,
      amount_month_10: item.amounts[9] ?? null,
      amount_month_11: item.amounts[10] ?? null,
      amount_month_12: item.amounts[11] ?? null,
      annual_total: item.annual_total,
      is_income: item.is_income,
      sort_order: item.sort_order,
    }));

    const { data, error } = await admin
      .from("t12_line_items")
      .insert(rows)
      .select("id");

    if (error) {
      console.error("Error saving T12 line items:", error);
      return { error: error.message };
    }

    return { success: true, ids: data?.map((d) => d.id) ?? [] };
  } catch (err) {
    console.error("Error saving T12 line items:", err);
    return { error: "Failed to save T12 line items" };
  }
}

export async function saveT12Mappings(
  uploadId: string,
  mappings: {
    t12_line_item_id: string;
    mapped_category: string;
    mapped_subcategory?: string | null;
    is_excluded: boolean;
    exclusion_reason?: string | null;
  }[]
) {
  await requireAdmin();
  const admin = createAdminClient();

  try {
    // Delete existing mappings for this upload
    await admin
      .from("t12_field_mappings")
      .delete()
      .eq("t12_upload_id", uploadId);

    if (mappings.length === 0) return { success: true };

    const rows = mappings.map((m) => ({
      t12_upload_id: uploadId,
      t12_line_item_id: m.t12_line_item_id,
      mapped_category: m.mapped_category,
      mapped_subcategory: m.mapped_subcategory ?? null,
      is_excluded: m.is_excluded,
      exclusion_reason: m.exclusion_reason ?? null,
    }));

    const { error } = await admin.from("t12_field_mappings").insert(rows);

    if (error) {
      console.error("Error saving T12 mappings:", error);
      return { error: error.message };
    }

    // Update upload status to mapped
    await admin
      .from("t12_uploads")
      .update({ status: "mapped" })
      .eq("id", uploadId);

    return { success: true };
  } catch (err) {
    console.error("Error saving T12 mappings:", err);
    return { error: "Failed to save T12 mappings" };
  }
}

export async function updateT12MappingSuggestions(
  items: { label: string; category: string }[]
) {
  await requireAdmin();
  const admin = createAdminClient();

  try {
    for (const item of items) {
      // Try to increment, or insert new
      const { data: existing } = await admin
        .from("t12_mapping_suggestions")
        .select("id, usage_count")
        .eq("original_label", item.label.toLowerCase().trim())
        .eq("mapped_category", item.category)
        .single();

      if (existing) {
        await admin
          .from("t12_mapping_suggestions")
          .update({ usage_count: (existing.usage_count ?? 0) + 1 })
          .eq("id", existing.id);
      } else {
        await admin.from("t12_mapping_suggestions").insert({
          original_label: item.label.toLowerCase().trim(),
          mapped_category: item.category,
          usage_count: 1,
        });
      }
    }
    return { success: true };
  } catch (err) {
    console.error("Error updating mapping suggestions:", err);
    return { error: "Failed to update mapping suggestions" };
  }
}

export async function getT12DataForLoan(loanId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  try {
    // Get versions for this loan
    const { data: versions, error: versionsError } = await admin
      .from("t12_versions")
      .select("*")
      .eq("loan_id", loanId)
      .order("version_number", { ascending: false });

    if (versionsError) {
      console.error("Error fetching T12 versions:", versionsError);
      return { error: versionsError.message };
    }

    // Get active version
    const activeVersion = versions?.find((v) => v.is_active);
    if (!activeVersion) {
      return {
        success: true,
        versions: versions ?? [],
        upload: null,
        lineItems: [],
        mappings: [],
        overrides: [],
      };
    }

    // Get upload record
    const { data: upload } = await admin
      .from("t12_uploads")
      .select("*")
      .eq("id", activeVersion.t12_upload_id)
      .single();

    // Get line items
    const { data: lineItems } = await admin
      .from("t12_line_items")
      .select("*")
      .eq("t12_upload_id", activeVersion.t12_upload_id)
      .order("sort_order", { ascending: true });

    // Get mappings
    const { data: mappings } = await admin
      .from("t12_field_mappings")
      .select("*")
      .eq("t12_upload_id", activeVersion.t12_upload_id);

    // Get overrides
    const { data: overrides } = await admin
      .from("t12_overrides")
      .select("*")
      .eq("t12_upload_id", activeVersion.t12_upload_id);

    return {
      success: true,
      versions: versions ?? [],
      upload: upload ?? null,
      lineItems: lineItems ?? [],
      mappings: mappings ?? [],
      overrides: overrides ?? [],
    };
  } catch (err) {
    console.error("Error fetching T12 data:", err);
    return { error: "Failed to fetch T12 data" };
  }
}

export async function getT12UploadData(uploadId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  try {
    const { data: upload } = await admin
      .from("t12_uploads")
      .select("*")
      .eq("id", uploadId)
      .single();

    const { data: lineItems } = await admin
      .from("t12_line_items")
      .select("*")
      .eq("t12_upload_id", uploadId)
      .order("sort_order", { ascending: true });

    const { data: mappings } = await admin
      .from("t12_field_mappings")
      .select("*")
      .eq("t12_upload_id", uploadId);

    const { data: overrides } = await admin
      .from("t12_overrides")
      .select("*")
      .eq("t12_upload_id", uploadId);

    return {
      success: true,
      upload: upload ?? null,
      lineItems: lineItems ?? [],
      mappings: mappings ?? [],
      overrides: overrides ?? [],
    };
  } catch (err) {
    console.error("Error fetching T12 upload data:", err);
    return { error: "Failed to fetch T12 upload data" };
  }
}

export async function activateT12Version(loanId: string, versionId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  try {
    // Deactivate all versions for this loan
    await admin
      .from("t12_versions")
      .update({ is_active: false })
      .eq("loan_id", loanId);

    // Activate selected version
    const { error } = await admin
      .from("t12_versions")
      .update({ is_active: true })
      .eq("id", versionId);

    if (error) {
      console.error("Error activating T12 version:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error activating T12 version:", err);
    return { error: "Failed to activate T12 version" };
  }
}

export async function saveT12Overrides(
  uploadId: string,
  overrides: { category: string; override_annual_total: number }[]
) {
  await requireAdmin();
  const admin = createAdminClient();

  try {
    // Delete existing overrides
    await admin.from("t12_overrides").delete().eq("t12_upload_id", uploadId);

    if (overrides.length === 0) return { success: true };

    const rows = overrides.map((o) => ({
      t12_upload_id: uploadId,
      category: o.category,
      override_annual_total: o.override_annual_total,
    }));

    const { error } = await admin.from("t12_overrides").insert(rows);

    if (error) {
      console.error("Error saving T12 overrides:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error saving T12 overrides:", err);
    return { error: "Failed to save T12 overrides" };
  }
}

export async function getPreviousMappingsForLoan(loanId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  try {
    // Get the most recent mapped upload for this loan
    const { data: uploads } = await admin
      .from("t12_uploads")
      .select("id")
      .eq("loan_id", loanId)
      .eq("status", "mapped")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!uploads || uploads.length === 0) {
      return { success: true, mappings: [] };
    }

    const prevUploadId = uploads[0].id;

    // Get line items and mappings
    const { data: lineItems } = await admin
      .from("t12_line_items")
      .select("id, original_row_label")
      .eq("t12_upload_id", prevUploadId);

    const { data: mappings } = await admin
      .from("t12_field_mappings")
      .select("t12_line_item_id, mapped_category, is_excluded, exclusion_reason")
      .eq("t12_upload_id", prevUploadId);

    // Build a label -> mapping lookup
    const labelMappings: Record<
      string,
      { category: string; is_excluded: boolean; exclusion_reason: string | null }
    > = {};
    for (const m of mappings ?? []) {
      const lineItem = lineItems?.find((li) => li.id === m.t12_line_item_id);
      if (lineItem) {
        labelMappings[lineItem.original_row_label.toLowerCase().trim()] = {
          category: m.mapped_category,
          is_excluded: m.is_excluded ?? false,
          exclusion_reason: m.exclusion_reason,
        };
      }
    }

    return { success: true, mappings: labelMappings };
  } catch (err) {
    console.error("Error fetching previous mappings:", err);
    return { error: "Failed to fetch previous mappings" };
  }
}

export async function getGlobalMappingSuggestions() {
  await requireAdmin();
  const admin = createAdminClient();

  try {
    const { data } = await admin
      .from("t12_mapping_suggestions")
      .select("original_label, mapped_category, usage_count")
      .order("usage_count", { ascending: false })
      .limit(500);

    return { success: true, suggestions: data ?? [] };
  } catch (err) {
    console.error("Error fetching mapping suggestions:", err);
    return { error: "Failed to fetch suggestions" };
  }
}
