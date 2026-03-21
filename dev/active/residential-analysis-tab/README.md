# Residential Analysis Tab Development

This directory contains development documentation for Sprint 1 of the Residential Analysis Tab feature.

## Files Overview

### Development Documentation
- **residential-analysis-plan.md** - Approved implementation plan with scope, approach, risks, and success criteria
- **residential-analysis-context.md** - Architecture decisions, gotchas discovered, dependencies, and living context
- **residential-analysis-tasks.md** - Phase checklist; Phases 1-4 complete, Phase 5 (verification) pending
- **IMPLEMENTATION_SUMMARY.md** - Executive summary of what was built, file locations, and next steps
- **README.md** - This file

### Implementation Status

**PHASE 1-4: COMPLETE** (all code written)
- Types & computation engine: lib/residential-uw/
- Tab shell with 4-tab nav: components/pipeline/tabs/ResidentialAnalysisTab.tsx
- Deal Analysis section with full UI: components/pipeline/tabs/residential/DealAnalysisSection.tsx
- Placeholder sections: BorrowerEligibilitySection, CostsReturnsSection, CompAnalysisSection
- Wired into DealDetailPage with "Analysis" tab visible on all deals

**PHASE 5: PENDING** (requires build verification)
- TypeScript check (pnpm typecheck)
- Full build (pnpm build)
- Browser testing (light/dark mode, all interactions)
- Verification that both Analysis and Underwriting tabs coexist

## Quick Start for Verification

```bash
cd /sessions/amazing-focused-cannon/mnt/requity
pnpm typecheck
pnpm build
```

If errors occur, see "Troubleshooting" below.

## Files Created

### Core Libraries
```
apps/requity-os/lib/residential-uw/
├── types.ts             # All TypeScript interfaces + MOCK_PROGRAMS
└── computations.ts      # All calculation functions
```

### Components
```
apps/requity-os/components/pipeline/tabs/
├── ResidentialAnalysisTab.tsx
└── residential/
    ├── DealAnalysisSection.tsx
    ├── BorrowerEligibilitySection.tsx
    ├── CostsReturnsSection.tsx
    └── CompAnalysisSection.tsx
```

### Modified
```
apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/
└── DealDetailPage.tsx   # Added "Analysis" tab import and renderer
```

## Architecture Highlights

### Programs Architecture
- Data-driven: MOCK_PROGRAMS array (Sprint 1), DB table (Sprint 2+)
- Scalable to 8 programs (RTL Premier, RTL Balance Sheet, DSCR Standard, DSCR No-Ratio, GUC x3, future)
- Each program: name, type, rate, points, LTV/LTC/LTP limits, borrower minimums, adjusters

### Deal Type Flexibility
- RTL mode: fix & flip analysis with exit P&L
- DSCR mode: rental property analysis with cash flow
- Runtime toggle at top of Deal Analysis section
- KPI strip adapts based on deal type

### Loan Sizing
- Waterfall across LTV, LTC, LTP constraints
- Highlights binding constraint (most restrictive)
- Reactive to program selection and leverage adjusters
- Effective ratios calculated at max loan

### Leverage Adjusters
- Optional per-program (RTL Balance Sheet = 3 adjusters)
- Checkboxes in expandable panel
- Real-time recalculation of LTV/LTC/LTP impact
- Ready for validation against borrower profile (Sprint 2)

## Computations Overview

All formulas match RTL UW Google Sheet logic:

| Function | Purpose |
|----------|---------|
| computeAdjustedLimits | Apply leverage adjusters to program limits |
| computeLoanSizing | Max loan by constraint, binding constraint identification |
| computeHoldingCosts | Monthly + total construction/hold period costs |
| computeExitAnalysis | Sale P&L, profit, ROI for fix & flip |
| computeDSCRAnalysis | DSCR ratio, cash flow, rent/expense breakdown |
| computeResidentialUW | Orchestrates all calculations |
| computeKPIs | Returns all values needed for KPI strip |

## Design System Compliance

- Uses existing shared.tsx components: PillNav, MetricBar, SectionCard, TableShell, TH
- Global CSS classes: .inline-field, .inline-field-label, .rq-section-title, .rq-micro-label, .rq-stat-value, .rq-th, .rq-td, .rq-total-row, .rq-card, .num
- Color utilities: .rq-value-positive, .rq-value-negative, .rq-value-warn
- No navy, gold, serifs, bounce animations, or hardcoded colors
- Light and dark mode via CSS variables
- shadcn/ui primitives only (Select, Button, Input, Dialog, etc.)

## Troubleshooting

### TypeScript Errors in Other Files
If build shows unrelated TypeScript errors, they may be pre-existing. Check:
```bash
git diff HEAD -- <file> | head -20
```
If no changes in file, error is pre-existing; note it in dev docs.

### Import Path Issues
All imports use @/ alias per monorepo convention:
```typescript
import { ResidentialAnalysisTab } from "@/components/pipeline/tabs/ResidentialAnalysisTab";
import { computeLoanSizing } from "@/lib/residential-uw/computations";
```

### FUSE Mount / Git Issues
Bash is broken in sandbox (disk full, git corruption). All files created via Write/Edit tools. Commercial UW changes must be committed from local Cursor instance.

## Next Phase (Sprint 2)

1. Database table: loan_programs
2. Seed migration with 3 programs
3. BorrowerEligibilitySection (profile fields, eligibility checklist)
4. CostsReturnsSection (holding costs breakdown, exit P&L detail, DSCR schedule)
5. Rate sheet upload UI in control center

## Questions?

Refer to:
- **Plan**: residential-analysis-plan.md
- **Context**: residential-analysis-context.md
- **Tasks**: residential-analysis-tasks.md
- **Summary**: IMPLEMENTATION_SUMMARY.md
