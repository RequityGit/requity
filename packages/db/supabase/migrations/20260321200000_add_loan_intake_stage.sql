-- Add loan_intake to condition_stage enum before 'processing'
ALTER TYPE condition_stage ADD VALUE IF NOT EXISTS 'loan_intake' BEFORE 'processing';
