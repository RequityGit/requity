# Format Library Enforcement - Implementation Plan

## Objective
Eliminate all inline/duplicate formatting across RequityOS portal. Every date, currency, percent, phone, and null-value display must flow through `lib/format.ts`.

## Scope
- IN: All files under `apps/requity-os/`, new formatter functions, tests, CLAUDE.md rule
- OUT: `apps/requity-group/`, `apps/trg-living/`, `packages/`

## Approach
See `dev/active/format-library-enforcement/format-library-enforcement-prompt.md` for the full prompt with all file references and line numbers.

6 steps:
1. Add new functions to `lib/format.ts` + tests
2. Kill 12+ duplicate `formatDate` definitions
3. Consolidate `pipeline-types.ts` formatters
4. Replace ~30 inline `.toLocaleDateString()` calls
5. Replace duplicate currency formatters + inline `Intl.NumberFormat`
6. Update CLAUDE.md with formatting rule

## Success Criteria
- Zero local format function definitions outside `lib/format.ts`
- Zero raw `.toLocaleDateString()` or `new Intl.NumberFormat()` in components
- All null values display as "—"
- `pnpm build` and `pnpm test` pass
