-- Migration: Add read_at column for read/unread visual distinction
-- Model: unread (read_at IS NULL, archived_at IS NULL) = "New"
--        read   (read_at IS NOT NULL, archived_at IS NULL) = "Earlier"
--        archived (archived_at IS NOT NULL) = hidden from dropdown

-- 1. Add read_at column (nullable, NULL = unread)
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- 2. Add index for fast unread count queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, read_at, archived_at, created_at DESC);

-- 3. RPC: get unread notification count (badge count)
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
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
    AND read_at IS NULL
    AND archived_at IS NULL;
  RETURN v_count;
END;
$$;

-- 4. RPC: mark a single notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = now()
  WHERE id = p_notification_id
    AND user_id = (SELECT auth.uid())
    AND read_at IS NULL;
END;
$$;

-- 5. Update archive_notification to also set read_at
CREATE OR REPLACE FUNCTION public.archive_notification(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET archived_at = now(),
      read_at = COALESCE(read_at, now())
  WHERE id = p_notification_id
    AND user_id = (SELECT auth.uid())
    AND archived_at IS NULL;
END;
$$;

-- 6. Update archive_all_notifications to also set read_at
CREATE OR REPLACE FUNCTION public.archive_all_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET archived_at = now(),
      read_at = COALESCE(read_at, now())
  WHERE user_id = (SELECT auth.uid())
    AND archived_at IS NULL;
END;
$$;
