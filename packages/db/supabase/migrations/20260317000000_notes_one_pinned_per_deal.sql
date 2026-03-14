-- One pinned note per deal: partial unique index.
-- notes already has is_pinned; we only add the constraint.
CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_one_pinned_per_deal
ON notes (deal_id)
WHERE is_pinned = true AND deal_id IS NOT NULL;
