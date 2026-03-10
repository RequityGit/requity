-- Seed the "Outstanding Conditions Reminder" user email template
INSERT INTO public.user_email_templates (
  name, slug, description, category,
  subject_template, body_template,
  available_variables, context, is_default, sort_order
) VALUES (
  'Outstanding Conditions Reminder',
  'outstanding_conditions_reminder',
  'Sends borrower a summary of all outstanding (pending/requested/rejected) conditions on their loan with a link to the portal to upload documents, comment, and track progress.',
  'lending',
  '{{loan_number}} — Outstanding Items for {{property_address_short}}',
  E'<div style="font-family: ''Source Sans 3'', ''Segoe UI'', Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1a1a1a;">\n  <div style="background: #0F2140; padding: 32px 24px; border-radius: 8px 8px 0 0;">\n    <img src="https://portal.requitygroup.com/requity-logo-white.png" alt="Requity Lending" style="height: 36px;" />\n  </div>\n  <div style="padding: 32px 24px; background: #ffffff; border: 1px solid #e5e5e5; border-top: none;">\n    <p style="margin: 0 0 16px; font-size: 16px;">Hi {{borrower_first_name}},</p>\n    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">We''re working to keep your loan moving forward. Below is a summary of the outstanding items we still need for <strong>{{property_address}}</strong> (Loan {{loan_number}}).</p>\n    \n    <div style="margin: 24px 0;">\n      <h3 style="font-family: ''Cormorant Garamond'', Georgia, serif; font-size: 20px; color: #0F2140; margin: 0 0 12px; border-bottom: 2px solid #C5975B; padding-bottom: 8px;">Outstanding Conditions</h3>\n      {{outstanding_conditions_html}}\n    </div>\n\n    <div style="text-align: center; margin: 32px 0;">\n      <a href="{{portal_login_url}}" style="display: inline-block; background: #C5975B; color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px;">Log In to Your Portal</a>\n    </div>\n    <p style="margin: 0 0 8px; font-size: 14px; color: #666; line-height: 1.6;">From the portal you can:</p>\n    <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 14px; color: #666; line-height: 1.8;">\n      <li>Upload requested documents directly</li>\n      <li>Comment on any condition for clarification</li>\n      <li>Track your loan progress in real time</li>\n    </ul>\n    <p style="margin: 0 0 8px; font-size: 15px; line-height: 1.6;">If you have any questions, reply to this email or reach out to your point of contact.</p>\n    <p style="margin: 24px 0 0; font-size: 15px;">Regards,<br/>{{sender_name}}<br/>{{sender_title}}<br/><span style="color: #C5975B;">Requity Lending</span></p>\n  </div>\n  <div style="background: #f5f5f5; padding: 16px 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e5e5; border-top: none; text-align: center; font-size: 12px; color: #999;">\n    Requity Lending &bull; Tampa, FL &bull; <a href="https://www.requitylending.com" style="color: #C5975B;">requitylending.com</a>\n  </div>\n</div>',
  '[
    {"key": "borrower_first_name", "label": "Borrower First Name", "source": "contact", "sample": "John"},
    {"key": "borrower_full_name", "label": "Borrower Full Name", "source": "contact", "sample": "John Smith"},
    {"key": "borrower_email", "label": "Borrower Email", "source": "contact", "sample": "john@example.com"},
    {"key": "loan_number", "label": "Loan Number", "source": "loan", "sample": "RL-2025-042"},
    {"key": "property_address", "label": "Full Property Address", "source": "loan", "sample": "123 Main St, Tampa, FL 33602"},
    {"key": "property_address_short", "label": "Short Property Address", "source": "loan", "sample": "123 Main St"},
    {"key": "loan_amount", "label": "Loan Amount", "source": "loan", "sample": "$750,000"},
    {"key": "loan_type", "label": "Loan Type", "source": "loan", "sample": "Bridge"},
    {"key": "loan_status", "label": "Loan Status", "source": "loan", "sample": "Underwriting"},
    {"key": "outstanding_conditions_html", "label": "Outstanding Conditions Table (auto-generated)", "source": "computed", "sample": "<table style=\"width:100%;border-collapse:collapse;\"><tr style=\"background:#f8f8f8;\"><th style=\"text-align:left;padding:10px;border-bottom:2px solid #0F2140;font-size:13px;\">Condition</th><th style=\"text-align:left;padding:10px;border-bottom:2px solid #0F2140;font-size:13px;\">Category</th><th style=\"text-align:center;padding:10px;border-bottom:2px solid #0F2140;font-size:13px;\">Status</th></tr><tr><td style=\"padding:10px;border-bottom:1px solid #eee;font-size:14px;\">Bank Statements (2 months)</td><td style=\"padding:10px;border-bottom:1px solid #eee;font-size:13px;color:#666;\">Borrower Documents</td><td style=\"text-align:center;padding:10px;border-bottom:1px solid #eee;\"><span style=\"background:#FFF3CD;color:#856404;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;\">Pending</span></td></tr><tr><td style=\"padding:10px;border-bottom:1px solid #eee;font-size:14px;\">Proof of Insurance</td><td style=\"padding:10px;border-bottom:1px solid #eee;font-size:13px;color:#666;\">Deal Level Items</td><td style=\"text-align:center;padding:10px;border-bottom:1px solid #eee;\"><span style=\"background:#F8D7DA;color:#842029;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;\">Rejected</span></td></tr></table>"},
    {"key": "outstanding_conditions_count", "label": "Number of Outstanding Conditions", "source": "computed", "sample": "5"},
    {"key": "portal_login_url", "label": "Portal Login URL", "source": "static", "sample": "https://portal.requitygroup.com"},
    {"key": "sender_name", "label": "Sender Name (auto from logged-in user)", "source": "user", "sample": "Luis Rodriguez"},
    {"key": "sender_title", "label": "Sender Title", "source": "user", "sample": "Originations Manager"},
    {"key": "sender_email", "label": "Sender Email", "source": "user", "sample": "luis@requitygroup.com"},
    {"key": "today_date", "label": "Today''s Date", "source": "static", "sample": "March 2, 2026"}
  ]'::jsonb,
  'deal',
  true,
  1
);
