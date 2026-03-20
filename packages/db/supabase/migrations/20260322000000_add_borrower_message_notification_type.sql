-- Add notification type for borrower messages on deal threads
INSERT INTO notification_types (slug, display_name, description, category, default_email_enabled, default_in_app_enabled, default_priority, applicable_roles, is_active)
VALUES (
  'borrower_message_received',
  'Borrower Message Received',
  'A borrower sent a message on a deal thread',
  'lending',
  false,
  true,
  'normal',
  ARRAY['super_admin', 'admin']::app_role[],
  true
)
ON CONFLICT DO NOTHING;
