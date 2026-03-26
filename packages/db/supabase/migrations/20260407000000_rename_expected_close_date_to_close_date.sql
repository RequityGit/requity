-- Rename expected_close_date to close_date on unified_deals
ALTER TABLE public.unified_deals RENAME COLUMN expected_close_date TO close_date;

-- Backfill from uw_data where column is null
UPDATE public.unified_deals
SET close_date = COALESCE(
  (uw_data->>'expected_close_date')::date,
  (uw_data->>'closing_date')::date
)
WHERE close_date IS NULL
  AND (uw_data->>'expected_close_date' IS NOT NULL
       OR uw_data->>'closing_date' IS NOT NULL);

-- Update the field_configurations registry
UPDATE public.field_configurations
SET field_key = 'close_date'
WHERE field_key = 'expected_close_date'
  AND module = 'uw_deal';

-- Update unified_card_types: rename field_key in uw_field_refs JSONB arrays
UPDATE public.unified_card_types
SET uw_field_refs = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'field_key' = 'expected_close_date'
      THEN jsonb_set(elem, '{field_key}', '"close_date"')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(uw_field_refs) AS elem
)
WHERE uw_field_refs::text LIKE '%expected_close_date%';

-- Update the stage-gate function to use new column name
CREATE OR REPLACE FUNCTION public.unified_advance_stage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stage  text;
  v_close_date     date;
  v_priority       int;
BEGIN
  -- Only fire when stage actually changes
  IF NEW.stage IS NOT DISTINCT FROM OLD.stage THEN
    RETURN NEW;
  END IF;

  SELECT stage, close_date INTO v_current_stage, v_close_date
  FROM public.unified_deals
  WHERE id = NEW.id;

  -- Gate: require close_date before advancing past "Underwriting"
  IF NEW.stage IN ('Approved', 'Closing', 'Funded', 'Won')
     AND v_close_date IS NULL THEN
    RAISE EXCEPTION 'A closing date is required before advancing to %', NEW.stage;
  END IF;

  -- Record stage history
  INSERT INTO public.unified_deal_stage_history (deal_id, from_stage, to_stage, changed_by)
  VALUES (NEW.id, OLD.stage, NEW.stage, auth.uid());

  RETURN NEW;
END;
$$;
