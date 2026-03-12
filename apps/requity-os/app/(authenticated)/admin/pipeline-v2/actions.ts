"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Database, Json } from "@/lib/supabase/types";
import { FIELD_MAPPING_MAP } from "@/lib/pipeline/uw-field-mappings";
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

function revalidatePipeline(dealId?: string) {
  revalidatePath("/admin/pipeline-v2");
  revalidatePath("/admin/pipeline");
  if (dealId) {
    revalidatePath(`/admin/pipeline-v2/${dealId}`);
    revalidatePath(`/admin/pipeline/${dealId}`);
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
  expected_close_date?: string;
  assigned_to?: string;
  uw_data?: Record<string, unknown>;
}) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const insertData: UnifiedDealInsert = {
      name: data.name,
      card_type_id: data.card_type_id,
      capital_side: data.capital_side || "debt",
      asset_class: data.asset_class || null,
      amount: data.amount || null,
      primary_contact_id: data.primary_contact_id || null,
      company_id: data.company_id || null,
      expected_close_date: data.expected_close_date || null,
      assigned_to: data.assigned_to || null,
      created_by: auth.user.id,
      ...(data.uw_data && Object.keys(data.uw_data).length > 0
        ? { uw_data: data.uw_data as Json }
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

    revalidatePipeline(deal.id);
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

    revalidatePipeline(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("updateUnifiedDealAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to update deal" };
  }
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

    // Fetch deal data for validation
    const { data: deal, error: fetchErr } = await admin
      .from("unified_deals")
      .select("*")
      .eq("id", dealId)
      .single();

    if (fetchErr || !deal) {
      return { error: "Deal not found" };
    }

    const { error } = await admin.rpc("unified_advance_stage", {
      p_deal_id: dealId,
      p_new_stage: newStage,
      p_notes: notes,
    });

    if (error) {
      console.error("advanceStageAction error:", error);
      return { error: error.message };
    }

    revalidatePipeline(dealId);
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

    revalidatePipeline(dealId);
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
      // Route write to the borrowers table via primary_contact_id
      const { data: deal, error: fetchErr } = await admin
        .from("unified_deals")
        .select("primary_contact_id")
        .eq("id", dealId)
        .single();

      if (fetchErr || !deal) return { error: "Deal not found" };

      if (!deal.primary_contact_id) {
        // No linked contact — fall back to uw_data JSONB
        return await updateUwDataJsonb(admin, dealId, key, value, auth.user.id);
      }

      // Find borrower by crm_contact_id
      const { data: borrower } = await admin
        .from("borrowers")
        .select("id")
        .eq("crm_contact_id", deal.primary_contact_id)
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

    revalidatePipeline(dealId);
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

  revalidatePipeline(dealId);
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

    revalidatePipeline(dealId);
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

    revalidatePipeline(dealId);
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
    if (status === "won") updates.actual_close_date = new Date().toISOString().split("T")[0];

    const { error } = await admin
      .from("unified_deals")
      .update(updates)
      .eq("id", dealId);

    if (error) {
      console.error("updateDealStatusAction error:", error);
      return { error: error.message };
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

    revalidatePipeline(dealId);
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
          "@/app/(authenticated)/admin/operations/approvals/actions"
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

        revalidatePipeline(cond.deal_id);
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

    revalidatePipeline(dealId);
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
    expected_close_date?: string;
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
      revalidatePath("/admin/pipeline/intake");
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
        expected_close_date: data.dealFields?.expected_close_date || null,
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

      revalidatePipeline(deal.id);
      revalidatePath("/admin/pipeline/intake");
      return { success: true, deal };
    }

    return { error: "Invalid action" };
  } catch (err: unknown) {
    console.error("resolveIntakeItemAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to resolve intake item" };
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
      revalidatePipeline();
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

    let contactId: string | null = null;
    let companyId: string | null = null;
    let propertyId: string | null = null;

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
          contact_type: "borrower",
          source: "email_intake",
        } as never)
        .select("id" as never)
        .single();

      if (error) {
        console.error("Failed to create contact:", error);
        return { error: `Failed to create contact: ${error.message}` };
      }
      contactId = (contact as { id: string }).id;
    } else if (decisions.entityModes.contact === "merge" && autoMatches?.contact) {
      contactId = autoMatches.contact.match_id;
      const fieldChoices = decisions.fieldChoices.contact || {};
      const updates: Record<string, unknown> = {};
      const incoming = INCOMING_DATA_MAP.contact(parsed);
      const existing = autoMatches.contact.snapshot;

      for (const f of ENTITY_FIELD_MAP.contact) {
        const inc = incoming[f.key];
        const ext = existing[f.key];
        if (isEmpty(inc) || valsMatch(inc, ext)) continue;

        if (isEmpty(ext)) {
          // Auto-fill empty field
          updates[f.key] = inc;
        } else if (fieldChoices[f.key] === "incoming") {
          updates[f.key] = inc;
        } else if (fieldChoices[f.key] === "both") {
          // "Keep both" appends to notes since crm_contacts doesn't have secondary fields
          const label = f.key === "phone" ? "Alt phone" : f.key === "email" ? "Alt email" : f.key;
          const existingNotes = (autoMatches.contact.snapshot.notes as string) || "";
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

    // Process Company
    if (decisions.entityModes.company === "new" && parsed.companyName) {
      const incoming = INCOMING_DATA_MAP.company(parsed);
      const { data: company, error } = await admin
        .from("companies" as never)
        .insert({
          name: incoming.name || "Unknown Company",
          company_type: "borrower",
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
    } else if (decisions.entityModes.company === "merge" && autoMatches?.company) {
      companyId = autoMatches.company.match_id;
      const fieldChoices = decisions.fieldChoices.company || {};
      const updates: Record<string, unknown> = {};
      const incoming = INCOMING_DATA_MAP.company(parsed);
      const existing = autoMatches.company.snapshot;

      for (const f of ENTITY_FIELD_MAP.company) {
        const inc = incoming[f.key];
        const ext = existing[f.key];
        if (isEmpty(inc) || valsMatch(inc, ext)) continue;
        if (isEmpty(ext)) {
          updates[f.key] = inc;
        } else if (fieldChoices[f.key] === "incoming") {
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

    // Link contact to company if both exist
    if (contactId && companyId) {
      await admin
        .from("crm_contacts" as never)
        .update({ company_id: companyId } as never)
        .eq("id" as never, contactId as never);
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
    } else if (decisions.entityModes.property === "merge" && autoMatches?.property) {
      propertyId = autoMatches.property.match_id;
      const fieldChoices = decisions.fieldChoices.property || {};
      const updates: Record<string, unknown> = {};
      const incoming = INCOMING_DATA_MAP.property(parsed);
      const existing = autoMatches.property.snapshot;

      for (const f of ENTITY_FIELD_MAP.property) {
        const inc = incoming[f.key];
        const ext = existing[f.key];
        if (isEmpty(inc) || valsMatch(inc, ext)) continue;
        if (isEmpty(ext)) {
          updates[f.key] = inc;
        } else if (fieldChoices[f.key] === "incoming") {
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

    // Process Opportunity (Deal) - always create a new deal in Lead stage
    const opportunityData = INCOMING_DATA_MAP.opportunity(parsed);
    const dealName = [
      parsed.contactName || parsed.companyName || "Unknown",
      parsed.propertyAddress?.split(",")[0],
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

    const insertData: UnifiedDealInsert = {
      name: dealName,
      card_type_id: cardTypeId,
      capital_side: (cardType as { capital_side: string } | null)?.capital_side || "debt",
      amount: (opportunityData.amount as number) || null,
      primary_contact_id: contactId,
      company_id: companyId,
      property_id: propertyId,
      created_by: auth.user.id,
      source: "email_intake",
      uw_data: {
        loan_type: opportunityData.loan_type,
        ltv: opportunityData.ltv,
        rate: opportunityData.rate,
        term: opportunityData.term,
        dscr: opportunityData.dscr,
        rehab_budget: opportunityData.rehab_budget,
        arv: opportunityData.arv,
      } as Json,
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

    revalidatePipeline(deal.id);
    return { success: true, deal };
  } catch (err: unknown) {
    console.error("processIntakeItemAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to process intake item" };
  }
}
