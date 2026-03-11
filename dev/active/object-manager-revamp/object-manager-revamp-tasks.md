# Object Manager Revamp - Tasks

## Phase 1: Database Schema
- [x] Add visibility_condition JSONB to field_configurations
- [x] Add formula_output_format, formula_decimal_places to field_configurations
- [x] Create pro_forma_template table with RLS
- [x] Create intake_form, intake_form_field, intake_submission tables with RLS
- [x] Seed 4 pro forma templates (Commercial OS, Res Bridge, Construction, Equity)

## Phase 2: Object Manager UI Revamp
- [x] Add Condition Matrix and Formulas tabs to ObjectManagerView
- [x] Enhance FieldsTab with condition badges, filter toolbar, axis banners
- [x] Build ConditionEditorModal component
- [x] Build ConditionBadge component
- [x] Build ConditionMatrixTab component
- [x] Build FormulasTab component
- [x] Update actions.ts with visibility_condition support + VisibilityCondition type
- [x] Add updateFieldVisibilityCondition server action
- [x] Add fetchProFormaTemplates server action
- [ ] FormulaEditorModal (deferred - editing works via FieldConfigPanel)

## Phase 3: Conditional Visibility Runtime
- [x] Create visibility evaluator utility (lib/visibility-engine.ts)
- [ ] Wire into pipeline deal rendering (deferred to runtime phase)

## Important Decision
- Card Types system is preserved intact (not deleted) for reference

## Final
- [ ] Build and typecheck
- [ ] Commit and push

## Blockers
- None currently

## Last Updated: 2026-03-11
