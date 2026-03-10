-- Pipeline Stage Config tables
-- Stores warn/alert thresholds and ordering per pipeline stage
CREATE TABLE pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_key text NOT NULL UNIQUE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#888',
  stage_order integer NOT NULL,
  warn_days integer NOT NULL DEFAULT 5,
  alert_days integer NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Stores field-required rules per stage
CREATE TABLE pipeline_stage_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES pipeline_stages(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stage_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_stages" ON pipeline_stages
  FOR ALL USING (is_super_admin());

CREATE POLICY "admin_read_stages" ON pipeline_stages
  FOR SELECT USING (is_admin());

CREATE POLICY "super_admin_all_rules" ON pipeline_stage_rules
  FOR ALL USING (is_super_admin());

CREATE POLICY "admin_read_rules" ON pipeline_stage_rules
  FOR SELECT USING (is_admin());

-- Seed with current opportunity pipeline stages
INSERT INTO pipeline_stages (stage_key, name, color, stage_order, warn_days, alert_days) VALUES
  ('awaiting_info',    'Awaiting Info',       '#888888', 1, 3,  7),
  ('quoting',          'Quoting',             '#2E6EA6', 2, 2,  5),
  ('uw',               'UW',                  '#9333EA', 3, 5, 10),
  ('uw_needs_approval','UW Needs Approval',   '#6366F1', 4, 2,  4),
  ('offer_placed',     'Offer(s) Placed',     '#1B7A44', 5, 7, 14),
  ('processing',       'Processing',          '#E54D42', 6, 10, 21);
