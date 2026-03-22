# Resilience Layer - Context

## Key Files
- `app/error.tsx` - Root error boundary (to upgrade)
- `app/(authenticated)/error.tsx` - Auth-level error boundary (to upgrade)
- `components/ui/skeleton.tsx` - Existing Skeleton primitive (animate-pulse rounded-md bg-muted)
- `app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage.tsx` - Deal tabs (loadedTabs pattern)
- `components/crm/contact-360/contact-detail-client.tsx` - Contact 360 sections
- `components/admin/servicing/loan-detail-tabs.tsx` - Servicing tabs (shadcn Tabs)

## Existing Error Pattern
Uses AlertTriangle icon, shadcn Button, "Go Back" + "Try Again" buttons. We'll standardize via ErrorFallback.

## Decisions Made
- ErrorFallback supports compact mode for inline use (tabs/cards)
- SectionErrorBoundary is a class component (React requirement for error boundaries)
- Wrap order: SectionErrorBoundary > Suspense > Component

## Last Updated: 2026-03-21
## Next Steps: Create shared components, then route files
