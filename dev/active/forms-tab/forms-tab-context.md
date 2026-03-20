# Forms Tab - Context

## Key Files
- DealDetailPage.tsx: Tab container, lazy-load pattern with loadedTabs Set
- form_submissions table: has deal_id column for linking
- form_definitions table: steps JSONB has field labels and structure
- deal_application_links table: token-based pre-filled form URLs

## Decisions Made
- Forms tab placed between Borrower and Diligence in tab order
- Dedicated tab (not embedded in Diligence) because form submissions are structured data, not file attachments
- Client-side fetching via Supabase client (consistent with BorrowerContactsTab pattern)

## Last Updated: 2026-03-20
