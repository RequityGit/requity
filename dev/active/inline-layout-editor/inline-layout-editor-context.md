# Inline Layout Editor - Context

## Key Files
- `/apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage.tsx` - Deal detail page, hard-coded 9 tabs
- `/apps/requity-os/components/pipeline/EditableOverview.tsx` - Overview tab rendering from layout data
- `/apps/requity-os/components/pipeline/tabs/PropertyTab.tsx` - Property tab with layout support
- `/apps/requity-os/hooks/useDealLayout.ts` - Fetches page_layout_sections + page_layout_fields
- `/apps/requity-os/hooks/useUwFieldConfigs.ts` - Fetches field_configurations by module
- `/apps/requity-os/hooks/useFieldConfigurations.ts` - Base field config fetcher
- `/apps/requity-os/app/(authenticated)/control-center/object-manager/actions.ts` - Server actions for layout mutations
- `/apps/requity-os/app/(authenticated)/control-center/object-manager/_components/LayoutTab.tsx` - Existing DnD patterns

## Architecture Decisions
1. Reuse existing server actions from Object Manager (no new API endpoints)
2. Use @dnd-kit (already in project) for drag-and-drop
3. Context provider pattern for edit mode state
4. Edit mode adds overlay controls; does NOT replace the existing rendering
5. Field picker groups by module using useUwFieldConfigs + useFieldConfigurations
6. Cross-object fields use source_object_key column in page_layout_fields (already supported)

## Key Data Flow
- page_layout_sections: has tab_key, section_key, display_order, section_type
- page_layout_fields: has section_id, field_key, field_config_id, source_object_key, column_span, display_order
- EditableOverview reads from useDealLayout() and maps sections/fields to UI
- PropertyTab also reads from useDealLayout() filtering by tab_key="property"
- Server actions: reorderLayoutSections, reorderLayoutFields, addFieldToLayout, removeLayoutField, updateLayoutFieldSpan, addSection

## MODULE_TO_SOURCE Mapping (from actions.ts)
- uw_deal -> unified_deal
- property -> property
- uw_property -> property
- uw_borrower -> borrower
- contact_profile -> contact
- borrower_profile -> borrower
- borrower_entity -> borrower
- company_info -> company
- loan_details -> loan

## Gotchas
- Tabs on deal detail are hard-coded (not from layout system yet)
- section_type="system" sections are hard-coded components (Documents, Tasks, etc.) - NOT editable in inline editor
- section_type="fields" sections are layout-driven and editable
- Layout is universal (no card_type_id scoping) - Condition Matrix handles per-deal-type visibility
- dnd-kit uses prefixed IDs: section:, field:, palette:, dropzone:

## Last Updated: 2026-03-14
## Next Steps: Build Phase 1 components
