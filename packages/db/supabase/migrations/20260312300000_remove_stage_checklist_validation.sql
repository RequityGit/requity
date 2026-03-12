-- ═══════════════════════════════════════════════════════════
-- Remove checklist validation from unified_advance_stage
-- The stage checklist UI was removed; this drops the
-- checklist requirement so deals can advance freely.
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION unified_advance_stage(
  p_deal_id UUID,
  p_new_stage TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stage TEXT;
BEGIN
  -- Get current stage
  SELECT stage INTO v_current_stage
  FROM unified_deals
  WHERE id = p_deal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal not found';
  END IF;

  IF v_current_stage = p_new_stage THEN
    RAISE EXCEPTION 'Deal is already in stage %', p_new_stage;
  END IF;

  -- Update the deal stage
  UPDATE unified_deals
  SET stage = p_new_stage,
      stage_entered_at = now(),
      updated_at = now()
  WHERE id = p_deal_id;

  -- Record stage history
  INSERT INTO unified_deal_stage_history (deal_id, from_stage, to_stage, notes, changed_by)
  VALUES (p_deal_id, v_current_stage, p_new_stage, p_notes, auth.uid());

  -- Log activity
  INSERT INTO unified_deal_activity (deal_id, activity_type, title, description, metadata)
  VALUES (
    p_deal_id,
    'stage_change',
    'Stage changed to ' || p_new_stage,
    CASE WHEN p_notes IS NOT NULL THEN p_notes ELSE NULL END,
    jsonb_build_object('from_stage', v_current_stage, 'to_stage', p_new_stage)
  );
END;
$$;
