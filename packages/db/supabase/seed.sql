-- Requity Group Unified Portal - Seed Data
-- This seed file creates demo data for testing the portal.
-- NOTE: Auth users must be created through Supabase Auth (dashboard or API).
-- This seeds the public tables assuming auth users already exist.

-- Demo user UUIDs (these must match auth.users entries)
-- Admin users
-- admin1: 00000000-0000-0000-0000-000000000001
-- admin2: 00000000-0000-0000-0000-000000000002
-- admin3: 00000000-0000-0000-0000-000000000003

-- Investor users
-- investor1: 10000000-0000-0000-0000-000000000001
-- investor2: 10000000-0000-0000-0000-000000000002
-- investor3: 10000000-0000-0000-0000-000000000003
-- investor4: 10000000-0000-0000-0000-000000000004
-- investor5: 10000000-0000-0000-0000-000000000005

-- Borrower users
-- borrower1: 20000000-0000-0000-0000-000000000001
-- borrower2: 20000000-0000-0000-0000-000000000002
-- borrower3: 20000000-0000-0000-0000-000000000003
-- borrower4: 20000000-0000-0000-0000-000000000004
-- borrower5: 20000000-0000-0000-0000-000000000005
-- borrower6: 20000000-0000-0000-0000-000000000006
-- borrower7: 20000000-0000-0000-0000-000000000007
-- borrower8: 20000000-0000-0000-0000-000000000008

-- ============================================
-- PROFILES
-- ============================================
INSERT INTO public.profiles (id, email, full_name, company_name, phone, role) VALUES
  -- Admins
  ('00000000-0000-0000-0000-000000000001', 'admin@requitygroup.com', 'Sarah Chen', 'Requity Group', '(212) 555-0100', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'jmartinez@requitygroup.com', 'James Martinez', 'Requity Group', '(212) 555-0101', 'admin'),
  ('00000000-0000-0000-0000-000000000003', 'lthompson@requitygroup.com', 'Lisa Thompson', 'Requity Group', '(212) 555-0102', 'admin'),
  -- Investors
  ('10000000-0000-0000-0000-000000000001', 'rwilson@capitalventures.com', 'Robert Wilson', 'Capital Ventures LLC', '(310) 555-0201', 'investor'),
  ('10000000-0000-0000-0000-000000000002', 'ekim@pacificwealth.com', 'Emily Kim', 'Pacific Wealth Partners', '(415) 555-0202', 'investor'),
  ('10000000-0000-0000-0000-000000000003', 'mpatel@sunriseequity.com', 'Michael Patel', 'Sunrise Equity Group', '(305) 555-0203', 'investor'),
  ('10000000-0000-0000-0000-000000000004', 'janderson@oakgrove.com', 'Jennifer Anderson', 'Oak Grove Investments', '(512) 555-0204', 'investor'),
  ('10000000-0000-0000-0000-000000000005', 'dlee@harborpoint.com', 'David Lee', 'Harbor Point Capital', '(617) 555-0205', 'investor'),
  -- Borrowers
  ('20000000-0000-0000-0000-000000000001', 'tgarcia@garciarealty.com', 'Thomas Garcia', 'Garcia Realty Inc', '(713) 555-0301', 'borrower'),
  ('20000000-0000-0000-0000-000000000002', 'arobinson@bluestonedev.com', 'Amanda Robinson', 'Bluestone Development', '(404) 555-0302', 'borrower'),
  ('20000000-0000-0000-0000-000000000003', 'jnguyen@nguyenproperties.com', 'Jason Nguyen', 'Nguyen Properties LLC', '(214) 555-0303', 'borrower'),
  ('20000000-0000-0000-0000-000000000004', 'smorgan@morganbuilders.com', 'Stephanie Morgan', 'Morgan Builders Corp', '(602) 555-0304', 'borrower'),
  ('20000000-0000-0000-0000-000000000005', 'cbrown@brownflip.com', 'Christopher Brown', 'Brown Flip Homes', '(503) 555-0305', 'borrower'),
  ('20000000-0000-0000-0000-000000000006', 'ktaylor@taylorcommercial.com', 'Karen Taylor', 'Taylor Commercial Group', '(206) 555-0306', 'borrower'),
  ('20000000-0000-0000-0000-000000000007', 'rjohnson@johnsondev.com', 'Ryan Johnson', 'Johnson Development Co', '(312) 555-0307', 'borrower'),
  ('20000000-0000-0000-0000-000000000008', 'mwhite@whitecapital.com', 'Michelle White', 'White Capital Properties', '(480) 555-0308', 'borrower')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FUNDS
-- ============================================
INSERT INTO public.funds (id, name, fund_type, target_size, current_aum, vintage_year, status) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'Requity Bridge Fund I', 'debt', 50000000, 38500000, 2023, 'open'),
  ('f0000000-0000-0000-0000-000000000002', 'Requity Equity Fund I', 'equity', 75000000, 42000000, 2024, 'open')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- INVESTOR COMMITMENTS
-- ============================================
INSERT INTO public.investor_commitments (id, investor_id, fund_id, commitment_amount, funded_amount, commitment_date, status) VALUES
  -- Fund I - Bridge (Debt)
  ('c0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 5000000, 3500000, '2023-03-15', 'partially_called'),
  ('c0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 10000000, 8000000, '2023-03-20', 'partially_called'),
  ('c0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001', 7500000, 7500000, '2023-04-01', 'fully_called'),
  ('c0000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000001', 3000000, 2000000, '2023-04-10', 'partially_called'),
  ('c0000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000001', 8000000, 5500000, '2023-05-01', 'partially_called'),
  -- Fund II - Equity
  ('c0000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 8000000, 4000000, '2024-01-15', 'partially_called'),
  ('c0000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 15000000, 10000000, '2024-01-20', 'partially_called'),
  ('c0000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000002', 12000000, 8000000, '2024-02-01', 'partially_called'),
  ('c0000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000002', 10000000, 6000000, '2024-02-15', 'partially_called')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CAPITAL CALLS
-- ============================================
INSERT INTO public.capital_calls (id, fund_id, investor_id, commitment_id, call_amount, due_date, status, paid_date) VALUES
  -- Bridge Fund I capital calls
  ('cc000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 2000000, '2023-06-01', 'paid', '2023-05-28'),
  ('cc000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 4000000, '2023-06-01', 'paid', '2023-05-30'),
  ('cc000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 3000000, '2023-06-01', 'paid', '2023-05-29'),
  ('cc000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 1500000, '2023-09-15', 'paid', '2023-09-12'),
  ('cc000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 4000000, '2023-09-15', 'paid', '2023-09-14'),
  ('cc000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 4500000, '2023-09-15', 'paid', '2023-09-13'),
  ('cc000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 2000000, '2024-01-15', 'paid', '2024-01-10'),
  ('cc000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 5500000, '2024-01-15', 'paid', '2024-01-12'),
  -- Equity Fund capital calls
  ('cc000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 4000000, '2024-04-01', 'paid', '2024-03-28'),
  ('cc000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000007', 10000000, '2024-04-01', 'paid', '2024-03-30'),
  ('cc000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000008', 8000000, '2024-04-01', 'paid', '2024-03-29'),
  ('cc000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000009', 6000000, '2024-04-01', 'paid', '2024-03-31'),
  -- Pending capital calls
  ('cc000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 500000, '2025-03-01', 'pending', NULL),
  ('cc000000-0000-0000-0000-000000000014', 'f0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 2000000, '2025-03-15', 'pending', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DISTRIBUTIONS
-- ============================================
INSERT INTO public.distributions (id, fund_id, investor_id, distribution_type, amount, distribution_date, description, status) VALUES
  -- Q1 2025 distributions - Bridge Fund
  ('d0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'income', 87500, '2025-04-15', 'Q1 2025 quarterly interest distribution', 'paid'),
  ('d0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'income', 200000, '2025-04-15', 'Q1 2025 quarterly interest distribution', 'paid'),
  ('d0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'income', 187500, '2025-04-15', 'Q1 2025 quarterly interest distribution', 'paid'),
  ('d0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'income', 50000, '2025-04-15', 'Q1 2025 quarterly interest distribution', 'paid'),
  ('d0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'income', 137500, '2025-04-15', 'Q1 2025 quarterly interest distribution', 'paid'),
  -- Q2 2025 distributions - Bridge Fund
  ('d0000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'income', 87500, '2025-07-15', 'Q2 2025 quarterly interest distribution', 'paid'),
  ('d0000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'income', 200000, '2025-07-15', 'Q2 2025 quarterly interest distribution', 'paid'),
  ('d0000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'income', 187500, '2025-07-15', 'Q2 2025 quarterly interest distribution', 'paid'),
  -- Q3 2025 distributions - Bridge Fund
  ('d0000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'income', 87500, '2025-10-15', 'Q3 2025 quarterly interest distribution', 'paid'),
  ('d0000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'income', 200000, '2025-10-15', 'Q3 2025 quarterly interest distribution', 'paid'),
  -- Q4 2025 distributions - Bridge Fund
  ('d0000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'income', 87500, '2026-01-15', 'Q4 2025 quarterly interest distribution', 'pending'),
  ('d0000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'income', 200000, '2026-01-15', 'Q4 2025 quarterly interest distribution', 'pending'),
  -- Equity Fund distributions
  ('d0000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'gain', 120000, '2025-07-01', 'H1 2025 property sale proceeds', 'paid'),
  ('d0000000-0000-0000-0000-000000000014', 'f0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'gain', 300000, '2025-07-01', 'H1 2025 property sale proceeds', 'paid'),
  ('d0000000-0000-0000-0000-000000000015', 'f0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'return_of_capital', 500000, '2025-12-15', 'H2 2025 partial return of capital', 'paid')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- LOANS (updated for pipeline stages)
-- ============================================
INSERT INTO public.loans (id, borrower_id, loan_type, property_address, property_city, property_state, property_zip, loan_amount, appraised_value, interest_rate, term_months, stage, stage_updated_at, originator, originator_id, processor_id, next_action, expected_close_date, purchase_price, notes) VALUES
  ('l0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'bridge_residential', '1425 Oak Street', 'Houston', 'TX', '77001', 850000, 1200000, 10.5, 12, 'servicing', '2024-11-15', 'Sarah Chen', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', NULL, NULL, 975000, 'Rehab project, good borrower history'),
  ('l0000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'bridge_commercial', '500 Commerce Blvd, Suite 200', 'Atlanta', 'GA', '30301', 2500000, 3500000, 11.0, 18, 'funded', '2025-01-20', 'James Martinez', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', NULL, NULL, 2800000, 'Mixed-use commercial property'),
  ('l0000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'fix_and_flip', '782 Elm Avenue', 'Dallas', 'TX', '75201', 425000, 650000, 12.0, 9, 'underwriting', '2025-02-01', 'Sarah Chen', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Waiting on borrower entity docs', '2025-04-15', 510000, 'Single family fix and flip'),
  ('l0000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'ground_up', '15 Harbor View Lane', 'Phoenix', 'AZ', '85001', 3200000, 4800000, 11.5, 24, 'approved', '2025-02-10', 'Lisa Thompson', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Title commitment needed', '2025-03-30', 3800000, 'New construction townhomes'),
  ('l0000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 'fix_and_flip', '2200 Pine Street', 'Portland', 'OR', '97201', 375000, 550000, 12.5, 6, 'clear_to_close', '2025-02-15', 'James Martinez', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Final docs in review', '2025-03-10', 420000, 'Quick flip opportunity'),
  ('l0000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000006', 'bridge_commercial', '8900 Industrial Pkwy', 'Seattle', 'WA', '98101', 4500000, 6200000, 10.0, 18, 'lead', '2025-02-20', 'Sarah Chen', '00000000-0000-0000-0000-000000000001', NULL, 'Initial borrower outreach', '2025-06-01', 5200000, 'Industrial warehouse conversion'),
  ('l0000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000007', 'stabilized', '350 Maple Court, Units 1-4', 'Chicago', 'IL', '60601', 1200000, 1650000, 8.5, 36, 'servicing', '2024-08-01', 'Lisa Thompson', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', NULL, NULL, 1450000, 'Multi-unit stabilized rental'),
  ('l0000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000008', 'bridge_residential', '945 Sunset Drive', 'Scottsdale', 'AZ', '85251', 675000, 950000, 11.0, 12, 'processing', '2025-02-22', 'James Martinez', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Waiting on insurance quote', '2025-04-01', 780000, 'Luxury rehab project'),
  -- Additional pipeline loans for a fuller board
  ('l0000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000001', 'dscr', '2100 Main Street', 'Austin', 'TX', '78701', 520000, 720000, 9.5, 30, 'application', '2025-02-25', 'Sarah Chen', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Application under review', '2025-05-15', 600000, 'DSCR rental property, strong cash flow'),
  ('l0000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000003', 'bridge_residential', '410 Cherry Lane', 'Denver', 'CO', '80201', 390000, 560000, 11.5, 12, 'processing', '2025-02-18', 'Lisa Thompson', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Credit check pending', '2025-04-10', 450000, 'Duplex conversion project'),
  ('l0000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000005', 'fix_and_flip', '7788 Birch Road', 'Tampa', 'FL', '33601', 280000, 420000, 13.0, 6, 'application', '2025-02-26', 'James Martinez', '00000000-0000-0000-0000-000000000002', NULL, NULL, '2025-05-01', 320000, 'Small SFR flip'),
  ('l0000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000006', 'bridge_commercial', '1200 Enterprise Way', 'Miami', 'FL', '33101', 6800000, 9200000, 9.5, 24, 'lead', '2025-02-27', 'Sarah Chen', '00000000-0000-0000-0000-000000000001', NULL, 'Broker referral, high priority', NULL, 7500000, 'Large office-to-residential conversion')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DRAW REQUESTS
-- ============================================
INSERT INTO public.draw_requests (id, loan_id, borrower_id, draw_number, amount_requested, amount_approved, description, status, submitted_at, reviewed_at, reviewer_notes) VALUES
  ('dr000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1, 125000, 125000, 'Foundation and framing complete. Requesting first draw for electrical and plumbing rough-in.', 'funded', '2024-12-01', '2024-12-05', 'Inspection passed. Approved full amount.'),
  ('dr000000-0000-0000-0000-000000000002', 'l0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 2, 95000, 85000, 'Electrical and plumbing complete. Requesting draw for drywall and finishing.', 'approved', '2025-01-15', '2025-01-20', 'Partial approval - drywall not fully complete per inspector.'),
  ('dr000000-0000-0000-0000-000000000003', 'l0000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 1, 350000, NULL, 'Phase 1 tenant improvements complete. Requesting draw for Phase 2 buildout.', 'submitted', '2025-02-10', NULL, NULL),
  ('dr000000-0000-0000-0000-000000000004', 'l0000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 1, 500000, NULL, 'Site work and foundation poured. Requesting first construction draw.', 'under_review', '2025-02-18', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- LOAN PAYMENTS
-- ============================================
INSERT INTO public.loan_payments (id, loan_id, borrower_id, payment_number, amount_due, amount_paid, principal_amount, interest_amount, due_date, paid_date, status) VALUES
  -- Loan 1 (Garcia - Bridge Residential, Servicing)
  ('lp000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1, 7437.50, 7437.50, 0, 7437.50, '2024-12-01', '2024-12-01', 'paid'),
  ('lp000000-0000-0000-0000-000000000002', 'l0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 2, 7437.50, 7437.50, 0, 7437.50, '2025-01-01', '2025-01-01', 'paid'),
  ('lp000000-0000-0000-0000-000000000003', 'l0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 3, 7437.50, 7437.50, 0, 7437.50, '2025-02-01', '2025-02-01', 'paid'),
  -- Loan 2 (Robinson - Bridge Commercial, Funded)
  ('lp000000-0000-0000-0000-000000000004', 'l0000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 1, 22916.67, 22916.67, 0, 22916.67, '2025-02-01', '2025-02-01', 'paid'),
  -- Loan 7 (Johnson - Stabilized, Servicing)
  ('lp000000-0000-0000-0000-000000000005', 'l0000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000007', 1, 12500.00, 12500.00, 4000, 8500, '2024-09-01', '2024-09-01', 'paid'),
  ('lp000000-0000-0000-0000-000000000006', 'l0000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000007', 2, 12500.00, 12500.00, 4050, 8450, '2024-10-01', '2024-10-01', 'paid'),
  ('lp000000-0000-0000-0000-000000000007', 'l0000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000007', 3, 12500.00, 12500.00, 4100, 8400, '2024-11-01', '2024-11-01', 'paid'),
  ('lp000000-0000-0000-0000-000000000008', 'l0000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000007', 4, 12500.00, 12500.00, 4150, 8350, '2024-12-01', '2024-12-01', 'paid'),
  ('lp000000-0000-0000-0000-000000000009', 'l0000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000007', 5, 12500.00, 12500.00, 4200, 8300, '2025-01-01', '2025-01-01', 'paid'),
  ('lp000000-0000-0000-0000-000000000010', 'l0000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000007', 6, 12500.00, 12500.00, 4250, 8250, '2025-02-01', '2025-02-01', 'paid'),
  -- Upcoming payments
  ('lp000000-0000-0000-0000-000000000011', 'l0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 4, 7437.50, 0, 0, 7437.50, '2025-03-01', NULL, 'pending')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DOCUMENTS (metadata only - actual files stored in Supabase Storage)
-- ============================================
INSERT INTO public.documents (id, owner_id, uploaded_by, document_type, file_name, description, file_path, file_size, mime_type, fund_id, loan_id, status) VALUES
  -- Investor documents
  ('doc00000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'k1', '2024-k1-bridge-fund-1.pdf', '2024 K-1 - Bridge Fund I', 'investor-documents/10000000-0000-0000-0000-000000000001/k1/2024-k1-bridge-fund-1.pdf', 245000, 'application/pdf', 'f0000000-0000-0000-0000-000000000001', NULL, 'approved'),
  ('doc00000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'distribution_statement', 'q4-2025-dist-statement.pdf', 'Q4 2025 Distribution Statement', 'investor-documents/10000000-0000-0000-0000-000000000001/distribution_statement/q4-2025-dist-statement.pdf', 128000, 'application/pdf', 'f0000000-0000-0000-0000-000000000001', NULL, 'approved'),
  ('doc00000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'investor_report', '2025-annual-report-bridge-fund-1.pdf', 'Annual Report 2025 - Bridge Fund I', 'investor-documents/10000000-0000-0000-0000-000000000001/investor_report/2025-annual-report-bridge-fund-1.pdf', 1500000, 'application/pdf', 'f0000000-0000-0000-0000-000000000001', NULL, 'approved'),
  ('doc00000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'k1', '2024-k1-bridge-fund-1.pdf', '2024 K-1 - Bridge Fund I', 'investor-documents/10000000-0000-0000-0000-000000000002/k1/2024-k1-bridge-fund-1.pdf', 248000, 'application/pdf', 'f0000000-0000-0000-0000-000000000001', NULL, 'approved'),
  ('doc00000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'capital_call_notice', 'q1-2025-capital-call.pdf', 'Capital Call Notice - Q1 2025', 'investor-documents/10000000-0000-0000-0000-000000000002/capital_call_notice/q1-2025-capital-call.pdf', 98000, 'application/pdf', 'f0000000-0000-0000-0000-000000000001', NULL, 'approved'),
  -- Borrower / Loan documents
  ('doc00000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'loan_agreement', 'loan-agreement-1425-oak.pdf', 'Loan Agreement - 1425 Oak Street', 'loan-documents/20000000-0000-0000-0000-000000000001/loan_agreement/loan-agreement-1425-oak.pdf', 450000, 'application/pdf', NULL, 'l0000000-0000-0000-0000-000000000001', 'approved'),
  ('doc00000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'appraisal', 'appraisal-1425-oak.pdf', 'Appraisal - 1425 Oak Street', 'loan-documents/20000000-0000-0000-0000-000000000001/appraisal/appraisal-1425-oak.pdf', 2200000, 'application/pdf', NULL, 'l0000000-0000-0000-0000-000000000001', 'approved'),
  ('doc00000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'insurance', 'insurance-1425-oak.pdf', 'Insurance Certificate - 1425 Oak Street', 'loan-documents/20000000-0000-0000-0000-000000000001/insurance/insurance-1425-oak.pdf', 180000, 'application/pdf', NULL, 'l0000000-0000-0000-0000-000000000001', 'approved'),
  ('doc00000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'loan_agreement', 'loan-agreement-500-commerce.pdf', 'Loan Agreement - 500 Commerce Blvd', 'loan-documents/20000000-0000-0000-0000-000000000002/loan_agreement/loan-agreement-500-commerce.pdf', 520000, 'application/pdf', NULL, 'l0000000-0000-0000-0000-000000000002', 'approved'),
  ('doc00000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'closing_docs', 'closing-500-commerce.pdf', 'Closing Package - 500 Commerce Blvd', 'loan-documents/20000000-0000-0000-0000-000000000002/closing_docs/closing-500-commerce.pdf', 3500000, 'application/pdf', NULL, 'l0000000-0000-0000-0000-000000000002', 'approved'),
  ('doc00000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'draw_approval', 'draw-1-approval-1425-oak.pdf', 'Draw #1 Approval - 1425 Oak Street', 'loan-documents/20000000-0000-0000-0000-000000000001/draw_approval/draw-1-approval-1425-oak.pdf', 95000, 'application/pdf', NULL, 'l0000000-0000-0000-0000-000000000001', 'approved'),
  ('doc00000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', 'loan_agreement', 'loan-agreement-350-maple.pdf', 'Loan Agreement - 350 Maple Court', 'loan-documents/20000000-0000-0000-0000-000000000007/loan_agreement/loan-agreement-350-maple.pdf', 410000, 'application/pdf', NULL, 'l0000000-0000-0000-0000-000000000007', 'approved')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- LOAN CONDITION TEMPLATES (flat table matching live DB)
-- ============================================
INSERT INTO public.loan_condition_templates (id, condition_name, category, required_stage, internal_description, borrower_description, responsible_party, critical_path_item, applies_to_rtl, applies_to_commercial, applies_to_dscr, applies_to_guc, applies_to_transactional, is_active, sort_order) VALUES
  -- Borrower Documents
  ('lct00000-0000-0000-0000-000000000001', 'Signed Loan Application', 'borrower_documents', 'processing', 'Complete and signed loan application form', 'Please complete and sign the loan application', 'borrower', true, true, true, true, true, true, true, 1),
  ('lct00000-0000-0000-0000-000000000002', 'Credit Authorization', 'borrower_documents', 'processing', 'Signed credit check authorization', 'Please sign the credit authorization form', 'borrower', true, true, true, true, true, true, true, 2),
  ('lct00000-0000-0000-0000-000000000003', 'Personal Financial Statement', 'borrower_documents', 'processing', 'Current personal financial statement for all guarantors', 'Please provide a current personal financial statement', 'borrower', false, true, true, true, true, false, true, 3),
  ('lct00000-0000-0000-0000-000000000004', 'Bank Statements (2 months)', 'borrower_documents', 'processing', 'Last 2 months of bank statements for all accounts', 'Please provide your last 2 months of bank statements', 'borrower', true, true, true, true, true, false, true, 4),
  ('lct00000-0000-0000-0000-000000000005', 'Proof of Funds for Down Payment', 'borrower_documents', 'processing', 'Documentation showing available funds for down payment and reserves', 'Please provide proof of funds for your down payment', 'borrower', true, true, true, true, true, false, true, 5),
  -- Entity Documents
  ('lct00000-0000-0000-0000-000000000006', 'Entity Documents (Articles, OA, EIN)', 'entity_documents', 'processing', 'Articles of Org, Operating Agreement, EIN Letter', 'Please provide your entity formation documents', 'borrower', true, true, true, true, true, true, true, 6),
  -- Deal Level Items
  ('lct00000-0000-0000-0000-000000000007', 'Purchase Contract', 'deal_level_items', 'processing', 'Fully executed purchase agreement', 'Please provide the signed purchase contract', 'borrower', true, true, true, true, true, true, true, 7),
  ('lct00000-0000-0000-0000-000000000008', 'Rehab Budget / Scope of Work', 'deal_level_items', 'processing', 'Detailed rehab budget and scope of work', 'Please provide your detailed rehab budget and scope of work', 'borrower', true, true, false, false, true, false, true, 8),
  ('lct00000-0000-0000-0000-000000000009', 'Rent Roll', 'deal_level_items', 'processing', 'Current rent roll and lease abstracts', 'Please provide the current rent roll', 'borrower', false, false, true, true, false, false, true, 9),
  ('lct00000-0000-0000-0000-000000000010', 'Operating Statements (2 years)', 'deal_level_items', 'processing', 'Trailing 24 months of operating statements / P&L', 'Please provide the last 2 years of operating statements', 'borrower', false, false, true, true, false, false, true, 10),
  -- Appraisal Request
  ('lct00000-0000-0000-0000-000000000011', 'Appraisal or BPO', 'appraisal_request', 'processing', 'Final appraisal or Broker Price Opinion', 'No action needed — we will order the appraisal', 'internal', true, true, true, true, true, false, true, 11),
  -- Title / Fraud Protection
  ('lct00000-0000-0000-0000-000000000012', 'Final Title Commitment', 'title_fraud_protection', 'closed_onboarding', 'Clean title commitment with no unacceptable exceptions', 'No action needed — your title company will provide this', 'title_company', true, true, true, true, true, true, true, 12),
  ('lct00000-0000-0000-0000-000000000013', 'Flood Certification', 'title_fraud_protection', 'closed_onboarding', 'Flood zone determination certificate', 'No action needed — we will order the flood cert', 'internal', false, true, true, true, true, false, true, 13),
  ('lct00000-0000-0000-0000-000000000014', 'Background & Credit Check', 'title_fraud_protection', 'processing', 'Internal background and credit check completed', 'No action needed — we will handle this internally', 'internal', true, true, true, true, true, true, true, 14),
  -- Insurance Request
  ('lct00000-0000-0000-0000-000000000015', 'Insurance Quote', 'insurance_request', 'processing', 'Property insurance quote or binder', 'Please provide an insurance quote for the property', 'insurance_agent', false, true, true, true, true, false, true, 15),
  ('lct00000-0000-0000-0000-000000000016', 'Proof of Insurance (Bound Policy)', 'insurance_request', 'closed_onboarding', 'Evidence of hazard insurance with proper endorsements', 'Please ensure your insurance agent binds the policy before closing', 'insurance_agent', true, true, true, true, true, false, true, 16),
  -- Lender Package
  ('lct00000-0000-0000-0000-000000000017', 'Executed Loan Documents', 'lender_package', 'closed_onboarding', 'All loan documents signed by borrower', 'You will need to sign all loan documents at closing', 'borrower', true, true, true, true, true, true, true, 17),
  ('lct00000-0000-0000-0000-000000000018', 'Wire Instructions', 'lender_package', 'closed_onboarding', 'Verified wire transfer instructions', 'Please provide your wire transfer instructions', 'borrower', false, true, true, true, true, true, true, 18)
ON CONFLICT (id) DO NOTHING;
