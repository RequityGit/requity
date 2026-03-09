# Train Deal Doc Prompts - Context

## Key Files
- `packages/db/supabase/functions/review-document/index.ts` - Main edge function with all prompts and field mappings
- `apps/requity-os/app/api/deals/[dealId]/review-document/route.ts` - Backup Next.js API route
- `apps/requity-os/components/pipeline-v2/DocumentReviewPanel.tsx` - Review UI panel
- `packages/db/supabase/migrations/20260308950000_train_deal_doc_prompts.sql` - Migration

## Decisions Made
- loan_document field mappings target both jsonb columns (uw_data, property_data) and direct columns (amount)
- Direct column updates use empty string target_json_path ("") to distinguish from jsonb updates
- Auto deal note uses activity_type "ai_review" with metadata.auto_generated = true to distinguish from manual notes
- "other" type now has 13 common field mappings so any document can propose updates if it extracts matching data

## Gotchas
- The RPC uses format() with %I for column names which safely quotes identifiers
- Direct column update for "amount" passes the string value; PostgreSQL casts it to numeric automatically
- The edge function uses service role key so auto-note insert bypasses RLS (no created_by user)

## Dependencies
- Requires the document_reviews table and unified_deal_activity table to exist
- Edge function must be redeployed after changes

## Last Updated: 2026-03-08
## Next Steps: Deploy edge function, test with actual promissory note upload
