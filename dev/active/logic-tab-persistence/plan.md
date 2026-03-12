# Logic Tab Persistence - Implementation Plan

## Objective
Wire the FieldConfigPanel's Logic tab to save and load conditional rules from the database, replacing the current static/hardcoded UI. This enables admins to define per-field conditional logic (show/hide/require/set-value based on other field values).

## Scope
- IN: Add condition_rules JSONB column to field_configurations, update Logic tab UI to be dynamic (add/remove rules, save/load), update actions.ts to handle condition_rules
- OUT: Runtime evaluation of condition rules in pipeline/CRM rendering (separate task), complex condition builders (AND/OR groups), cross-field dependency validation

## Approach
### Phase 1: Database Schema
- Add `condition_rules` JSONB column to `field_configurations` table via migration
- Column stores an array of rule objects: `[{ source_field, operator, value, action }]`

### Phase 2: Update FieldConfigPanel Logic Tab
- Replace hardcoded example rule with dynamic rule list from field.condition_rules
- Add/remove rule functionality
- Debounced save via updateFieldConfig action (already supports partial updates)
- Source field dropdown populated from same-module fields

### Phase 3: Verification
- pnpm build passes
- Logic tab loads existing rules
- Rules persist on save

## Files to Modify
- `apps/requity-os/app/(authenticated)/control-center/object-manager/_components/FieldConfigPanel.tsx` - Logic tab UI
- `apps/requity-os/app/(authenticated)/control-center/object-manager/actions.ts` - Ensure condition_rules flows through updateFieldConfig
- New migration file for condition_rules column

## Database Changes
- ALTER TABLE field_configurations ADD COLUMN condition_rules JSONB DEFAULT '[]'::jsonb

## Risks
- updateFieldConfig may need type update to include condition_rules
- Need to ensure the JSONB column is included in SELECT queries

## Success Criteria
- Logic tab shows existing rules from DB
- Admin can add, edit, and remove rules
- Rules persist across page reloads
- pnpm build passes
