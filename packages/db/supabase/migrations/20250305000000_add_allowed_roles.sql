-- Add allowed_roles column to profiles table
-- This enables users to switch between multiple role views (admin, investor, borrower)
-- The default value is an array containing only their current role

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS allowed_roles text[] NOT NULL DEFAULT '{}';

-- Backfill: set allowed_roles to contain the user's current role
UPDATE profiles SET allowed_roles = ARRAY[role::text] WHERE allowed_roles = '{}';
