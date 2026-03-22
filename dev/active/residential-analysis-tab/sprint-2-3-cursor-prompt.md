# Residential Analysis Tab - Sprint 2 & 3 Cursor Prompt

Copy everything below the line into Cursor as a single prompt.

---

## Context

We are building the residential underwriting "Analysis" tab for RequityOS (our deal pipeline at app.requitygroup.com). Sprint 1 is complete and live: the Deal Analysis sub-tab works with program selection, loan sizing waterfall, leverage adjusters, KPI strip, and both RTL and DSCR views.

The Analysis tab lives at `apps/requity-os/components/pipeline/tabs/ResidentialAnalysisTab.tsx` and has 4 sub-tabs via PillNav: Deal Analysis, Borrower & Eligibility, Costs & Returns, Comp Analysis. The last three are currently placeholders. Your job is to build them out.

## Critical References (READ THESE FIRST)

1. **Design mockup**: `residential-uw-mockup.jsx` in the repo root. This is the approved design target. Match the layout, content, and structure exactly.
2. **Computation engine** (already built, use these functions):
   - `lib/residential-uw/computations.ts` - Pure functions: `computeHoldingCosts`, `computeExitAnalysis`, `computeDSCRAnalysis`, `computeLoanSizing`, `computeAdjustedLimits`
   - `lib/residential-uw/types.ts` - All interfaces: `ResidentialDealInputs`, `LoanProgram`, `HoldingCosts`, `ExitAnalysis`, `DSCRAnalysis`, `LoanSizingResult`, `MOCK_PROGRAMS`
3. **Shared UI components** (already built, import and use these):
   - `components/pipeline/tabs/financials/shared.tsx` - `SectionCard`, `MetricBar`, `TableShell`, `TH`, `PillNav`, `fmtCurrency`, `fmtPct`, `n`
4. **CLAUDE.md** at repo root - Contains all design system rules, CSS classes, and coding standards. Read it.
5. **Existing Sprint 1 implementation** for pattern reference:
   - `components/pipeline/tabs/residential/DealAnalysisSection.tsx` - Shows exactly how to use shared components, computation engine, and styling

## Design System Rules (MANDATORY)

- Use shadcn/ui primitives only (Button, Select, Input, etc.)
- Use global CSS classes: `.inline-field`, `.inline-field-label`, `.rq-td`, `.rq-th`, `.rq-section-title`, `.rq-micro-label`, `.rq-value-positive`, `.rq-value-negative`, `.rq-value-warn`, `.rq-total-row`, `.rq-subtotal-row`, `.rq-empty-state`, `.num`
- Import `cn` from `@/lib/utils` for conditional classNames
- Import icons from `lucide-react`
- No navy, no gold, no serifs, no bounce animations, no emoji
- All financial numbers use `.num` class (tabular-nums)
- Positive values: `rq-value-positive`, negative: `rq-value-negative`, warning: `rq-value-warn`
- Negative cost values displayed as `(${amount})` in parentheses
- Light and dark mode must both work (use semantic Tailwind classes)

## Sprint 2, Task 1: BorrowerEligibilitySection.tsx

**File**: `components/pipeline/tabs/residential/BorrowerEligibilitySection.tsx`

**Props needed** (update ResidentialAnalysisTab.tsx to pass these):
```typescript
interface BorrowerEligibilitySectionProps {
  dealInputs: ResidentialDealInputs;
  selectedProgram: LoanProgram;
}
```

**Layout**: 2-column grid (`grid grid-cols-1 md:grid-cols-2 gap-4`)

**Left Column: Borrower Profile** (SectionCard with Users icon)
Display these fields as read-only rows (label left, value right, separated by light border-b):
- Credit Score (FICO) - from `dealInputs.fico_score`
- Real Estate Experience - from `dealInputs.real_estate_experience_years` (display as "X years")
- Citizenship / Residency - from `dealInputs.is_us_citizen` (display "US Citizen" or "Non-US")
- Entity Type - hardcode "LLC" for now (Sprint 3 will add entity fields)
- Liquidity Verified - from `dealInputs.liquid_reserves` (format as currency)
- Net Worth - from `dealInputs.net_worth` (format as currency)

Each row: `flex justify-between items-center py-2.5 border-b border-border last:border-0`. Label is `text-[13px] text-muted-foreground`, value is `text-[13px] font-medium num` (for numbers).

**Right Column: Eligibility Check** (SectionCard with ShieldCheck icon)
Header should show program name and a pass/fail badge.

Create an eligibility checklist array based on the selected program's requirements:
```typescript
const checks = [
  {
    label: "Minimum Credit Score",
    requirement: selectedProgram.min_fico ? `${selectedProgram.min_fico} FICO` : "None",
    actual: dealInputs.fico_score?.toString() || "N/A",
    pass: !selectedProgram.min_fico || (dealInputs.fico_score || 0) >= selectedProgram.min_fico,
  },
  {
    label: "Minimum Experience",
    requirement: selectedProgram.min_experience_years ? `${selectedProgram.min_experience_years}+ years` : "None",
    actual: dealInputs.real_estate_experience_years ? `${dealInputs.real_estate_experience_years} years` : "N/A",
    pass: !selectedProgram.min_experience_years || (dealInputs.real_estate_experience_years || 0) >= selectedProgram.min_experience_years,
  },
  {
    label: "Citizenship",
    requirement: selectedProgram.citizenship_required === "us_citizen" ? "US Citizen" : selectedProgram.citizenship_required === "permanent_resident" ? "US Citizen / PR" : "Any",
    actual: dealInputs.is_us_citizen ? "US Citizen" : "Non-US",
    pass: selectedProgram.citizenship_required === "any" || dealInputs.is_us_citizen === true,
  },
  {
    label: "Entity Required",
    requirement: selectedProgram.entity_type === "llc" ? "LLC" : selectedProgram.entity_type === "corp" ? "Corporation" : "LLC / Corp",
    actual: "LLC", // hardcoded for now
    pass: true,
  },
  {
    label: "Appraisal",
    requirement: selectedProgram.appraisal_required ? "Full Appraisal Required" : "BPO Accepted",
    actual: "Pending",
    pass: true, // informational only
  },
];
```

Each check row: icon (CheckCircle green or XCircle red from lucide-react, 24x24 rounded container with bg-emerald-50/bg-red-50 dark:bg-emerald-950/dark:bg-red-950), label + requirement subtitle, actual value right-aligned.

Header badge: count passing checks. If all pass, show green badge "All Passed" with CheckCircle icon. If any fail, show red badge "X Failed" with AlertTriangle icon.

## Sprint 2, Task 2: CostsReturnsSection.tsx

**File**: `components/pipeline/tabs/residential/CostsReturnsSection.tsx`

**Props needed** (update ResidentialAnalysisTab.tsx to pass these):
```typescript
interface CostsReturnsSectionProps {
  dealInputs: ResidentialDealInputs;
  dealType: DealType;
  selectedProgram: LoanProgram;
  activeAdjusterKeys: string[];
}
```

This section renders DIFFERENTLY based on dealType.

### RTL (Fix & Flip) Layout: 2-column grid

**Left Column: Project Costs** (SectionCard with DollarSign icon)
Use TableShell with grouped cost rows:

Group 1: ACQUISITION (use `rq-micro-label` for group header spanning full row)
- Purchase Price: `dealInputs.purchase_price`
- Rehab Budget: `dealInputs.rehab_budget`
- **Total Basis** (subtotal row, `rq-subtotal-row`): purchase + rehab

Group 2: LOAN COSTS
- Origination Fee (show pts %): computed from `loanSizing.effective_origination_fee`
- Legal / Doc Prep: estimate $1,500
- Title / Closing / Escrow: estimate $2,000

Group 3: HOLDING COSTS (show "X MO" in header from `holdingCosts.total_holding_period`)
- Interest: `holdingCosts.monthly_interest` x months = total
- Insurance: from `dealInputs.annual_insurance / 12` x months
- Property Taxes: from `dealInputs.annual_property_tax / 12` x months
- Utilities: `holdingCosts.monthly_utilities` x months

**Total Project Cost** (`rq-total-row`, bold, larger font): sum of all above

Compute these using the existing computation functions:
```typescript
const loanSizing = computeLoanSizing(dealInputs, selectedProgram, activeAdjusterKeys);
const holdingCosts = computeHoldingCosts(dealInputs, loanSizing.max_loan, selectedProgram);
const exitAnalysis = computeExitAnalysis(dealInputs, loanSizing.max_loan, holdingCosts, selectedProgram);
```

**Right Column: Exit & Returns** (stacked: Exit Analysis card + Profit Summary card)

Exit Analysis card (SectionCard with TrendingUp icon):
- Projected Sale Price: `exitAnalysis.gross_sale_proceeds`
- Disposition Costs (show %): `exitAnalysis.sales_disposition_cost` (red, in parens)
- **Net Sale Proceeds** (subtotal): `exitAnalysis.net_proceeds`
- Less: Total Project Cost (red, in parens)

Profit Summary card (conditionally styled green/red based on net_profit sign):
Use `rounded-xl border p-5` with conditional bg: `bg-emerald-50/5 border-emerald-200/20 dark:bg-emerald-950/20 dark:border-emerald-800/30` for positive, red equivalent for negative.
- **Net Profit**: large number, `text-2xl font-bold num`, colored positive/negative
- 3-column grid below:
  - Cash Invested: `exitAnalysis.total_cost_basis - loanSizing.max_loan` (approximate)
  - ROI: `exitAnalysis.borrower_roi`%
  - Annualized ROI: `exitAnalysis.annualized_roi`%

Below that, a dashed-border placeholder card for "Dual Scenario: Bridge + DSCR Takeout" (Sprint 3 feature). Text only, no functionality. Use `border-dashed border-border text-center py-6`:
- Title: "Dual Scenario: Bridge + DSCR Takeout"
- Subtitle: "Model a stabilized rental takeout alongside this fix & flip"
- Disabled button: "Add DSCR Takeout Scenario" (Coming Soon)

### DSCR (Rental) Layout: 2-column grid

**Left Column: Annual Cash Flow** (SectionCard with BarChart3 icon)
Use TableShell with 3 columns: Item | Monthly | Annual

Rows:
- Gross Rental Income (green): `dscrAnalysis.monthly_rent` | x12
- Less: Vacancy (5%): `monthly_rent * 0.05` (muted, in parens) | x12
- **Effective Gross Income** (subtotal): rent * 0.95 | x12
- Property Taxes (in parens): from annual_property_tax / 12 | annual
- Insurance (in parens): from annual_insurance / 12 | annual
- Management (8%): `monthly_rent * 0.08` (in parens) | x12
- Maintenance Reserve: $100/mo (in parens) | $1,200/yr
- **Net Operating Income** (subtotal, bold): computed | x12
- Debt Service P&I (red, in parens): `dscrAnalysis.monthly_pi` | x12
- **Cash Flow After Debt** (total row, green bg): NOI - P&I | x12

Compute: `const dscrAnalysis = computeDSCRAnalysis(dealInputs, loanSizing.max_loan, selectedProgram);`

**Right Column: Return Metrics** (SectionCard with TrendingUp icon)
Display as stacked metric cards (each is a rounded-lg bg-muted/30 px-4 py-3 flex justify-between):
- Cash Invested: `purchase_price - loanSizing.max_loan + closing_costs_estimate`
- Annual Cash Flow: from computed value, colored
- Cash-on-Cash Return: `(annual_cash_flow / cash_invested) * 100`, colored (green if > 8%)
- Cap Rate: `(annual_NOI / purchase_price) * 100`
- DSCR: `dscrAnalysis.dscr` with "x" suffix, colored (green >= 1.25, amber < 1.25)

## Sprint 2, Task 3: Update ResidentialAnalysisTab.tsx

The parent component needs to pass additional props down to the new sections. Currently it only passes `dealInputs` and `dealType` context.

Add state and computation at the parent level that can be shared:
```typescript
// Add to existing state
const [selectedProgramId, setSelectedProgramId] = useState<string>(MOCK_PROGRAMS[0]?.id || "");
const [activeAdjusterKeys, setActiveAdjusterKeys] = useState<string[]>([]);

const selectedProgram = useMemo(
  () => MOCK_PROGRAMS.find((p) => p.id === selectedProgramId) || MOCK_PROGRAMS[0],
  [selectedProgramId]
);
```

BUT WAIT - DealAnalysisSection already manages its own `selectedProgramId` and `activeAdjusterKeys` state internally. To avoid duplicating state, you have two options:

**Option A (recommended)**: Lift the program selection state UP to ResidentialAnalysisTab so it's shared across all sub-tabs. This means:
1. Move `selectedProgramId`, `activeAdjusterKeys`, and `selectedProgram` state from DealAnalysisSection up to ResidentialAnalysisTab
2. Pass them down as props to DealAnalysisSection, BorrowerEligibilitySection, and CostsReturnsSection
3. Update DealAnalysisSection to accept these as props instead of managing internally

**Option B (simpler)**: Duplicate the state in each sub-tab (not recommended, leads to inconsistent program selection across tabs)

Go with Option A. Update DealAnalysisSection's interface to accept:
```typescript
interface DealAnalysisSectionProps {
  dealInputs: ResidentialDealInputs;
  dealType: DealType;
  onDealTypeChange?: (type: DealType) => void;
  selectedProgram: LoanProgram;
  onProgramChange: (programId: string) => void;
  activeAdjusterKeys: string[];
  onAdjusterKeysChange: (keys: string[]) => void;
}
```

Then update ResidentialAnalysisTab to render:
```tsx
{activeTab === "borrower" && (
  <BorrowerEligibilitySection
    dealInputs={dealInputs}
    selectedProgram={selectedProgram}
  />
)}

{activeTab === "costs" && (
  <CostsReturnsSection
    dealInputs={dealInputs}
    dealType={dealType}
    selectedProgram={selectedProgram}
    activeAdjusterKeys={activeAdjusterKeys}
  />
)}
```

## Sprint 3, Task 1: CompAnalysisSection.tsx

**File**: `components/pipeline/tabs/residential/CompAnalysisSection.tsx`

**Props**:
```typescript
interface CompAnalysisSectionProps {
  dealInputs: ResidentialDealInputs;
}
```

**Layout**: Stacked cards

**Card 1: Subject Property** (SectionCard with Home icon, accent border `border-primary`)
6-column grid of property details:
- Address: "Subject Property" (placeholder, will come from deal data later)
- Sqft: placeholder
- Beds / Baths: placeholder
- Year Built: placeholder
- Condition (Post-Rehab): placeholder
- Your ARV: `fmtCurrency(dealInputs.after_repair_value)`

For now, show an inline note: "Property details will auto-populate from the Property tab" in muted text.

**Card 2: Comparable Sales** (SectionCard with Building2 icon)
Header has an "Add Comp" button (`rq-action-btn-sm`).

For Sprint 3, use mock comp data (3 comps) to demonstrate the table layout:
```typescript
const MOCK_COMPS = [
  { address: "123 Oak Street", salePrice: 285000, saleDate: "2025-11-15", sqft: 1380, beds: 3, baths: 2, distance: "0.3 mi", condition: "Renovated", adj: 5000 },
  { address: "456 Maple Ave", salePrice: 272000, saleDate: "2025-10-22", sqft: 1450, beds: 3, baths: 2, distance: "0.5 mi", condition: "Good", adj: -3000 },
  { address: "789 Pine Blvd", salePrice: 295000, saleDate: "2025-12-01", sqft: 1520, beds: 4, baths: 2, distance: "0.8 mi", condition: "Excellent", adj: -8000 },
];
```

Table columns (TableShell): Address | Sale Price | Date | Sqft | $/Sqft | Beds | Baths | Distance | Condition | Adjustment | Adj. Value

- $/Sqft: computed `salePrice / sqft`
- Adjustment: positive green with +, negative red, zero shows "--"
- Adj. Value: `salePrice + adj`

**Card 3: ARV Confidence** (SectionCard with Target icon)
Compute from mock comps:
- Average Adj. Value
- Median Adj. Value
- Range (min to max adj. value)
- Your ARV vs Average (show delta as % and color)

Display as a 4-column metric grid similar to MetricBar but in a card.

Below the metrics, show a confidence indicator:
- If ARV is within 5% of average: green "High Confidence"
- If 5-10%: amber "Moderate Confidence"
- If >10%: red "Low Confidence - Review Comps"

## Wiring Checklist

After building all components:

1. Update `ResidentialAnalysisTab.tsx`:
   - Lift program state up from DealAnalysisSection
   - Pass shared props to all sub-tab components
   - Import new components

2. Update `DealAnalysisSection.tsx`:
   - Accept program selection as props instead of internal state
   - Remove internal useState for selectedProgramId, activeAdjusterKeys
   - Use props.selectedProgram, props.onProgramChange, etc.

3. Ensure all imports resolve:
   - lucide-react icons: Users, ShieldCheck, DollarSign, TrendingUp, BarChart3, Building2, Home, Target, CheckCircle, XCircle, AlertTriangle
   - shared.tsx: SectionCard, MetricBar, TableShell, TH, fmtCurrency, fmtPct, n
   - types.ts: ResidentialDealInputs, LoanProgram, DealType, MOCK_PROGRAMS
   - computations.ts: computeLoanSizing, computeHoldingCosts, computeExitAnalysis, computeDSCRAnalysis, computeAdjustedLimits

4. Run `pnpm build` after all changes to catch TypeScript errors.

## File Summary

| File | Action |
|------|--------|
| `components/pipeline/tabs/ResidentialAnalysisTab.tsx` | MODIFY - lift state, pass props |
| `components/pipeline/tabs/residential/DealAnalysisSection.tsx` | MODIFY - accept props for program state |
| `components/pipeline/tabs/residential/BorrowerEligibilitySection.tsx` | REWRITE - full implementation |
| `components/pipeline/tabs/residential/CostsReturnsSection.tsx` | REWRITE - full implementation |
| `components/pipeline/tabs/residential/CompAnalysisSection.tsx` | REWRITE - full implementation |
| `lib/residential-uw/types.ts` | NO CHANGE |
| `lib/residential-uw/computations.ts` | NO CHANGE |

## Do NOT

- Change any files outside the residential/ directory and ResidentialAnalysisTab.tsx
- Modify types.ts or computations.ts (they are complete)
- Use any non-shadcn UI components
- Use navy, gold, serif fonts, bounce animations, or emoji
- Add persistent borders on inline fields (use .inline-field class)
- Skip the `pnpm build` verification at the end
- Create any new database tables or migrations (that is a separate task)
