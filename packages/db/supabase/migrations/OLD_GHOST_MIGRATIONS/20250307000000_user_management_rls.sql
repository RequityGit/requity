-- Migration: User Management RLS policies & auth trigger
-- Adds missing policies so admins can manage all profiles,
-- and creates an auto-profile trigger for new auth users.

-- =========================================================================
-- 1. Admin INSERT policy on profiles (admins can create profiles for invited users)
-- =========================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Admins can insert profiles'
  ) THEN
    EXECUTE format(
      'CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (is_admin())'
    );
  END IF;
END
$$;

-- =========================================================================
-- 2. Admin UPDATE policy on profiles (admins can update any profile)
-- =========================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Admins can update all profiles'
  ) THEN
    EXECUTE format(
      'CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin())'
    );
  END IF;
END
$$;

-- =========================================================================
-- 3. Trigger to auto-create a profiles row when a new auth user is created
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, allowed_roles, activation_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'investor')::user_role,
    ARRAY[COALESCE((NEW.raw_user_meta_data->>'role')::text, 'investor')]::user_role[],
    CASE
      WHEN NEW.email_confirmed_at IS NOT NULL THEN 'activated'
      ELSE 'pending'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Drop existing trigger if any, then re-create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
