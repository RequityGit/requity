# Income Tab Redesign - Implementation Plan

## Objective
Restructure the Income sub-tab within Underwriting to add a Unit Mix summary (auto-populated from rent roll), reorder sections for speed (Unit Mix > Ancillary > Income Summary), and rename the mode tabs to "Income Overview" and "Rent Roll."

## Scope
- IN: Income sub-tab layout, new Unit Mix component, tab rename, section reorder, market rent write-back from Unit Mix to rent roll, MHC-specific grouping
- OUT: Pro Forma tab, Expenses tab, Capital Stack tab, Google Sheets sync logic, T12/Historical tab

## Current Architecture
- UnderwritingTab.tsx renders sub-tabs: Pro Forma, Income, Expenses, Capital Stack
- Income tab renders T12SubTab with initialView="income"
- T12SubTab shows "Manual Entry" / "Upload & Map" pill toggle
- "Manual Entry" mode shows: IncomeCard (GPR, Ancillary, Less Vacancy, Less Concessions, EGI) + AncillaryIncomeSection
- "Upload & Map" mode shows: file upload dropzone for P&L import
- Rent roll lives separately in FinancialsTab > RentRollSubTab
- No Unit Mix concept exists today

## Target Architecture

### Tab Rename
- "Manual Entry" becomes "Income Overview"
- "Upload & Map" becomes "Rent Roll"

### Income Overview Layout (top to bottom)
1. **Unit Mix Summary** (NEW) - Groups rent roll by unit type, shows occupancy, effective rents, editable market rents
2. **Other / Ancillary Income** (existing AncillaryIncomeSection, moved up)
3. **Income Summary** (existing IncomeCard with GPR, Ancillary, Less Vacancy, Less Concessions, EGI, moved to bottom)

### Rent Roll Tab Layout
- Manual entry table + Add Units button + Edit dialog
- Upload & Parse button (opens UploadRentRollDialog)
- Summary metrics bar (total units, occupancy, monthly rent, loss-to-lease)

## Approach

### Phase 1: Unit Mix Component + Data Plumbing
- Create UnitMixSection.tsx component
- Add UnitMixGroup TypeScript interface
- Add updateMarketRentByUnitType server action
- Pass rentRoll data into Income sub-tab via UnderwritingTab props

### Phase 2: Tab Restructure
- Replace "Manual Entry"/"Upload & Map" pills with "Income Overview"/"Rent Roll"
- Income Overview mode: render UnitMix > Ancillary > IncomeCard
- Rent Roll mode: bring in RentRollSubTab content (table + upload + metrics)

### Phase 3: Polish + GPR Bridge
- Ensure GPR in Income Summary reflects live rent roll totals
- Market rent changes in Unit Mix trigger optimistic update of summary
- MHC-specific grouping (Occupied TOH, Occupied POH, Vacant POH, Vacant Lot)
- Property-type-aware grouping (multifamily = bed/bath, office = SF ranges, MHC = TOH/POH/Lot)
- Empty states when no rent roll uploaded

## Files to Modify

### New Files
- components/pipeline/tabs/financials/UnitMixSection.tsx
- lib/commercial-uw/unit-mix-utils.ts (grouping logic, type normalization)

### Modified Files
- components/pipeline/tabs/financials/T12SubTab.tsx (tab rename, layout reorder, rent roll data prop)
- components/pipeline/tabs/UnderwritingTab.tsx (pass rentRoll to T12SubTab)
- components/pipeline/tabs/financials/RentRollSubTab.tsx (adapt for embedding in Income tab)
- app/(authenticated)/(admin)/pipeline/[id]/commercial-uw-actions.ts (batch market rent update action)
- lib/commercial-uw/types.ts (UnitMixGroup interface)

## Database Changes
- No schema changes required. Unit Mix is computed from existing deal_commercial_rent_roll rows.
- Market rent write-back uses existing market_rent column on rent roll rows.

## Unit Mix Grouping Logic

```
For multifamily:
  key = normalize(beds_type) OR "${bedrooms}BR/${bathrooms}BA"

For MHC (mobile_home_park):
  key = status + poh_indicator -> "Occupied TOH", "Occupied POH", "Vacant POH", "Vacant Lot"

For office/retail/industrial:
  key = tenant_name or space grouping by SF range

Per group:
  unitCount, occupiedCount, occupancyPct
  avgEffectiveRent (avg current_rent of occupied)
  marketRent (editable, init from avg market_rent)
  annualAtCurrent = occupiedCount x avgEffectiveRent x 12
  annualAtMarket = unitCount x marketRent x 12
```

## Data Flow
```
Rent Roll (source of truth)
  -> Unit Mix (computed read, market rent editable)
  -> Market rent edit writes back to matching rent roll rows
  -> Income Summary GPR = sum of all unit rents from rent roll
  -> Ancillary income adds on top
  -> Vacancy/Concessions deducted
  -> EGI = final number
```

## Risks
1. GPR is currently a static t12_amount row, not computed from rent roll. Phase 3 bridges this.
2. beds_type is free-text from uploads. Need normalization (e.g., "2 bed / 2 bath" == "2BR/2BA").
3. Property-type-specific grouping adds complexity. Start with multifamily + MHC.

## Success Criteria
1. Income tab shows "Income Overview" and "Rent Roll" as the two modes
2. Unit Mix auto-populates from uploaded/entered rent roll
3. Editing market rent in Unit Mix batch-updates matching rent roll rows
4. Income Summary (GPR -> EGI) sits at bottom as final rollup
5. Upload/parse and manual entry still work on Rent Roll tab
6. Build passes with no new TypeScript errors
