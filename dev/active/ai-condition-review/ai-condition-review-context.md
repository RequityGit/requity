# AI Condition Review - Context

## Key Files
| File | Purpose |
|------|---------|
| app/api/deals/[dealId]/review-document/route.ts | Existing generic AI review (reference pattern) |
| app/api/deals/[dealId]/review-condition-document/route.ts | NEW: Condition-aware review |
| components/pipeline/DocumentReviewPanel.tsx | Existing review panel (field extraction UI) |
| components/pipeline/tabs/DiligenceTab.tsx | DocPreviewModal + ConditionRow (add AI review UI) |
| pipeline/[id]/actions.ts | Server actions |

## Decisions Made
- Condition-aware review is a separate route from generic review (don't modify existing)
- Primary UI in DocPreviewModal, condition row has shortcut trigger
- Results stored in existing document_reviews table with new condition_id FK
- Claude vision with base64 document + condition-specific prompt
- Human-in-the-loop: AI recommends, human decides

## Last Updated: 2026-03-15
