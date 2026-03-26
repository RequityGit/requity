-- Add sort_order column to unified_deals for kanban card reordering
ALTER TABLE unified_deals
ADD COLUMN IF NOT EXISTS sort_order integer;

-- Index for efficient ordering within each stage
CREATE INDEX IF NOT EXISTS idx_unified_deals_stage_sort_order
ON unified_deals (stage, sort_order NULLS LAST);
