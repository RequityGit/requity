# Resilience Layer - Implementation Plan

## Objective
Add error boundaries, loading skeletons, and not-found pages to every major route so failures are graceful, loading is visible, and bad URLs are handled.

## Scope
- IN: ErrorFallback, SectionErrorBoundary, 5 shared skeletons, route-level error/loading/not-found files, tab wrapping, CLAUDE.md update
- OUT: Sentry integration, offline mode, retry with backoff, custom 500 page

## Approach
1. Create shared components (ErrorFallback, SectionErrorBoundary, skeletons)
2. Add route-level error.tsx for routes missing them
3. Add route-level loading.tsx for routes missing them
4. Add not-found.tsx for root + detail routes
5. Upgrade existing error.tsx files to use shared ErrorFallback
6. Wrap deal detail, CRM 360, and servicing tabs in SectionErrorBoundary
7. Update CLAUDE.md

## Existing Coverage (from research)
### Routes WITH error.tsx already:
- borrowers, funds, funds/[id], investors, servicing, (authenticated), i/distributions, i/funds/[id], app/error.tsx

### Routes WITH loading.tsx already:
- companies, contacts, operations, pipeline, pipeline/[id], tasks, b/, i/

### Routes NEEDING error.tsx:
- pipeline, pipeline/[id], contacts, loans, documents, conditions, pricing, dialer, control-center, b/

### Routes NEEDING loading.tsx:
- loans, servicing, servicing/[loanId], investors, funds, documents, conditions, pricing, dialer, control-center

## Success Criteria
1. Every major route has error.tsx and loading.tsx
2. Tab crashes are isolated via SectionErrorBoundary
3. Bad URLs show styled not-found pages
4. pnpm build passes with zero new errors
