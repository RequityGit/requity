# Residential Analysis Tab - Tasks

## Sprint 1: Deal Analysis + Computation Engine

### Phase 1: Types & Computation Engine
- [x] Create lib/residential-uw/types.ts (LoanProgram, ResidentialDealInputs, LoanSizingResult, HoldingCosts, ExitAnalysis, DSCRAnalysis interfaces)
- [x] Create lib/residential-uw/computations.ts (computeLoanSizing, computeHoldingCosts, computeExitPL, computeDSCR, computeAdjustedLimits)
- [x] Add mock program data (2-3 programs: RTL Premier, RTL Balance Sheet, DSCR Standard)

### Phase 2: Tab Shell
- [x] Create ResidentialAnalysisTab.tsx with 4-tab pill nav matching commercial pattern
- [x] Create placeholder components for all 4 sub-tabs
- [x] Add deal type toggle (Fix & Flip / DSCR) at top

### Phase 3: Deal Analysis Section
- [x] Build KPI strip (conditional on deal type)
- [x] Build program selector dropdown
- [x] Build loan sizing waterfall table with binding constraint highlight
- [x] Build program terms summary
- [x] Build leverage adjusters panel (toggleable, only for programs that support them)
- [x] Build DSCR analysis view (when DSCR deal type selected)

### Phase 4: Wire Into DealDetailPage
- [x] Add "Analysis" tab to deal page tab bar (visible on all deals)
- [x] Pass uw_data and deal info to ResidentialAnalysisTab
- [x] Ensure both Analysis and Underwriting tabs coexist

### Phase 5: Verify
- [ ] TypeScript check passes (pnpm typecheck)
- [ ] Build passes (pnpm build)
- [ ] Light and dark mode both work
- [ ] No hardcoded values that should come from programs

## Sprint 2: Costs & Returns + Borrower (Future)
- [ ] Build CostsReturnsSection (RTL: holding costs + exit P&L; DSCR: cash flow)
- [ ] Build BorrowerEligibilitySection (profile fields + eligibility checklist)
- [ ] Create loan_programs DB table + seed migration
- [ ] Build rate sheet upload UI in control center

## Sprint 3: Comp Analysis + Polish (Future)
- [ ] Build CompAnalysisSection grid
- [ ] Program comparison matrix view
- [ ] GUC placeholders
- [ ] Dual-scenario RTL+DSCR foundation

## Blockers
- Git repo corrupted in sandbox; commercial UW changes must be committed from Cursor first
- Bash shell broken (disk full); using Write/Edit tools only

## Last Updated: 2026-03-21
