# Residential Analysis Tab - Context

## Key Files
- apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage.tsx - Renders deal tabs, has UnderwritingContent that routes commercial vs residential
- apps/requity-os/components/pipeline/UnderwritingPanel.tsx - Current residential UW (simple field grid, will coexist)
- apps/requity-os/components/pipeline/tabs/UnderwritingTab.tsx - Commercial UW tab (our design reference for tab structure)
- apps/requity-os/components/pipeline/tabs/CommercialUnderwritingTab.tsx - Enhanced Pro Forma (reference for KPI strip pattern)
- apps/requity-os/components/pipeline/tabs/financials/shared.tsx - PillNav, MetricBar, SectionCard components (reuse)
- apps/requity-os/lib/underwriting/types.ts - Existing UnderwritingInputs/Outputs interfaces
- apps/requity-os/lib/underwriting/calculator.ts - Existing residential calculator (reference for formulas)
- apps/requity-os/lib/visibility-engine.ts - isCommercialDeal() function
- apps/requity-os/lib/pipeline/deal-display-config.ts - Deal flavor routing (res_rtl, res_dscr, comm_debt, comm_equity)
- apps/requity-os/hooks/useUwFieldConfigs.ts - Field configuration hook for UW fields

## Design Reference
- residential-uw-mockup.jsx - JSX mockup approved by Dylan (4 tabs: Deal Analysis, Borrower & Eligibility, Costs & Returns, Comp Analysis)
- underwriting-tab-mockup.jsx - Commercial UW mockup (reference for consistent styling)

## RTL UW Google Sheet Structure (from Make.com MCP)
- Program Selection tab: Premier vs Balance Sheet, leverage adjusters (10 risk factors), effective limits
- Pricing Link tab: IMPORTRANGE from pricing matrix (rates, points, LTV caps, LTC caps, min FICO, min experience)
- Deal Summary tab: Core deal analysis
- Comp Analysis tab: Comparable sales grid
- Draw Schedule tab: Construction draw milestones

## Decisions Made
1. Tab is called "Analysis" (not "Underwriting") for residential deals
2. Both Analysis and Underwriting tabs visible on ALL deals during build-out
3. Program architecture supports up to 8 programs, data-driven from day 1
4. Sprint 1 uses client-side mock programs; Sprint 2 introduces loan_programs DB table
5. RTL and DSCR share the same tab shell but render different content per sub-tab
6. Deal type toggle (Fix & Flip / DSCR Rental) at top of Analysis tab

## Gotchas Discovered
- Bash shell in sandbox is broken (disk full from git corruption). Use Write/Edit tools, not bash.
- Git repo index is corrupted on FUSE mount. Commercial UW changes need to be committed from Cursor/local.
- The commercial UnderwritingTab.tsx was recently rewritten to use tab-switching (not scroll sections)

## Dependencies
- Commercial UW tab changes (UnderwritingTab.tsx rewrite) must be committed first
- shared.tsx components (PillNav, MetricBar, SectionCard) are already built and available

## Last Updated: 2026-03-21
## Next Steps: Build lib/residential-uw/types.ts and computations.ts, then ResidentialAnalysisTab shell
