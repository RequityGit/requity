-- Schedule fetch-intake-emails edge function every 5 minutes via pg_cron + pg_net.
--
-- This uses the project's service_role key (already in Supabase Vault) to
-- authenticate the cron request. No manual secret setup required.
--
-- PRE-REQUISITES before pushing this migration:
--
--   1. Deploy the edge function:
--        npx supabase functions deploy fetch-intake-emails
--        (or merge to main if using the GitHub Actions workflow)
--
--   2. Set edge function secrets (Supabase Dashboard > Edge Functions > Secrets):
--        GMAIL_CLIENT_ID
--        GMAIL_CLIENT_SECRET
--        GMAIL_INTAKE_REFRESH_TOKEN   <- see GETTING A REFRESH TOKEN below
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
--   7. Copy the refresh_token value -> set as GMAIL_INTAKE_REFRESH_TOKEN

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Drop existing schedule if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fetch-intake-emails') THEN
    PERFORM cron.unschedule('fetch-intake-emails');
  END IF;
END;
$$;

-- Helper function to read the service_role key from Supabase Vault.
-- Supabase automatically stores project keys in vault.decrypted_secrets.
CREATE OR REPLACE FUNCTION private.get_service_role_key()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;
$$;

-- Schedule every 5 minutes using the service_role key for auth.
SELECT cron.schedule(
  'fetch-intake-emails',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://edhlkknvlczhbowasjna.supabase.co/functions/v1/fetch-intake-emails',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || private.get_service_role_key()
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);
