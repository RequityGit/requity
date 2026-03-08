ALTER TABLE companies ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
