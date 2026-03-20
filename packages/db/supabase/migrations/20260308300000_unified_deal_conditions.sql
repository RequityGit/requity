-- ═══════════════════════════════════════════════════════════
-- Migration: unified_deal_conditions
-- Generates loan conditions from loan_condition_templates
-- when a unified deal is created (pipeline-v2).
-- ═══════════════════════════════════════════════════════════

-- ─── Table ───

CREATE TABLE IF NOT EXISTS public.unified_deal_conditions (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id             uuid NOT NULL REFERENCES public.unified_deals(id) ON DELETE CASCADE,
  template_id         uuid REFERENCES public.loan_condition_templates(id),
  condition_name      text NOT NULL,
  category            text NOT NULL DEFAULT 'borrower_documents',
  required_stage      text NOT NULL DEFAULT 'processing',
  status              text NOT NULL DEFAULT 'pending',
  internal_description text,
  borrower_description text,
  responsible_party   text,
  critical_path_item  boolean DEFAULT false,
  is_required         boolean DEFAULT true,
  sort_order          int DEFAULT 0,
  notes               text,
  document_urls       text[],
  due_date            date,
  assigned_to         uuid REFERENCES auth.users(id),
  submitted_at        timestamptz,
  reviewed_at         timestamptz,
  reviewed_by         uuid REFERENCES auth.users(id),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ─── Indexes ───

CREATE INDEX IF NOT EXISTS idx_unified_deal_conditions_deal_id
  ON public.unified_deal_conditions(deal_id);

CREATE INDEX IF NOT EXISTS idx_unified_deal_conditions_status
  ON public.unified_deal_conditions(status);

CREATE INDEX IF NOT EXISTS idx_unified_deal_conditions_category
  ON public.unified_deal_conditions(category);

-- ─── Updated-at trigger ───

CREATE OR REPLACE TRIGGER set_unified_deal_conditions_updated_at
  BEFORE UPDATE ON public.unified_deal_conditions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ─── RLS ───

ALTER TABLE public.unified_deal_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to unified_deal_conditions"
  ON public.unified_deal_conditions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('super_admin', 'admin')
    )
  );

-- ─── Generator function ───

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
    critical_path_item, is_required, sort_order
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
    t.sort_order
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
