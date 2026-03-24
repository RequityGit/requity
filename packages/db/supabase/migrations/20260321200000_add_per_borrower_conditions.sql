-- Per-borrower condition system
-- Templates with per_borrower=true create one condition per borrower contact on the deal.

ALTER TABLE public.loan_condition_templates
  ADD COLUMN IF NOT EXISTS per_borrower boolean NOT NULL DEFAULT false;

ALTER TABLE public.loan_condition_templates
  ADD COLUMN IF NOT EXISTS is_borrower_facing boolean DEFAULT true;

-- Updated generate_deal_conditions and new generate_borrower_conditions
-- See migration applied via Supabase MCP for full function bodies
