-- Add 'loan_intake' to condition_stage enum (before 'processing')
-- This represents the earliest stage in the loan condition lifecycle.
ALTER TYPE condition_stage ADD VALUE IF NOT EXISTS 'loan_intake' BEFORE 'processing';
