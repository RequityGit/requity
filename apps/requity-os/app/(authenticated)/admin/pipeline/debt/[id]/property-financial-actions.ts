"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { RentRollRow } from "@/lib/commercial-uw/types";

function db() {
  return createAdminClient();
}

// ── Rent Roll ──

export async function uploadPropertyRentRoll(
  propertyId: string,
  asOfDate: string,
  sourceLabel: string | null,
  fileName: string | null,
  columnMapping: Record<string, string> | null,
  units: RentRollRow[],
  userId: string,
  setAsCurrent: boolean
): Promise<{ data: { id: string } | null; error: string | null }> {
  const supabase = db();

  const { data: rr, error: rrError } = await supabase
    .from("property_rent_rolls")
    .insert({
      property_id: propertyId,
      as_of_date: asOfDate,
      source_label: sourceLabel,
      file_name: fileName,
      column_mapping: columnMapping,
      is_current: setAsCurrent,
      uploaded_by: userId,
    })
    .select("id")
    .single();

  if (rrError || !rr) {
    console.error("Failed to create property rent roll:", rrError);
    return { data: null, error: rrError?.message ?? "Failed to create rent roll" };
  }

  if (units.length > 0) {
    const rows = units.map((u, i) => ({
      rent_roll_id: rr.id,
      sort_order: u.sort_order ?? i,
      unit_number: u.unit_number || `Unit ${i + 1}`,
      tenant_name: u.tenant_name || null,
      sf: u.sf || 0,
      beds_type: u.beds_type || null,
      baths: u.baths || 0,
      lease_type: u.lease_type || null,
      lease_start: u.lease_start || null,
      lease_end: u.lease_end || null,
      current_monthly_rent: u.current_monthly_rent || 0,
      cam_nnn: u.cam_nnn || 0,
      other_income: u.other_income || 0,
      is_vacant: u.is_vacant ?? false,
      market_rent: u.market_rent || 0,
    }));

    const { error: unitsError } = await supabase
      .from("property_rent_roll_units")
      .insert(rows);

    if (unitsError) {
      console.error("Failed to insert rent roll units:", unitsError);
      return { data: null, error: unitsError.message };
    }
  }

  revalidatePath(`/admin/pipeline/debt`);
  return { data: { id: rr.id }, error: null };
}

// ── T12 ──

interface T12LineItemInput {
  original_row_label: string;
  mapped_category: string | null;
  is_income: boolean;
  is_excluded: boolean;
  exclusion_reason: string | null;
  amounts: (number | null)[];
  annual_total: number | null;
  sort_order: number;
}

export async function uploadPropertyT12(
  propertyId: string,
  periodStart: string,
  periodEnd: string,
  sourceLabel: string | null,
  fileName: string | null,
  monthLabels: string[] | null,
  lineItems: T12LineItemInput[],
  userId: string,
  setAsCurrent: boolean
): Promise<{ data: { id: string } | null; error: string | null }> {
  const supabase = db();

  const { data: t12, error: t12Error } = await supabase
    .from("property_t12s")
    .insert({
      property_id: propertyId,
      period_start: periodStart,
      period_end: periodEnd,
      source_label: sourceLabel,
      file_name: fileName,
      month_labels: monthLabels,
      is_current: setAsCurrent,
      uploaded_by: userId,
    })
    .select("id")
    .single();

  if (t12Error || !t12) {
    console.error("Failed to create property T12:", t12Error);
    return { data: null, error: t12Error?.message ?? "Failed to create T12" };
  }

  if (lineItems.length > 0) {
    const rows = lineItems.map((item) => ({
      t12_id: t12.id,
      original_row_label: item.original_row_label,
      mapped_category: item.mapped_category,
      is_income: item.is_income,
      is_excluded: item.is_excluded,
      exclusion_reason: item.exclusion_reason,
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
      sort_order: item.sort_order,
    }));

    const { error: itemsError } = await supabase
      .from("property_t12_line_items")
      .insert(rows);

    if (itemsError) {
      console.error("Failed to insert T12 line items:", itemsError);
      return { data: null, error: itemsError.message };
    }
  }

  revalidatePath(`/admin/pipeline/debt`);
  return { data: { id: t12.id }, error: null };
}

// ── Set Current ──

export async function setCurrentRentRoll(
  rentRollId: string
): Promise<{ error: string | null }> {
  const supabase = db();
  const { error } = await supabase
    .from("property_rent_rolls")
    .update({ is_current: true, updated_at: new Date().toISOString() })
    .eq("id", rentRollId);

  if (error) {
    console.error("Failed to set current rent roll:", error);
    return { error: error.message };
  }

  revalidatePath(`/admin/pipeline/debt`);
  return { error: null };
}

export async function setCurrentT12(
  t12Id: string
): Promise<{ error: string | null }> {
  const supabase = db();
  const { error } = await supabase
    .from("property_t12s")
    .update({ is_current: true, updated_at: new Date().toISOString() })
    .eq("id", t12Id);

  if (error) {
    console.error("Failed to set current T12:", error);
    return { error: error.message };
  }

  revalidatePath(`/admin/pipeline/debt`);
  return { error: null };
}

// ── Delete ──

export async function deletePropertyRentRoll(
  rentRollId: string
): Promise<{ error: string | null }> {
  const supabase = db();
  const { error } = await supabase
    .from("property_rent_rolls")
    .delete()
    .eq("id", rentRollId);

  if (error) {
    console.error("Failed to delete rent roll:", error);
    return { error: error.message };
  }

  revalidatePath(`/admin/pipeline/debt`);
  return { error: null };
}

export async function deletePropertyT12(
  t12Id: string
): Promise<{ error: string | null }> {
  const supabase = db();
  const { error } = await supabase
    .from("property_t12s")
    .delete()
    .eq("id", t12Id);

  if (error) {
    console.error("Failed to delete T12:", error);
    return { error: error.message };
  }

  revalidatePath(`/admin/pipeline/debt`);
  return { error: null };
}
