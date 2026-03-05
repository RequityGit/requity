-- Streak tracking for the action dashboard
CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  current_streak int DEFAULT 0,
  best_streak int DEFAULT 0,
  last_completed_date date,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all streaks"
  ON public.user_streaks FOR SELECT
  USING ((select auth.uid()) IN (SELECT ur.user_id FROM public.user_roles ur WHERE ur.role IN ('admin', 'super_admin')));

CREATE POLICY "Users can view own streak"
  ON public.user_streaks FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_incomplete_today int;
  v_last_date date;
  v_current int;
  v_best int;
BEGIN
  SELECT count(*) INTO v_incomplete_today
  FROM public.dashboard_tasks
  WHERE user_id = p_user_id
    AND due_date <= CURRENT_DATE
    AND is_completed = false;

  IF v_incomplete_today = 0 THEN
    SELECT last_completed_date, current_streak, best_streak
    INTO v_last_date, v_current, v_best
    FROM public.user_streaks
    WHERE user_id = p_user_id;

    IF v_last_date IS NULL OR v_last_date < CURRENT_DATE - 1 THEN
      v_current := 1;
    ELSIF v_last_date = CURRENT_DATE - 1 THEN
      v_current := COALESCE(v_current, 0) + 1;
    END IF;

    IF v_last_date IS DISTINCT FROM CURRENT_DATE THEN
      INSERT INTO public.user_streaks (user_id, current_streak, best_streak, last_completed_date, updated_at)
      VALUES (p_user_id, v_current, GREATEST(v_current, COALESCE(v_best, 0)), CURRENT_DATE, now())
      ON CONFLICT (user_id) DO UPDATE SET
        current_streak = v_current,
        best_streak = GREATEST(v_current, COALESCE(public.user_streaks.best_streak, 0)),
        last_completed_date = CURRENT_DATE,
        updated_at = now();
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
