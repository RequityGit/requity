import { z } from "zod";

/** Base contact schema — name fields only (refines require external state) */
export const contactBaseSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
});

/**
 * Build the full contact schema with cross-field validation.
 * Requires runtime state (selectedRelationships, email, phone) because
 * Zod refines reference closure variables.
 */
export function buildContactSchema(context: {
  selectedRelationships: string[];
  email: string;
  phone: string;
}) {
  return contactBaseSchema
    .refine(() => context.selectedRelationships.length > 0, {
      message: "At least one relationship type is required",
      path: ["relationships"],
    })
    .refine(() => context.email.trim() !== "" || context.phone.trim() !== "", {
      message:
        "At least one contact method (email or phone) is required",
      path: ["contact_method"],
    });
}
