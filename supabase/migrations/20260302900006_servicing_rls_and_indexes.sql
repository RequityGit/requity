-- =============================================================================
-- LOAN SERVICING INFRASTRUCTURE — Phase 7 & 8: RLS Policies & Indexes
-- =============================================================================
-- Matches existing RLS pattern: admin full access, limited borrower access,
-- no direct borrower access to billing/NACHA tables.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. RLS POLICIES — loan_events
-- ---------------------------------------------------------------------------
-- Admin: full CRUD
DO $$ BEGIN
    CREATE POLICY loan_events_admin_all ON loan_events
        FOR ALL USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 2. RLS POLICIES — billing_cycles
-- ---------------------------------------------------------------------------
DO $$ BEGIN
    CREATE POLICY billing_cycles_admin_all ON billing_cycles
        FOR ALL USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 3. RLS POLICIES — billing_line_items
-- ---------------------------------------------------------------------------
DO $$ BEGIN
    CREATE POLICY billing_items_admin_all ON billing_line_items
        FOR ALL USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 4. RLS POLICIES — delinquency_records
-- ---------------------------------------------------------------------------
DO $$ BEGIN
    CREATE POLICY delinquency_admin_all ON delinquency_records
        FOR ALL USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 5. RLS POLICIES — borrower_ach_info
-- ---------------------------------------------------------------------------
-- Admin only — sensitive ACH data, no borrower or loan officer access
DO $$ BEGIN
    CREATE POLICY borrower_ach_admin_all ON borrower_ach_info
        FOR ALL USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 6. Additional Indexes (beyond those created with tables)
-- ---------------------------------------------------------------------------

-- billing_line_items: additional useful indexes
CREATE INDEX IF NOT EXISTS idx_billing_items_status
    ON billing_line_items(status);

-- Composite index for payment waterfall queries
CREATE INDEX IF NOT EXISTS idx_billing_items_loan_status_date
    ON billing_line_items(loan_id, status, billing_date);

-- Index for reconciliation check 5 (interest variance)
CREATE INDEX IF NOT EXISTS idx_billing_items_loan_interest
    ON billing_line_items(loan_id, billing_date, total_interest_billed);

-- Servicing payments by loan and date (for last payment lookup)
CREATE INDEX IF NOT EXISTS idx_servicing_payments_loan_date_desc
    ON servicing_payments(loan_id, date DESC)
    WHERE entry_type = 'Original';
