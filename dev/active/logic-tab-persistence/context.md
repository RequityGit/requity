# Logic Tab Persistence - Context

## Key Files
- `apps/requity-os/app/(authenticated)/control-center/object-manager/_components/FieldConfigPanel.tsx` - Logic tab UI (lines 290-351)
- `apps/requity-os/app/(authenticated)/control-center/object-manager/actions.ts` - Server actions for field CRUD
- `apps/requity-os/lib/visibility-engine.ts` - Existing two-axis visibility (asset_class x loan_type)
- `apps/requity-os/hooks/useFieldConfigurations.ts` - Client hook for field configs

## Decisions Made
- condition_rules stored as JSONB array on field_configurations (not a separate table) - simpler, co-located with field
- Rule schema: { source_field: string, operator: string, value: string, action: string, action_value?: string }
- Operators: equals, not_equals, contains, is_empty, is_not_empty, greater_than, less_than
- Actions: show, hide, require, set_value

## Gotchas Discovered
- (to be filled during implementation)

## Dependencies
- field_configurations table
- updateFieldConfig action
- FieldConfig type in actions.ts

## Last Updated: 2026-03-12
## Next Steps: Start with Phase 1 (DB migration)
