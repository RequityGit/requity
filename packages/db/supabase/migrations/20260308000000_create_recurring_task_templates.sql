-- Create recurring_task_templates table for the recurring tasks system
-- This table stores template definitions that generate ops_tasks on a schedule via pg_cron

CREATE EXTENSION IF NOT EXISTS moddatetime;

CREATE TABLE IF NOT EXISTS recurring_task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
  assigned_to UUID REFERENCES profiles(id),

  -- Recurrence config
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'annually')),
  monthly_mode TEXT CHECK (monthly_mode IN ('date', 'weekday')),
  anchor_day INT,
  anchor_month INT,
  every_x_months INT DEFAULT 1 CHECK (every_x_months >= 1 AND every_x_months <= 12),
  nth_occurrence INT CHECK (nth_occurrence >= 1 AND nth_occurrence <= 4),
  nth_weekday INT CHECK (nth_weekday >= 0 AND nth_weekday <= 6),

  -- Generation timing
  lead_days INT NOT NULL DEFAULT 10 CHECK (lead_days >= 0 AND lead_days <= 30),
  next_generation_date DATE NOT NULL,
  next_due_date DATE NOT NULL,

  -- Lifecycle
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_updated_at ON recurring_task_templates;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON recurring_task_templates
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE INDEX IF NOT EXISTS idx_recurring_templates_active_gen
  ON recurring_task_templates (next_generation_date)
  WHERE is_active = true;

-- Add recurring template tracking columns to ops_tasks
ALTER TABLE ops_tasks
  ADD COLUMN IF NOT EXISTS recurring_template_id UUID REFERENCES recurring_task_templates(id),
  ADD COLUMN IF NOT EXISTS recurrence_period TEXT,
  ADD COLUMN IF NOT EXISTS previous_incomplete BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ops_tasks_recurring_template
  ON ops_tasks (recurring_template_id)
  WHERE recurring_template_id IS NOT NULL;

-- RLS
ALTER TABLE recurring_task_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read templates" ON recurring_task_templates;
DROP POLICY IF EXISTS "Admins can insert templates" ON recurring_task_templates;
DROP POLICY IF EXISTS "Admins can update templates" ON recurring_task_templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON recurring_task_templates;

CREATE POLICY "Authenticated users can read templates"
  ON recurring_task_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert templates"
  ON recurring_task_templates FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_super_admin());

CREATE POLICY "Admins can update templates"
  ON recurring_task_templates FOR UPDATE TO authenticated
  USING (is_admin() OR is_super_admin())
  WITH CHECK (is_admin() OR is_super_admin());

CREATE POLICY "Admins can delete templates"
  ON recurring_task_templates FOR DELETE TO authenticated
  USING (is_admin() OR is_super_admin());
