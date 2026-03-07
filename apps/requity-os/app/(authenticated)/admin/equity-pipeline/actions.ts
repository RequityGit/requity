"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Move equity deal stage
// ---------------------------------------------------------------------------

export async function moveEquityStageAction(
  dealId: string,
  newStage: string,
  lossReason?: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    if (newStage === "closed_lost" && !lossReason) {
      return { error: "Loss reason is required when marking a deal as closed lost" };
    }

    const { data: deal, error: fetchErr } = await admin
      .from("equity_deals")
      .select("stage")
      .eq("id", dealId)
      .single();

    if (fetchErr || !deal) return { error: "Deal not found" };

    const updateData: any = {
      stage: newStage,
      stage_changed_by: auth.user.id,
    };

    if (lossReason) {
      updateData.loss_reason = lossReason;
    }

    const { error: updateErr } = await admin
      .from("equity_deals")
      .update(updateData)
      .eq("id", dealId);

    if (updateErr) {
      console.error("Failed to move equity deal stage:", updateErr);
      return { error: "Failed to update deal stage" };
    }

    revalidatePath("/admin/equity-pipeline");
    return { success: true };
  } catch (err) {
    console.error("moveEquityStageAction error:", err);
    return { error: "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Create equity deal
// ---------------------------------------------------------------------------

interface CreateEquityDealInput {
  deal_name: string;
  source?: string;
  property_id?: string;
  property?: {
    address_line1: string;
    city?: string;
    state?: string;
    zip?: string;
    asset_type?: string;
    property_type?: string;
    number_of_units?: number;
    lot_size_acres?: number;
  };
  asking_price?: number;
  assigned_to?: string;
  value_add_strategy?: string;
  target_irr?: number;
  investment_thesis?: string;
}

export async function createEquityDealAction(input: CreateEquityDealInput) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Create property if provided inline
    let propertyId = input.property_id;
    if (!propertyId && input.property) {
      const { data: propData, error: propError } = await admin
        .from("properties")
        .insert({
          address_line1: input.property.address_line1,
          city: input.property.city,
          state: input.property.state,
          zip: input.property.zip,
          asset_type: input.property.asset_type,
          property_type: input.property.property_type,
          number_of_units: input.property.number_of_units,
          lot_size_acres: input.property.lot_size_acres,
        })
        .select("id")
        .single();

      if (propError) {
        console.error("Failed to create property:", propError);
        return { error: "Failed to create property" };
      }
      propertyId = propData.id;
    }

    const { data: deal, error: dealError } = await admin
      .from("equity_deals")
      .insert({
        deal_name: input.deal_name,
        source: input.source as any,
        property_id: propertyId,
        asking_price: input.asking_price,
        assigned_to: input.assigned_to,
        value_add_strategy: input.value_add_strategy,
        target_irr: input.target_irr,
        investment_thesis: input.investment_thesis,
        stage_changed_by: auth.user.id,
      })
      .select("id")
      .single();

    if (dealError) {
      console.error("Failed to create equity deal:", dealError);
      return { error: "Failed to create deal" };
    }

    revalidatePath("/admin/equity-pipeline");
    return { success: true, id: deal.id };
  } catch (err) {
    console.error("createEquityDealAction error:", err);
    return { error: "An unexpected error occurred" };
  }
}
