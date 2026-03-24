# Condition Matrix Consolidation - Tasks

## Phase 1: New Hook
- [x] Create useUwFieldConfigs hook
- [x] Fetch all field_configurations for uw_deal, uw_property, uw_borrower
- [x] Apply visibility_condition filtering via isVisible()
- [x] Convert to UwFieldDef format using mapFieldType
- [x] Cache with 5-minute TTL (same pattern as existing hooks)
- [x] Return Map<field_key, UwFieldDef> + array by module + byObject grouping

## Phase 2: Update useDealLayout
- [x] Remove cardTypeId parameter
- [x] Fetch all deal_detail sections (no card_type_id filtering)

## Phase 3: Update EditableOverview
- [x] Replace useResolvedCardType with useUwFieldConfigs
- [x] Build uwFieldMap from hook output
- [x] Keep layout-driven sections as primary
- [x] Keep detail_field_groups fallback temporarily

## Phase 4: Update UnderwritingPanel
- [x] Replace useResolvedCardType with useUwFieldConfigs
- [x] Group fields by module (byObject) for object sections

## Phase 5: Update PropertyTab and ContactsTab
- [x] Update PropertyTab to use visibility-filtered uw_property fields
- [x] Update ContactsTab to use visibility-filtered uw_borrower fields
- [x] Pass visibilityContext from DealDetailPage to both tabs

## Phase 6: Build and Verify
- [x] Run pnpm build - passes clean
- [x] No linter errors

## Phase 7: Backfill field_configurations from card type inline fields
- [x] Extract all unique field keys from card types' inline uw_fields
- [x] Insert 78 missing fields into field_configurations (130 total now)
- [x] Correctly map modules (uw_deal, uw_property, uw_borrower) and types

## Phase 8: Universal page layout sections
- [x] Delete old card-type-scoped sections and their fields
- [x] Create 11 universal sections (Deal Summary, Loan Terms, Property, Property Financials, Acquisition & Rehab, Borrower, Fees & Costs, Capital & Funding, Exit Strategy, Key Dates, Team & Third Parties)
- [x] Assign all 127 field_configurations to appropriate sections via page_layout_fields

## Phase 9: Remove card type field ref tabs
- [x] Remove Overview Tab, Property Tab, Contacts Tab, UW Fields tabs from CardTypeManagerView
- [x] Remove uw_field_refs/property_field_refs/contact_field_refs from saveCardType payload

## Phase 10: Remove useResolvedCardType
- [x] Delete hooks/useResolvedCardType.ts
- [x] Delete lib/pipeline/resolve-card-type-fields.ts
- [x] Verify no remaining imports in code

## Phase 11: Build and verify
- [x] pnpm build passes clean (all 3 packages)
- [x] No linter errors on modified files

## Phase 12: Expand visibility engine to asset-class-driven architecture
- [x] Replace two-axis (Residential/Commercial x loan_type) with granular asset classes
- [x] Add 5 asset classes: residential_1_4, multifamily, mhc, rv_campground, commercial
- [x] Add flexible `conditions` system for secondary filters (loan_type, loan_purpose, etc.)
- [x] Create normalizeAssetClass() to map DB values to visibility values
- [x] Remove AXIS_COMBINATIONS and mapAssetClassToVisibility
- [x] Update isVisible() to evaluate asset_class + conditions
- [x] Update DealDetailPage to pass raw asset_class + dealValues context
- [x] Update useUwFieldConfigs and useFieldConfigurations ctxKey
- [x] Rewrite ConditionEditorModal with asset class toggles + "Add Condition" UI
- [x] Rewrite ConditionMatrixTab to show asset class columns + conditions badge
- [x] Update ConditionBadge for new shape
- [x] DB migration: convert existing visibility_condition data to new format
- [x] pnpm build passes clean
- [x] No linter errors

## Blockers
- None

## Last Updated: 2026-03-13
