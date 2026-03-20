# Audit Monorepo Cleanup - Implementation Plan

## Objective
Comprehensive audit and cleanup of the RequityOS monorepo to eliminate dead weight, maximize performance, and verify functionality across all three Next.js apps.

## Scope
- IN: Dead code removal, unused packages, duplicate routes, performance fixes, code quality, dependency health, API security verification
- OUT: Major architectural refactors, Next.js 15 upgrade, ESLint v9 migration

## Approach
### Phase 1: Dead Code & Unnecessary Files
- Remove unused packages (mammoth, react-resizable-panels)
- Delete old /admin/dscr/ routes (replaced by /admin/models/dscr/)
- Delete old /admin/pipeline/ routes (replaced by pipeline-v2)
- Find unused components/hooks/utilities and remove them
- Remove abandoned commented-out code

### Phase 2: Performance & Code Quality
- Fix console.log statements
- Fix TypeScript `any` types
- Identify missing memoization, large client components
- Check image optimization

### Phase 3: Data & Security
- Audit N+1 queries and subscription cleanup
- Verify API route auth guards and input validation

### Phase 4: Verification
- Run build to verify all changes compile
- Report remaining findings

## Success Criteria
- All unused packages removed
- All duplicate/dead routes deleted
- No console.logs in production code
- Build passes cleanly
- Comprehensive report of all findings with priorities
