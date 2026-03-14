import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FormStep, FormFieldDefinition } from "@/lib/form-engine/types";

interface SubmitRequest {
  submission_id: string;
  form_id: string;
  data: Record<string, unknown>;
  mode: "create" | "update";
  record_id: string | null;
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

    // 2. Process each entity group in dependency order
    // Order: crm_contact -> company -> property -> opportunity
    const entityOrder = ["crm_contact", "company", "property", "opportunity"];
    const sortedGroups = entityGroups.sort(
      (a, b) => entityOrder.indexOf(a.target_entity) - entityOrder.indexOf(b.target_entity)
    );

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
            // Link to related entities
            if (entityIds.contact_id) entityData.contact_id = entityIds.contact_id;
            if (entityIds.property_id) entityData.property_id = entityIds.property_id;

            // Add loan type from router selections
            if (data.category) entityData.category = data.category;
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

              if (oppError) throw new Error(`Deal creation failed: ${oppError.message}`);
              entityIds.opportunity_id = newOpp.id;
            }
            break;
          }

          // Company and other entity types can be added as needed
          default:
            break;
        }
      } catch (entityErr) {
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

    // 3. Update submission record
    const { error: updateError } = await supabase
      .from("form_submissions")
      .update({
        status: "submitted",
        type: mode,
        data,
        entity_ids: entityIds,
        changes: allChanges.length > 0 ? allChanges : null,
      })
      .eq("id", submission_id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to update submission record", step: "update_submission" },
        { status: 500 }
      );
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
