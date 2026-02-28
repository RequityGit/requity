-- Add activation_status to profiles for the investor onboarding flow:
--   pending   = investor created by admin, no invite sent yet
--   link_sent = admin clicked "Send Portal Activation Link"
--   activated = investor signed in for the first time
--
-- Uses IF NOT EXISTS so this migration is safe to run on databases
-- that already include the column in the initial schema.

alter table public.profiles
  add column if not exists activation_status text
  default 'activated'
  check (activation_status in ('pending', 'link_sent', 'activated'));

-- Existing users are already active, so default is 'activated'.
-- New investors created by admin will be explicitly set to 'pending'.
