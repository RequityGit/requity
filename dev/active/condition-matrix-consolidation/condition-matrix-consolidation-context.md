# Condition Matrix Consolidation - Context

## Key Files
- `apps/requity-os/hooks/useResolvedCardType.ts` - Current hook being replaced (resolves card type field refs)
- `apps/requity-os/hooks/useFieldConfigurations.ts` - Existing hook for non-pipeline pages (pattern to follow)
- `apps/requity-os/hooks/useDealLayout.ts` - Page layout hook (being simplified)
- `apps/requity-os/lib/pipeline/resolve-card-type-fields.ts` - Current resolution logic (mapFieldType reusable)
- `apps/requity-os/lib/visibility-engine.ts` - Condition matrix visibility evaluation
- `apps/requity-os/components/pipeline-v2/EditableOverview.tsx` - Overview tab (primary consumer)
- `apps/requity-os/components/pipeline-v2/UnderwritingPanel.tsx` - UW tab (consumer)
- `apps/requity-os/components/pipeline-v2/pipeline-types.ts` - UwFieldDef type definition
- `apps/requity-os/components/pipeline-v2/tabs/PropertyTab.tsx` - Property tab (consumer)
- `apps/requity-os/components/pipeline-v2/tabs/ContactsTab.tsx` - Contacts tab (consumer)

## Decisions Made
- Option A: One universal deal_detail layout for all card types. Condition matrix handles per-deal-type field visibility.
- Card types retain: card_metrics, uw_outputs, uw_grid, slug, label, capital_side. They lose field selection responsibility.
- detail_field_groups fallback kept temporarily until page layout is populated.

## Gotchas Discovered
- Object Manager shows "Page Layout: 0" for Pipeline Deal - layout sections need to be created by admin after this code change
- The dual-gate problem (field must be in card type refs AND page layout) is the root cause of layout issues

## Dependencies
- Condition Matrix must be populated (it already is per screenshot)
- Page layout for deal_detail needs sections to be created via Object Manager

## Last Updated: 2026-03-13
## Next Steps: Create useUwFieldConfigs hook
