# TRG Living Admin Panel - Implementation Plan

## Objective
Build a secure, V3-compliant internal CMS for TRG Living to manage the marketing hierarchy (Regions -> Communities -> Posts) and layout settings.

## Scope
- IN: V3 Admin Layout, Dashboard Stats, Login/Auth flow, Middleware protection, Community List & Creation, Hardened RLS, Supabase Storage integration.
- OUT: Role management UI, Advanced "Field Manager" integration (for now).

## Approach
- Phase 1: Infrastructure. Establish @supabase/ssr patterns and Middleware protection.
- Phase 2: Security. Implement hardened RLS policies using (SELECT auth.uid()) and user_roles lookup.
- Phase 3: CMS Features. Build CRUD (Create, Read, Update, Delete) forms for Communities and Regions.
- Phase 4: Production Sync. Align Live Supabase and Netlify settings with Localhost breakthroughs.

## Files to Modify
- apps/trg-living/middleware.ts (Route protection)
- apps/trg-living/lib/supabase/server.ts (SSR Client)
- apps/trg-living/lib/supabase/client.ts (Browser Client)
- apps/trg-living/app/login/page.tsx (Secure Login)
- apps/trg-living/app/(admin)/admin/layout.tsx (Sidebar)
- apps/trg-living/app/(admin)/admin/page.tsx (Dashboard)
- apps/trg-living/app/(admin)/admin/communities/new/page.tsx (Creation Form)
- packages/db/supabase/migrations/20260308085328_create_trg_living_base.sql

## Database Changes
- Add `pm_site_settings`, `pm_amenities`, `pm_gallery`, `pm_community_amenities`.
- Hardened RLS policies for all `pm_` tables.
- Storage bucket `trg-living-media` with role-based write access.

## Success Criteria
- Unauthorized users redirected to /login.
- Only users with 'admin' role in user_roles can create/edit.
- Successful image upload to Supabase Storage via Next.js form.