-- Add CRM field manager modules: Company Information, Borrower Profile, Investor Profile, Contact Profile

INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked, is_admin_created) VALUES
  -- Company Information
  ('company_info', 'legal_name',          'Legal Name',          'text',     'left',  0, true,  true,  false),
  ('company_info', 'dba_names',           'DBA / Other Names',   'text',     'right', 1, true,  false, false),
  ('company_info', 'company_type',        'Company Type',        'dropdown', 'left',  2, true,  false, false),
  ('company_info', 'subtype',             'Subtype',             'dropdown', 'right', 3, true,  false, false),
  ('company_info', 'phone',               'Phone',               'phone',    'left',  4, true,  false, false),
  ('company_info', 'email',               'Email',               'email',    'right', 5, true,  false, false),
  ('company_info', 'website',             'Website',             'text',     'left',  6, true,  false, false),
  ('company_info', 'source',              'Source',              'dropdown', 'right', 7, true,  false, false),
  ('company_info', 'status',              'Status',              'dropdown', 'left',  8, true,  false, false),
  ('company_info', 'is_title_co_verified','Title Co. Verified',  'boolean',  'right', 9, true,  false, false),

  -- Borrower Profile
  ('borrower_profile', 'credit_score',         'Credit Score',       'number',   'left',  0,  true, false, false),
  ('borrower_profile', 'credit_report_date',   'Credit Report Date', 'date',     'right', 1,  true, false, false),
  ('borrower_profile', 'experience_count',     'RE Experience',      'number',   'left',  2,  true, false, false),
  ('borrower_profile', 'date_of_birth',        'Date of Birth',      'date',     'right', 3,  true, false, false),
  ('borrower_profile', 'is_us_citizen',        'US Citizen',         'boolean',  'left',  4,  true, false, false),
  ('borrower_profile', 'marital_status',       'Marital Status',     'dropdown', 'right', 5,  true, false, false),
  ('borrower_profile', 'ssn_last4',            'SSN (last 4)',        'text',     'left',  6,  true, false, false),
  ('borrower_profile', 'stated_liquidity',     'Stated Liquidity',   'currency', 'right', 7,  true, false, false),
  ('borrower_profile', 'verified_liquidity',   'Verified Liquidity', 'currency', 'left',  8,  true, false, false),
  ('borrower_profile', 'stated_net_worth',     'Stated Net Worth',   'currency', 'right', 9,  true, false, false),
  ('borrower_profile', 'verified_net_worth',   'Verified Net Worth', 'currency', 'left',  10, true, false, false),

  -- Investor Profile
  ('investor_profile', 'accreditation_status',     'Accreditation', 'dropdown', 'left',  0, true, false, false),
  ('investor_profile', 'accreditation_verified_at','Verified At',   'date',     'right', 1, true, false, false),

  -- Contact Profile
  ('contact_profile', 'first_name',      'First Name',      'text',     'left',  0,  true, true,  false),
  ('contact_profile', 'last_name',       'Last Name',       'text',     'right', 1,  true, true,  false),
  ('contact_profile', 'email',           'Email',           'email',    'left',  2,  true, false, false),
  ('contact_profile', 'phone',           'Phone',           'phone',    'right', 3,  true, false, false),
  ('contact_profile', 'address',         'Address',         'text',     'left',  4,  true, false, false),
  ('contact_profile', 'city',            'City',            'text',     'right', 5,  true, false, false),
  ('contact_profile', 'state',           'State',           'text',     'left',  6,  true, false, false),
  ('contact_profile', 'zip',             'Zip',             'text',     'right', 7,  true, false, false),
  ('contact_profile', 'lifecycle_stage', 'Lifecycle Stage', 'dropdown', 'left',  8,  true, false, false),
  ('contact_profile', 'status',          'Status',          'dropdown', 'right', 9,  true, false, false),
  ('contact_profile', 'source',          'Source',          'dropdown', 'left',  10, true, false, false),
  ('contact_profile', 'company_name',    'Company',         'text',     'right', 11, true, false, false)

ON CONFLICT (module, field_key) DO NOTHING;
