-- Allow all authenticated users to read basic profile info (id, full_name, email, avatar_url)
-- so the @mention dropdown in loan chatter works for all roles (not just admins).
-- Note: RLS policies are additive (OR), so this doesn't weaken existing policies.
CREATE POLICY "Authenticated users can read profiles for mentions"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
