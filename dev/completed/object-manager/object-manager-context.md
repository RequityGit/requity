# Object Manager - Context

## Key Files
- `control-center/_config/nav.ts` - Navigation config
- `control-center/layout.tsx` - Auth layout (super_admin required)
- `control-center/field-manager/actions.ts` - Existing field CRUD pattern
- `control-center/page-manager/actions.ts` - Existing page layout CRUD pattern
- `lib/auth/require-admin.ts` - Auth guards
- `lib/supabase/admin.ts` - Admin client factory
- `lib/supabase/server.ts` - Server client factory

## Decisions Made
- Using Next.js App Router pattern (NOT Remix, despite outer CLAUDE.md)
- Using `as never` casting for tables not in generated types (matches existing pattern)
- Server actions colocated in actions.ts files
- Three-panel layout: 220px left sidebar, flex center, 310px right panel

## Gotchas Discovered
- Tables not in generated Supabase types need `as never` casting
- Layout.tsx uses `createClient()` (awaitable server client)
- Actions use `createAdminClient()` (service role, no RLS)

## Last Updated: 2026-03-10
## Next Steps: Phase 1 migration, then Phase 2 UI shell
