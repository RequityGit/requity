# Secure Upload Links - Context

## Key Files
- `packages/db/supabase/migrations/20260319000000_secure_upload_links.sql` - Migration for both tables
- `apps/requity-os/app/api/upload-link/validate/route.ts` - Token validation API
- `apps/requity-os/app/api/upload-link/upload/route.ts` - File upload API
- `apps/requity-os/app/(public)/upload/[token]/page.tsx` - Server page
- `apps/requity-os/app/(public)/upload/[token]/SecureUploadClient.tsx` - Client upload UI
- `apps/requity-os/components/pipeline/SecureUploadLinkDialog.tsx` - Admin dialog
- `apps/requity-os/components/pipeline/tabs/DiligenceTab.tsx` - Integration point
- `apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/actions.ts` - Server actions

## Decisions Made
- Token is UUID v4 (cryptographically random, not guessable)
- API routes use service role (createAdminClient) so no RLS holes needed for public access
- Upload API handles files server-side (reads arrayBuffer, puts to storage) rather than giving borrower direct signed upload URLs
- Condition status auto-updates to "submitted" when borrower uploads against a pending condition
- uploaded_by is null for borrower uploads; traceability via secure_upload_links.token
- Files get visibility="external" to distinguish from admin uploads

## Gotchas Discovered
- The (public) route group is NOT automatically public; must add to PUBLIC_ROUTES in middleware.ts
- DiligenceTab is the actual component (not DocumentsTab) that renders in the deal page
- Pre-existing build errors in useInlineLayout conditional hooks (not related to this feature)

## Dependencies
- unified_deal_conditions must exist (already does)
- unified_deal_documents must exist (already does)
- loan-documents storage bucket must exist (already does)

## Last Updated: 2026-03-15
## Next Steps: Test the feature end-to-end, consider adding email send from dialog in v2
