# Secure Upload Links - Tasks

## Phase 1: Database
- [x] Create secure_upload_links table
- [x] Create secure_upload_link_conditions junction table
- [x] Add RLS policies (admin/super_admin)
- [x] Apply migration via MCP
- [x] Regenerate TypeScript types

## Phase 2: API Routes
- [x] Build /api/upload-link/validate route
- [x] Build /api/upload-link/upload route

## Phase 3: Public Upload Page
- [x] Add /upload to PUBLIC_ROUTES in middleware.ts
- [x] Create /upload/[token] server page
- [x] Build SecureUploadClient with general and checklist modes
- [x] Invalid/expired link error states

## Phase 4: Admin UI
- [x] Create server actions (create, revoke, list)
- [x] Build SecureUploadLinkDialog with mode toggle and condition picker
- [x] Integrate into DiligenceTab header
- [x] Link management (copy, revoke, view active links)

## Phase 5: Build Verification
- [x] Run pnpm build - passes (pre-existing errors in unrelated files only)

## Future (v2)
- [ ] "Send via Email" button in dialog
- [ ] Google Drive auto-sync from upload API
- [ ] Upload notifications (notify admin when borrower uploads)
- [ ] Upload activity logging to deal timeline

## Blockers
- None

## Last Updated: 2026-03-15
