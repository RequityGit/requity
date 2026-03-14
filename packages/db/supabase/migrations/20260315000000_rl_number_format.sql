-- Migration: Unified RL number format
-- Changes deal_number / loan_number across unified_deals, equity_deals, and loans
-- from R26-XXXX / EQ-YYYY-NNN / LN-XXXX to a single RL{NNNN} format (e.g. RL1100).
-- Uses one shared PostgreSQL sequence so every number is globally unique.

-- =========================================================================
-- 1. Create shared sequence starting at 1100
-- =========================================================================
CREATE SEQUENCE IF NOT EXISTS rl_number_seq START WITH 1100;

-- =========================================================================
-- 2. Re-number unified_deals (pipeline deals) — ordered by created_at
-- =========================================================================
ALTER TABLE unified_deals
  DROP CONSTRAINT IF EXISTS unified_deals_deal_number_unique;

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM unified_deals
)
UPDATE unified_deals u
SET deal_number = 'RL' || LPAD((1099 + o.rn)::TEXT, 4, '0')
FROM ordered o
WHERE u.id = o.id;

-- =========================================================================
-- 3. Re-number equity_deals — continues after unified_deals
-- =========================================================================
ALTER TABLE equity_deals
  DROP CONSTRAINT IF EXISTS equity_deals_deal_number_key;

WITH base AS (
  SELECT COALESCE((SELECT COUNT(*) FROM unified_deals), 0) AS cnt
),
ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM equity_deals
)
UPDATE equity_deals e
SET deal_number = 'RL' || LPAD((1099 + (SELECT cnt FROM base) + o.rn)::TEXT, 4, '0')
FROM ordered o
WHERE e.id = o.id;

-- =========================================================================
-- 4. Re-number loans — continues after equity_deals
-- =========================================================================
ALTER TABLE loans
  DROP CONSTRAINT IF EXISTS loans_loan_number_key;

WITH base AS (
  SELECT COALESCE((SELECT COUNT(*) FROM unified_deals), 0)
       + COALESCE((SELECT COUNT(*) FROM equity_deals), 0) AS cnt
),
ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM loans
)
UPDATE loans l
SET loan_number = 'RL' || LPAD((1099 + (SELECT cnt FROM base) + o.rn)::TEXT, 4, '0')
FROM ordered o
WHERE l.id = o.id;

-- =========================================================================
-- 5. Advance the sequence past the last assigned number
-- =========================================================================
SELECT setval('rl_number_seq',
  1099 + (SELECT COUNT(*) FROM unified_deals)
       + (SELECT COUNT(*) FROM equity_deals)
       + (SELECT COUNT(*) FROM loans)
);

-- =========================================================================
-- 6. Re-add unique constraints
-- =========================================================================
ALTER TABLE unified_deals
  ADD CONSTRAINT unified_deals_deal_number_unique UNIQUE (deal_number);

ALTER TABLE equity_deals
  ADD CONSTRAINT equity_deals_deal_number_key UNIQUE (deal_number);

ALTER TABLE loans
  ADD CONSTRAINT loans_loan_number_key UNIQUE (loan_number);

-- =========================================================================
-- 7. Replace trigger function for unified_deals
-- =========================================================================
CREATE OR REPLACE FUNCTION unified_generate_deal_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.deal_number := 'RL' || LPAD(nextval('rl_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- =========================================================================
-- 8. Replace trigger function for equity_deals
-- =========================================================================
CREATE OR REPLACE FUNCTION generate_equity_deal_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.deal_number := 'RL' || LPAD(nextval('rl_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- =========================================================================
-- 9. Update loans column default to use the shared sequence
-- =========================================================================
ALTER TABLE loans
  ALTER COLUMN loan_number SET DEFAULT 'RL' || LPAD(nextval('rl_number_seq')::TEXT, 4, '0');
