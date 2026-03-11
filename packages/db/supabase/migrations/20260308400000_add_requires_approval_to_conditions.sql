-- Add requires_approval to condition templates
ALTER TABLE public.loan_condition_templates
  ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT false;

-- Add requires_approval to deal conditions
ALTER TABLE public.unified_deal_conditions
  ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT false;

-- Update generate_deal_conditions to copy requires_approval from templates
CREATE OR REPLACE FUNCTION public.generate_deal_conditions(p_deal_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_slug text;
  v_count integer := 0;
BEGIN
  -- Get the card type slug for this deal
  SELECT ct.slug INTO v_slug
  FROM public.unified_deals d
  JOIN public.unified_card_types ct ON ct.id = d.card_type_id
  WHERE d.id = p_deal_id;

  IF v_slug IS NULL THEN
    RAISE EXCEPTION 'Deal not found or has no card type: %', p_deal_id;
  END IF;

  -- Don't duplicate: skip if conditions already exist
  IF EXISTS (
    SELECT 1 FROM public.unified_deal_conditions
    WHERE deal_id = p_deal_id
  ) THEN
    RETURN 0;
  END IF;

  -- Insert conditions from matching active templates
  INSERT INTO public.unified_deal_conditions (
    deal_id, template_id, condition_name, category, required_stage,
    internal_description, borrower_description, responsible_party,
    critical_path_item, is_required, sort_order, requires_approval
  )
  SELECT
    p_deal_id,
    t.id,
    t.condition_name,
    t.category::text,
    t.required_stage::text,
    t.internal_description,
    t.borrower_description,
    t.responsible_party,
    COALESCE(t.critical_path_item, false),
    true,
    t.sort_order,
    COALESCE(t.requires_approval, false)
  FROM public.loan_condition_templates t
  WHERE t.is_active = true
    AND (
      (v_slug IN ('comm_equity', 'comm_debt') AND t.applies_to_commercial = true) OR
      (v_slug = 'res_debt_dscr' AND t.applies_to_dscr = true) OR
      (v_slug = 'res_debt_rtl' AND t.applies_to_rtl = true)
    )
  ORDER BY t.sort_order;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
