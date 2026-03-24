# Field System Cleanup - Tasks

## Phase 1: Seed Missing Dropdown Options
- [x] Query field_configurations via Supabase MCP to see current state of the 10 target fields
- [x] Write migration to seed/update dropdown_options for fields that are missing them
- [x] Push migration and verify data (14/14 dropdown fields confirmed seeded)

## Phase 2: Remove Hardcoded Fallbacks
- [x] Remove DROPDOWN_FALLBACKS from shared-field-renderer.tsx
- [x] Remove FIELD_TYPE_OVERRIDES from shared-field-renderer.tsx
- [x] Add multi_select to FC_TYPE_TO_CRM mapping (for company_type)
- [x] Update CRM field rendering to handle null dropdown_options gracefully (empty array, not fallback)
- [x] Remove DROPDOWN_FALLBACKS from useUwFieldConfigs.ts
- [x] Remove hardcoded loan_type array from ConditionEditorModal.tsx (now pulls from field_configurations)
- [x] Remove unused CRM_COMPANY_TYPES/CRM_COMPANY_SUBTYPES imports
- [x] Run typecheck - 0 new errors (13 pre-existing in unrelated files)

## Phase 3: Simplify Object Manager Edit Flow
- [x] Remove useDraft prop from FieldConfigPanel (now uses direct DB writes)
- [x] Remove draft callback props from FieldsTab (isFieldDirty, isFieldNew, etc.)
- [x] Add toast feedback for save errors via useToast
- [x] Add "Saved at X" status indicator (replaces "Changes saved as draft" message)
- [x] Update ObjectManagerView to pass fields directly instead of displayFields
- [x] Update onUpdate callback to sync field changes to center panel immediately
- [x] Draft system preserved for Layout tab (no breaking changes)
- [x] Run typecheck - 0 new errors

## Phase 4: Client-Side Cache Invalidation
- [x] Reduce TTL from 5 minutes to 30 seconds in useFieldConfigurations
- [x] Reduce TTL from 5 minutes to 30 seconds in useUwFieldConfigs
- [x] Add FIELD_CONFIG_INVALIDATE_EVENT custom event system
- [x] Add broadcastFieldConfigInvalidation() helper function
- [x] Add event listeners in useFieldConfigurations (refetch on invalidation)
- [x] Add event listeners in useUwFieldConfigs (refetch on invalidation)
- [x] Wire broadcast into FieldConfigPanel after successful save
- [x] Wire broadcast into FieldsTab after create, archive, condition update
- [x] Run typecheck - 0 new errors

## Phase 5: Verification
- [x] Grep confirms 0 references to DROPDOWN_FALLBACKS in codebase
- [x] Grep confirms 0 references to FIELD_TYPE_OVERRIDES in codebase
- [x] Grep confirms 0 hardcoded loan_type arrays ("Bridge, DSCR, Perm")
- [x] DB verification: all 14 dropdown fields have options populated
- [x] TypeScript check: 13 errors total, all pre-existing in unrelated files
- [ ] Manual test: edit dropdown options in Object Manager, verify on pipeline deal page
- [ ] Manual test: edit field label, verify on CRM contact page
- [ ] Manual test: conditional visibility (change asset class, verify field show/hide)
- [ ] Manual test: borrower role access (RLS)

## Blockers
None

## Last Updated: 2026-03-14
