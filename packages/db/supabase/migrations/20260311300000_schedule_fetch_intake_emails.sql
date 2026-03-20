-- Schedule fetch-intake-emails edge function every 2 minutes via pg_cron + pg_net.
--
-- Uses a CRON_SECRET stored in Supabase Vault to authenticate the request.
-- The same secret must be set as an edge function secret (CRON_SECRET) in the
-- Supabase Dashboard > Edge Functions > Secrets.
--
-- PRE-REQUISITES before pushing this migration:
--
--   1. Deploy the edge function (with --no-verify-jwt):
--        npx supabase functions deploy fetch-intake-emails --no-verify-jwt
--        (or merge to main if using the GitHub Actions workflow)
--
--   2. Create CRON_SECRET in vault (if not already done):
--        SELECT vault.create_secret(encode(gen_random_bytes(32), 'hex'), 'cron_secret', 'pg_cron auth');
--
--   3. Copy the CRON_SECRET value and set it as an edge function secret:
--        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret';
--        Then paste into Supabase Dashboard > Edge Functions > Secrets > CRON_SECRET
--
--   4. Set Gmail + AI secrets (Supabase Dashboard > Edge Functions > Secrets):
--        GMAIL_CLIENT_ID
--        GMAIL_CLIENT_SECRET
--        GMAIL_REFRESH_TOKEN           <- see GETTING A REFRESH TOKEN below
--        ANTHROPIC_API_KEY
--
-- GETTING A GMAIL REFRESH TOKEN FOR intake@requitygroup.com:
--   1. Go to https://developers.google.com/oauthplayground
--   2. Click the gear icon > check "Use your own OAuth credentials"
--   3. Enter your GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET
--   4. In Step 1, select Gmail API v1 scopes:
--        https://www.googleapis.com/auth/gmail.readonly
--   5. Authorize with the intake@requitygroup.com Google account
--   6. In Step 2, click "Exchange authorization code for tokens"
--   7. Copy the refresh_token value -> set as GMAIL_REFRESH_TOKEN

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Ensure private schema exists
CREATE SCHEMA IF NOT EXISTS private;

-- Drop existing schedule if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fetch-intake-emails') THEN
    PERFORM cron.unschedule('fetch-intake-emails');
  END IF;
END;
$$;

-- Helper function to read the CRON_SECRET from Supabase Vault.
CREATE OR REPLACE FUNCTION private.get_cron_secret()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = 'cron_secret'
  LIMIT 1;
$$;

-- Schedule every 2 minutes using the CRON_SECRET for auth.
SELECT cron.schedule(
  'fetch-intake-emails',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://edhlkknvlczhbowasjna.supabase.co/functions/v1/fetch-intake-emails',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || private.get_cron_secret()
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);
