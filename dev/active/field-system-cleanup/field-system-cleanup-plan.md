# Field System Cleanup - Implementation Plan

## Objective
Eliminate all hardcoded field fallbacks so the Object Manager is the single source of truth, simplify the edit flow from draft/publish to instant-save for field metadata, and ensure field edits propagate immediately to all consuming pages.

## Scope
- IN: Removing hardcoded dropdown fallbacks (3 files), removing field type overrides, seeding missing dropdown_options into field_configurations, simplifying Object Manager edit flow, adding client-side cache invalidation after publish
- OUT: New field types, new conditional_rules UI, formula engine changes, RLS policy changes, new Object Manager features, redesigning the Object Manager layout/navigation

## Current State (Research Findings)

### Hardcoded Fallbacks to Remove

**1. shared-field-renderer.tsx (lines 41-84)**
7 hardcoded dropdown fallback maps:
- lifecycle_stage: 5 options
- status: 5 options
- source: 11 options
- marital_status: 5 options
- accreditation_status: 4 options
- company_type: references CRM_COMPANY_TYPES (10 values)
- subtype: references CRM_COMPANY_SUBTYPES (5 values)

Plus FIELD_TYPE_OVERRIDES (line 103-105): company_type hardcoded to multi_select

**2. useUwFieldConfigs.ts (lines 62-64)**
- loan_purpose: 5 hardcoded options

**3. ConditionEditorModal.tsx (lines 123-124)**
- loan_type: 5 hardcoded options (Bridge, DSCR, Perm, Construction, Equity)

### Draft/Publish Complexity
- useDraftState.ts: 434 lines managing a 4-tier accumulation system
- Field metadata edits are staged (draft), but layout changes write to DB immediately
- This asymmetry creates confusion: "did my edit save or not?"
- batchPublishChanges() runs sequential DB updates with no transaction wrapper
- No client-side cache invalidation after publish (relies on Next.js revalidatePath only)

### What Already Works (Don't Touch)
- conditional_rules: fully wired (FieldConfigPanel LogicTab + useConditionalLogic hook)
- required_at_stage: fully wired (FieldConfigPanel StageTab + stage-gating.ts)
- visibility_condition + visibility-engine.ts: working for asset class filtering
- Field permissions: working via useFieldPermissions hook

## Approach

### Phase 1: Seed Missing Dropdown Options into field_configurations
Write a migration that ensures every field currently relying on a hardcoded fallback has its dropdown_options properly populated in field_configurations. This makes the fallbacks redundant before we remove them.

Fields to seed (verify current DB state first via Supabase MCP):
- contact_profile module: lifecycle_stage, status, source, marital_status, accreditation_status
- company_info module: company_type (with multi_select field_type), subtype
- uw_deal module: loan_purpose, loan_type

### Phase 2: Remove Hardcoded Fallbacks
Once DB is seeded:
1. Remove DROPDOWN_FALLBACKS object from shared-field-renderer.tsx
2. Remove FIELD_TYPE_OVERRIDES from shared-field-renderer.tsx
3. Update field rendering to use field_configurations exclusively (graceful empty state if no options found, not a hardcoded fallback)
4. Remove DROPDOWN_FALLBACKS from useUwFieldConfigs.ts
5. Remove hardcoded loan_type array from ConditionEditorModal.tsx; pull from field_configurations instead
6. Update any remaining references to CRM_COMPANY_TYPES/CRM_COMPANY_SUBTYPES in field rendering contexts

### Phase 3: Simplify Object Manager Edit Flow
Replace draft/publish with instant-save for individual field edits:
1. When a field property changes in FieldConfigPanel, call the server action immediately (like layout changes already do)
2. Keep batch operations (bulk archive, bulk reorder) as a separate "apply" action
3. Remove or simplify useDraftState.ts (keep only for bulk ops if needed)
4. Remove DiffReviewModal for single-field edits
5. Add success/error toast feedback on each save

### Phase 4: Client-Side Cache Invalidation
After field edits save:
1. Add a cache key or version to field_configurations queries
2. When Object Manager saves a field, broadcast invalidation to consuming hooks
3. Options: React context event, custom event bus, or simple refetch trigger via URL param
4. Test that open pipeline/CRM pages reflect changes without full page refresh

### Phase 5: Verification
1. Edit a dropdown field in Object Manager, confirm it reflects immediately on pipeline deal page
2. Edit a field label, confirm it updates on CRM contact page
3. Confirm conditional visibility still works (change asset class on a deal, verify fields show/hide)
4. Run pnpm build to catch any TS errors
5. Test with borrower role to verify RLS still enforced

## Files to Modify

### Phase 1 (Migration)
- NEW: supabase/migrations/[timestamp]_seed_field_dropdown_options.sql

### Phase 2 (Fallback Removal)
- apps/requity-os/components/crm/shared-field-renderer.tsx
- apps/requity-os/hooks/useUwFieldConfigs.ts
- apps/requity-os/app/(authenticated)/control-center/object-manager/_components/ConditionEditorModal.tsx

### Phase 3 (Edit Flow)
- apps/requity-os/app/(authenticated)/control-center/object-manager/ObjectManagerView.tsx
- apps/requity-os/app/(authenticated)/control-center/object-manager/_hooks/useDraftState.ts
- apps/requity-os/app/(authenticated)/control-center/object-manager/actions.ts
- apps/requity-os/app/(authenticated)/control-center/object-manager/_components/FieldConfigPanel.tsx
- apps/requity-os/app/(authenticated)/control-center/object-manager/_components/DiffReviewModal.tsx (remove or simplify)

### Phase 4 (Cache)
- apps/requity-os/hooks/useFieldConfigurations.ts
- apps/requity-os/hooks/useUwFieldConfigs.ts

## Database Changes
- One migration to seed dropdown_options for ~10 fields
- No schema changes (field_configurations already has all needed columns)

## Risks
1. **Removing fallbacks before seeding**: If we remove fallbacks but a field's dropdown_options is null in DB, dropdowns render empty. Mitigation: Phase 1 (seed) must complete and be verified before Phase 2 (remove).
2. **Instant-save breaking bulk workflows**: If someone is reordering 20 fields, instant-save could fire 20 DB calls. Mitigation: Keep batch/reorder as a separate "apply" action.
3. **Cache staleness during transition**: If cache invalidation isn't working, stale field defs could confuse users. Mitigation: Add a manual "refresh" action as fallback.

## Success Criteria
- Zero hardcoded dropdown fallbacks in codebase (grep for DROPDOWN_FALLBACKS returns nothing)
- Field label/option edits in Object Manager reflect on consuming pages within seconds
- No draft/publish flow for single-field edits
- pnpm build passes clean
- Conditional visibility still works correctly per asset class
