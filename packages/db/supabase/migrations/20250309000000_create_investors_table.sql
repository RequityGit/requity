-- =============================================================================
-- Create / Formalise Investors Table
-- =============================================================================
-- The investors table may have been created directly in the Supabase dashboard
-- without a migration. This migration ensures it exists with proper defaults,
-- constraints, RLS policies, and triggers.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. CREATE investors TABLE (IF NOT EXISTS)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.investors (
  id                         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name                 text NOT NULL,
  last_name                  text NOT NULL,
  email                      text NOT NULL UNIQUE,
  phone                      text,
  address_line1              text,
  address_line2              text,
  city                       text,
  state                      text,
  zip                        text,
  country                    text NOT NULL DEFAULT 'US',
  accreditation_status       text NOT NULL DEFAULT 'pending'
    CHECK (accreditation_status IN ('pending', 'verified', 'expired', 'not_accredited')),
  accreditation_verified_at  timestamptz,
  notes                      text,
  user_id                    uuid REFERENCES public.profiles(id),
  created_at                 timestamptz DEFAULT now(),
  updated_at                 timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. Backfill any existing NULL accreditation_status rows
-- ---------------------------------------------------------------------------
UPDATE public.investors
  SET accreditation_status = 'pending'
  WHERE accreditation_status IS NULL;

-- ---------------------------------------------------------------------------
-- 3. Ensure DEFAULT and NOT NULL on accreditation_status for tables that
--    already exist but lack the constraint
-- ---------------------------------------------------------------------------
ALTER TABLE public.investors
  ALTER COLUMN accreditation_status SET DEFAULT 'pending';

ALTER TABLE public.investors
  ALTER COLUMN accreditation_status SET NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. updated_at trigger (function already exists from initial_schema)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_investors_updated_at'
      AND tgrelid = 'public.investors'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER set_investors_updated_at
      BEFORE UPDATE ON public.investors
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at()';
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 5. Enable RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 6. Admin RLS policies
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'investors' AND policyname = 'Admins can select investors') THEN
    CREATE POLICY "Admins can select investors" ON public.investors FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'investors' AND policyname = 'Admins can insert investors') THEN
    CREATE POLICY "Admins can insert investors" ON public.investors FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'investors' AND policyname = 'Admins can update investors') THEN
    CREATE POLICY "Admins can update investors" ON public.investors FOR UPDATE
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'investors' AND policyname = 'Admins can delete investors') THEN
    CREATE POLICY "Admins can delete investors" ON public.investors FOR DELETE
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 7. Investor self-access policy (for portal users linked via user_id)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'investors' AND policyname = 'Investors can view own record') THEN
    CREATE POLICY "Investors can view own record" ON public.investors FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 8. Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_investors_email    ON public.investors(email);
CREATE INDEX IF NOT EXISTS idx_investors_user_id  ON public.investors(user_id);

-- ---------------------------------------------------------------------------
-- 9. Force PostgREST to reload schema cache
-- ---------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
