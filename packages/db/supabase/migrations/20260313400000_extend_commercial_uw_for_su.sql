-- ============================================================
-- Extend commercial UW tables for Sources & Uses go-live
-- Adds typed debt tranches, categorized S&U rows, enhanced
-- scope-of-work fields, and S&U configuration columns.
-- ============================================================

-- ── deal_commercial_debt: typed tranches + takeout constraints ──

ALTER TABLE deal_commercial_debt
  ADD COLUMN IF NOT EXISTS tranche_type TEXT DEFAULT 'senior'
    CHECK (tranche_type IN ('senior', 'mezz', 'takeout')),
  ADD COLUMN IF NOT EXISTS is_io BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ltv_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS prepay_type TEXT,
  ADD COLUMN IF NOT EXISTS max_ltv_constraint NUMERIC,
  ADD COLUMN IF NOT EXISTS dscr_floor_constraint NUMERIC,
  ADD COLUMN IF NOT EXISTS takeout_year INT,
  ADD COLUMN IF NOT EXISTS appraisal_cap_rate NUMERIC;

-- Back-fill existing rows as senior
UPDATE deal_commercial_debt SET tranche_type = 'senior' WHERE tranche_type IS NULL;

-- ── deal_commercial_sources_uses: category for closing costs vs reserves ──

ALTER TABLE deal_commercial_sources_uses
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general'
    CHECK (category IN ('general', 'closing_cost', 'reserve'));

-- ── deal_commercial_scope_of_work: structured budget fields ──

ALTER TABLE deal_commercial_scope_of_work
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS qty NUMERIC DEFAULT 1,
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS timeline TEXT,
  ADD COLUMN IF NOT EXISTS budget_type TEXT DEFAULT 'value_add'
    CHECK (budget_type IN ('value_add', 'ground_up'));

-- ── deal_commercial_uw: S&U configuration columns ──

ALTER TABLE deal_commercial_uw
  ADD COLUMN IF NOT EXISTS budget_mode TEXT DEFAULT 'value_add'
    CHECK (budget_mode IN ('value_add', 'ground_up')),
  ADD COLUMN IF NOT EXISTS takeout_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS value_add_contingency_pct NUMERIC DEFAULT 10,
  ADD COLUMN IF NOT EXISTS ground_up_gc_fee_pct NUMERIC DEFAULT 5,
  ADD COLUMN IF NOT EXISTS ground_up_dev_fee_pct NUMERIC DEFAULT 4,
  ADD COLUMN IF NOT EXISTS ground_up_contingency_pct NUMERIC DEFAULT 10;
