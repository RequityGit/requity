-- Add template file columns to the master template library
ALTER TABLE public.loan_condition_templates
  ADD COLUMN IF NOT EXISTS template_file_url text,
  ADD COLUMN IF NOT EXISTS template_file_name text;

-- Add template file columns to deal-specific conditions (copied from template at generation time)
ALTER TABLE public.unified_deal_conditions
  ADD COLUMN IF NOT EXISTS template_file_url text,
  ADD COLUMN IF NOT EXISTS template_file_name text;

-- Create condition-templates storage bucket (public for borrower downloads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('condition-templates', 'condition-templates', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Admins can upload condition templates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'condition-templates');

CREATE POLICY "Admins can update condition templates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'condition-templates');

CREATE POLICY "Admins can delete condition templates"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'condition-templates');

CREATE POLICY "Public can read condition templates"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'condition-templates');

-- Update generate_deal_conditions to copy template file fields
CREATE OR REPLACE FUNCTION public.generate_deal_conditions(p_deal_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_slug text;
  v_count integer := 0;
  v_contact record;
  v_template record;
BEGIN
  SELECT ct.slug INTO v_slug
  FROM public.unified_deals d
  JOIN public.unified_card_types ct ON ct.id = d.card_type_id
  WHERE d.id = p_deal_id;

  IF v_slug IS NULL THEN
    RAISE EXCEPTION 'Deal not found or has no card type: %', p_deal_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.unified_deal_conditions
    WHERE deal_id = p_deal_id
  ) THEN
    RETURN 0;
  END IF;

  INSERT INTO public.unified_deal_conditions (
    deal_id, template_id, condition_name, category, required_stage,
    internal_description, borrower_description, responsible_party,
    critical_path_item, is_required, sort_order, requires_approval,
    template_file_url, template_file_name
  )
  SELECT
    p_deal_id, t.id, t.condition_name, t.category::text, t.required_stage::text,
    t.internal_description, t.borrower_description, t.responsible_party,
    COALESCE(t.critical_path_item, false), true, t.sort_order,
    COALESCE(t.requires_approval, false),
    t.template_file_url, t.template_file_name
  FROM public.loan_condition_templates t
  WHERE t.is_active = true
    AND t.per_borrower = false
    AND (
      (v_slug IN ('comm_equity', 'comm_debt') AND t.applies_to_commercial = true) OR
      (v_slug = 'res_debt_dscr' AND t.applies_to_dscr = true) OR
      (v_slug = 'res_debt_rtl' AND t.applies_to_rtl = true)
    )
  ORDER BY t.sort_order;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  FOR v_contact IN
    SELECT dc.contact_id, cc.first_name, cc.last_name
    FROM public.deal_contacts dc
    JOIN public.crm_contacts cc ON cc.id = dc.contact_id
    WHERE dc.deal_id = p_deal_id
    ORDER BY dc.sort_order
  LOOP
    FOR v_template IN
      SELECT t.*
      FROM public.loan_condition_templates t
      WHERE t.is_active = true
        AND t.per_borrower = true
        AND (
          (v_slug IN ('comm_equity', 'comm_debt') AND t.applies_to_commercial = true) OR
          (v_slug = 'res_debt_dscr' AND t.applies_to_dscr = true) OR
          (v_slug = 'res_debt_rtl' AND t.applies_to_rtl = true)
        )
      ORDER BY t.sort_order
    LOOP
      INSERT INTO public.unified_deal_conditions (
        deal_id, template_id, condition_name, category, required_stage,
        internal_description, borrower_description, responsible_party,
        critical_path_item, is_required, sort_order, requires_approval,
        assigned_contact_id, template_file_url, template_file_name
      )
      VALUES (
        p_deal_id, v_template.id,
        v_template.condition_name || ' - ' || COALESCE(v_contact.first_name, '') || ' ' || COALESCE(v_contact.last_name, ''),
        v_template.category::text, v_template.required_stage::text,
        v_template.internal_description, v_template.borrower_description, v_template.responsible_party,
        COALESCE(v_template.critical_path_item, false), true, v_template.sort_order,
        COALESCE(v_template.requires_approval, false),
        v_contact.contact_id, v_template.template_file_url, v_template.template_file_name
      );
      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$function$;

-- Update generate_borrower_conditions to copy template file fields
CREATE OR REPLACE FUNCTION public.generate_borrower_conditions(p_deal_id uuid, p_contact_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_slug text;
  v_count integer := 0;
  v_contact_name text;
BEGIN
  SELECT ct.slug INTO v_slug
  FROM public.unified_deals d
  JOIN public.unified_card_types ct ON ct.id = d.card_type_id
  WHERE d.id = p_deal_id;

  IF v_slug IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')
  INTO v_contact_name
  FROM public.crm_contacts
  WHERE id = p_contact_id;

  IF EXISTS (
    SELECT 1 FROM public.unified_deal_conditions
    WHERE deal_id = p_deal_id AND assigned_contact_id = p_contact_id
  ) THEN
    RETURN 0;
  END IF;

  INSERT INTO public.unified_deal_conditions (
    deal_id, template_id, condition_name, category, required_stage,
    internal_description, borrower_description, responsible_party,
    critical_path_item, is_required, sort_order, requires_approval,
    assigned_contact_id, template_file_url, template_file_name
  )
  SELECT
    p_deal_id, t.id, t.condition_name || ' - ' || v_contact_name,
    t.category::text, t.required_stage::text,
    t.internal_description, t.borrower_description, t.responsible_party,
    COALESCE(t.critical_path_item, false), true, t.sort_order,
    COALESCE(t.requires_approval, false),
    p_contact_id, t.template_file_url, t.template_file_name
  FROM public.loan_condition_templates t
  WHERE t.is_active = true
    AND t.per_borrower = true
    AND (
      (v_slug IN ('comm_equity', 'comm_debt') AND t.applies_to_commercial = true) OR
      (v_slug = 'res_debt_dscr' AND t.applies_to_dscr = true) OR
      (v_slug = 'res_debt_rtl' AND t.applies_to_rtl = true)
    )
  ORDER BY t.sort_order;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;
