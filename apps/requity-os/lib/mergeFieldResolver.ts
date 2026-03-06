import type { UserEmailTemplateVariable } from "@/lib/types/user-email-templates";

/**
 * Resolves merge fields in a template string using provided data.
 * Replaces {{variable_name}} with the corresponding value.
 */
export function resolveTemplate(
  template: string,
  data: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return data[key] ?? match;
  });
}

/**
 * Builds sample data from available_variables for live preview.
 */
export function buildSampleData(
  variables: UserEmailTemplateVariable[]
): Record<string, string> {
  const data: Record<string, string> = {};
  for (const v of variables) {
    data[v.key] = v.sample;
  }
  return data;
}

/**
 * Extracts all merge field keys used in a template string.
 */
export function extractMergeFields(template: string): string[] {
  const keys = new Set<string>();
  const regex = /\{\{(\w+)\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(template)) !== null) {
    keys.add(match[1]);
  }
  return Array.from(keys);
}

/**
 * Formats snake_case to Title Case.
 */
export function toTitleCase(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Generates a slug from a template name.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .replace(/^_+|_+$/g, "");
}
