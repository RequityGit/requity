-- Create gmail_tokens table for storing Google OAuth tokens
-- Used by the Gmail integration to send CRM emails from user's Gmail account
CREATE TABLE IF NOT EXISTS gmail_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL DEFAULT '',
  token_expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  scopes text[],
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Index for quick lookups by user
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_user_active
  ON gmail_tokens(user_id) WHERE is_active = true;

-- RLS
ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;

-- Admins (via service_role) can manage all tokens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'gmail_tokens' AND policyname = 'Service role can manage gmail_tokens'
  ) THEN
    CREATE POLICY "Service role can manage gmail_tokens"
      ON gmail_tokens FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Users can read their own tokens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'gmail_tokens' AND policyname = 'Users can view own gmail_tokens'
  ) THEN
    CREATE POLICY "Users can view own gmail_tokens"
      ON gmail_tokens FOR SELECT
      USING (user_id = (select auth.uid()));
  END IF;
END $$;

-- Users can update their own tokens (e.g., disconnect)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'gmail_tokens' AND policyname = 'Users can update own gmail_tokens'
  ) THEN
    CREATE POLICY "Users can update own gmail_tokens"
      ON gmail_tokens FOR UPDATE
      USING (user_id = (select auth.uid()))
      WITH CHECK (user_id = (select auth.uid()));
  END IF;
END $$;
