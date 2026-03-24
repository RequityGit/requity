# Field System Cleanup - Context

## Key Files Modified

### Phase 1 (Migration)
- Supabase migration `seed_field_dropdown_options` - Seeds dropdown_options for 10 fields, creates uw_deal.loan_type and company_info.subtype, updates company_info.company_type to multi_select

### Phase 2 (Fallback Removal)
- `components/crm/shared-field-renderer.tsx` - Removed DROPDOWN_FALLBACKS (7 fields), FIELD_TYPE_OVERRIDES, unused CRM_COMPANY_TYPES/SUBTYPES imports. Added multi_select to FC_TYPE_TO_CRM.
- `hooks/useUwFieldConfigs.ts` - Removed DROPDOWN_FALLBACKS for loan_purpose. Simplified toUwFieldDef to use only DB options.
- `control-center/object-manager/_components/ConditionEditorModal.tsx` - Removed hardcoded loan_type array. Now pulls from field.dropdown_options with format normalization.

### Phase 3 (Edit Flow)
- `control-center/object-manager/ObjectManagerView.tsx` - Removed draft props from FieldsTab and FieldConfigPanel. Uses fields directly instead of displayFields.
- `control-center/object-manager/_components/FieldConfigPanel.tsx` - Added useToast, broadcastFieldConfigInvalidation. Shows "Saved at X" instead of "Changes saved as draft".

### Phase 4 (Cache)
- `hooks/useFieldConfigurations.ts` - TTL 5min->30sec. Added FIELD_CONFIG_INVALIDATE_EVENT listener, broadcastFieldConfigInvalidation() export.
- `hooks/useUwFieldConfigs.ts` - TTL 5min->30sec. Added FIELD_CONFIG_INVALIDATE_EVENT listener.
- `control-center/object-manager/_components/FieldsTab.tsx` - Added broadcastFieldConfigInvalidation() calls after create, archive, condition update.

## Decisions Made
- Kept draft system intact for Layout tab (only removed from Fields tab usage)
- Used custom DOM events for cache invalidation (simplest cross-component communication without adding a state management library)
- Reduced TTL to 30 seconds as a safety net even if invalidation event doesn't fire
- ConditionEditorModal now handles both string[] and {label,value}[] formats for dropdown_options
- company_info.company_type changed to field_type='multi_select' in DB to match previous FIELD_TYPE_OVERRIDES behavior

## Gotchas Discovered
- UW modules use string[] format for dropdown_options, CRM modules use {label,value}[] format. This inconsistency is preserved to avoid breaking existing data.
- uw_deal.loan_purpose had string[] format in DB already. Newly seeded uw_deal.loan_type also uses string[] to match.
- The ConditionEditorModal's getOptionsForCondition was casting dropdown_options as string[] but needed to handle {label,value}[] too.
- 13 pre-existing TS errors exist in unrelated files (pricing, contacts, UnderwritingTab). None caused by our changes.

## Dependencies
- No remaining blockers
- Manual testing needed on live portal

## Last Updated: 2026-03-14
## Status: Implementation complete. Manual testing remaining.
