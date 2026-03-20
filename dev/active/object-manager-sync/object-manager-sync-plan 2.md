# Object Manager -> Deal Sync - Implementation Plan

## Objective
Make the Object Manager (field_configurations) the single source of truth for ALL field metadata displayed on pipeline deal pages. Currently, PropertyTab, ContactsTab, and parts of EditableOverview use stale inline field definitions cached in card types instead of resolving from field_configurations at runtime.

## Scope
- IN: PropertyTab, ContactsTab, EditableOverview, useResolvedCardType hook, cache invalidation from Object Manager actions
- IN: Card type editor changes to stop caching inline field definitions
- OUT: FinancialsTab and CommercialUnderwritingTab (these are specialized spreadsheet-like UIs, not field-driven; will audit but likely no changes)
- OUT: Schema migrations (all needed columns already exist)
- OUT: ConditionsTab, DocumentsTab, DealActivityTab (not field-driven)

## Approach

### Phase 1: useResolvedCardType already resolves all three field types
Good news: the hook ALREADY resolves property_field_refs and contact_field_refs (lines 125-136). The issue is that PropertyTab and ContactsTab don't USE the resolved card type.

### Phase 2: Migrate PropertyTab and ContactsTab
- PropertyTab: Accept resolved card type (parent already resolves it), use cardType.property_fields from resolved output
- ContactsTab: Same pattern, use resolved cardType.contact_fields
- Both tabs currently build fieldMap from cardType.property_fields / cardType.contact_fields directly
- After resolution, these arrays are already populated from field_configurations, so the tabs just need to receive the resolved cardType

### Phase 3: Wire the parent deal page
The deal detail page must pass the resolved cardType to PropertyTab and ContactsTab. Currently EditableOverview calls useResolvedCardType but the parent may pass the raw cardType to other tabs.

### Phase 4: Cache invalidation
Object Manager server actions (updateFieldConfig, createField, archiveField, etc.) need to call publishObjectChanges which revalidates pipeline pages. The client-side caches (uwFieldConfigCache) have a 5-min TTL which is acceptable, but we should also invalidate when the Object Manager "Publish" button is used.

### Phase 5: Card type editor - stop snapshotting inline fields
When saving card types, stop writing uw_fields/property_fields/contact_fields if corresponding field_refs exist. This prevents stale cached labels.

## Files to Modify
- `components/pipeline-v2/tabs/PropertyTab.tsx` - use resolved card type
- `components/pipeline-v2/tabs/ContactsTab.tsx` - use resolved card type
- `app/(authenticated)/admin/pipeline-v2/[id]/page.tsx` (or equivalent) - pass resolved cardType to all tabs
- `hooks/useResolvedCardType.ts` - minor: ensure it returns loading state
- `app/(authenticated)/control-center/object-manager/actions.ts` - add pipeline revalidation to publish
- `app/(authenticated)/control-center/card-types/CardTypeManagerView.tsx` - stop writing inline fields when refs exist

## Database Changes
None required. All columns exist.

## Risks
- Card types with no field_refs will fall back to inline fields (backwards compat already works)
- Some card types may have field_refs for UW but not property/contacts. The hook handles this (falls back per array).

## Success Criteria
1. Editing a field label in Object Manager immediately reflects on deal detail pages after revalidation
2. PropertyTab renders fields from field_configurations, not inline snapshots
3. ContactsTab renders fields from field_configurations, not inline snapshots
4. No TypeScript build errors
5. Backward compatibility: card types without field_refs still work
