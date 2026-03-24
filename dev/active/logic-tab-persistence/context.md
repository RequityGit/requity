# Logic Tab Persistence - Context

## Key Files
- `apps/requity-os/app/(authenticated)/control-center/object-manager/_components/FieldConfigPanel.tsx` - Logic tab UI with LogicTab component
- `apps/requity-os/app/(authenticated)/control-center/object-manager/actions.ts` - Server actions (updateFieldConfig handles conditional_rules)
- `apps/requity-os/app/(authenticated)/control-center/object-manager/ObjectManagerView.tsx` - Parent passes siblingFields prop

## Decisions Made
- conditional_rules stored as JSONB array on field_configurations (column name: conditional_rules)
- ConditionRule type: { source_field, operator, value, action, action_value? }
- Operators: equals, not_equals, contains, is_empty, is_not_empty, greater_than, less_than
- Actions: show, hide, require, set_value
- VALUE_FREE_OPERATORS (is_empty, is_not_empty) hide the value input
- set_value action shows an additional action_value input
- Source field dropdown populated from siblingFields (same module, excluding current field and archived)

## Gotchas Discovered
- Column already existed as conditional_rules (not condition_rules as planned) - no migration needed
- updateFieldConfig already supports partial updates including conditional_rules via spread

## Dependencies
- field_configurations table (conditional_rules JSONB column)
- updateFieldConfig action
- FieldConfig type in actions.ts

## Last Updated: 2026-03-12
## Status: Complete
