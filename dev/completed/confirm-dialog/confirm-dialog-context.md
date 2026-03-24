# ConfirmDialog — Context

## Key Files
- `app/(authenticated)/layout.tsx` — server component, authenticated layout wrapper
- `components/ui/alert-dialog.tsx` — shadcn AlertDialog primitives
- `components/shared/` — shared component directory (target for ConfirmDialog.tsx)

## Decisions Made
- Provider goes in authenticated layout only (public routes don't need it)
- Hook returns Promise<boolean> — simple, no async callback variant needed yet
- Destructive styling: `bg-red-600 hover:bg-red-700 focus:ring-red-600`

## Gotchas Discovered
- Layout is a server component but can render client component providers (same as existing providers)
- Two toast libraries in use: `useToast()` from shadcn and `toast` from sonner — don't unify, just leave each caller's existing pattern

## Dependencies
- shadcn AlertDialog primitives (already installed)
- cn utility from @/lib/utils

## Last Updated: 2026-03-21
## Next Steps: Create ConfirmDialog.tsx, add to layout
