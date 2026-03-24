# AI Condition Review - Implementation Plan

## Objective
Add condition-aware AI document review that uses "What to Look For" (template_guidance) as review criteria, producing pass/fail assessments per criterion with an overall recommendation.

## Scope
- IN: New API route for condition-aware review, UI in DocPreviewModal, condition row trigger, migration
- OUT: Batch review of all conditions, automated approval without human confirmation, changes to existing generic review-document route

## Approach
1. Migration: add condition_id to document_reviews
2. New API: /api/deals/[dealId]/review-condition-document
3. Server actions for triggering and fetching reviews
4. UI in DocPreviewModal (primary) and condition row (shortcut trigger)

## Files to Create/Modify
- NEW: app/api/deals/[dealId]/review-condition-document/route.ts
- MODIFY: components/pipeline/tabs/DiligenceTab.tsx (DocPreviewModal + ConditionRow)
- MODIFY: app/(authenticated)/(admin)/pipeline/[id]/actions.ts (new actions)
- NEW: Migration for condition_id on document_reviews

## Success Criteria
- Click "AI Review" in preview modal, see criteria-by-criteria assessment in ~10s
- template_guidance parsed into discrete criteria, each evaluated
- Human always makes final call
