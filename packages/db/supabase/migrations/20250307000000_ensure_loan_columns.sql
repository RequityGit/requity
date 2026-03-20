-- =============================================================================
-- Ensure loans table has all required columns
-- =============================================================================
-- Fixes: "Could not find the 'property_address' column of 'loans' in the schema cache"
-- These columns are defined in the initial schema and loan_pipeline migrations
-- but may be missing if the table was created outside of migrations or if the
-- PostgREST schema cache is stale.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. CORE COLUMNS (from initial_schema migration)
-- ---------------------------------------------------------------------------
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS property_address text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS property_city text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS property_state text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS property_zip text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS appraised_value numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS interest_rate numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS term_months int;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS origination_date date;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS maturity_date date;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS stage_updated_at timestamptz DEFAULT now();
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS originator text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS notes text;

-- ---------------------------------------------------------------------------
-- 2. PIPELINE COLUMNS (from loan_pipeline migration)
-- ---------------------------------------------------------------------------
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS processor_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS underwriter_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS closer_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS originator_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS next_action text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS expected_close_date date;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS purchase_price numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS arv numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS points numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS origination_fee numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS extension_options text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS prepayment_terms text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS application_date date;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS approval_date date;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS actual_close_date date;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ---------------------------------------------------------------------------
-- 3. FORCE POSTGREST TO RELOAD ITS SCHEMA CACHE
-- ---------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
