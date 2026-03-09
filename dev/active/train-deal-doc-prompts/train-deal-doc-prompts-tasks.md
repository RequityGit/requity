# Train Deal Doc Prompts - Tasks

## Phase 1: Edge Function Updates
- [x] Add loan_document to DocumentType union
- [x] Add filename patterns for loan docs (promissory note, loan agreement, etc.)
- [x] Add loan_document to classification prompt
- [x] Create detailed extraction prompt for loan_document type
- [x] Expand "other" extraction prompt to use known field names
- [x] Add loan_document field mappings (21 fields)
- [x] Add "other" field mappings (13 common fields)
- [x] Update review item building to handle direct columns (empty target_json_path)
- [x] Add auto deal note creation after review completes
- [x] Add loan_document to DOC_TYPE_LABELS

## Phase 2: Database Migration
- [x] Update document_type check constraint
- [x] Update apply_document_review RPC for direct column support
- [x] Apply migration to production

## Phase 3: Sync & UI
- [x] Update Next.js API route with loan_document type
- [x] Update classification prompt in API route
- [x] Update extraction prompt in API route for loan_document and other
- [x] Update DOC_TYPE_LABELS in DocumentReviewPanel

## Phase 4: Verify
- [x] Build passes (pnpm build)
- [ ] Test with actual document upload (manual)

## Last Updated: 2026-03-08
