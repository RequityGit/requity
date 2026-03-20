# Audit Monorepo Cleanup - Tasks

## Phase 1: Dead Code & Unnecessary Files
- [ ] Remove unused packages (mammoth, react-resizable-panels)
- [ ] Delete old /admin/dscr/ routes
- [ ] Delete old /admin/pipeline/ routes
- [ ] Find and remove unused components/hooks/utilities
- [ ] Remove abandoned commented-out code

## Phase 2: Performance & Code Quality
- [ ] Remove console.log statements from production code
- [ ] Fix TypeScript `any` types
- [ ] Audit performance (memoization, client components, images)

## Phase 3: Data & Security
- [ ] Audit N+1 queries and subscription cleanup
- [ ] Verify API route auth guards

## Phase 4: Verification
- [ ] Run build
- [ ] Commit and push

## Last Updated: 2026-03-11
