# Object Manager Revamp - Context

## Key Files
- `apps/requity-os/app/(authenticated)/control-center/object-manager/ObjectManagerView.tsx` - Main view with sidebar + tabs
- `apps/requity-os/app/(authenticated)/control-center/object-manager/actions.ts` - Server actions (CRUD for fields, relationships, layouts)
- `apps/requity-os/app/(authenticated)/control-center/object-manager/_components/constants.ts` - Field types, icon mapping
- `apps/requity-os/app/(authenticated)/control-center/object-manager/_components/FieldsTab.tsx` - Fields grid
- `apps/requity-os/app/(authenticated)/control-center/object-manager/_components/FieldConfigPanel.tsx` - Field config right panel
- `apps/requity-os/app/(authenticated)/control-center/card-types/` - Card Types system (to eventually replace)
- `apps/requity-os/components/pipeline-v2/pipeline-types.ts` - Pipeline types (UnifiedCardType, UnifiedDeal)
- `apps/requity-os/lib/formula-engine/` - Existing formula engine (mathjs-based)
- `packages/db/supabase/types.ts` - Generated Supabase types

## Architecture Notes
- This is a **Next.js 14 App Router** project (NOT Remix despite CLAUDE.md mention)
- Uses `"use server"` actions colocated with pages
- Tables accessed via `as never` casts because not all tables in generated types
- `field_configurations` table is master field registry keyed by `(module, field_key)`
- `unified_card_types` references fields via `uw_field_refs` JSONB arrays
- `unified_deals.uw_data` stores field values as JSONB keyed by field_key
- Formula engine already exists with mathjs, financial functions, grid evaluator
- Object Manager uses 3 tabs: Fields, Relationships, Page Layout
- Existing `field_configurations` has `conditional_rules` (JSON array) but NOT `visibility_condition`

## Decisions Made
- visibility_condition column is JSONB: `{asset_class?: string[], loan_type?: string[]}`
- AND across axes, OR within each axis
- null/undefined = always visible
- Formula fields already have type "formula" in field_configurations

## Gotchas Discovered
- CLAUDE.md says Remix but app is actually Next.js 14 (App Router)
- Existing `conditional_rules` column exists but is for stage-gating, NOT axis visibility
- Card Types have `applicable_asset_classes` already - partial overlap
- `field_configurations.formula_expression` already exists

## Dependencies
- Supabase MCP for DB operations
- shadcn/ui for all UI components
- Existing formula engine for formula evaluation

## Last Updated: 2026-03-11
## Next Steps: Create migration, then build UI components
