-- Add notification type for website loan request deal submissions
INSERT INTO notification_types (slug, display_name, description, category, default_email_enabled, default_in_app_enabled, default_priority, applicable_roles, is_active)
VALUES (
  'website_deal_submission',
  'Website Deal Submission',
  'A new deal was submitted via the requitygroup.com loan application',
  'lending',
  false,
  true,
  'high',
  ARRAY['super_admin', 'admin']::app_role[],
  true
)
ON CONFLICT DO NOTHING;
