# Residential Analysis Tab - File Guide

## Development Documentation Directory
```
dev/active/residential-analysis-tab/
├── README.md                        # Quick start guide for development
├── CHECKLIST.md                     # Detailed implementation checklist
├── FILE_GUIDE.md                    # This file
├── IMPLEMENTATION_SUMMARY.md        # Executive summary of what was built
├── residential-analysis-plan.md     # Approved implementation plan
├── residential-analysis-context.md  # Architecture decisions and context
└── residential-analysis-tasks.md    # Phase checklist (update as you work)
```

## Implementation Files

### Core Computation Libraries
```
apps/requity-os/lib/residential-uw/
├── types.ts                         # All TypeScript interfaces + MOCK_PROGRAMS
│   ├── DealType enum (rtl | dscr | guc)
│   ├── ProgramType enum (rtl_premier | rtl_balance_sheet | dscr_standard | etc.)
│   ├── AdjusterDefinition (key, label, LTC/LTV/LTP impact)
│   ├── LoanProgram (rates, limits, borrower requirements, adjusters)
│   ├── ResidentialDealInputs (parsed from uw_data JSONB)
│   ├── LoanSizingResult (max loan by constraint, binding constraint)
│   ├── HoldingCosts (monthly + total for construction)
│   ├── ExitAnalysis (P&L, profit, ROI for fix & flip)
│   ├── DSCRAnalysis (DSCR ratio, cash flow, rent/expense breakdown)
│   └── MOCK_PROGRAMS ([RTL Premier, RTL Balance Sheet, DSCR Standard])
│
└── computations.ts                  # All calculation functions
    ├── safe(v) - null/undefined safe conversion
    ├── round2(v) - round to cents
    ├── computeAdjustedLimits() - apply leverage adjusters
    ├── computeLoanSizing() - max loan, binding constraint
    ├── computeHoldingCosts() - monthly + total costs
    ├── computeExitAnalysis() - P&L, profit, ROI
    ├── computeDSCRAnalysis() - DSCR, cash flow
    ├── computeKPIs() - all KPI values
    └── computeResidentialUW() - orchestrate all calculations
```

**Import**: `import { computeLoanSizing } from "@/lib/residential-uw/computations"`

### Main Tab Component
```
apps/requity-os/components/pipeline/tabs/
└── ResidentialAnalysisTab.tsx       # Main shell, 4-tab router
    ├── Props: dealId, uwData
    ├── State: activeTab, dealType
    ├── Parses uw_data -> ResidentialDealInputs
    ├── Renders: 4 sub-tabs (Deal Analysis, Borrower & Eligibility, Costs & Returns, Comp Analysis)
    └── Routes to appropriate sub-tab based on activeTab
```

**Import**: `import { ResidentialAnalysisTab } from "@/components/pipeline/tabs/ResidentialAnalysisTab"`

### Sub-Tab Components
```
apps/requity-os/components/pipeline/tabs/residential/
├── DealAnalysisSection.tsx          # Main Deal Analysis tab (FULL IMPLEMENTATION)
│   ├── Deal type toggle (Fix & Flip / DSCR Rental)
│   ├── KPI strip (6 metrics, conditional on deal type)
│   ├── Program selector (dropdown from MOCK_PROGRAMS)
│   ├── Loan sizing waterfall (LTV, LTC, LTP constraints)
│   ├── Max Loan callout box
│   ├── Program terms summary (rate, points, fees, min FICO/experience)
│   ├── Leverage adjusters panel (expandable, checkboxes, impact display)
│   ├── RTL exit analysis (sale proceeds, P&L, profit, ROI tables)
│   └── DSCR analysis (rent, expenses, NOI, P&I, cash flow, DSCR ratio)
│
├── BorrowerEligibilitySection.tsx   # Placeholder for Sprint 2
│   └── Uses SectionCard with "Coming in Sprint 2" message
│
├── CostsReturnsSection.tsx          # Placeholder for Sprint 2
│   └── Uses SectionCard with "Coming in Sprint 2" message
│
└── CompAnalysisSection.tsx          # Placeholder for Sprint 3
    └── Uses SectionCard with "Coming in Sprint 3" message
```

**Imports**:
```typescript
import { DealAnalysisSection } from "@/components/pipeline/tabs/residential/DealAnalysisSection"
import { BorrowerEligibilitySection } from "@/components/pipeline/tabs/residential/BorrowerEligibilitySection"
import { CostsReturnsSection } from "@/components/pipeline/tabs/residential/CostsReturnsSection"
import { CompAnalysisSection } from "@/components/pipeline/tabs/residential/CompAnalysisSection"
```

### Modified Deal Page
```
apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/
└── DealDetailPage.tsx               # MODIFIED
    ├── Added import: ResidentialAnalysisTab
    ├── Added "Analysis" to UNIVERSAL_TABS array
    ├── Added tab content renderer for Analysis tab
    ├── Passes dealId and uwData to ResidentialAnalysisTab
    └── Analysis tab appears 3rd in tab bar (after Property, before Underwriting)
```

## Shared Components & Utilities

### From `financials/shared.tsx`
These are imported and used in DealAnalysisSection:

```typescript
// Components
export function PillNav() - Tab navigation pills
export function MetricBar() - KPI metrics display
export function SectionCard() - Card wrapper with title and icon
export function TableShell() - Table container
export function TH() - Table header cell
export function SubLabel() - Section label

// Utilities
export function n(v) - Convert to number (safe)
export function fmtCurrency(v) - Format as $USD
export function fmtPct(v) - Format as percentage
export function StatusDot() - Status indicator

// CSS Classes (from globals.css)
.rq-section-title
.rq-micro-label
.rq-th (table header)
.rq-td (table data)
.rq-stat-value
.rq-value-positive (green text)
.rq-value-negative (red text)
.rq-value-warn (amber text)
.num (tabular-nums for financial figures)
.inline-field (hover-reveal input)
.inline-field-label (input label)
```

## Data Flow Diagram

```
DealDetailPage
    ↓ (provides deal.uw_data as Record<string, unknown>)
ResidentialAnalysisTab
    ↓ (parses uw_data -> ResidentialDealInputs)
    ├─→ DealAnalysisSection
    │       ↓ (receives dealInputs, dealType, MOCK_PROGRAMS)
    │       ├─→ computeLoanSizing()
    │       ├─→ computeHoldingCosts()
    │       ├─→ computeExitAnalysis()
    │       ├─→ computeDSCRAnalysis()
    │       └─→ renders KPI strip, waterfall, selector, analysis tables
    │
    ├─→ BorrowerEligibilitySection (placeholder)
    ├─→ CostsReturnsSection (placeholder)
    └─→ CompAnalysisSection (placeholder)
```

## Key Integration Points

### 1. Adding ResidentialAnalysisTab to Deal Page
✓ Already done in DealDetailPage.tsx (lines 105-110)

```typescript
import { ResidentialAnalysisTab } from "@/components/pipeline/tabs/ResidentialAnalysisTab";

// In UNIVERSAL_TABS:
const UNIVERSAL_TABS = [
  "Overview",
  "Property",
  "Analysis",        // <-- NEW
  "Underwriting",
  "Borrower",
  "Forms",
  "Diligence",
  "Messages",
] as const;

// In tab content renderer:
{loadedTabs.has("Analysis") && (
  <div className={activeTab !== "Analysis" ? "hidden" : undefined}>
    <ResidentialAnalysisTab
      dealId={deal.id}
      uwData={(deal.uw_data as Record<string, unknown>) ?? {}}
    />
  </div>
)}
```

### 2. Parsing uw_data Fields
ResidentialAnalysisTab expects these fields in uw_data (all optional, default to 0):
- purchase_price
- after_repair_value
- appraised_value
- rehab_budget
- loan_amount
- loan_term_months
- interest_rate
- origination_pts
- holding_period_months
- projected_sale_price
- sales_disposition_pct
- monthly_rent
- annual_property_tax
- annual_insurance
- monthly_hoa
- monthly_utilities
- operating_expenses
- fico_score
- net_worth
- liquid_reserves
- real_estate_experience_years
- is_us_citizen

### 3. Program Selection
Programs are loaded from MOCK_PROGRAMS in types.ts. To add more programs:
1. Add to MOCK_PROGRAMS array in lib/residential-uw/types.ts
2. No code changes needed (programmatic)
3. Sprint 2: Replace with database lookup

## Testing Checklist

- [ ] Navigate to a deal
- [ ] Click "Analysis" tab (should appear 3rd after Property)
- [ ] See 4 pill tabs: Deal Analysis, Borrower & Eligibility, Costs & Returns, Comp Analysis
- [ ] Deal Analysis tab is active by default
- [ ] See deal type toggle (Fix & Flip / DSCR Rental)
- [ ] See KPI strip with 6 metrics
- [ ] See program selector dropdown
- [ ] Select different program -> waterfall updates
- [ ] For RTL Balance Sheet program: see leverage adjusters panel
- [ ] Toggle adjusters -> waterfall updates
- [ ] Switch to DSCR mode -> KPI strip changes
- [ ] Switch to DSCR mode -> DSCR analysis table appears
- [ ] Light mode looks good
- [ ] Dark mode looks good
- [ ] Underwriting tab still works (coexistence)
- [ ] No console errors

## Common Tasks

### To Modify Program Data
File: `apps/requity-os/lib/residential-uw/types.ts`
Section: `MOCK_PROGRAMS` array
Action: Add, edit, or remove LoanProgram objects

### To Add a New Calculation
File: `apps/requity-os/lib/residential-uw/computations.ts`
Action: Add new function following existing pattern
Action: Export from computations.ts
Action: Import and use in DealAnalysisSection.tsx

### To Modify KPI Display
File: `apps/requity-os/components/pipeline/tabs/residential/DealAnalysisSection.tsx`
Section: `kpiItems` useMemo
Action: Modify items array based on deal type

### To Modify Waterfall Table
File: `apps/requity-os/components/pipeline/tabs/residential/DealAnalysisSection.tsx`
Section: "Loan Sizing Waterfall" SectionCard
Action: Modify table rows, columns, or logic

## References

- Plan: See `residential-analysis-plan.md` for scope and approach
- Context: See `residential-analysis-context.md` for decisions and gotchas
- Tasks: See `residential-analysis-tasks.md` for checklist
- Summary: See `IMPLEMENTATION_SUMMARY.md` for high-level overview
