# AI Condition Review - Tasks

## Phase 1: Backend
- [x] Migration: add condition_id to document_reviews
- [x] New API route: /api/deals/[dealId]/review-condition-document
- [x] Server actions: triggerConditionReview, getConditionReview

## Phase 2: Frontend
- [x] AI Review button in DocPreviewModal header (violet, with Sparkles icon)
- [x] AI Review results card (collapsible, criteria checklist, recommendation badge)
- [x] Loading state (animated progress bar)
- [x] Error state with retry
- [x] Action buttons: "Approve" on recommend-approve, "Request Revision" on recommend-revision (pre-fills feedback)
- [x] Auto-load existing review when modal opens
- [x] AI Review trigger on condition row hover actions (opens preview of first doc)
- [x] Typecheck clean

## Last Updated: 2026-03-15
