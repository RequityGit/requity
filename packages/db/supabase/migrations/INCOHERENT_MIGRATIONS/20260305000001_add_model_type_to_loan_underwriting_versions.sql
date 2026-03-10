ALTER TABLE loan_underwriting_versions
ADD COLUMN IF NOT EXISTS model_type TEXT DEFAULT 'rtl_dscr';
