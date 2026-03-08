-- Seed initial document templates
-- Uses a super_admin user as created_by

INSERT INTO document_templates (name, template_type, record_type, description, gdrive_file_id, merge_fields, requires_signature, signature_roles, is_active, version, created_by)
SELECT
  'RTL Fix & Flip Term Sheet',
  'term_sheet'::template_type_enum,
  'loan'::record_type_enum,
  'Standard term sheet for residential fix-and-flip bridge loans',
  'placeholder_gdrive_term_sheet',
  '[
    {"key":"borrower_name","label":"Borrower Name","source":"crm_contacts","column":"full_name"},
    {"key":"borrower_entity","label":"Borrower Entity","source":"companies","column":"name"},
    {"key":"property_address","label":"Property Address","source":"loans","column":"property_address"},
    {"key":"loan_amount","label":"Loan Amount","source":"loans","column":"amount","format":"currency"},
    {"key":"interest_rate","label":"Interest Rate","source":"loans","column":"interest_rate","format":"percentage"},
    {"key":"term_months","label":"Loan Term (months)","source":"loans","column":"term_months"},
    {"key":"effective_date","label":"Date","source":"_system","column":"today","format":"date"},
    {"key":"lender_entity","label":"Lender","source":"_system","column":"requity_entity"}
  ]'::jsonb,
  true,
  '[
    {"role":"Borrower","name_source":"crm_contacts.full_name","email_source":"crm_contacts.email","order":1},
    {"role":"Lender","name_source":"_system.dylan_name","email_source":"_system.dylan_email","order":2}
  ]'::jsonb,
  true,
  1,
  ur.user_id
FROM user_roles ur WHERE ur.role = 'super_admin' AND ur.is_active = true LIMIT 1;

INSERT INTO document_templates (name, template_type, record_type, description, gdrive_file_id, merge_fields, requires_signature, signature_roles, is_active, version, created_by)
SELECT
  'Mutual NDA v2',
  'nda'::template_type_enum,
  'contact'::record_type_enum,
  'Standard mutual non-disclosure agreement for broker, vendor, and investor relationships',
  'placeholder_gdrive_nda',
  '[
    {"key":"party_name","label":"Counterparty Name","source":"crm_contacts","column":"full_name"},
    {"key":"party_email","label":"Counterparty Email","source":"crm_contacts","column":"email"},
    {"key":"party_company","label":"Counterparty Company","source":"companies","column":"name"},
    {"key":"effective_date","label":"Effective Date","source":"_system","column":"today","format":"date"},
    {"key":"requity_entity","label":"Requity Entity","source":"_system","column":"requity_entity"},
    {"key":"requity_signer","label":"Requity Signer","source":"_system","column":"requity_signer"}
  ]'::jsonb,
  true,
  '[
    {"role":"Counterparty","name_source":"crm_contacts.full_name","email_source":"crm_contacts.email","order":1},
    {"role":"Requity","name_source":"_system.dylan_name","email_source":"_system.dylan_email","order":2}
  ]'::jsonb,
  true,
  1,
  ur.user_id
FROM user_roles ur WHERE ur.role = 'super_admin' AND ur.is_active = true LIMIT 1;

INSERT INTO document_templates (name, template_type, record_type, description, gdrive_file_id, merge_fields, requires_signature, signature_roles, is_active, version, created_by)
SELECT
  'Broker Fee Agreement v1',
  'broker_agreement'::template_type_enum,
  'loan'::record_type_enum,
  'Formalizes broker compensation on a specific loan transaction',
  'placeholder_gdrive_broker_agreement',
  '[
    {"key":"broker_name","label":"Broker Name","source":"crm_contacts","column":"full_name"},
    {"key":"broker_company","label":"Broker Company","source":"companies","column":"name"},
    {"key":"loan_amount","label":"Loan Amount","source":"loans","column":"amount","format":"currency"},
    {"key":"effective_date","label":"Date","source":"_system","column":"today","format":"date"},
    {"key":"lender_entity","label":"Lender Entity","source":"_system","column":"requity_entity"}
  ]'::jsonb,
  true,
  '[
    {"role":"Broker","name_source":"crm_contacts.full_name","email_source":"crm_contacts.email","order":1},
    {"role":"Lender","name_source":"_system.dylan_name","email_source":"_system.dylan_email","order":2}
  ]'::jsonb,
  true,
  1,
  ur.user_id
FROM user_roles ur WHERE ur.role = 'super_admin' AND ur.is_active = true LIMIT 1;
