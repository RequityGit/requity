-- Migration 009: Create marketing_campaigns table
-- Tracks email marketing campaigns with audience targeting rules.

CREATE TABLE marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  campaign_type campaign_type_enum NOT NULL,
  status campaign_status_enum DEFAULT 'draft',
  audience_rules jsonb,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Document the audience_rules JSONB contract
COMMENT ON COLUMN marketing_campaigns.audience_rules IS
'JSON contract: {
  "filters": [
    { "field": "lifecycle_stage", "operator": "in", "value": ["active", "past"] },
    { "field": "relationship_type", "operator": "in", "value": ["borrower"] },
    { "field": "broker_sourced", "operator": "eq", "value": false },
    { "field": "dnc", "operator": "eq", "value": false },
    { "field": "marketing_consent", "operator": "eq", "value": true }
  ],
  "logic": "AND"
}
Supported operators: eq, neq, in, not_in, contains, gt, lt. Logic: AND or OR.';

-- Enable RLS
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Super admin full access policy
CREATE POLICY "super_admin_full_access_marketing_campaigns" ON marketing_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role = 'super_admin'
    )
  );

-- Admin full access policy
CREATE POLICY "admin_full_access_marketing_campaigns" ON marketing_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role = 'admin'
    )
  );

-- Indexes
CREATE INDEX idx_marketing_campaigns_campaign_type ON marketing_campaigns (campaign_type);
CREATE INDEX idx_marketing_campaigns_status ON marketing_campaigns (status);
CREATE INDEX idx_marketing_campaigns_created_by ON marketing_campaigns (created_by);
