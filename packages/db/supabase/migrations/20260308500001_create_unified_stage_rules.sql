-- ═══════════════════════════════════════════════════════════
-- Create unified_stage_rules table
-- Stores field-required advancement rules for unified pipeline stages
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS unified_stage_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_config_id uuid NOT NULL REFERENCES unified_stage_configs(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE unified_stage_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read unified_stage_rules"
  ON unified_stage_rules FOR SELECT
  USING ((SELECT auth.uid()) IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

CREATE POLICY "Super admins can manage unified_stage_rules"
  ON unified_stage_rules FOR ALL
  USING ((SELECT auth.uid()) IN (
    SELECT id FROM profiles WHERE allowed_roles @> ARRAY['super_admin']::text[]
  ));
