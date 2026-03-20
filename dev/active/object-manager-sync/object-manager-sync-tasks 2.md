# Object Manager -> Deal Sync - Tasks

## Phase 1: Wire resolved cardType through deal detail page
- [x] Added `useResolvedCardType` import to DealDetailPage.tsx
- [x] Renamed prop to `rawCardType`, called `useResolvedCardType(rawCardType, visibilityContext)` at parent level
- [x] All child tabs (PropertyTab, ContactsTab, EditableOverview, UnderwritingPanel, etc.) now receive resolved cardType

## Phase 2: Fix PropertyTab
- [x] No code changes needed. PropertyTab reads `cardType.property_fields` which is now resolved by the parent.

## Phase 3: Fix ContactsTab
- [x] No code changes needed. ContactsTab reads `cardType.contact_fields` which is now resolved by the parent.

## Phase 4: Remove duplicate resolution from child components
- [x] EditableOverview: removed internal `useResolvedCardType` call (was duplicating parent's work)
- [x] UnderwritingPanel: removed internal `useResolvedCardType` call (was duplicating parent's work)
- [x] Removed unused `useResolvedCardType` imports from both files

## Phase 5: Cache invalidation
- [x] Added `/admin/pipeline-v2` revalidation to `revalidate()` helper in object-manager/actions.ts
- [x] Added `uw_deal`, `uw_property`, `uw_borrower` to `pageRouteMap` in `publishObjectChanges()`
- [x] Server-side revalidation ensures fresh data on next page load after Object Manager changes

## Phase 6: Card type editor cleanup
- [x] Updated `handleSave()` in CardTypeManagerView to clear inline fields when field_refs exist
- [x] When `uw_field_refs` has entries, saves `uw_fields: []` (runtime resolution handles hydration)
- [x] Same for `property_fields` and `contact_fields`
- [x] Backward compat preserved: card types without refs still save inline fields

## Phase 7: Build verification
- [x] TypeScript check passed (only pre-existing env errors from missing react/next types in tsc standalone mode)
- [x] No unused imports or new errors from our changes

## Blockers
- None

## Last Updated: 2026-03-12
