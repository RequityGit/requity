# TRG Living Admin Panel - Tasks

## Phase 1: Infrastructure & Auth
- [x] Create V3-compliant layout shell
- [x] Implement @supabase/ssr (Server & Client factories)
- [x] Build Secure Login UI with Hydration fix
- [x] Implement Middleware route protection for /admin
- [x] Consolidate pm_ schema with secure RLS policies (v3 Hardened)

## Phase 2: Community Management
- [x] Build community list view table
- [x] Create "Add New Community" form
- [x] Implement image upload logic to trg-living-media
- [x] Verify end-to-end community creation (Local)

## Phase 3: Region & Content Management
- [x] Build region list view
- [ ] Create "Add New Region" form
- [ ] Build "Edit Community" form (Load existing data into fields)

## Phase 4: Production Alignment
- [ ] Push Hardened SQL to Cloud Supabase
- [ ] Replicate `trg-living-media` bucket in Cloud
- [ ] Commit and Push Middleware/Login code to GitHub
- [ ] Verify Production Login flow on Netlify Alpha URL

## Blockers
- None.