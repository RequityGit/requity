# Form Engine - Context

## Key Files
- `apps/requity-os/lib/supabase/client.ts` - Browser Supabase client
- `apps/requity-os/lib/supabase/server.ts` - Server Supabase client
- `apps/requity-os/lib/supabase/admin.ts` - Admin Supabase client
- `apps/requity-os/lib/supabase/types.ts` - Generated DB types
- `apps/requity-os/lib/utils.ts` - `cn()` utility
- `apps/requity-os/components/ui/` - All shadcn/ui primitives
- `apps/requity-os/app/(authenticated)/control-center/_config/nav.ts` - CC nav config
- `packages/db/supabase/migrations/` - All migrations (latest: 20260309300001)

## Decisions Made
- Using Next.js API routes instead of Supabase Edge Functions for submission handler (simpler, same deployment)
- RLS policies use `user_roles` table (confirmed by CLAUDE.md rule #2)
- Form components in `components/forms/` (not in packages/ui since they're app-specific)

## Gotchas Discovered
- Project is Next.js 14, not Remix (CLAUDE.md mentions Remix but package.json confirms Next.js)
- `profiles.role` exists but is NOT the auth source - `user_roles` table is
- Monorepo: apps/requity-os is the portal app, packages/db has migrations

## Dependencies
- shadcn/ui components (already installed)
- lucide-react (already installed)
- react-hook-form + zod (already installed)
- @supabase/ssr (already installed)

## Last Updated: 2026-03-10
## Next Steps: Create database migration, then build form rendering components
