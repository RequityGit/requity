-- =============================================================================
-- Ensure profiles table has all required columns
-- =============================================================================
-- Fixes: "Could not find the 'full_name' column of 'profiles' in the schema cache"
-- These columns are defined in the initial schema but may be missing if the
-- table was created outside of migrations.
-- =============================================================================

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists activation_status text default 'activated'
  check (activation_status in ('pending', 'link_sent', 'activated'));
