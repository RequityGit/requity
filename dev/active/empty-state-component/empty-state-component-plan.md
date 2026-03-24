# EmptyState Component - Implementation Plan

## Objective
Create a shared `<EmptyState>` component and replace all ~96 ad-hoc "No X found/yet" patterns across the portal with it.

## Scope
- IN: New EmptyState component, DataTable upgrade, replacement sweep across all files, CLAUDE.md rule
- OUT: Illustrations/SVGs, animated variants, per-module custom empty state components

## Approach
1. Create `components/shared/EmptyState.tsx`
2. Upgrade `DataTable` with `emptyState` prop (backward compatible)
3. Replace inline empty states across all files in batches by area
4. Update CLAUDE.md with rule 15

## Files to Modify
- NEW: `components/shared/EmptyState.tsx`
- `components/shared/data-table.tsx`
- ~96 component files (see prompt for full list)
- `CLAUDE.md`

## Risks
- DataTable backward compat: mitigated by keeping `emptyMessage` string prop
- Table cell contexts: `compact` mode handles this

## Success Criteria
- Zero inline "No X found/yet" with ad-hoc styling
- `pnpm build` passes
- CLAUDE.md updated
