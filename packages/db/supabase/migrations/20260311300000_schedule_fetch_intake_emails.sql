-- Schedule fetch-intake-emails edge function every 5 minutes via pg_cron + pg_net.
--
-- PRE-REQUISITES before pushing this migration:
--
--   1. Deploy the edge function:
--        npx supabase functions deploy fetch-intake-emails
--
--   2. Set edge function secrets (Supabase Dashboard > Edge Functions > Secrets,
--      or via CLI: npx supabase secrets set KEY=value):
--        GMAIL_CLIENT_ID
--        GMAIL_CLIENT_SECRET
--        GMAIL_INTAKE_REFRESH_TOKEN   <- see GETTING A REFRESH TOKEN below
--        ANTHROPIC_API_KEY
--        CRON_SECRET                  <- any random secret string
--
--   3. Store the CRON_SECRET as a database setting so pg_cron can use it:
--        Run in Supabase SQL Editor:
--          ALTER DATABASE postgres SET app.cron_secret = '<your-cron-secret>';
--        Use the same value as CRON_SECRET above.
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
--
-- ALTERNATIVE (no migration needed):
--   Schedule directly in Supabase Dashboard:
--     Edge Functions > fetch-intake-emails > Schedule tab > */5 * * * *

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

-- Schedule every 5 minutes.
-- Requires: ALTER DATABASE postgres SET app.cron_secret = '<your-cron-secret>';
SELECT cron.schedule(
  'fetch-intake-emails',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://edhlkknvlczhbowasjna.supabase.co/functions/v1/fetch-intake-emails',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_secret', true)
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);
