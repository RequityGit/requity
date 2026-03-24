# Diligence Tab - Context

## Key Files
- `components/pipeline/tabs/DocumentsTab.tsx` - Existing doc tab (~300 lines). Upload, AI review, visibility, delete.
- `components/pipeline/tabs/ConditionsTab.tsx` - Existing conditions tab (~800+ lines). Status workflow, note threads, uploads, category groups.
- `app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage.tsx` - Parent page with tab bar and content area (~900 lines).
- `app/(authenticated)/(admin)/pipeline/[id]/page.tsx` - Server route fetching data (~1165 lines). Fetches `unified_deal_conditions`, `unified_deal_documents`.
- `app/(authenticated)/(admin)/pipeline/[id]/actions.ts` - Server actions for documents and conditions.
- `components/pipeline/DocumentReviewPanel.tsx` - AI document analysis panel.
- `hooks/useDocumentReviewStatus.ts` - Realtime polling for review status.
- `lib/document-upload-utils.ts` - Upload helpers, file validation, formatting.
- `deal-sidebar-concept.jsx` - Concept JSX mockup (v6) with all features visualized.

## Database Tables
- `unified_deal_documents` - Deal documents. Has `condition_id` (nullable FK to conditions), `visibility`, `review_status`, `storage_path`, `category`.
- `unified_deal_conditions` - Deal conditions. Has `status` (condition_status enum), `category` (condition_category enum), `required_stage`, `notes`, `internal_description`, `due_date`, `critical_path_item`.
- Storage bucket: `loan-documents`, paths: `deals/{dealId}/{filename}`, `deals/{dealId}/conditions/{conditionId}/{filename}`

## Existing Patterns
- Documents use signed URLs for download/preview
- Conditions use ConditionNoteThread component with MentionInput for discussions
- Upload flow: get signed URL -> upload to storage -> save metadata record -> trigger AI analysis
- Status updates via `updateConditionStatusAction`
- Phase filters: "processing" covers ptf+ptc+ptd categories, "post_closing" covers post-closing categories

## Decisions Made
- Diligence tab replaces BOTH Documents and Conditions tabs (not alongside)
- All existing features preserved (no feature regression)
- Diligence tab only scope (no sidebar, no Activity relocation)
- Archive feature uses `archived_at` column on `unified_deal_documents`

## Gotchas Discovered
- `unified_deal_documents.condition_id` already exists - doc-to-condition linking just needs a client-side supabase update
- ConditionsTab is substantial (~800+ lines) with complex sub-components inline. Extracted ConditionRow component to avoid hooks-in-loop violation.
- DealDetailPage uses lazy tab mounting via `loadedTabs` Set - added "Diligence" to this pattern
- Tab URL param backward compat: ?tab=conditions and ?tab=documents now resolve to ?tab=diligence
- Archive and doc-linking use client-side supabase calls (not server actions) since they're simple single-field updates
- Pinned notes save to `internal_description` on `unified_deal_conditions`

## Dependencies
- This task depends on: existing DocumentsTab and ConditionsTab being stable (they are)
- Nothing currently depends on this task

## Last Updated: 2026-03-15
## Status: All phases complete. Ready for QA testing.
## Next Steps:
- Push migration (`npx supabase db push`) to add `archived_at` column
- Test on portal: navigate to a deal, verify Diligence tab loads with both docs and conditions
- Test backward compat: visit `?tab=conditions` and `?tab=documents` URLs
- Verify archive toggle, doc-to-condition linking, pinned notes
- Delete old DocumentsTab.tsx and ConditionsTab.tsx after confirming everything works
