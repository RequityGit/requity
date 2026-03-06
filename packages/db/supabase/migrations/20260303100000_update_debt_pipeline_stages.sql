-- Update debt pipeline stages to match Salesforce
-- Replaces old dual-phase (Originations + Active Loans) with 7 unified stages

-- 1. Delete existing debt pipeline stage configs
DELETE FROM pipeline_stage_config WHERE pipeline_type = 'debt';

-- 2. Insert new unified debt pipeline stages with hex dot colors
INSERT INTO pipeline_stage_config (pipeline_type, stage_key, label, color, sort_order, is_terminal, sla_days)
VALUES
  ('debt', 'awaiting_info',      'Awaiting Info',       '#9B9BA0', 0, false, 3),
  ('debt', 'quoting',            'Quoting',             '#3B82F6', 1, false, 5),
  ('debt', 'uw',                 'UW',                  '#8B5CF6', 2, false, 7),
  ('debt', 'uw_needs_approval',  'UW Needs Approval',   '#D97706', 3, false, 5),
  ('debt', 'offer_placed',       'Offer(s) Placed',     '#22A861', 4, false, 5),
  ('debt', 'processing',         'Processing',          '#EC4899', 5, false, 10),
  ('debt', 'closed',             'Closed',              '#1A1A1A', 6, true,  null),
  ('debt', 'closed_lost',        'Closed Lost',         '#E5453D', 7, true,  null);

-- 3. Update opportunities CHECK constraint to include uw_needs_approval
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_stage_check;
ALTER TABLE opportunities ADD CONSTRAINT opportunities_stage_check
  CHECK (stage IN ('awaiting_info','uw','quoting','offer_placed','processing','closed','onboarding','closed_lost','uw_needs_approval'));

-- 4. Map any existing opportunities with stage='onboarding' to 'processing'
UPDATE opportunities SET stage = 'processing' WHERE stage = 'onboarding';
