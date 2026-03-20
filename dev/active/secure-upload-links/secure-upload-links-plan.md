# Secure Upload Links - Implementation Plan

## Objective
Build a per-deal secure upload link system with two modes (general upload or conditions-based checklist) that lets borrowers upload documents without logging in, with files flowing into unified_deal_documents and the document center.

## Scope
- IN: Token-based upload links, public upload page, admin generate/manage/revoke UI, conditions checklist mode, general upload mode
- OUT: Email sending from the dialog (v2), Google Drive auto-sync from upload API (v2, needs env vars in Next.js runtime)

## Approach
1. Database: secure_upload_links + secure_upload_link_conditions tables with RLS
2. API: /api/upload-link/validate and /api/upload-link/upload routes using service role
3. Public page: /upload/[token] with branded UI, drag-and-drop, per-condition upload zones
4. Admin UI: SecureUploadLinkDialog in DiligenceTab with mode toggle, condition picker, link management

## Files Created
- packages/db/supabase/migrations/20260319000000_secure_upload_links.sql
- apps/requity-os/app/api/upload-link/validate/route.ts
- apps/requity-os/app/api/upload-link/upload/route.ts
- apps/requity-os/app/(public)/upload/[token]/page.tsx
- apps/requity-os/app/(public)/upload/[token]/SecureUploadClient.tsx
- apps/requity-os/components/pipeline/SecureUploadLinkDialog.tsx

## Files Modified
- apps/requity-os/middleware.ts (added /upload to PUBLIC_ROUTES)
- apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/actions.ts (3 server actions)
- apps/requity-os/components/pipeline/tabs/DiligenceTab.tsx (upload link button in header)
- apps/requity-os/lib/supabase/types.ts (regenerated)

## Success Criteria
- Admin can generate a link from deal page, choose general or checklist mode
- Borrower opens link without login, sees branded upload page
- Files land in unified_deal_documents with correct deal_id and condition_id
- Admin can revoke links, see upload counts
- Uploaded files appear in Document Center and Conditions tab
