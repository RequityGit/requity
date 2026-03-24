-- Seed the "Document Upload Link" user email template for sending secure upload links to borrowers.
-- Merge fields: {{upload_link}}, {{upload_link_expiry}}, {{deal_name}}, {{borrower_full_name}}, {{sender_name}}.
-- When opening "Send by email" from the upload link dialog, the app passes initialBody with the link;
-- this template is available in "Use Template" and can be resolved with override_variables (upload_link, etc.).
INSERT INTO public.user_email_templates (
  name, slug, description, category,
  subject_template, body_template,
  available_variables, context, is_default, sort_order
) VALUES (
  'Document Upload Link',
  'document_upload_link',
  'Sends the borrower a secure one-time link to upload documents (e.g. from pipeline diligence). Use when sharing an upload link by email; link and expiry can be filled via override or pasted.',
  'lending',
  'Document upload link for {{deal_name}}',
  E'Hello,\n\nPlease use the secure link below to upload your documents for {{deal_name}}.\n\n{{upload_link}}\n\n{{upload_link_expiry}}\n\nIf you have any questions, please reply to this email.\n\nBest regards,\n{{sender_name}}',
  '[
    {"key": "deal_name", "label": "Deal Name", "source": "static", "sample": "Valor Quest Endeavors, LLC - Portfolio"},
    {"key": "borrower_full_name", "label": "Borrower Full Name", "source": "contact", "sample": "John Smith"},
    {"key": "upload_link", "label": "Secure Upload Link URL", "source": "static", "sample": "https://portal.requitygroup.com/upload/abc123"},
    {"key": "upload_link_expiry", "label": "Link Expiry (e.g. This link expires on...)", "source": "static", "sample": "This link expires on Fri, Mar 22, 2026."},
    {"key": "sender_name", "label": "Sender Name", "source": "user", "sample": "Luis Rodriguez"}
  ]'::jsonb,
  'deal',
  false,
  2
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  subject_template = EXCLUDED.subject_template,
  body_template = EXCLUDED.body_template,
  available_variables = EXCLUDED.available_variables,
  updated_at = now();
