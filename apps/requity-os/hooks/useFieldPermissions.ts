"use client";

import { useMemo } from "react";
import type { FieldConfiguration, FieldPermissions } from "@/hooks/useFieldConfigurations";

/** A field with its permission-derived editable flag. */
export interface PermittedField<T extends { permissions: FieldPermissions | null }> {
  field: T;
  editable: boolean;
}

/**
 * Check whether a role has view permission on a field.
 * If permissions is null/empty, default to visible for all roles (backwards compatible).
 */
function canView(permissions: FieldPermissions | null, role: string): boolean {
  if (!permissions || Object.keys(permissions).length === 0) return true;
  return permissions[role]?.view !== false;
}

/**
 * Check whether a role has edit permission on a field.
 * If permissions is null/empty, default to editable for all roles (backwards compatible).
 */
function canEdit(permissions: FieldPermissions | null, role: string): boolean {
  if (!permissions || Object.keys(permissions).length === 0) return true;
  return permissions[role]?.edit !== false;
}

/**
 * Filters fields by role-based permissions and annotates each with an editable flag.
 *
 * - Fields where permissions[role].view === false are excluded entirely
 * - Remaining fields include editable: permissions[role].edit
 * - Null/empty permissions defaults to visible+editable (backwards compatible)
 *
 * Usage:
 *   const { effectiveViewRole } = useViewAs();
 *   const permitted = useFieldPermissions(fields, effectiveViewRole);
 *   // permitted[i].field is the FieldConfiguration, permitted[i].editable is boolean
 */
export function useFieldPermissions<T extends FieldConfiguration>(
  fields: T[],
  role: string
): PermittedField<T>[] {
  return useMemo(() => {
    return fields
      .filter((f) => canView(f.permissions, role))
      .map((f) => ({
        field: f,
        editable: canEdit(f.permissions, role),
      }));
  }, [fields, role]);
}

/**
 * Pure function version for use in non-React contexts.
 */
export function filterByPermissions<T extends { permissions: FieldPermissions | null }>(
  fields: T[],
  role: string
): PermittedField<T>[] {
  return fields
    .filter((f) => canView(f.permissions, role))
    .map((f) => ({
      field: f,
      editable: canEdit(f.permissions, role),
    }));
}
