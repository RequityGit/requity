-- Schedule task notification cron jobs via pg_cron + pg_net.
--
-- PRE-REQUISITES:
--   1. Deploy edge functions:
--        npx supabase functions deploy send-task-notification-emails --no-verify-jwt
--        npx supabase functions deploy task-due-reminders --no-verify-jwt
--
--   2. Ensure SUPABASE_SERVICE_ROLE_KEY is set as an edge function secret
--      (Supabase Dashboard > Edge Functions > Secrets)
--
--   3. Ensure APP_URL is set as an edge function secret:
--        APP_URL=https://app.requitygroup.com
--
--   4. CRON_SECRET must already exist in vault (created by fetch-intake-emails migration)

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Ensure private schema and helper function exist
CREATE SCHEMA IF NOT EXISTS private;

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

-- ============================================================
-- 1. send-task-notification-emails: every 3 minutes
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-task-notification-emails') THEN
    PERFORM cron.unschedule('send-task-notification-emails');
  END IF;
END;
$$;

SELECT cron.schedule(
  'send-task-notification-emails',
  '*/3 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://edhlkknvlczhbowasjna.supabase.co/functions/v1/send-task-notification-emails',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || private.get_cron_secret()
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================
-- 2. task-due-reminders: daily at 12:00 UTC (8:00 AM ET)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'task-due-reminders') THEN
    PERFORM cron.unschedule('task-due-reminders');
  END IF;
END;
$$;

SELECT cron.schedule(
  'task-due-reminders',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://edhlkknvlczhbowasjna.supabase.co/functions/v1/task-due-reminders',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || private.get_cron_secret()
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);
