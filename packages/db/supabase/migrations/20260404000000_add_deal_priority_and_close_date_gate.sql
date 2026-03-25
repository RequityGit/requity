-- Add priority/pin column to unified_deals
ALTER TABLE unified_deals ADD COLUMN IF NOT EXISTS is_priority BOOLEAN NOT NULL DEFAULT false;

-- Update unified_advance_stage to require expected_close_date when leaving lead
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
  v_close_date DATE;
BEGIN
  -- Get current stage and close date
  SELECT stage, expected_close_date INTO v_current_stage, v_close_date
  FROM unified_deals
  WHERE id = p_deal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal not found';
  END IF;

  IF v_current_stage = p_new_stage THEN
    RAISE EXCEPTION 'Deal is already in stage %', p_new_stage;
  END IF;

  -- Gate: closing date required to leave lead
  IF v_current_stage = 'lead' AND p_new_stage != 'lead' AND v_close_date IS NULL THEN
    RAISE EXCEPTION 'Closing date is required to move past Intake';
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
