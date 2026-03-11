# Audit Monorepo Cleanup - Context

## Key Files
- apps/requity-os/ - Main portal app (Remix-like Next.js)
- apps/requity-group/ - Requity Group website
- apps/trg-living/ - TRG Living website
- packages/lib/, packages/db/, packages/ui/, packages/types/ - Shared packages

## Decisions Made
- /admin/dscr/ is OLD, /admin/models/dscr/ is CURRENT (confirmed by Dylan)
- /admin/pipeline/ is OLD, pipeline-v2 is CURRENT (confirmed by Dylan)
- Full audit scope: all 6 categories with actual code changes

## Dependencies
- mammoth and react-resizable-panels confirmed unused (0 imports)
- Next.js 14.2.21 has security advisory (upgrade recommended but out of scope for this PR)

## Last Updated: 2026-03-11
## Next Steps: Execute Phase 1 - dead code removal
