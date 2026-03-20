# Object Manager Runtime - Context

## Key Files
- `hooks/useFieldConfigurations.ts` - Non-pipeline field consumption (CRM, loan detail, servicing)
- `hooks/useResolvedCardType.ts` - Pipeline field consumption (resolves card type refs)
- `lib/visibility-engine.ts` - isVisible() for asset class x loan type matrix
- `lib/pipeline/resolve-card-type-fields.ts` - Resolves CardTypeFieldRef[] to UwFieldDef[]
- `lib/pipeline/validate-stage-advancement.ts` - Validates stage rules from unified_stage_rules
- `app/(authenticated)/admin/pipeline-v2/actions.ts` - Server actions including advanceStageAction
- `components/pipeline-v2/PipelineKanban.tsx` - Kanban drag handler
- `contexts/view-as-context.tsx` - Client-side role context (useViewAs -> effectiveViewRole)
- `components/crm/shared-field-renderer.tsx` - CRM field rendering (renderField, buildEditFields)

## Decisions Made
- Use useViewAs() for role-based permissions (effectiveViewRole handles view-as simulation)
- Stage gating integrates INTO advanceStageAction alongside existing validateStageAdvancement
- Conditional logic is a standalone hook consumed by both pipeline and non-pipeline paths
- All new columns added to SELECT_COLS with null defaults for backwards compat

## Gotchas Discovered
- useFieldConfigurations SELECT_COLS does NOT include conditional_rules, permissions, required_at_stage, blocks_stage_progression
- FieldConfigRecord in resolve-card-type-fields.ts also missing these columns
- Stage validation currently uses unified_stage_rules table, NOT field_configurations columns
- CRM rendering uses shared-field-renderer.tsx (renderDynamicFields, buildEditFields) not direct hook consumption

## Last Updated: 2026-03-12
## Next Steps: Implement Phase 1 (Conditional Logic Engine)
