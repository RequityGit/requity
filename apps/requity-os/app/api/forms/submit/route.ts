import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseCurrency, LOAN_TYPE_CODES } from "@repo/lib";
import { createHash } from "crypto";
import type { FormStep, FormFieldDefinition } from "@/lib/form-engine/types";

interface SubmitRequest {
  submission_id: string;
  form_id: string;
  data: Record<string, unknown>;
  mode: "create" | "update";
  record_id: string | null;
  deal_id?: string | null;
  deal_application_link_id?: string | null;
}

interface EntityFieldGroup {
  target_entity: string;
  match_on: string | null;
  fields: FormFieldDefinition[];
}

function groupFieldsByEntity(steps: FormStep[]): EntityFieldGroup[] {
  const entityMap = new Map<string, EntityFieldGroup>();

  for (const step of steps) {
    if (!step.target_entity) continue;

    const existing = entityMap.get(step.target_entity);
    if (existing) {
      existing.fields.push(...step.fields.filter((f) => f.mapped_column));
      if (!existing.match_on && step.match_on) {
        existing.match_on = step.match_on;
      }
    } else {
      entityMap.set(step.target_entity, {
        target_entity: step.target_entity,
        match_on: step.match_on,
        fields: step.fields.filter((f) => f.mapped_column),
      });
    }
  }

  return Array.from(entityMap.values());
}

function buildEntityData(
  fields: FormFieldDefinition[],
  data: Record<string, unknown>
): Record<string, unknown> {
  const entityData: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.mapped_column && data[field.id] !== undefined && data[field.id] !== "") {
      entityData[field.mapped_column] = data[field.id];
    }
  }
  return entityData;
}

function computeChangeset(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  fields: FormFieldDefinition[]
): Array<{ field: string; old_value: string | null; new_value: string | null }> {
  const changes: Array<{ field: string; old_value: string | null; new_value: string | null }> = [];

  for (const f of fields) {
    if (!f.mapped_column) continue;
    const oldVal = oldData[f.mapped_column];
    const newVal = newData[f.mapped_column];
    if (String(oldVal ?? "") !== String(newVal ?? "")) {
      changes.push({
        field: f.mapped_column,
        old_value: oldVal != null ? String(oldVal) : null,
        new_value: newVal != null ? String(newVal) : null,
      });
    }
  }

  return changes;
}

export async function POST(request: Request) {
  try {
    const body: SubmitRequest = await request.json();
    const { submission_id, form_id, data, mode, record_id } = body;

    if (!submission_id || !form_id || !data) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Capture request metadata for signature audit trail
    const headersList = await headers();
    const clientIp = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
      || headersList.get("x-real-ip")
      || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createAdminClient();

    // 1. Load form definition
    const { data: formDef, error: formError } = await supabase
      .from("form_definitions")
      .select("*")
      .eq("id", form_id)
      .single();

    if (formError || !formDef) {
      return NextResponse.json(
        { success: false, error: "Form definition not found", step: "load_form" },
        { status: 404 }
      );
    }

    const steps = ((formDef as any).steps || []) as FormStep[];
    const entityGroups = groupFieldsByEntity(steps);
    const entityIds: Record<string, string> = {};
    const allChanges: Array<{ field: string; old_value: string | null; new_value: string | null }> = [];

    // Check if this is the loan request form (special handling)
    const isLoanApplicationForm = (formDef as any).slug === "loan-request";

    // 2. Process each entity group in dependency order
    // Order: crm_contact -> company -> property -> opportunity
    const entityOrder = ["crm_contact", "company", "property", "opportunity"];
    const sortedGroups = entityGroups.sort(
      (a, b) => entityOrder.indexOf(a.target_entity) - entityOrder.indexOf(b.target_entity)
    );

    // Track if opportunity creation failed (for review queue)
    let opportunityCreationFailed = false;
    let opportunityError: string | null = null;

    for (const group of sortedGroups) {
      const entityData = buildEntityData(group.fields, data);
      if (Object.keys(entityData).length === 0) continue;

      try {
        switch (group.target_entity) {
          case "crm_contact": {
            // Handle full_name -> first_name / last_name split
            if (data.full_name && typeof data.full_name === "string") {
              const nameParts = (data.full_name as string).trim().split(/\s+/);
              entityData.first_name = nameParts[0] || "";
              entityData.last_name = nameParts.slice(1).join(" ") || "";
              delete entityData.first_name; // remove if it was mapped as the full field
            }
            if (data.full_name && typeof data.full_name === "string") {
              const nameParts = (data.full_name as string).trim().split(/\s+/);
              entityData.first_name = nameParts[0] || "";
              entityData.last_name = nameParts.slice(1).join(" ") || "";
            }

            let contactId: string | null = null;

            if (group.match_on === "email" && entityData.email) {
              const { data: existingContact } = await supabase
                .from("crm_contacts")
                .select("*")
                .ilike("email", entityData.email as string)
                .limit(1)
                .single();

              if (existingContact) {
                contactId = existingContact.id;
                const changes = computeChangeset(existingContact, entityData, group.fields);
                if (changes.length > 0) {
                  await supabase
                    .from("crm_contacts")
                    .update(entityData)
                    .eq("id", contactId);

                  for (const change of changes) {
                    await supabase.from("entity_audit_log").insert({
                      entity_type: "crm_contact",
                      entity_id: contactId,
                      field_name: change.field,
                      old_value: change.old_value,
                      new_value: change.new_value,
                      changed_via: (formDef as any).name,
                      form_submission_id: submission_id,
                      form_definition_id: form_id,
                    });
                  }
                  allChanges.push(...changes);
                }
              } else {
                const { data: newContact, error: contactError } = await supabase
                  .from("crm_contacts")
                  .insert(entityData)
                  .select("id")
                  .single();

                if (contactError) throw new Error(`Contact creation failed: ${contactError.message}`);
                contactId = newContact.id;
              }
            } else {
              const { data: newContact, error: contactError } = await supabase
                .from("crm_contacts")
                .insert(entityData)
                .select("id")
                .single();

              if (contactError) throw new Error(`Contact creation failed: ${contactError.message}`);
              contactId = newContact.id;
            }

            if (contactId) entityIds.contact_id = contactId;
            break;
          }

          case "property": {
            let propertyId: string | null = null;

            if (group.match_on === "address" && entityData.address) {
              const { data: existingProperty } = await supabase
                .from("properties")
                .select("*")
                .ilike("address", entityData.address as string)
                .limit(1)
                .single();

              if (existingProperty) {
                propertyId = existingProperty.id;
                const changes = computeChangeset(existingProperty, entityData, group.fields);
                if (changes.length > 0) {
                  await supabase
                    .from("properties")
                    .update(entityData)
                    .eq("id", propertyId);

                  for (const change of changes) {
                    await supabase.from("entity_audit_log").insert({
                      entity_type: "property",
                      entity_id: propertyId,
                      field_name: change.field,
                      old_value: change.old_value,
                      new_value: change.new_value,
                      changed_via: (formDef as any).name,
                      form_submission_id: submission_id,
                      form_definition_id: form_id,
                    });
                  }
                  allChanges.push(...changes);
                }
              } else {
                const { data: newProperty, error: propError } = await supabase
                  .from("properties")
                  .insert(entityData)
                  .select("id")
                  .single();

                if (propError) throw new Error(`Property creation failed: ${propError.message}`);
                propertyId = newProperty.id;
              }
            } else {
              const { data: newProperty, error: propError } = await supabase
                .from("properties")
                .insert(entityData)
                .select("id")
                .single();

              if (propError) throw new Error(`Property creation failed: ${propError.message}`);
              propertyId = newProperty.id;
            }

            if (propertyId) entityIds.property_id = propertyId;
            break;
          }

          case "opportunity": {
            // Special handling for loan request form - create unified_deal instead
            if (isLoanApplicationForm) {
              // Loan request form creates unified_deals, not opportunities
              const loanType = data.loan_type as string;
              const firstName = data.first_name as string;
              const lastName = data.last_name as string;
              const propertyAddress = data.property_address as string;
              const loanAmount = data.loan_amount as string;
              const purchasePrice = data.purchase_price as string;
              const rehabBudget = data.rehab_budget as string;
              const afterRepairValue = data.after_repair_value as string;
              const creditScore = data.credit_score as string;
              const dealsInLast24Months = data.deals_in_last_24_months as string;
              const citizenshipStatus = data.citizenship_status as string;
              const experienceLevel = data.experience_level as string;
              const timeline = data.timeline as string;
              const company = data.company as string;

              if (!loanType || !firstName || !lastName || !loanAmount) {
                opportunityCreationFailed = true;
                opportunityError = "Missing required fields: loan_type, first_name, last_name, or loan_amount";
                break;
              }

              // Asset type mapping (from loan-request API)
              const ASSET_TYPE_MAP: Record<string, string> = {
                "Fix & Flip": "sfr",
                "DSCR Rental": "sfr",
                "New Construction": "sfr",
                "CRE Bridge": "commercial",
                "Manufactured Housing": "mhc",
                "RV Park": "rv_park",
                Multifamily: "multifamily",
              };

              // Card type mapping (from loan-request API)
              const CARD_TYPE_MAP: Record<string, string> = {
                rtl: "6ea336bf-3325-44e9-b83b-26aef2fd0005",
                guc: "6ea336bf-3325-44e9-b83b-26aef2fd0005",
                dscr: "977496b1-5109-4298-83bb-f8b1735d9d16",
                cre_bridge: "33ae24e4-3969-4e6e-bd4f-4b007bdcfcaa",
                mhc: "33ae24e4-3969-4e6e-bd4f-4b007bdcfcaa",
                rv_park: "33ae24e4-3969-4e6e-bd4f-4b007bdcfcaa",
                multifamily: "33ae24e4-3969-4e6e-bd4f-4b007bdcfcaa",
              };

              const loanTypeCode = LOAN_TYPE_CODES[loanType] || null;
              const cardTypeId = loanTypeCode ? CARD_TYPE_MAP[loanTypeCode] || null : null;
              const loanAmountNum = parseCurrency(loanAmount);

              const addressPart = propertyAddress
                ? propertyAddress.split(",")[0].trim()
                : loanType;
              const dealName = `${firstName} ${lastName} - ${addressPart}`;

              // Build uw_data
              const uwData: Record<string, unknown> = {};
              if (purchasePrice) uwData.purchase_price = parseCurrency(purchasePrice);
              if (loanAmount) uwData.loan_amount_requested = loanAmountNum;
              if (rehabBudget) uwData.rehab_budget = parseCurrency(rehabBudget);
              if (afterRepairValue) uwData.after_repair_value = parseCurrency(afterRepairValue);
              if (creditScore) uwData.credit_score = creditScore;
              if (dealsInLast24Months) uwData.deals_in_last_24_months = dealsInLast24Months;
              if (citizenshipStatus) uwData.citizenship_status = citizenshipStatus;
              if (experienceLevel) uwData.experience_level = experienceLevel;
              if (timeline) uwData.timeline_to_close = timeline;
              if (company) uwData.company = company;

              // Build notes
              const notesLines = [
                `Form submission - ${new Date().toISOString().split("T")[0]}`,
                timeline ? `Timeline: ${timeline}` : null,
                creditScore ? `Credit: ${creditScore}` : null,
                dealsInLast24Months ? `Deals (24mo): ${dealsInLast24Months}` : null,
                citizenshipStatus ? `Citizenship: ${citizenshipStatus}` : null,
                experienceLevel ? `Experience: ${experienceLevel}` : null,
                purchasePrice ? `Purchase Price: ${purchasePrice}` : null,
                rehabBudget ? `Rehab: ${rehabBudget}` : null,
                afterRepairValue ? `ARV: ${afterRepairValue}` : null,
              ].filter(Boolean).join("\n");

              // Create unified_deal
              const { data: dealData, error: dealErr } = await supabase
                .from("unified_deals")
                .insert({
                  name: dealName,
                  capital_side: "debt",
                  stage: "lead",
                  card_type_id: cardTypeId,
                  loan_type: loanTypeCode,
                  primary_contact_id: entityIds.contact_id || null,
                  property_id: entityIds.property_id || null,
                  amount: loanAmountNum > 0 ? loanAmountNum : null,
                  source: "website",
                  source_detail: "loan request form",
                  asset_class: ASSET_TYPE_MAP[loanType] || null,
                  uw_data: uwData,
                  notes: notesLines,
                  tags: ["website-lead"],
                } as never)
                .select("id")
                .single();

              if (dealErr) {
                opportunityCreationFailed = true;
                opportunityError = dealErr.message;
              } else {
                entityIds.unified_deal_id = dealData.id;
                // Also set opportunity_id for backwards compatibility
                entityIds.opportunity_id = dealData.id;
              }

              // Link contact to deal via deal_contacts
              if (dealData?.id && entityIds.contact_id) {
                await supabase.from("deal_contacts").insert({
                  deal_id: dealData.id,
                  contact_id: entityIds.contact_id,
                  role: "primary",
                  is_guarantor: false,
                  sort_order: 1,
                });
              }
            } else {
              // Standard opportunity creation for other forms
              if (entityIds.property_id) entityData.property_id = entityIds.property_id;
              if (entityIds.borrower_entity_id) entityData.borrower_entity_id = entityIds.borrower_entity_id;

              if (data.loan_type) entityData.loan_type = data.loan_type;

              if (mode === "update" && record_id) {
                const { data: existingOpp } = await supabase
                  .from("opportunities")
                  .select("*")
                  .eq("id", record_id)
                  .single();

                if (existingOpp) {
                  const changes = computeChangeset(existingOpp, entityData, group.fields);
                  if (changes.length > 0 || Object.keys(entityData).length > 0) {
                    await supabase
                      .from("opportunities")
                      .update(entityData)
                      .eq("id", record_id);

                    for (const change of changes) {
                      await supabase.from("entity_audit_log").insert({
                        entity_type: "opportunity",
                        entity_id: record_id,
                        field_name: change.field,
                        old_value: change.old_value,
                        new_value: change.new_value,
                        changed_via: (formDef as any).name,
                        form_submission_id: submission_id,
                        form_definition_id: form_id,
                      });
                    }
                    allChanges.push(...changes);
                  }
                  entityIds.opportunity_id = record_id;
                }
              } else {
                const { data: newOpp, error: oppError } = await supabase
                  .from("opportunities")
                  .insert(entityData)
                  .select("id")
                  .single();

                if (oppError) {
                  opportunityCreationFailed = true;
                  opportunityError = oppError.message;
                } else {
                  entityIds.opportunity_id = newOpp.id;
                }
              }
            }
            break;
          }

          // Company and other entity types can be added as needed
          default:
            break;
        }
      } catch (entityErr) {
        // If opportunity creation fails, mark for review but don't fail the entire submission
        if (group.target_entity === "opportunity") {
          opportunityCreationFailed = true;
          opportunityError = entityErr instanceof Error ? entityErr.message : "Entity processing failed";
        } else {
          // For other entities, still throw to maintain data integrity
          return NextResponse.json(
            {
              success: false,
              error: entityErr instanceof Error ? entityErr.message : "Entity processing failed",
              step: group.target_entity,
            },
            { status: 500 }
          );
        }
      }
    }

    // 3. Build signature audit trail if form contains a signature field
    let signatureAudit = null;
    const hasSignature = Object.entries(data).some(
      ([, v]) => v && typeof v === "object" && (v as Record<string, unknown>).data_url && (v as Record<string, unknown>).timestamp
    );

    if (hasSignature) {
      // Create a SHA-256 hash of the full submission data (excluding the signature image itself)
      const dataForHash = { ...data };
      for (const [key, val] of Object.entries(dataForHash)) {
        if (val && typeof val === "object" && (val as Record<string, unknown>).data_url) {
          // Replace image data with a hash reference to keep the hash deterministic but exclude large base64
          dataForHash[key] = `[signature:${key}]`;
        }
      }
      const dataHash = createHash("sha256").update(JSON.stringify(dataForHash)).digest("hex");

      // Find the signature field(s) and extract metadata
      const signatureFields: Array<{
        field_id: string;
        mode: string;
        typed_name?: string;
        signed_at: string;
      }> = [];

      for (const [key, val] of Object.entries(data)) {
        if (val && typeof val === "object" && (val as Record<string, unknown>).data_url) {
          const sig = val as Record<string, unknown>;
          signatureFields.push({
            field_id: key,
            mode: (sig.mode as string) || "unknown",
            typed_name: sig.typed_name as string | undefined,
            signed_at: (sig.timestamp as string) || new Date().toISOString(),
          });
        }
      }

      signatureAudit = {
        ip_address: clientIp,
        user_agent: userAgent,
        submitted_at: new Date().toISOString(),
        data_hash: dataHash,
        hash_algorithm: "sha256",
        signatures: signatureFields,
        esign_consent: true,
        form_name: (formDef as Record<string, unknown>).name,
        form_version_id: form_id,
      };
    }

    // 4. Update submission record
    // If opportunity creation failed, mark as 'pending_review' so it appears in review queue
    const submissionStatus = opportunityCreationFailed ? "pending_review" : "submitted";

    const { error: updateError } = await supabase
      .from("form_submissions")
      .update({
        status: submissionStatus,
        type: mode,
        data,
        entity_ids: entityIds,
        changes: allChanges.length > 0 ? allChanges : null,
        ip_address: clientIp,
        user_agent: userAgent,
        ...(signatureAudit ? { signature_audit: signatureAudit } : {}),
        // Store error in internal_notes if opportunity creation failed
        ...(opportunityCreationFailed && opportunityError
          ? { internal_notes: `Opportunity creation failed: ${opportunityError}. Submission requires manual review and opportunity creation.` }
          : {}),
      })
      .eq("id", submission_id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to update submission record", step: "update_submission" },
        { status: 500 }
      );
    }

    // 5. Generate PDF receipt asynchronously if form has a signature
    // Fire-and-forget: don't block the submission response
    if (hasSignature) {
      try {
        const baseUrl = request.headers.get("origin") || request.headers.get("host") || "";
        const protocol = baseUrl.startsWith("http") ? "" : "https://";
        const receiptUrl = `${protocol}${baseUrl}/api/forms/receipt`;

        fetch(receiptUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submission_id }),
        }).catch((receiptErr) => {
          console.error("Receipt generation trigger failed:", receiptErr);
        });
      } catch (receiptErr) {
        // Non-blocking: log but don't fail the submission
        console.error("Receipt generation trigger failed:", receiptErr);
      }
    }

    // If opportunity creation failed, return success but with a warning
    if (opportunityCreationFailed) {
      return NextResponse.json({
        success: true,
        submission_id,
        entity_ids: entityIds,
        warning: "Submission saved but opportunity creation failed. This submission has been queued for manual review.",
        requires_review: true,
      });
    }

    return NextResponse.json({
      success: true,
      submission_id,
      entity_ids: entityIds,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Internal server error",
        step: "unknown",
      },
      { status: 500 }
    );
  }
}
