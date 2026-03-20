# Underwriting Formula Engine - Context

## Key Files
- `apps/requity-os/lib/formula-engine/` - New formula engine library
- `apps/requity-os/components/pipeline-v2/pipeline-types.ts` - Contains `computeUwOutput()` (replaced)
- `apps/requity-os/components/pipeline-v2/UnderwritingPanel.tsx` - Calls `computeUwOutput()`
- `apps/requity-os/components/pipeline-v2/EditableOverview.tsx` - Calls `computeUwOutput()`
- `apps/requity-os/app/(authenticated)/control-center/card-types/CardTypeManagerView.tsx` - Enhanced formula editor

## Decisions Made
- **mathjs over HyperFormula**: HyperFormula is GPL-licensed; mathjs is MIT. mathjs is also smaller and better suited for expression evaluation without needing a cell model.
- **Lazy singleton**: mathjs instance is created once on first use and cached. Compiled expressions are also cached.
- **Null safety**: Any formula error, missing variable, or non-finite result returns null (renders as "--" in UI).
- **COALESCE function**: Added to handle the old fallback patterns (e.g., `val("noi") ?? val("noi_current")`).
- **Backward compatible**: Simple formulas like `loan_amount / property_value * 100` work identically in mathjs.

## Gotchas
- mathjs `MathNode` type doesn't expose `.name` directly - needed type assertion for `SymbolNode`
- The `IF` function in mathjs must be registered as a custom function since mathjs uses ternary `?:` syntax natively

## Dependencies
- `mathjs` package added to requity-os

## Last Updated: 2026-03-09 (audit cleanup)
## Status: COMPLETED - Merged via PR #566. Production build passes. Formula engine live in portal.
