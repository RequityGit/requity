# Object Manager Runtime Wiring - Implementation Plan

## Objective
Wire the Object Manager's configured field-level features (conditional logic, role permissions, stage gating, visibility filtering) into the runtime so they actually affect field rendering and stage transitions.

## Scope
- IN: Conditional logic engine, role-based permissions, stage gating validation, non-pipeline visibility filtering
- OUT: Intake Form Builder UI, Pro Forma Templates, Object Manager admin UI changes, new migrations

## Approach

### Phase 1: Conditional Logic Engine
- Create `hooks/useConditionalLogic.ts` that evaluates `conditional_rules` JSONB against current form values
- Returns field_key -> { visible, required, setValue } map
- Reactive: recalculates when form values change

### Phase 2: Role-based Field Permissions
- Create `hooks/useFieldPermissions.ts` that filters fields by `permissions` JSONB
- Uses `useViewAs()` for current user role
- Returns filtered fields with editable flag

### Phase 3: Stage Gating Validation
- Create `lib/pipeline/stage-gating.ts` that validates `required_at_stage` + `blocks_stage_progression`
- Integrate into `advanceStageAction()` alongside existing `validateStageAdvancement()`

### Phase 4: Non-pipeline Visibility Filtering
- Extend `useFieldConfigurations()` to accept optional `VisibilityContext`
- Filter fields through existing `isVisible()` engine

## Files to Modify
- `hooks/useFieldConfigurations.ts` - Add conditional_rules, permissions, required_at_stage, blocks_stage_progression to SELECT_COLS + interface
- `hooks/useResolvedCardType.ts` - Add same columns to SELECT_COLS
- `lib/pipeline/resolve-card-type-fields.ts` - Add columns to FieldConfigRecord
- `app/(authenticated)/admin/pipeline-v2/actions.ts` - Integrate stage gating
- New: `hooks/useConditionalLogic.ts`
- New: `hooks/useFieldPermissions.ts`
- New: `lib/pipeline/stage-gating.ts`

## Success Criteria
- Fields with conditional_rules show/hide/become required based on form values
- Fields with permissions are filtered by user role
- Stage transitions blocked when required_at_stage fields are empty
- Non-pipeline pages filter by visibility_condition when context provided
- All backwards compatible (no breakage when columns are null)
- pnpm build passes
