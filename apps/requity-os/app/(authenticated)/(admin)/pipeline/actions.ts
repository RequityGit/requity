"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Database, Json } from "@/lib/supabase/types";
import { FIELD_MAPPING_MAP } from "@/lib/pipeline/uw-field-mappings";
import { revalidateDealPaths } from "@/lib/pipeline/revalidate-deal";
import type {
  IntakeDecisions,
  IntakeEntityKey,
  IntakeParsedData,
} from "@/lib/intake/types";
import {
  INCOMING_DATA_MAP,
  ENTITY_FIELD_MAP,
  isEmpty,
  valsMatch,
} from "@/lib/intake/types";

type UnifiedDealInsert = Database["public"]["Tables"]["unified_deals"]["Insert"];
type UnifiedDealUpdate = Database["public"]["Tables"]["unified_deals"]["Update"];

async function revalidatePipeline(dealId?: string) {
  revalidatePath("/pipeline");
  if (dealId) {
    await revalidateDealPaths(dealId);
  }
}

// ─── Create Deal ───

export async function createUnifiedDealAction(data: {
  name: string;
  card_type_id: string;
  capital_side?: string;
  asset_class?: string;
  amount?: number;
  primary_contact_id?: string;
  company_id?: string;
  assigned_to?: string;
  uw_data?: Record<string, unknown>;
  property_data?: Record<string, unknown>;
}) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // If property_data has enrichment fields, create a properties row
    let propertyId: string | null = null;
    if (data.property_data && Object.keys(data.property_data).length > 0) {
      const pd = data.property_data;
      const propertyInsert: Record<string, unknown> = {};

      const PROPERTY_TABLE_FIELDS: Record<string, string> = {
        address_line1: "address_line1",
        city: "city",
        state: "state",
        zip: "zip",
        county: "county",
        parcel_id: "parcel_id",
        zoning: "zoning",
        year_built: "year_built",
        gross_building_area_sqft: "gross_building_area_sqft",
        lot_size_acres: "lot_size_acres",
        number_of_stories: "number_of_stories",
        number_of_buildings: "number_of_buildings",
      };

      for (const [pdKey, col] of Object.entries(PROPERTY_TABLE_FIELDS)) {
        if (pd[pdKey] !== undefined && pd[pdKey] !== null && pd[pdKey] !== "") {
          propertyInsert[col] = pd[pdKey];
        }
      }

      if (Object.keys(propertyInsert).length > 0) {
        const { data: newProp, error: propErr } = await admin
          .from("properties")
          .insert(propertyInsert)
          .select("id")
          .single();

        if (propErr) {
          console.error("Failed to create property record:", propErr);
        } else if (newProp) {
          propertyId = newProp.id;
        }
      }
    }

    const insertData: UnifiedDealInsert = {
      name: data.name,
      card_type_id: data.card_type_id,
      capital_side: data.capital_side || "debt",
      asset_class: data.asset_class || null,
      amount: data.amount || null,
      primary_contact_id: data.primary_contact_id || null,
      company_id: data.company_id || null,
      assigned_to: data.assigned_to || null,
      created_by: auth.user.id,
      ...(propertyId ? { property_id: propertyId } : {}),
      ...(data.uw_data && Object.keys(data.uw_data).length > 0
        ? { uw_data: data.uw_data as Json }
        : {}),
      ...(data.property_data && Object.keys(data.property_data).length > 0
        ? { property_data: data.property_data as Json }
        : {}),
    };

    const { data: deal, error } = await admin
      .from("unified_deals")
      .insert(insertData)
      .select("id, deal_number")
      .single();

    if (error) {
      console.error("createUnifiedDealAction error:", error);
      return { error: error.message };
    }

    // Generate conditions from loan_condition_templates
    const { error: condError } = await admin.rpc(
      "generate_deal_conditions" as never,
      { p_deal_id: deal.id } as never
    );
    if (condError) {
      console.error("Failed to generate deal conditions:", condError);
    }

    await revalidatePipeline(deal.id);
    return { success: true, deal };
  } catch (err: unknown) {
    console.error("createUnifiedDealAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to create deal" };
  }
}

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

// ─── Update Deal ───

export async function updateUnifiedDealAction(
  dealId: string,
  updates: Record<string, unknown>
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin
      .from("unified_deals")
      .update(updates as UnifiedDealUpdate)
      .eq("id", dealId);

    if (error) {
      console.error("updateUnifiedDealAction error:", error);
      return { error: error.message };
    }

    // Trigger Drive folder rename when name-relevant fields change
    const nameRelevantKeys = ["primary_contact_id", "uw_data", "name"];
    const shouldRename = nameRelevantKeys.some((k) => k in updates);
    if (shouldRename) {
      triggerDriveFolderRename(dealId, admin).catch((err) =>
        console.error("Drive folder rename failed (non-blocking):", err)
      );
    }

    await revalidatePipeline(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("updateUnifiedDealAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to update deal" };
  }
}

async function triggerDriveFolderRename(
  dealId: string,
  admin: ReturnType<typeof createAdminClient>
) {
  const { data: deal } = await admin
    .from("unified_deals")
    .select("google_drive_folder_id")
    .eq("id", dealId)
    .single();

  if (!deal?.google_drive_folder_id) return;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return;

  await fetch(`${supabaseUrl}/functions/v1/create-deal-drive-folder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ deal_id: dealId, rename: true }),
  });
}

// ─── Advance Stage ───

export async function advanceStageAction(
  dealId: string,
  newStage: string,
  notes?: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin.rpc("unified_advance_stage", {
      p_deal_id: dealId,
      p_new_stage: newStage,
      p_notes: notes,
    });

    if (error) {
      console.error("advanceStageAction error:", error);
      return { error: error.message };
    }

    await revalidatePipeline(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("advanceStageAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to advance stage" };
  }
}

// ─── Regress Stage (backward jump, no validation) ───

export async function regressStageAction(
  dealId: string,
  targetStage: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin.rpc("unified_advance_stage", {
      p_deal_id: dealId,
      p_new_stage: targetStage,
      p_notes: `Stage moved back to ${targetStage}`,
    });

    if (error) {
      console.error("regressStageAction error:", error);
      return { error: error.message };
    }

    await revalidatePipeline(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("regressStageAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to change stage" };
  }
}

// ─── Update UW Data ───

export async function updateUwDataAction(
  dealId: string,
  key: string,
  value: unknown
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const mapping = FIELD_MAPPING_MAP.get(key);

    if (mapping?.source === "property") {
      // Route write to the properties table
      const { data: deal, error: fetchErr } = await admin
        .from("unified_deals")
        .select("property_id")
        .eq("id", dealId)
        .single();

      if (fetchErr || !deal) return { error: "Deal not found" };

      if (!deal.property_id) {
        // No linked property — create one and link it
        const { data: newProp, error: createErr } = await admin
          .from("properties")
          .insert({ [mapping.column]: value })
          .select("id")
          .single();

        if (createErr || !newProp) {
          console.error("Failed to create property:", createErr);
          return { error: "Failed to create property record" };
        }

        const { error: linkErr } = await admin
          .from("unified_deals")
          .update({ property_id: newProp.id })
          .eq("id", dealId);

        if (linkErr) {
          console.error("Failed to link property:", linkErr);
          return { error: "Failed to link property to deal" };
        }
      } else {
        // Update existing property
        const { error: updateErr } = await admin
          .from("properties")
          .update({ [mapping.column]: value })
          .eq("id", deal.property_id);

        if (updateErr) {
          console.error("updateUwDataAction property error:", updateErr);
          return { error: updateErr.message };
        }
      }
    } else if (mapping?.source === "deal") {
      // Route write to a top-level column on unified_deals
      const { error: updateErr } = await admin
        .from("unified_deals")
        .update({ [mapping.column]: value || null })
        .eq("id", dealId);

      if (updateErr) {
        console.error("updateUwDataAction deal column error:", updateErr);
        return { error: updateErr.message };
      }
    } else if (mapping?.source === "borrower") {
      // Route write to the borrowers table via primary_contact_id or deal_contacts
      const { data: deal, error: fetchErr } = await admin
        .from("unified_deals")
        .select("primary_contact_id")
        .eq("id", dealId)
        .single();

      if (fetchErr || !deal) return { error: "Deal not found" };

      let primaryContactId = deal.primary_contact_id;

      // Fallback: resolve primary from deal_contacts if primary_contact_id is null
      if (!primaryContactId) {
        const { data: dc } = await admin
          .from("deal_contacts")
          .select("contact_id")
          .eq("deal_id", dealId)
          .eq("role", "primary")
          .limit(1)
          .maybeSingle();

        primaryContactId = dc?.contact_id ?? null;
      }

      if (!primaryContactId) {
        return await updateUwDataJsonb(admin, dealId, key, value, auth.user.id);
      }

      // Find borrower by crm_contact_id
      const { data: borrower } = await admin
        .from("borrowers")
        .select("id")
        .eq("crm_contact_id", primaryContactId)
        .limit(1)
        .single();

      if (!borrower) {
        // No borrower record — fall back to uw_data JSONB
        return await updateUwDataJsonb(admin, dealId, key, value, auth.user.id);
      }

      const { error: updateErr } = await admin
        .from("borrowers")
        .update({ [mapping.column]: value })
        .eq("id", borrower.id);

      if (updateErr) {
        console.error("updateUwDataAction borrower error:", updateErr);
        return { error: updateErr.message };
      }
    } else {
      // Default: write to uw_data JSONB on unified_deals
      return await updateUwDataJsonb(admin, dealId, key, value, auth.user.id);
    }

    // Log field update activity
    const { error: activityErr } = await admin.from("unified_deal_activity").insert({
      deal_id: dealId,
      activity_type: "field_updated",
      title: `Updated ${key}`,
      metadata: {
        field: key,
        value,
        source: mapping?.source ?? "deal",
      } as unknown as Json,
      created_by: auth.user.id,
    });

    if (activityErr) {
      console.error("Failed to log activity:", activityErr);
    }

    await revalidatePipeline(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("updateUwDataAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to update underwriting data" };
  }
}

/** Write a field value to the uw_data JSONB column on unified_deals */
async function updateUwDataJsonb(
  admin: ReturnType<typeof createAdminClient>,
  dealId: string,
  key: string,
  value: unknown,
  userId: string
) {
  const { data: deal, error: fetchErr } = await admin
    .from("unified_deals")
    .select("uw_data")
    .eq("id", dealId)
    .single();

  if (fetchErr || !deal) return { error: "Deal not found" };

  const currentData = (deal.uw_data as Record<string, unknown>) || {};
  const updatedData = { ...currentData, [key]: value };

  const { error } = await admin
    .from("unified_deals")
    .update({ uw_data: updatedData as Json })
    .eq("id", dealId);

  if (error) {
    console.error("updateUwDataJsonb error:", error);
    return { error: error.message };
  }

  // Log field update activity
  const { error: activityErr } = await admin.from("unified_deal_activity").insert({
    deal_id: dealId,
    activity_type: "field_updated",
    title: `Updated ${key}`,
    metadata: { field: key, value, source: "deal" } as unknown as Json,
    created_by: userId,
  });

  if (activityErr) {
    console.error("Failed to log activity:", activityErr);
  }

  await revalidatePipeline(dealId);
  return { success: true };
}

// ─── Update Property Data ───

export async function updatePropertyDataAction(
  dealId: string,
  key: string,
  value: unknown
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Get current property_data
    const { data: deal, error: fetchErr } = await admin
      .from("unified_deals")
      .select("property_data")
      .eq("id", dealId)
      .single();

    if (fetchErr || !deal) return { error: "Deal not found" };

    const currentData = (deal.property_data as Record<string, unknown>) || {};
    const updatedData = { ...currentData, [key]: value };

    const { error } = await admin
      .from("unified_deals")
      .update({ property_data: updatedData as Json })
      .eq("id", dealId);

    if (error) {
      console.error("updatePropertyDataAction error:", error);
      return { error: error.message };
    }

    // Log field update activity
    const { error: activityErr } = await admin.from("unified_deal_activity").insert({
      deal_id: dealId,
      activity_type: "field_updated",
      title: `Updated property ${key}`,
      metadata: { field: key, value, section: "property" } as unknown as Json,
      created_by: auth.user.id,
    });

    if (activityErr) {
      console.error("Failed to log activity:", activityErr);
    }

    await revalidatePipeline(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("updatePropertyDataAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to update property data" };
  }
}

// ─── Add Activity Note ───

export async function addDealNoteAction(dealId: string, content: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin.from("unified_deal_activity").insert({
      deal_id: dealId,
      activity_type: "note",
      title: "Note added",
      description: content,
      created_by: auth.user.id,
    });

    if (error) {
      console.error("addDealNoteAction error:", error);
      return { error: error.message };
    }

    await revalidatePipeline(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("addDealNoteAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to add note" };
  }
}

// ─── Update Deal Status (won/lost/on_hold) ───

export async function updateDealStatusAction(
  dealId: string,
  status: string,
  lossReason?: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    if (status === "lost" && !lossReason) {
      return { error: "Loss reason is required when marking a deal as lost" };
    }

    const admin = createAdminClient();

    const updates: UnifiedDealUpdate = { status };
    if (lossReason) updates.loss_reason = lossReason;

    const { error } = await admin
      .from("unified_deals")
      .update(updates)
      .eq("id", dealId);

    if (error) {
      console.error("updateDealStatusAction error:", error);
      return { error: error.message };
    }

    // Closing Date is the single source of truth: expected until close, then actual once won.
    if (status === "won") {
      const closingDate = new Date().toISOString().split("T")[0];
      const { data: deal } = await admin
        .from("unified_deals")
        .select("uw_data")
        .eq("id", dealId)
        .single();
      const uwData = (deal?.uw_data as Record<string, unknown>) || {};
      const { error: uwError } = await admin
        .from("unified_deals")
        .update({ uw_data: { ...uwData, closing_date: closingDate } as Json })
        .eq("id", dealId);
      if (uwError) {
        console.error("updateDealStatusAction uw_data closing_date error:", uwError);
      }
    }

    // Log status change
    const { error: activityErr } = await admin.from("unified_deal_activity").insert({
      deal_id: dealId,
      activity_type: "status_change",
      title: `Status changed to ${status}`,
      metadata: { status, loss_reason: lossReason } as unknown as Json,
      created_by: auth.user.id,
    });

    if (activityErr) {
      console.error("Failed to log status change activity:", activityErr);
    }

    await revalidatePipeline(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("updateDealStatusAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to update deal status" };
  }
}

// ─── Update Condition Status ───

export async function updateConditionStatusAction(
  conditionId: string,
  newStatus: string,
  dealId?: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // If approving, check if condition requires approval workflow
    if (newStatus === "approved") {
      const { data: condition } = await admin
        .from("unified_deal_conditions" as never)
        .select("requires_approval, condition_name, category, deal_id" as never)
        .eq("id" as never, conditionId as never)
        .single();

      const cond = condition as { requires_approval: boolean; condition_name: string; category: string; deal_id: string } | null;

      if (cond?.requires_approval) {
        // Get deal name for snapshot
        const { data: deal } = await admin
          .from("unified_deals" as never)
          .select("name, deal_number" as never)
          .eq("id" as never, cond.deal_id as never)
          .single();

        const dealInfo = deal as { name: string; deal_number: string } | null;

        // Set to under_review instead of approved
        const { error: updateErr } = await admin
          .from("unified_deal_conditions" as never)
          .update({ status: "under_review" } as never)
          .eq("id" as never, conditionId as never);

        if (updateErr) {
          console.error("updateConditionStatusAction error:", updateErr);
          return { error: updateErr.message };
        }

        // Submit for approval
        const { submitForApproval } = await import(
          "@/app/(authenticated)/(admin)/tasks/approvals/actions"
        );

        const approvalResult = await submitForApproval({
          entityType: "condition",
          entityId: conditionId,
          dealSnapshot: {
            condition_name: cond.condition_name,
            category: cond.category,
            deal_id: cond.deal_id,
            borrower_name: dealInfo?.name ?? "Unknown Deal",
            deal_number: dealInfo?.deal_number ?? "",
          },
          checklistResults: [],
        });

        if (approvalResult.error) {
          console.error("Failed to submit condition for approval:", approvalResult.error);
          return { error: approvalResult.error };
        }

        await revalidatePipeline(cond.deal_id);
        return { success: true, message: "Condition sent for approval" };
      }
    }

    // Normal status update (no approval required)
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "submitted") updates.submitted_at = new Date().toISOString();
    if (newStatus === "approved" || newStatus === "rejected") {
      updates.reviewed_at = new Date().toISOString();
      updates.reviewed_by = auth.user.id;
    }

    const { error } = await admin
      .from("unified_deal_conditions" as never)
      .update(updates as never)
      .eq("id" as never, conditionId as never);

    if (error) {
      console.error("updateConditionStatusAction error:", error);
      return { error: error.message };
    }

    await revalidatePipeline(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("updateConditionStatusAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ─── Resolve Intake Queue Item ───

export async function resolveIntakeItemAction(data: {
  intakeQueueId: string;
  action: "create_deal" | "attach" | "dismiss";
  cardTypeId?: string;
  dealFields?: {
    name?: string;
    amount?: number;
    asset_class?: string;
  };
  uwFields?: Record<string, string>;
  existingDealId?: string;
  notes?: string;
}) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    if (data.action === "dismiss") {
      const { error } = await admin
        .from("email_intake_queue")
        .update({
          status: "dismissed",
          resolved_by: auth.user.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: data.notes || null,
        })
        .eq("id", data.intakeQueueId);

      if (error) return { error: error.message };
      revalidatePath("/pipeline/intake");
      return { success: true };
    }

    if (data.action === "create_deal") {
      if (!data.cardTypeId) return { error: "Card type is required" };

      // Look up the card type for capital_side
      const { data: cardType } = await admin
        .from("unified_card_types")
        .select("capital_side")
        .eq("id", data.cardTypeId)
        .single();

      // Create the deal using the existing action logic
      const insertData: UnifiedDealInsert = {
        name: data.dealFields?.name || "Untitled Deal",
        card_type_id: data.cardTypeId,
        capital_side: cardType?.capital_side || "debt",
        asset_class: data.dealFields?.asset_class || null,
        amount: data.dealFields?.amount || null,
        created_by: auth.user.id,
        ...(data.uwFields && Object.keys(data.uwFields).length > 0
          ? { uw_data: data.uwFields as Json }
          : {}),
      };

      const { data: deal, error: dealError } = await admin
        .from("unified_deals")
        .insert(insertData)
        .select("id, deal_number")
        .single();

      if (dealError) {
        console.error("resolveIntakeItemAction create deal error:", dealError);
        return { error: dealError.message };
      }

      // Generate conditions (non-fatal)
      const { error: condErr } = await admin.rpc(
        "generate_deal_conditions" as never,
        { p_deal_id: deal.id } as never
      );
      if (condErr) console.error("Failed to generate conditions:", condErr);

      // Move attachments from email-intake/ to deals/{dealId}/ and create documents
      const { data: queueItem } = await admin
        .from("email_intake_queue")
        .select("attachments")
        .eq("id", data.intakeQueueId)
        .single();

      if (queueItem?.attachments) {
        const attachments = queueItem.attachments as Array<{
          filename: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
        }>;

        for (const att of attachments) {
          if (!att.storage_path) continue;

          try {
            // Download from intake path
            const { data: fileData } = await admin.storage
              .from("loan-documents")
              .download(att.storage_path);

            if (!fileData) continue;

            // Upload to deal path
            const newPath = `deals/${deal.id}/${att.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
            await admin.storage
              .from("loan-documents")
              .upload(newPath, fileData, {
                contentType: att.mime_type,
                upsert: true,
              });

            // Create document record
            await admin
              .from("unified_deal_documents")
              .insert({
                deal_id: deal.id,
                document_name: att.filename,
                storage_path: newPath,
                file_url: newPath,
                file_size_bytes: att.size_bytes,
                mime_type: att.mime_type,
                uploaded_by: auth.user.id,
              });

            // Clean up intake file (non-fatal)
            await admin.storage
              .from("loan-documents")
              .remove([att.storage_path]);
          } catch (err) {
            console.error(`Failed to move attachment ${att.filename}:`, err);
          }
        }
      }

      // Log activity (non-fatal)
      await admin
        .from("unified_deal_activity")
        .insert({
          deal_id: deal.id,
          activity_type: "status_change",
          title: "Deal created from email intake",
          created_by: auth.user.id,
        });

      // Mark intake item as resolved
      await admin
        .from("email_intake_queue")
        .update({
          status: "deal_created",
          resolved_deal_id: deal.id,
          resolved_by: auth.user.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: data.notes || null,
        })
        .eq("id", data.intakeQueueId);

      await revalidatePipeline(deal.id);
      revalidatePath("/pipeline/intake");
      return { success: true, deal };
    }

    if (data.action === "attach" && data.existingDealId) {
      // Mark intake queue as attached
      await admin
        .from("email_intake_queue")
        .update({
          status: "attached",
          resolved_deal_id: data.existingDealId,
          resolved_by: auth.user.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: data.notes || null,
        })
        .eq("id", data.intakeQueueId);

      // Mark the intake_items record too
      await admin
        .from("intake_items" as never)
        .update({ status: "merged" } as never)
        .eq("email_intake_queue_id" as never, data.intakeQueueId as never);

      await revalidatePipeline(data.existingDealId);
      revalidatePath("/pipeline/intake");
      return { success: true, dealId: data.existingDealId };
    }

    return { error: "Invalid action" };
  } catch (err: unknown) {
    console.error("resolveIntakeItemAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to resolve intake item" };
  }
}

// ─── Attach Intake to Existing Deal (with merge safeguards) ───

interface MergeField {
  key: string;
  label: string;
  incoming: string | number | null;
  existing: string | number | null;
  state: "auto_fill" | "skip" | "conflict" | "match";
}

export interface MergePreview {
  dealId: string;
  dealName: string;
  fields: MergeField[];
  hasConflicts: boolean;
}

export async function previewMergeToDeal(
  intakeQueueId: string,
  dealId: string
): Promise<{ preview?: MergePreview; error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const [{ data: queueItem }, { data: deal }] = await Promise.all([
      admin.from("email_intake_queue")
        .select("extracted_deal_fields, extraction_summary, from_email, from_name, subject, body_preview")
        .eq("id", intakeQueueId)
        .single(),
      admin.from("unified_deals")
        .select("id, name, amount, asset_class, uw_data, primary_contact_id, property_id")
        .eq("id", dealId)
        .single(),
    ]);

    if (!queueItem || !deal) return { error: "Queue item or deal not found" };

    const extracted = queueItem.extracted_deal_fields as Record<string, { value: unknown }> | null;
    const uwData = (deal.uw_data || {}) as Record<string, unknown>;

    const fields: MergeField[] = [];
    const fieldMap: Array<{ key: string; label: string; incomingKey: string; existingValue: unknown }> = [
      { key: "amount", label: "Loan Amount", incomingKey: "loan_amount", existingValue: deal.amount },
      { key: "asset_class", label: "Asset Class", incomingKey: "property_type", existingValue: deal.asset_class },
      { key: "loan_type", label: "Loan Type", incomingKey: "loan_type", existingValue: uwData.loan_type },
      { key: "ltv", label: "LTV", incomingKey: "ltv", existingValue: uwData.ltv },
      { key: "dscr", label: "DSCR", incomingKey: "dscr", existingValue: uwData.dscr },
      { key: "arv", label: "ARV", incomingKey: "arv", existingValue: uwData.arv },
      { key: "rehab_budget", label: "Rehab Budget", incomingKey: "rehab_budget", existingValue: uwData.rehab_budget },
    ];

    for (const fm of fieldMap) {
      const incomingVal = extracted?.[fm.incomingKey]?.value;
      const incomingStr = incomingVal != null ? String(incomingVal) : null;
      const existingStr = fm.existingValue != null ? String(fm.existingValue) : null;

      if (!incomingStr && !existingStr) continue;

      let state: MergeField["state"];
      if (!incomingStr) {
        state = "skip";
      } else if (!existingStr) {
        state = "auto_fill";
      } else if (incomingStr === existingStr) {
        state = "match";
      } else {
        state = "conflict";
      }

      fields.push({
        key: fm.key,
        label: fm.label,
        incoming: incomingStr,
        existing: existingStr,
        state,
      });
    }

    return {
      preview: {
        dealId: deal.id,
        dealName: deal.name || "Untitled Deal",
        fields,
        hasConflicts: fields.some((f) => f.state === "conflict"),
      },
    };
  } catch (err) {
    console.error("previewMergeToDeal error:", err);
    return { error: err instanceof Error ? err.message : "Failed to preview merge" };
  }
}

export async function mergeToDealAction(data: {
  intakeQueueId: string;
  dealId: string;
  acceptedFields: string[];
  notes?: string;
}): Promise<{ success?: boolean; error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { data: queueItem } = await admin
      .from("email_intake_queue")
      .select("extracted_deal_fields, extraction_summary, from_email, subject, body_preview, attachments")
      .eq("id", data.intakeQueueId)
      .single();

    if (!queueItem) return { error: "Queue item not found" };

    const { data: deal } = await admin
      .from("unified_deals")
      .select("id, name, amount, asset_class, uw_data")
      .eq("id", data.dealId)
      .single();

    if (!deal) return { error: "Deal not found" };

    const extracted = queueItem.extracted_deal_fields as Record<string, { value: unknown }> | null;
    const uwData = (deal.uw_data || {}) as Record<string, unknown>;
    const changes: Array<{ field: string; before: unknown; after: unknown }> = [];

    const topLevelUpdates: Record<string, unknown> = {};
    const uwUpdates: Record<string, unknown> = { ...uwData };

    const topLevelKeys = ["amount", "asset_class", "loan_type"];
    const uwKeys = ["ltv", "dscr", "arv", "rehab_budget"];
    const incomingKeyMap: Record<string, string> = {
      amount: "loan_amount",
      asset_class: "property_type",
      loan_type: "loan_type",
      ltv: "ltv",
      dscr: "dscr",
      arv: "arv",
      rehab_budget: "rehab_budget",
    };

    for (const fieldKey of data.acceptedFields) {
      const incomingKey = incomingKeyMap[fieldKey];
      if (!incomingKey || !extracted?.[incomingKey]?.value) continue;

      const incomingVal = extracted[incomingKey].value;

      if (topLevelKeys.includes(fieldKey)) {
        const before = (deal as Record<string, unknown>)[fieldKey];
        topLevelUpdates[fieldKey] = fieldKey === "amount" ? Number(incomingVal) : incomingVal;
        changes.push({ field: fieldKey, before, after: incomingVal });
      } else if (uwKeys.includes(fieldKey)) {
        const before = uwData[fieldKey];
        uwUpdates[fieldKey] = incomingVal;
        changes.push({ field: `uw_data.${fieldKey}`, before, after: incomingVal });
      }
    }

    if (Object.keys(topLevelUpdates).length > 0 || changes.some((c) => c.field.startsWith("uw_data."))) {
      const updatePayload: Record<string, unknown> = {
        ...topLevelUpdates,
        updated_at: new Date().toISOString(),
      };
      if (changes.some((c) => c.field.startsWith("uw_data."))) {
        updatePayload.uw_data = uwUpdates as Json;
      }
      await admin.from("unified_deals").update(updatePayload).eq("id", data.dealId);
    }

    // Log audit trail
    await admin.from("unified_deal_activity").insert({
      deal_id: data.dealId,
      activity_type: "email_merge",
      title: "Email intake merged into deal",
      description: `Email from ${queueItem.from_email}: "${queueItem.subject}"`,
      metadata: {
        intake_queue_id: data.intakeQueueId,
        changes,
        accepted_fields: data.acceptedFields,
        merge_notes: data.notes,
      } as unknown as Json,
      created_by: auth.user.id,
    });

    // Create AI summary note
    const changeSummary = changes.length > 0
      ? changes.map((c) => `${c.field}: ${c.before ?? "(empty)"} -> ${c.after}`).join("; ")
      : "No fields updated";

    await admin.from("notes").insert({
      deal_id: data.dealId,
      author_id: auth.user.id,
      author_name: "AI Assistant",
      is_internal: true,
      body: `**Email Intake Merged**\n\nEmail from ${queueItem.from_email} ("${queueItem.subject}") was merged into this deal.\n\n${queueItem.extraction_summary ? `**AI Summary:** ${queueItem.extraction_summary}\n\n` : ""}**Changes applied:** ${changeSummary}${data.notes ? `\n\n**Reviewer notes:** ${data.notes}` : ""}`,
    });

    // Move attachments to deal folder
    if (queueItem.attachments) {
      const attachments = queueItem.attachments as Array<{
        filename: string;
        storage_path?: string;
        mime_type: string;
        size_bytes: number;
      }>;

      for (const att of attachments) {
        if (!att.storage_path) continue;
        try {
          const { data: fileData } = await admin.storage
            .from("loan-documents")
            .download(att.storage_path);
          if (!fileData) continue;

          const newPath = `deals/${data.dealId}/${att.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          await admin.storage
            .from("loan-documents")
            .upload(newPath, fileData, { contentType: att.mime_type, upsert: true });

          await admin.from("documents").insert({
            deal_id: data.dealId,
            file_name: att.filename,
            file_path: newPath,
            file_url: newPath,
            file_size: att.size_bytes,
            mime_type: att.mime_type,
            document_type: "email_attachment",
            source: "email_intake",
            status: "active",
          });

          await admin.storage.from("loan-documents").remove([att.storage_path]);
        } catch (err) {
          console.error(`Failed to move attachment ${att.filename}:`, err);
        }
      }
    }

    // Mark intake as merged
    await admin.from("email_intake_queue").update({
      status: "attached",
      resolved_deal_id: data.dealId,
      resolved_by: auth.user.id,
      resolved_at: new Date().toISOString(),
      resolution_notes: data.notes || null,
    }).eq("id", data.intakeQueueId);

    await admin.from("intake_items" as never)
      .update({ status: "merged" } as never)
      .eq("email_intake_queue_id" as never, data.intakeQueueId as never);

    await revalidatePipeline(data.dealId);
    revalidatePath("/pipeline/intake");
    return { success: true };
  } catch (err) {
    console.error("mergeToDealAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to merge" };
  }
}

// ─── Search Entity (for manual intake matching) ───

export async function searchEntityAction(
  entityType: IntakeEntityKey,
  query: string
): Promise<{ results: Array<{ match_id: string; snapshot: Record<string, unknown> }>; error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { results: [], error: auth.error };

    if (!query || query.trim().length < 2) return { results: [] };

    const admin = createAdminClient();
    const q = `%${query.trim()}%`;

    if (entityType === "contact" || entityType === "borrower_contact") {
      const { data, error } = await admin
        .from("crm_contacts")
        .select("id, name, first_name, last_name, email, phone, company_name, contact_type")
        .or(`name.ilike.${q},email.ilike.${q},phone.ilike.${q},first_name.ilike.${q},last_name.ilike.${q}`)
        .limit(5);

      if (error) return { results: [], error: error.message };

      return {
        results: (data || []).map((c) => ({
          match_id: c.id,
          snapshot: {
            name: c.name || `${c.first_name || ""} ${c.last_name || ""}`.trim(),
            email: c.email,
            phone: c.phone,
            first_name: c.first_name,
            last_name: c.last_name,
            company_name: c.company_name,
            contact_type: c.contact_type,
          },
        })),
      };
    }

    if (entityType === "company") {
      const { data, error } = await admin
        .from("companies")
        .select("id, name, email, phone, state")
        .or(`name.ilike.${q}`)
        .limit(5);

      if (error) return { results: [], error: error.message };

      return {
        results: (data || []).map((c) => ({
          match_id: c.id,
          snapshot: { name: c.name, email: c.email, phone: c.phone, state: c.state },
        })),
      };
    }

    if (entityType === "property") {
      const { data, error } = await admin
        .from("properties")
        .select("id, address_line1, city, state, property_type, number_of_units")
        .or(`address_line1.ilike.${q},city.ilike.${q}`)
        .limit(5);

      if (error) return { results: [], error: error.message };

      return {
        results: (data || []).map((p) => ({
          match_id: p.id,
          snapshot: {
            address_line1: p.address_line1,
            city: p.city,
            state: p.state,
            property_type: p.property_type,
            number_of_units: p.number_of_units,
          },
        })),
      };
    }

    if (entityType === "opportunity") {
      const { data, error } = await admin
        .from("unified_deals")
        .select("id, name, deal_number, amount, asset_class")
        .or(`name.ilike.${q},deal_number.ilike.${q}`)
        .limit(5);

      if (error) return { results: [], error: error.message };

      return {
        results: (data || []).map((d) => ({
          match_id: d.id,
          snapshot: {
            name: d.name,
            deal_number: d.deal_number,
            amount: d.amount,
            address_line1: d.asset_class,
          },
        })),
      };
    }

    return { results: [] };
  } catch (err: unknown) {
    console.error("searchEntityAction error:", err);
    return { results: [], error: err instanceof Error ? err.message : "Search failed" };
  }
}

// ─── Process Intake Item (new entity-merge flow) ───

export async function processIntakeItemAction(
  intakeItemId: string,
  decisions: IntakeDecisions | null
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // If decisions is null, dismiss the item
    if (!decisions) {
      const { error } = await admin
        .from("intake_items" as never)
        .update({
          status: "dismissed",
          processed_by: auth.user.id,
          processed_at: new Date().toISOString(),
        } as never)
        .eq("id" as never, intakeItemId as never);

      if (error) return { error: error.message };
      await revalidatePipeline();
      return { success: true };
    }

    // Fetch the intake item
    const { data: item, error: fetchErr } = await admin
      .from("intake_items" as never)
      .select("*" as never)
      .eq("id" as never, intakeItemId as never)
      .single();

    if (fetchErr || !item) return { error: "Intake item not found" };

    const parsed = (item as Record<string, unknown>).parsed_data as IntakeParsedData;
    const autoMatches = (item as Record<string, unknown>).auto_matches as Record<string, { match_id: string; snapshot: Record<string, unknown> } | null>;

    // Merge manual matches into auto matches for unified resolution
    const effectiveMatches = { ...autoMatches };
    if (decisions.manualMatches) {
      for (const [key, match] of Object.entries(decisions.manualMatches)) {
        if (match) {
          effectiveMatches[key] = match;
        }
      }
    }

    let contactId: string | null = null;
    let companyId: string | null = null;
    let propertyId: string | null = null;

    // Determine contact type based on broker data (crm_contact_type enum has no "broker", use "lead" for correspondent)
    const hasBrokerData = !!(parsed.brokerName || parsed.brokerEmail);
    const contactType = hasBrokerData ? "lead" : "borrower";

    // Process Contact
    if (decisions.entityModes.contact === "new") {
      const incoming = INCOMING_DATA_MAP.contact(parsed);
      const { data: contact, error } = await admin
        .from("crm_contacts" as never)
        .insert({
          first_name: incoming.first_name || null,
          last_name: incoming.last_name || null,
          name: incoming.name || null,
          email: incoming.email || null,
          phone: incoming.phone || null,
          contact_type: contactType,
          source: "other",
        } as never)
        .select("id" as never)
        .single();

      if (error) {
        console.error("Failed to create contact:", error);
        return { error: `Failed to create contact: ${error.message}` };
      }
      contactId = (contact as { id: string }).id;
    } else if (decisions.entityModes.contact === "merge" && effectiveMatches?.contact) {
      contactId = effectiveMatches.contact.match_id;
      const fieldChoicesContact = decisions.fieldChoices.contact || {};
      const updates: Record<string, unknown> = {};
      const incoming = INCOMING_DATA_MAP.contact(parsed);
      const existing = effectiveMatches.contact.snapshot;

      for (const f of ENTITY_FIELD_MAP.contact) {
        const inc = incoming[f.key];
        const ext = existing[f.key];
        if (isEmpty(inc) || valsMatch(inc, ext)) continue;

        if (isEmpty(ext)) {
          updates[f.key] = inc;
        } else if (fieldChoicesContact[f.key] === "incoming") {
          updates[f.key] = inc;
        } else if (fieldChoicesContact[f.key] === "both") {
          const label = f.key === "phone" ? "Alt phone" : f.key === "email" ? "Alt email" : f.key;
          const existingNotes = (effectiveMatches.contact.snapshot.notes as string) || "";
          updates["notes"] = existingNotes
            ? `${existingNotes}\n${label}: ${inc}`
            : `${label}: ${inc}`;
        }
      }

      if (Object.keys(updates).length > 0) {
        await admin
          .from("crm_contacts" as never)
          .update(updates as never)
          .eq("id" as never, contactId as never);
      }
    }

    // Process Borrower Contact (only when the borrower_contact entity is in the decisions)
    let borrowerContactId: string | null = null;
    if (decisions.entityModes.borrower_contact === "new") {
      const incoming = INCOMING_DATA_MAP.borrower_contact(parsed);
      if (incoming.name || incoming.email) {
        const { data: borrowerContact, error: bErr } = await admin
          .from("crm_contacts" as never)
          .insert({
            first_name: incoming.first_name || null,
            last_name: incoming.last_name || null,
            name: incoming.name || null,
            email: incoming.email || null,
            phone: incoming.phone || null,
            company_name: incoming.company_name || null,
            contact_type: "borrower",
            source: "other",
          } as never)
          .select("id" as never)
          .single();

        if (bErr) {
          console.error("Failed to create borrower contact:", bErr);
        } else if (borrowerContact) {
          borrowerContactId = (borrowerContact as { id: string }).id;
        }
      }
    } else if (decisions.entityModes.borrower_contact === "merge" && effectiveMatches?.borrower_contact) {
      borrowerContactId = effectiveMatches.borrower_contact.match_id;
      const fieldChoicesBorrower = decisions.fieldChoices.borrower_contact || {};
      const updates: Record<string, unknown> = {};
      const incoming = INCOMING_DATA_MAP.borrower_contact(parsed);
      const existing = effectiveMatches.borrower_contact.snapshot;

      for (const f of ENTITY_FIELD_MAP.borrower_contact) {
        const inc = incoming[f.key];
        const ext = existing[f.key];
        if (isEmpty(inc) || valsMatch(inc, ext)) continue;
        if (isEmpty(ext)) {
          updates[f.key] = inc;
        } else if (fieldChoicesBorrower[f.key] === "incoming") {
          updates[f.key] = inc;
        }
      }

      if (Object.keys(updates).length > 0) {
        await admin
          .from("crm_contacts" as never)
          .update(updates as never)
          .eq("id" as never, borrowerContactId as never);
      }
    }

    // Process Company (use borrowerEntityName if available)
    const companyName = parsed.borrowerEntityName || parsed.companyName;
    if (decisions.entityModes.company === "new" && companyName) {
      const incoming = INCOMING_DATA_MAP.company(parsed);
      const { data: company, error } = await admin
        .from("companies" as never)
        .insert({
          name: incoming.name || "Unknown Company",
          company_type: hasBrokerData ? "brokerage" : "other",
          state: incoming.state || null,
          primary_contact_id: contactId,
        } as never)
        .select("id" as never)
        .single();

      if (error) {
        console.error("Failed to create company:", error);
      } else {
        companyId = (company as { id: string }).id;
      }
    } else if (decisions.entityModes.company === "merge" && effectiveMatches?.company) {
      companyId = effectiveMatches.company.match_id;
      const fieldChoicesCompany = decisions.fieldChoices.company || {};
      const updates: Record<string, unknown> = {};
      const incoming = INCOMING_DATA_MAP.company(parsed);
      const existing = effectiveMatches.company.snapshot;

      for (const f of ENTITY_FIELD_MAP.company) {
        const inc = incoming[f.key];
        const ext = existing[f.key];
        if (isEmpty(inc) || valsMatch(inc, ext)) continue;
        if (isEmpty(ext)) {
          updates[f.key] = inc;
        } else if (fieldChoicesCompany[f.key] === "incoming") {
          updates[f.key] = inc;
        }
      }

      if (Object.keys(updates).length > 0) {
        await admin
          .from("companies" as never)
          .update(updates as never)
          .eq("id" as never, companyId as never);
      }
    }

    // Link contacts to company if both exist
    if (contactId && companyId) {
      await admin
        .from("crm_contacts" as never)
        .update({ company_id: companyId } as never)
        .eq("id" as never, contactId as never);
    }
    if (borrowerContactId && companyId) {
      await admin
        .from("crm_contacts" as never)
        .update({ company_id: companyId } as never)
        .eq("id" as never, borrowerContactId as never);
    }

    // Process Property
    if (decisions.entityModes.property === "new" && parsed.propertyAddress) {
      const incoming = INCOMING_DATA_MAP.property(parsed);
      const { data: property, error } = await admin
        .from("properties" as never)
        .insert({
          address_line1: incoming.address_line1 || null,
          city: incoming.city || null,
          state: incoming.state || null,
          property_type: incoming.property_type || null,
          number_of_units: incoming.number_of_units || null,
          gross_building_area_sqft: incoming.gross_building_area_sqft || null,
          year_built: incoming.year_built || null,
          zoning: incoming.zoning || null,
        } as never)
        .select("id" as never)
        .single();

      if (error) {
        console.error("Failed to create property:", error);
      } else {
        propertyId = (property as { id: string }).id;
      }
    } else if (decisions.entityModes.property === "merge" && effectiveMatches?.property) {
      propertyId = effectiveMatches.property.match_id;
      const fieldChoicesProperty = decisions.fieldChoices.property || {};
      const updates: Record<string, unknown> = {};
      const incoming = INCOMING_DATA_MAP.property(parsed);
      const existing = effectiveMatches.property.snapshot;

      for (const f of ENTITY_FIELD_MAP.property) {
        const inc = incoming[f.key];
        const ext = existing[f.key];
        if (isEmpty(inc) || valsMatch(inc, ext)) continue;
        if (isEmpty(ext)) {
          updates[f.key] = inc;
        } else if (fieldChoicesProperty[f.key] === "incoming") {
          updates[f.key] = inc;
        }
      }

      if (Object.keys(updates).length > 0) {
        await admin
          .from("properties" as never)
          .update(updates as never)
          .eq("id" as never, propertyId as never);
      }
    }

    // Process Deal - always create a new deal in Lead stage
    const opportunityData = INCOMING_DATA_MAP.opportunity(parsed);
    const dealName = [
      parsed.borrowerEntityName || parsed.borrowerName || parsed.companyName || parsed.brokerName || parsed.contactName || "Unknown",
      parsed.propertyAddress?.split(",")[0] || parsed.propertyType,
    ]
      .filter(Boolean)
      .join(" - ");

    // Try to determine a card type from the loan type
    let cardTypeId: string | null = null;
    if (parsed.loanType) {
      const loanTypeLower = parsed.loanType.toLowerCase();
      const slugMap: Record<string, string> = {
        dscr: "res_debt_dscr",
        rtl: "res_debt_rtl",
        "comm debt": "comm_debt",
        "comm eq": "comm_equity",
        commercial: "comm_debt",
      };
      const targetSlug = slugMap[loanTypeLower];
      if (targetSlug) {
        const { data: ct } = await admin
          .from("unified_card_types" as never)
          .select("id" as never)
          .eq("slug" as never, targetSlug as never)
          .eq("status" as never, "active" as never)
          .limit(1)
          .single();
        if (ct) cardTypeId = (ct as { id: string }).id;
      }
    }

    // Fall back to first active card type if none matched
    if (!cardTypeId) {
      const { data: fallbackCt } = await admin
        .from("unified_card_types" as never)
        .select("id" as never)
        .eq("status" as never, "active" as never)
        .order("sort_order" as never)
        .limit(1)
        .single();
      if (fallbackCt) cardTypeId = (fallbackCt as { id: string }).id;
    }

    if (!cardTypeId) {
      return { error: "No active card types found" };
    }

    // Get capital_side from card type
    const { data: cardType } = await admin
      .from("unified_card_types" as never)
      .select("capital_side" as never)
      .eq("id" as never, cardTypeId as never)
      .single();

    // Build uw_data with all available financial fields
    const uwData: Record<string, unknown> = {};
    const uwFieldMapping: Array<[string, unknown]> = [
      ["purchase_price", opportunityData.purchase_price],
      ["loan_type", opportunityData.loan_type],
      ["ltv", opportunityData.ltv],
      ["rate", opportunityData.rate],
      ["term", opportunityData.term],
      ["noi", opportunityData.noi],
      ["dscr", opportunityData.dscr],
      ["debt_service", opportunityData.debt_service],
      ["cash_flow", opportunityData.cash_flow],
      ["coc_return", opportunityData.coc_return],
      ["rehab_budget", opportunityData.rehab_budget],
      ["arv", opportunityData.arv],
      ["closing_date", opportunityData.closing_date],
      ["seller_financing", opportunityData.seller_financing],
      ["units", parsed.units],
      ["property_count", parsed.propertyCount],
      ["cap_rate", parsed.capRate],
      ["existing_debt", parsed.existingDebt],
    ];
    for (const [key, val] of uwFieldMapping) {
      if (val !== undefined && val !== null && val !== "" && val !== 0) {
        uwData[key] = val;
      }
    }

    const dealAmount = (opportunityData.amount as number) || (opportunityData.purchase_price as number) || null;

    const VALID_ASSET_CLASSES = ["sfr", "duplex_fourplex", "multifamily", "mhc", "rv_park", "campground", "commercial", "mixed_use", "land"] as const;
    const ASSET_CLASS_ALIASES: Record<string, typeof VALID_ASSET_CLASSES[number]> = {
      "single family": "sfr", "single-family": "sfr", "sfr": "sfr", "single family residence": "sfr",
      "duplex": "duplex_fourplex", "triplex": "duplex_fourplex", "quadplex": "duplex_fourplex", "fourplex": "duplex_fourplex",
      "2-4 unit": "duplex_fourplex", "2-4": "duplex_fourplex", "small multi": "duplex_fourplex",
      "multifamily": "multifamily", "multi-family": "multifamily", "apartment": "multifamily", "apartments": "multifamily",
      "portfolio": "multifamily",
      "mhc": "mhc", "mobile home": "mhc", "manufactured housing": "mhc",
      "rv park": "rv_park", "rv": "rv_park",
      "campground": "campground",
      "commercial": "commercial", "retail": "commercial", "office": "commercial", "industrial": "commercial", "warehouse": "commercial",
      "mixed use": "mixed_use", "mixed-use": "mixed_use",
      "land": "land", "lot": "land", "lots": "land",
    };
    let resolvedAssetClass: string | null = null;
    if (parsed.propertyType) {
      const normalized = parsed.propertyType.toLowerCase().trim();
      resolvedAssetClass = ASSET_CLASS_ALIASES[normalized] ?? null;
      if (!resolvedAssetClass && VALID_ASSET_CLASSES.includes(normalized as typeof VALID_ASSET_CLASSES[number])) {
        resolvedAssetClass = normalized;
      }
    }

    const dealNotes = [
      parsed.notes,
      parsed.brokerLicense ? `Broker License: ${parsed.brokerLicense}` : null,
      parsed.borrowerName ? `Borrower: ${parsed.borrowerName}` : null,
      parsed.borrowerEntityName ? `Borrower Entity: ${parsed.borrowerEntityName}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const insertData: UnifiedDealInsert = {
      name: dealName,
      card_type_id: cardTypeId,
      capital_side: (cardType as { capital_side: string } | null)?.capital_side || "debt",
      amount: dealAmount,
      asset_class: resolvedAssetClass,
      primary_contact_id: contactId,
      company_id: companyId,
      property_id: propertyId,
      created_by: auth.user.id,
      source: "email_intake",
      ...(dealNotes ? { notes: dealNotes } : {}),
      ...(Object.keys(uwData).length > 0 ? { uw_data: uwData as Json } : {}),
    };

    const { data: deal, error: dealError } = await admin
      .from("unified_deals")
      .insert(insertData)
      .select("id, deal_number")
      .single();

    if (dealError) {
      console.error("processIntakeItemAction create deal error:", dealError);
      return { error: dealError.message };
    }

    // Generate conditions (non-fatal)
    const { error: condErr } = await admin.rpc(
      "generate_deal_conditions" as never,
      { p_deal_id: deal.id } as never
    );
    if (condErr) console.error("Failed to generate conditions:", condErr);

    // Log activity (non-fatal)
    const { error: actErr } = await admin.from("unified_deal_activity").insert({
      deal_id: deal.id,
      activity_type: "status_change",
      title: "Deal created from email intake (entity merge flow)",
      created_by: auth.user.id,
    });
    if (actErr) console.error("Failed to log activity:", actErr);

    // Mark intake item as processed
    await admin
      .from("intake_items" as never)
      .update({
        status: "processed",
        processed_by: auth.user.id,
        processed_at: new Date().toISOString(),
        decisions: decisions as unknown as Json,
        created_deal_id: deal.id,
        created_contact_id: contactId,
        created_company_id: companyId,
        created_property_id: propertyId,
      } as never)
      .eq("id" as never, intakeItemId as never);

    await revalidatePipeline(deal.id);
    return { success: true, deal };
  } catch (err: unknown) {
    console.error("processIntakeItemAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to process intake item" };
  }
}
