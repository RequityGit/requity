-- Migration: Replace read/unread model with active/archived model
-- A notification is "active" when archived_at IS NULL, "archived" when archived_at IS NOT NULL.

-- 1. Drop the old RPC functions that reference is_read
DROP FUNCTION IF EXISTS public.mark_notifications_read(uuid[]);
DROP FUNCTION IF EXISTS public.mark_all_notifications_read();
DROP FUNCTION IF EXISTS public.get_unread_notification_count();

-- 2. Drop the old partial index that references is_read
DROP INDEX IF EXISTS idx_notifications_user_unread;

-- 3. Remove is_read, read_at, and redundant is_archived columns
ALTER TABLE public.notifications DROP COLUMN IF EXISTS is_read;
ALTER TABLE public.notifications DROP COLUMN IF EXISTS read_at;
ALTER TABLE public.notifications DROP COLUMN IF EXISTS is_archived;

-- 4. Add new index on (user_id, archived_at) for fast active/archived filtering
CREATE INDEX idx_notifications_user_archived
  ON public.notifications (user_id, archived_at, created_at DESC);

-- 5. Create new RPC: get active (non-archived) notification count
CREATE OR REPLACE FUNCTION public.get_active_notification_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.notifications
  WHERE user_id = (SELECT auth.uid())
    AND archived_at IS NULL;
  RETURN v_count;
END;
$$;

-- 6. Create new RPC: archive a single notification
CREATE OR REPLACE FUNCTION public.archive_notification(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET archived_at = now()
  WHERE id = p_notification_id
    AND user_id = (SELECT auth.uid())
    AND archived_at IS NULL;
END;
$$;

-- 7. Create new RPC: archive all active notifications for the current user
CREATE OR REPLACE FUNCTION public.archive_all_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET archived_at = now()
  WHERE user_id = (SELECT auth.uid())
    AND archived_at IS NULL;
END;
$$;

-- 8. Create new RPC: unarchive a notification
CREATE OR REPLACE FUNCTION public.unarchive_notification(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET archived_at = NULL
  WHERE id = p_notification_id
    AND user_id = (SELECT auth.uid())
    AND archived_at IS NOT NULL;
END;
$$;
