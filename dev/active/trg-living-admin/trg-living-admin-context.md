# TRG Living Admin Panel - Context

## Key Files
- `middleware.ts`: Intercepts /admin routes and validates session.
- `lib/supabase/server.ts`: Uses non-deprecated `getAll/setAll` cookie patterns.
- `app/login/page.tsx`: Implements "Mounted Pattern" to prevent hydration mismatches in privacy browsers (Brave).
- `app/(admin)/admin/communities/new/page.tsx`: Handles multipart form data and Supabase Storage uploads.

## Decisions Made
- Standardized on `@supabase/ssr` for future-proofing.
- Implemented "Mounted Pattern" in Client Components to ensure stability across different browser rendering engines.
- Used `(SELECT auth.uid())` subselects in RLS policies for query plan optimization as per monorepo standards.
- Isolated Media: Chose `trg-living-media` bucket name to prevent "Namespace Pollution" in the shared storage environment.

## Gotchas Discovered
- Brave Browser Hydration: Browser-injected elements (Shields/Password Managers) triggered React <div> mismatches. Resolved via useEffect mount check.
- RLS Recursion: Discovered that `pm_` policies fail if `user_roles` itself isn't readable by the user.

## Last Updated: 2026-03-13
## Next Steps: Deploy Auth and RLS hardening to Production; Build Region Creation Form.