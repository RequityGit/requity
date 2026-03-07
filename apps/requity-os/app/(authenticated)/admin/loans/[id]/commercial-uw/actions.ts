"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Database, Json } from "@/lib/supabase/types";

type RentRollInsert = Database["public"]["Tables"]["commercial_rent_roll"]["Insert"];
type OccupancyInsert = Database["public"]["Tables"]["commercial_occupancy_income"]["Insert"];
type AncillaryInsert = Database["public"]["Tables"]["commercial_ancillary_income"]["Insert"];
type ProFormaInsert = Database["public"]["Tables"]["commercial_proforma_years"]["Insert"];
type UWUpdate = Database["public"]["Tables"]["commercial_underwriting"]["Update"];

export async function createUnderwriting(loanId: string, propertyType: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const admin = createAdminClient();

  try {
    const { data, error } = await admin
      .from("commercial_underwriting")
      .insert({
        loan_id: loanId,
        property_type: propertyType,
        created_by: auth.user.id,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating underwriting:", error);
      return { error: error.message };
    }
    revalidatePath("/admin/loans");
    return { success: true, id: data.id };
  } catch (err) {
    console.error("Error creating underwriting:", err);
    return { error: "Failed to create underwriting" };
  }
}

export async function saveUnderwriting(
  uwId: string,
  data: Record<string, unknown>
) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const admin = createAdminClient();

  try {
    const { error } = await admin
      .from("commercial_underwriting")
      .update(data as UWUpdate)
      .eq("id", uwId);

    if (error) {
      console.error("Error saving underwriting:", error);
      return { error: error.message };
    }
    revalidatePath("/admin/loans");
    return { success: true };
  } catch (err) {
    console.error("Error saving underwriting:", err);
    return { error: "Failed to save underwriting" };
  }
}

export async function saveRentRoll(
  uwId: string,
  rows: Record<string, unknown>[]
) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const admin = createAdminClient();

  try {
    await admin
      .from("commercial_rent_roll")
      .delete()
      .eq("underwriting_id", uwId);

    if (rows.length > 0) {
      const typed: RentRollInsert[] = rows.map((r, i) => ({
        ...(r as RentRollInsert),
        underwriting_id: uwId,
        sort_order: i,
      }));
      const { error } = await admin.from("commercial_rent_roll").insert(typed);
      if (error) {
        console.error("Error saving rent roll:", error);
        return { error: error.message };
      }
    }
    revalidatePath("/admin/loans");
    return { success: true };
  } catch (err) {
    console.error("Error saving rent roll:", err);
    return { error: "Failed to save rent roll" };
  }
}

export async function saveOccupancyRows(
  uwId: string,
  rows: Record<string, unknown>[]
) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const admin = createAdminClient();

  try {
    await admin
      .from("commercial_occupancy_income")
      .delete()
      .eq("underwriting_id", uwId);

    if (rows.length > 0) {
      const typed: OccupancyInsert[] = rows.map((r, i) => ({
        ...(r as OccupancyInsert),
        underwriting_id: uwId,
        sort_order: i,
      }));
      const { error } = await admin
        .from("commercial_occupancy_income")
        .insert(typed);
      if (error) {
        console.error("Error saving occupancy rows:", error);
        return { error: error.message };
      }
    }
    revalidatePath("/admin/loans");
    return { success: true };
  } catch (err) {
    console.error("Error saving occupancy rows:", err);
    return { error: "Failed to save occupancy rows" };
  }
}

export async function saveAncillaryRows(
  uwId: string,
  rows: Record<string, unknown>[]
) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const admin = createAdminClient();

  try {
    await admin
      .from("commercial_ancillary_income")
      .delete()
      .eq("underwriting_id", uwId);

    if (rows.length > 0) {
      const typed: AncillaryInsert[] = rows.map((r, i) => ({
        ...(r as AncillaryInsert),
        underwriting_id: uwId,
        sort_order: i,
      }));
      const { error } = await admin
        .from("commercial_ancillary_income")
        .insert(typed);
      if (error) {
        console.error("Error saving ancillary rows:", error);
        return { error: error.message };
      }
    }
    revalidatePath("/admin/loans");
    return { success: true };
  } catch (err) {
    console.error("Error saving ancillary rows:", err);
    return { error: "Failed to save ancillary rows" };
  }
}

export async function saveProFormaYears(
  uwId: string,
  years: Record<string, unknown>[]
) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const admin = createAdminClient();

  try {
    await admin
      .from("commercial_proforma_years")
      .delete()
      .eq("underwriting_id", uwId);

    if (years.length > 0) {
      const typed: ProFormaInsert[] = years.map((y) => ({
        ...(y as ProFormaInsert),
        underwriting_id: uwId,
      }));
      const { error } = await admin
        .from("commercial_proforma_years")
        .insert(typed);
      if (error) {
        console.error("Error saving proforma years:", error);
        return { error: error.message };
      }
    }
    revalidatePath("/admin/loans");
    return { success: true };
  } catch (err) {
    console.error("Error saving proforma years:", err);
    return { error: "Failed to save proforma years" };
  }
}

export async function saveUploadMapping(
  uwId: string,
  uploadType: string,
  originalFilename: string,
  columnMapping: Record<string, string>,
  rowCount: number,
  parsedData: Record<string, unknown>[]
) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const admin = createAdminClient();

  try {
    const { data, error } = await admin
      .from("commercial_upload_mappings")
      .insert({
        underwriting_id: uwId,
        upload_type: uploadType,
        original_filename: originalFilename,
        column_mapping: columnMapping as unknown as Json,
        row_count: rowCount,
        parsed_data: parsedData as unknown as Json,
        created_by: auth.user.id,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error saving upload mapping:", error);
      return { error: error.message };
    }
    revalidatePath("/admin/loans");
    return { success: true, id: data.id };
  } catch (err) {
    console.error("Error saving upload mapping:", err);
    return { error: "Failed to save upload mapping" };
  }
}

export async function updateUWStatus(uwId: string, status: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const admin = createAdminClient();

  try {
    const { error } = await admin
      .from("commercial_underwriting")
      .update({ status } as UWUpdate)
      .eq("id", uwId);

    if (error) {
      console.error("Error updating status:", error);
      return { error: error.message };
    }
    revalidatePath("/admin/loans");
    return { success: true };
  } catch (err) {
    console.error("Error updating status:", err);
    return { error: "Failed to update status" };
  }
}
