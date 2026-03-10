// Prefill: loads existing record data for edit mode

import { createClient } from "@/lib/supabase/client";
import type { FormStep, FormFieldDefinition } from "./types";

interface PrefillResult {
  data: Record<string, unknown>;
  originalData: Record<string, unknown>;
}

export async function loadPrefillData(
  steps: FormStep[],
  recordId: string,
  recordType: string
): Promise<PrefillResult> {
  const supabase = createClient();
  const prefillData: Record<string, unknown> = {};
  const originalData: Record<string, unknown> = {};

  // Group fields by target entity
  const entityFields = new Map<string, FormFieldDefinition[]>();
  for (const step of steps) {
    if (!step.target_entity) continue;
    const existing = entityFields.get(step.target_entity) || [];
    existing.push(...step.fields.filter((f) => f.mapped_column));
    entityFields.set(step.target_entity, existing);
  }

  // Load primary record
  if (recordType === "opportunity") {
    const { data: opportunity } = await supabase
      .from("opportunities")
      .select("*")
      .eq("id", recordId)
      .single();

    if (opportunity) {
      const opp = opportunity as unknown as Record<string, unknown>;
      const oppFields = entityFields.get("opportunity") || [];
      for (const field of oppFields) {
        if (field.mapped_column && opp[field.mapped_column] !== undefined) {
          prefillData[field.id] = opp[field.mapped_column];
          originalData[field.mapped_column] = opp[field.mapped_column];
        }
      }

      // Load related contact
      const contactId = opp.contact_id as string | undefined;
      if (contactId) {
        const { data: contact } = await supabase
          .from("crm_contacts")
          .select("*")
          .eq("id", contactId)
          .single();

        if (contact) {
          const c = contact as unknown as Record<string, unknown>;
          const contactFields = entityFields.get("crm_contact") || [];
          for (const field of contactFields) {
            if (field.mapped_column && c[field.mapped_column] !== undefined) {
              prefillData[field.id] = c[field.mapped_column];
              originalData[field.mapped_column] = c[field.mapped_column];
            }
          }
        }
      }

      // Load related property
      const propertyId = opp.property_id as string | undefined;
      if (propertyId) {
        const { data: property } = await supabase
          .from("properties")
          .select("*")
          .eq("id", propertyId)
          .single();

        if (property) {
          const p = property as unknown as Record<string, unknown>;
          const propertyFields = entityFields.get("property") || [];
          for (const field of propertyFields) {
            if (field.mapped_column && p[field.mapped_column] !== undefined) {
              prefillData[field.id] = p[field.mapped_column];
              originalData[field.mapped_column] = p[field.mapped_column];
            }
          }
        }
      }
    }
  }

  return { data: prefillData, originalData };
}
