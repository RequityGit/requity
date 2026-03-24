# Object Manager -> Deal Sync - Context

## Key Files Modified
- `app/(authenticated)/admin/pipeline-v2/[id]/DealDetailPage.tsx` - Added parent-level field resolution via `useResolvedCardType`
- `components/pipeline-v2/EditableOverview.tsx` - Removed duplicate `useResolvedCardType` call (parent handles it)
- `components/pipeline-v2/UnderwritingPanel.tsx` - Removed duplicate `useResolvedCardType` call (parent handles it)
- `app/(authenticated)/control-center/object-manager/actions.ts` - Added pipeline revalidation paths + UW modules to route map
- `app/(authenticated)/control-center/card-types/CardTypeManagerView.tsx` - Clears inline fields when field_refs exist on save

## Key Files NOT Modified (no changes needed)
- `components/pipeline-v2/tabs/PropertyTab.tsx` - Already consumes `cardType.property_fields` correctly
- `components/pipeline-v2/tabs/ContactsTab.tsx` - Already consumes `cardType.contact_fields` correctly
- `hooks/useResolvedCardType.ts` - Already resolves all three field arrays (uw, property, contact)
- `lib/pipeline/resolve-card-type-fields.ts` - Resolution logic already complete

## Decisions Made
1. Single resolution point at DealDetailPage parent level rather than per-tab resolution
2. FinancialsTab and CommercialUnderwritingTab are NOT field-driven from field_configurations (they use specialized UW tables). No changes needed.
3. Card type editor now clears inline arrays when refs exist, forcing runtime resolution. This prevents stale labels.
4. Server-side revalidation (revalidatePath) is sufficient for cache busting. Client-side 5-min TTL is acceptable since page navigation triggers fresh server fetches.

## Gotchas Discovered
- `useResolvedCardType` was being called both in the parent (DealDetailPage) and in children (EditableOverview, UnderwritingPanel). This caused double-fetching of field_configurations. Now only the parent calls it.
- The `VisibilityContext` type import is still needed in EditableOverview and UnderwritingPanel (used in their props interface), even though `useResolvedCardType` was removed.

## Architecture After This Change
```
field_configurations (DB) -- source of truth
       |
       v
useResolvedCardType(rawCardType, visibilityCtx) -- called ONCE in DealDetailPage
       |
       v
resolved cardType (uw_fields, property_fields, contact_fields all hydrated)
       |
       +---> EditableOverview (Overview tab)
       +---> PropertyTab (Property tab)
       +---> ContactsTab (Contacts tab)
       +---> UnderwritingPanel (Underwriting tab)
       +---> FinancialsContent (Financials tab - doesn't use field arrays)
       +---> DealSidebar
```

## Last Updated: 2026-03-12
## Status: COMPLETE - ready for testing
