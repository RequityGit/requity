# Condition Matrix Consolidation - Implementation Plan

## Objective
Eliminate card types as a field selector. The Condition Matrix (visibility_condition on field_configurations) becomes the single source of truth for which fields appear on a deal, and the Object Manager Page Layout controls where they appear.

## Scope
- IN: EditableOverview, UnderwritingPanel, PropertyTab, ContactsTab - all switch from card-type-ref-driven to condition-matrix-driven field resolution
- IN: useDealLayout loses card_type_id scoping (universal deal_detail layout)
- IN: New useUwFieldConfigs hook replaces useResolvedCardType for field resolution
- OUT: Card Types editor cleanup (removing field tabs) - separate follow-up
- OUT: Populating the page layout with sections/fields - admin task via Object Manager
- OUT: Removing legacy uw_field_refs columns from unified_card_types

## Approach

### Phase 1: New Hook - useUwFieldConfigs
Create a hook that fetches ALL field_configurations for uw_deal, uw_property, uw_borrower modules, applies visibility_condition filtering, and returns a Map<field_key, UwFieldDef>. This replaces the card-type-ref resolution step entirely.

### Phase 2: Update useDealLayout
Remove the cardTypeId parameter. All deal_detail sections are universal (card_type_id = null). The condition matrix handles per-deal-type differentiation.

### Phase 3: Update EditableOverview
Replace useResolvedCardType with useUwFieldConfigs. Build uwFieldMap from all visibility-filtered field configs. Page layout sections drive grouping. Keep detail_field_groups fallback temporarily for deals without layout data.

### Phase 4: Update UnderwritingPanel
Same pattern - derive fields from useUwFieldConfigs, group by module (uw_deal, uw_property, uw_borrower → deal, property, borrower objects).

### Phase 5: Update PropertyTab and ContactsTab
Use useUwFieldConfigs filtered to uw_property and uw_borrower respectively.

### Phase 6: Build and verify

## Files to Modify
- `apps/requity-os/hooks/useUwFieldConfigs.ts` (NEW)
- `apps/requity-os/hooks/useDealLayout.ts`
- `apps/requity-os/components/pipeline-v2/EditableOverview.tsx`
- `apps/requity-os/components/pipeline-v2/UnderwritingPanel.tsx`
- `apps/requity-os/components/pipeline-v2/tabs/PropertyTab.tsx`
- `apps/requity-os/components/pipeline-v2/tabs/ContactsTab.tsx`

## Database Changes
None required. Existing tables and columns are sufficient. The condition matrix visibility_condition is already populated.

## Risks
- Page layout for deal_detail may have 0 sections currently (Object Manager shows "Page Layout: 0"). The detail_field_groups fallback handles this during transition.
- Field keys must be unique across uw_deal, uw_property, uw_borrower modules for the flat uwFieldMap to work. This is already true by convention.

## Success Criteria
- Deal overview/underwriting/property/contacts tabs render fields based on condition matrix visibility, not card type refs
- Object Manager page layout drives section grouping for deals
- Card type field ref tabs become irrelevant (can be removed later)
- No regressions in field display, editing, or saving
