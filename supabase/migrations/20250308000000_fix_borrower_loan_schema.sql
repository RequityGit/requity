-- =============================================================================
-- Fix Borrower-Loan Schema
-- =============================================================================
-- Fixes two root causes of the "schema cache" error on loan creation:
--
-- 1. The `borrowers` table was created directly in the Supabase dashboard and
--    never added to migrations. The `crm_system` migration already references
--    it, so it must exist before that migration can run on a fresh DB.
--
-- 2. `loans.borrower_id` was FK-constrained to `profiles(id)` (auth users),
--    but the entire admin UI populates loans from the `borrowers` CRM table.
--    This caused a silent FK violation on every loan creation attempt. We
--    re-point the FK to `borrowers(id)` and add an optional `profile_id`
--    column for borrowers who also have portal access.
--
-- 3. Several columns added in the `loan_pipeline` migration may not exist on
--    databases that were created before that migration was applied. We add
--    them all safely with ADD COLUMN IF NOT EXISTS.
--
-- 4. Ends with NOTIFY pgrst, 'reload schema' so PostgREST picks up all
--    changes immediately.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. CREATE borrowers TABLE (IF NOT EXISTS)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.borrowers (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now(),
  first_name           text NOT NULL,
  last_name            text NOT NULL,
  email                text,
  phone                text,
  address_line1        text,
  address_line2        text,
  city                 text,
  state                text,
  zip                  text,
  country              text NOT NULL DEFAULT 'US',
  ssn_last_four        text,
  date_of_birth        date,
  is_us_citizen        boolean NOT NULL DEFAULT true,
  credit_score         integer,
  credit_report_date   date,
  experience_count     integer NOT NULL DEFAULT 0,
  notes                text
);

-- updated_at trigger (function already exists from initial_schema)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_borrowers_updated_at'
      AND tgrelid = 'public.borrowers'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER set_borrowers_updated_at
      BEFORE UPDATE ON public.borrowers
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at()';
  END IF;
END
$$;

ALTER TABLE public.borrowers ENABLE ROW LEVEL SECURITY;

-- Admin policies (idempotent with DO blocks)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'borrowers' AND policyname = 'Admins can select borrowers') THEN
    CREATE POLICY "Admins can select borrowers" ON public.borrowers FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'borrowers' AND policyname = 'Admins can insert borrowers') THEN
    CREATE POLICY "Admins can insert borrowers" ON public.borrowers FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'borrowers' AND policyname = 'Admins can update borrowers') THEN
    CREATE POLICY "Admins can update borrowers" ON public.borrowers FOR UPDATE
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'borrowers' AND policyname = 'Admins can delete borrowers') THEN
    CREATE POLICY "Admins can delete borrowers" ON public.borrowers FOR DELETE
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. CREATE borrower_entities TABLE (IF NOT EXISTS)
--    (References borrowers — must come after borrowers exists)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.borrower_entities (
  id                             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at                     timestamptz DEFAULT now(),
  updated_at                     timestamptz DEFAULT now(),
  borrower_id                    uuid REFERENCES public.borrowers(id) ON DELETE CASCADE NOT NULL,
  entity_name                    text NOT NULL,
  entity_type                    text NOT NULL,
  ein                            text,
  state_of_formation             text,
  address_line1                  text,
  address_line2                  text,
  city                           text,
  state                          text,
  zip                            text,
  country                        text NOT NULL DEFAULT 'US',
  operating_agreement_url        text,
  articles_of_org_url            text,
  certificate_good_standing_url  text,
  ein_letter_url                 text,
  is_foreign_filed               boolean NOT NULL DEFAULT false,
  foreign_filed_states           text[],
  notes                          text
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_borrower_entities_updated_at'
      AND tgrelid = 'public.borrower_entities'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER set_borrower_entities_updated_at
      BEFORE UPDATE ON public.borrower_entities
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at()';
  END IF;
END
$$;

ALTER TABLE public.borrower_entities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'borrower_entities' AND policyname = 'Admins can select borrower_entities') THEN
    CREATE POLICY "Admins can select borrower_entities" ON public.borrower_entities FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'borrower_entities' AND policyname = 'Admins can insert borrower_entities') THEN
    CREATE POLICY "Admins can insert borrower_entities" ON public.borrower_entities FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'borrower_entities' AND policyname = 'Admins can update borrower_entities') THEN
    CREATE POLICY "Admins can update borrower_entities" ON public.borrower_entities FOR UPDATE
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'borrower_entities' AND policyname = 'Admins can delete borrower_entities') THEN
    CREATE POLICY "Admins can delete borrower_entities" ON public.borrower_entities FOR DELETE
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. RE-POINT loans.borrower_id → borrowers(id)
--    Drop the old FK that incorrectly pointed to profiles(id), then add a new
--    one pointing to borrowers(id). NOT VALID skips re-checking existing rows
--    so this is safe on databases that already have data.
-- ---------------------------------------------------------------------------
ALTER TABLE public.loans DROP CONSTRAINT IF EXISTS loans_borrower_id_fkey;

-- Re-add constraint pointing to the correct table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'loans_borrower_id_fkey'
      AND conrelid = 'public.loans'::regclass
  ) THEN
    ALTER TABLE public.loans
      ADD CONSTRAINT loans_borrower_id_fkey
      FOREIGN KEY (borrower_id) REFERENCES public.borrowers(id)
      NOT VALID;  -- skip checking pre-existing rows
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 4. ADD profile_id TO loans
--    Optional link to an auth user (profiles) so the borrower portal can
--    filter loans by the logged-in user. Set when the borrower also has
--    a portal account.
-- ---------------------------------------------------------------------------
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_loans_profile_id ON public.loans(profile_id);

-- ---------------------------------------------------------------------------
-- 5. UPDATE RLS: "Borrowers can view own loans"
--    The old policy used `borrower_id = auth.uid()` which only worked when
--    borrower_id referenced profiles. Now it checks profile_id instead.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Borrowers can view own loans" ON public.loans;

CREATE POLICY "Borrowers can view own loans"
  ON public.loans FOR SELECT
  USING (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6. ENSURE ALL LOAN PIPELINE COLUMNS EXIST
--    These were added in loan_pipeline and ensure_loan_columns migrations but
--    may be missing on databases where those migrations weren't applied.
-- ---------------------------------------------------------------------------

-- From initial_schema (may be missing if table was created before migration)
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS property_address   text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS property_city      text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS property_state     text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS property_zip       text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS appraised_value    numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS interest_rate      numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS term_months        int;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS origination_date   date;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS maturity_date      date;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS stage_updated_at   timestamptz DEFAULT now();
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS originator         text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS notes              text;

-- From loan_pipeline migration
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS processor_id       uuid REFERENCES public.profiles(id);
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS underwriter_id     uuid REFERENCES public.profiles(id);
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS closer_id          uuid REFERENCES public.profiles(id);
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS originator_id      uuid REFERENCES public.profiles(id);
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS priority           text DEFAULT 'normal';
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS next_action        text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS expected_close_date date;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS purchase_price     numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS arv                numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS points             numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS origination_fee   numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS extension_options  text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS prepayment_terms   text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS application_date   date;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS approval_date      date;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS actual_close_date  date;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS deleted_at         timestamptz;

-- Useful indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_loans_processor_id      ON public.loans(processor_id);
CREATE INDEX IF NOT EXISTS idx_loans_originator_id     ON public.loans(originator_id);
CREATE INDEX IF NOT EXISTS idx_loans_priority          ON public.loans(priority);
CREATE INDEX IF NOT EXISTS idx_loans_stage             ON public.loans(stage);
CREATE INDEX IF NOT EXISTS idx_loans_expected_close_date ON public.loans(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_loans_borrower_id       ON public.loans(borrower_id);
CREATE INDEX IF NOT EXISTS idx_loans_deleted_at        ON public.loans(deleted_at);

-- ---------------------------------------------------------------------------
-- 7. UPDATE loan_type CHECK CONSTRAINT to include 'dscr'
-- ---------------------------------------------------------------------------
ALTER TABLE public.loans DROP CONSTRAINT IF EXISTS loans_loan_type_check;
ALTER TABLE public.loans ADD CONSTRAINT loans_loan_type_check
  CHECK (loan_type IN (
    'bridge_residential', 'bridge_commercial', 'fix_and_flip',
    'ground_up', 'stabilized', 'dscr', 'other'
  ));

-- ---------------------------------------------------------------------------
-- 8. UPDATE stage CHECK CONSTRAINT to include pipeline stages
-- ---------------------------------------------------------------------------
ALTER TABLE public.loans DROP CONSTRAINT IF EXISTS loans_stage_check;
ALTER TABLE public.loans ADD CONSTRAINT loans_stage_check
  CHECK (stage IN (
    'lead', 'application', 'processing', 'underwriting', 'approved',
    'clear_to_close', 'funded', 'servicing', 'payoff', 'default', 'reo', 'paid_off'
  ));

-- ---------------------------------------------------------------------------
-- 9. FORCE POSTGREST TO RELOAD ITS SCHEMA CACHE
-- ---------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
