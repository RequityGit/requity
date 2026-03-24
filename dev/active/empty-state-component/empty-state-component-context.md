# EmptyState Component - Context

## Key Files
- `components/shared/data-table.tsx` — DataTable with `emptyMessage` string prop
- `app/globals/globals.css` — `.rq-empty-state` class (will be deprecated)
- `components/shared/EmptyState.tsx` — NEW component

## Decisions Made
- Component uses optional icon, title, description, action, compact props
- DataTable keeps `emptyMessage` for backward compat, adds `emptyState` for rich content
- Icon is optional — search popovers and small contexts stay text-only

## Last Updated: 2026-03-21
## Next Steps: Create component, upgrade DataTable, begin sweep
