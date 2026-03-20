# Train Deal Doc Prompts - Implementation Plan

## Objective
Improve AI Document Review to extract deal-updatable fields from loan documents (promissory notes, participation agreements, etc.) and auto-create deal notes with document summaries.

## Scope
- IN: New loan_document type, expanded "other" type extraction, direct column support in RPC, auto deal notes
- OUT: UI redesign, new database tables, changes to other document types

## Approach
1. Add `loan_document` as a new document type with filename patterns, classification, and extraction prompt
2. Update "other" type extraction to use known field names for deal mapping
3. Add field mappings for loan documents (borrower, entity, address, loan amount, rates, etc.)
4. Support direct column updates (e.g., `amount`) in addition to jsonb paths
5. Auto-create deal activity note when AI review completes
6. Update DB constraint and RPC to handle new type and direct columns

## Files Modified
- `packages/db/supabase/functions/review-document/index.ts` - Edge function (prompts, mappings, auto-note)
- `apps/requity-os/app/api/deals/[dealId]/review-document/route.ts` - Next.js API route (sync)
- `apps/requity-os/components/pipeline-v2/DocumentReviewPanel.tsx` - UI label
- `packages/db/supabase/migrations/20260308950000_train_deal_doc_prompts.sql` - DB migration

## Database Changes
- Updated `document_reviews.document_type` check constraint to include `loan_document`
- Updated `apply_document_review` RPC to handle direct column updates (empty target_json_path)

## Success Criteria
- Promissory notes/loan docs classified as `loan_document` with field proposals
- "Other" type docs also produce field proposals where data matches known fields
- Deal note auto-created in activity feed when review completes
- Direct column updates (like `amount`) work through the RPC
