-- Migration: Expand login access to all invited users
-- Adds 'unauthorized' activation_status for uninvited signups
-- Creates handle_new_user trigger to gate access

-- Step 1a: Add 'unauthorized' to activation_status CHECK constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_activation_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_activation_status_check
  CHECK (activation_status IN ('pending', 'link_sent', 'activated', 'unauthorized'));

-- Step 1b: Create handle_new_user trigger to gate uninvited signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- If profile already exists (from admin invite), skip
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    -- Invited via admin flow with role metadata
    INSERT INTO public.profiles (id, email, full_name, role, allowed_roles, activation_status)
    VALUES (
      NEW.id, NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.raw_user_meta_data->>'role',
      ARRAY[NEW.raw_user_meta_data->>'role'],
      CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN 'activated' ELSE 'pending' END
    ) ON CONFLICT (id) DO NOTHING;
  ELSE
    -- Uninvited user — create profile with 'unauthorized' status to block access
    INSERT INTO public.profiles (id, email, full_name, role, allowed_roles, activation_status)
    VALUES (
      NEW.id, NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      'investor', ARRAY[]::text[], 'unauthorized'
    ) ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
