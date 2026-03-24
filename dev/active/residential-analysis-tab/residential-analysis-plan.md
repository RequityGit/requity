# Residential Analysis Tab - Implementation Plan

## Objective
Build a production-quality "Analysis" tab for residential deals (RTL/Fix & Flip, DSCR, future GUC) that matches the commercial "Underwriting" tab's design standard. The tab is data-driven by a loan_programs system supporting up to 8 programs loaded from rate sheets.

## Scope
- IN: ResidentialAnalysisTab component with 4 sub-tabs (Deal Analysis, Borrower & Eligibility, Costs & Returns, Comp Analysis), computation engine, program selector, loan sizing waterfall, wiring into DealDetailPage
- IN: Both "Underwriting" (commercial) and "Analysis" (residential) tabs visible on ALL deals during build-out for QA
- IN: Data-driven program architecture (loan_programs table concept, selectedProgram state)
- OUT: Rate sheet upload UI (Sprint 2+), full comp analysis integration, GUC-specific sections, dual-scenario RTL+DSCR view
- OUT: Database migration for loan_programs table (will seed mock data client-side for Sprint 1)

## Approach

### Sprint 1 (Current): Deal Analysis tab + computation engine
1. Create computation engine (lib/residential-uw/computations.ts + types.ts)
2. Build ResidentialAnalysisTab.tsx shell with 4-tab layout matching commercial tab's pill nav pattern
3. Build DealAnalysisSection.tsx with:
   - KPI strip (LTV, LTC, Max Loan, Rate, Net Profit, Ann ROI for RTL; LTV, DSCR, Loan Amount, Rate, Rent, Cash Flow for DSCR)
   - Program selector dropdown (reads from programs array, expandable to 8)
   - Loan sizing waterfall (min of LTV, LTC, LTP with binding constraint)
   - Program terms summary
   - Leverage adjusters (when Balance Sheet type program selected)
4. Wire into DealDetailPage as "Analysis" tab, visible on all deals

### Sprint 2: Costs & Returns + Borrower & Eligibility
- Holding cost calculator, exit P&L, DSCR cash flow analysis
- Borrower profile fields, eligibility checklist with pass/fail
- loan_programs database table + seed migration
- Rate sheet upload (control center page)

### Sprint 3: Comp Analysis + Polish
- Comp grid with adjustments
- ARV confidence scoring
- Program comparison matrix view
- GUC placeholders
- Dual-scenario foundation

## Files to Create
- lib/residential-uw/types.ts - TypeScript interfaces for programs, deal inputs, computed outputs
- lib/residential-uw/computations.ts - All calculation functions matching Google Sheet formulas
- components/pipeline/tabs/ResidentialAnalysisTab.tsx - Main shell with 4-tab layout
- components/pipeline/tabs/residential/DealAnalysisSection.tsx - Deal Analysis tab content
- components/pipeline/tabs/residential/BorrowerEligibilitySection.tsx - Placeholder
- components/pipeline/tabs/residential/CostsReturnsSection.tsx - Placeholder
- components/pipeline/tabs/residential/CompAnalysisSection.tsx - Placeholder

## Files to Modify
- app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage.tsx - Add "Analysis" tab for all deals

## Database Changes (Sprint 1: None)
Sprint 1 uses client-side mock program data. Sprint 2 introduces loan_programs table.

## Program Architecture
- Up to 8 programs over time (RTL Premier, RTL Balance Sheet, DSCR Standard, DSCR No-Ratio, GUC, etc.)
- Each program defines: name, type (rtl|dscr|guc), interest_rate, origination_pts, max_ltv, max_ltc, max_ltp, min_fico, min_experience, citizenship_req, entity_req, appraisal_req, adjuster_definitions[]
- Programs are selected per-deal; comparison view shows all eligible programs side by side
- Rate sheets upload populates/updates program rows (Sprint 2+)

## Risks
- uw_data JSONB may not have all residential fields populated for existing deals (graceful fallback to 0/empty)
- Commercial UW data loader (commercialUWData) won't have residential-specific data; need separate data path or reuse uw_data
- Field configurations may need new residential-specific field_keys

## Success Criteria
- Analysis tab appears on all deals alongside Underwriting tab
- Deal Analysis sub-tab renders KPI strip, program selector, loan sizing waterfall
- Computations match the Google Sheet RTL UW model formulas
- TypeScript compiles clean
- Both light and dark mode work
