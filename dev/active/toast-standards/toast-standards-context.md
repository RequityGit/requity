# Toast Standards — Context

## Key Files
- `apps/requity-os/lib/toast.ts` — New wrapper (created)
- `apps/requity-os/components/ui/use-toast.ts` — shadcn useToast (keep, stop using)
- `apps/requity-os/components/ui/sonner.tsx` — Sonner theme config (keep)
- `apps/requity-os/components/ui/toaster.tsx` — shadcn Toaster (keep)

## Decisions Made
- Sonner is canonical toast library
- Wrapper functions: showSuccess, showError, showWarning, showInfo, showLoading, resolveLoading, rejectLoading, dismissToast
- ~104 useToast files found (more than estimated ~25)
- ~53 direct sonner files found

## Last Updated: 2026-03-21
## Next Steps: Begin Phase 2 — migrate useToast files in batches
