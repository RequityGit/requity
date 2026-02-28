-- =============================================================================
-- Rename description → internal_description on condition tables
-- Add new columns to condition_templates
-- Add prior_to_approval / prior_to_funding to category CHECK constraints
-- Rename is_critical_path → critical_path_item
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. condition_templates: rename description → internal_description, add new columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.condition_templates
  RENAME COLUMN description TO internal_description;

ALTER TABLE public.condition_templates
  ADD COLUMN IF NOT EXISTS borrower_description text,
  ADD COLUMN IF NOT EXISTS responsible_party text DEFAULT 'borrower',
  ADD COLUMN IF NOT EXISTS critical_path_item boolean DEFAULT false;

-- Add CHECK constraint for responsible_party on condition_templates
ALTER TABLE public.condition_templates
  ADD CONSTRAINT condition_templates_responsible_party_check
  CHECK (responsible_party IN (
    'borrower', 'broker', 'title_company', 'insurance_agent', 'internal', 'attorney', 'other'
  ));

-- ---------------------------------------------------------------------------
-- 2. condition_template_items: rename description → internal_description,
--    rename is_critical_path → critical_path_item
-- ---------------------------------------------------------------------------
ALTER TABLE public.condition_template_items
  RENAME COLUMN description TO internal_description;

ALTER TABLE public.condition_template_items
  RENAME COLUMN is_critical_path TO critical_path_item;

-- Update category CHECK to include new values
ALTER TABLE public.condition_template_items
  DROP CONSTRAINT IF EXISTS condition_template_items_category_check;
ALTER TABLE public.condition_template_items
  ADD CONSTRAINT condition_template_items_category_check
  CHECK (category IN ('pta', 'ptf', 'prior_to_approval', 'prior_to_funding'));

-- ---------------------------------------------------------------------------
-- 3. loan_conditions: rename description → internal_description,
--    rename is_critical_path → critical_path_item
-- ---------------------------------------------------------------------------
ALTER TABLE public.loan_conditions
  RENAME COLUMN description TO internal_description;

ALTER TABLE public.loan_conditions
  RENAME COLUMN is_critical_path TO critical_path_item;

-- Update category CHECK to include new values
ALTER TABLE public.loan_conditions
  DROP CONSTRAINT IF EXISTS loan_conditions_category_check;
ALTER TABLE public.loan_conditions
  ADD CONSTRAINT loan_conditions_category_check
  CHECK (category IN ('pta', 'ptf', 'prior_to_approval', 'prior_to_funding'));
