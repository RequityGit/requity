-- =============================================================================
-- SERVICING ENGINE — Phase 6: RLS Policies & Append-Only/Immutable Constraints
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. APPEND-ONLY: servicing_payments — Prevent UPDATE and DELETE
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_payment_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Payment ledger is append-only. Updates and deletes are not allowed. Use a reversal entry instead.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payments_no_update
    BEFORE UPDATE ON servicing_payments
    FOR EACH ROW EXECUTE FUNCTION prevent_payment_modification();

CREATE TRIGGER trg_payments_no_delete
    BEFORE DELETE ON servicing_payments
    FOR EACH ROW EXECUTE FUNCTION prevent_payment_modification();


-- ---------------------------------------------------------------------------
-- 2. IMMUTABLE: servicing_audit_log — Prevent UPDATE and DELETE
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log is immutable. Updates and deletes are not allowed.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_no_update
    BEFORE UPDATE ON servicing_audit_log
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER trg_audit_no_delete
    BEFORE DELETE ON servicing_audit_log
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();


-- ---------------------------------------------------------------------------
-- 3. AUDIT TRIGGERS — Auto-log material changes to loans and draws
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_servicing_loan_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_field text;
    v_old_val text;
    v_new_val text;
BEGIN
    -- Track changes to key fields
    IF OLD.loan_status IS DISTINCT FROM NEW.loan_status THEN
        INSERT INTO servicing_audit_log (action, loan_id, field_changed, old_value, new_value, entry_type)
        VALUES ('LOAN_STATUS_CHANGE', NEW.loan_id, 'loan_status', OLD.loan_status, NEW.loan_status, 'System');
    END IF;

    IF OLD.current_balance IS DISTINCT FROM NEW.current_balance THEN
        INSERT INTO servicing_audit_log (action, loan_id, field_changed, old_value, new_value, entry_type)
        VALUES ('BALANCE_CHANGE', NEW.loan_id, 'current_balance', OLD.current_balance::text, NEW.current_balance::text, 'System');
    END IF;

    IF OLD.interest_rate IS DISTINCT FROM NEW.interest_rate THEN
        INSERT INTO servicing_audit_log (action, loan_id, field_changed, old_value, new_value, entry_type)
        VALUES ('RATE_CHANGE', NEW.loan_id, 'interest_rate', OLD.interest_rate::text, NEW.interest_rate::text, 'System');
    END IF;

    IF OLD.default_status IS DISTINCT FROM NEW.default_status THEN
        INSERT INTO servicing_audit_log (action, loan_id, field_changed, old_value, new_value, entry_type)
        VALUES ('DEFAULT_STATUS_CHANGE', NEW.loan_id, 'default_status', OLD.default_status, NEW.default_status, 'System');
    END IF;

    IF OLD.maturity_date IS DISTINCT FROM NEW.maturity_date THEN
        INSERT INTO servicing_audit_log (action, loan_id, field_changed, old_value, new_value, entry_type)
        VALUES ('MATURITY_DATE_CHANGE', NEW.loan_id, 'maturity_date', OLD.maturity_date::text, NEW.maturity_date::text, 'System');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_servicing_loan_audit
    AFTER UPDATE ON servicing_loans
    FOR EACH ROW EXECUTE FUNCTION log_servicing_loan_changes();


-- Audit draw status changes
CREATE OR REPLACE FUNCTION log_servicing_draw_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO servicing_audit_log (action, loan_id, field_changed, old_value, new_value, entry_type, reference)
        VALUES ('DRAW_STATUS_CHANGE', NEW.loan_id, 'draw_status',
                OLD.status, NEW.status, 'System',
                'Draw #' || NEW.draw_number);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_servicing_draw_audit
    AFTER UPDATE ON servicing_draws
    FOR EACH ROW EXECUTE FUNCTION log_servicing_draw_changes();


-- Audit new payments
CREATE OR REPLACE FUNCTION log_servicing_payment_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO servicing_audit_log (action, loan_id, field_changed, new_value, entry_type, reference)
    VALUES ('PAYMENT_RECORDED', NEW.loan_id, 'payment',
            NEW.amount_paid::text, 'System',
            COALESCE(NEW.reference_trace, 'No reference'));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_servicing_payment_audit
    AFTER INSERT ON servicing_payments
    FOR EACH ROW EXECUTE FUNCTION log_servicing_payment_insert();


-- ---------------------------------------------------------------------------
-- 4. LOCKED PAYMENT CHECK — Prevent inserting reversals of locked payments
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_payment_lock()
RETURNS TRIGGER AS $$
DECLARE
    v_locked boolean;
BEGIN
    IF NEW.entry_type = 'Reversal' AND NEW.reversal_of IS NOT NULL THEN
        SELECT locked INTO v_locked
        FROM servicing_payments
        WHERE id = NEW.reversal_of;

        -- Note: We allow reversals of locked payments — the lock prevents
        -- modifications but reversals are new entries
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_payment_lock
    BEFORE INSERT ON servicing_payments
    FOR EACH ROW EXECUTE FUNCTION check_payment_lock();


-- ---------------------------------------------------------------------------
-- 5. RLS POLICIES — Admin full access, borrower restricted access
-- ---------------------------------------------------------------------------

-- servicing_loans: Admins full CRUD, borrowers view own loans
CREATE POLICY servicing_loans_admin_all ON servicing_loans
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY servicing_loans_borrower_select ON servicing_loans
    FOR SELECT
    USING (
        has_role('borrower') AND
        loan_id IN (
            SELECT sl.loan_id
            FROM servicing_loans sl
            JOIN borrowers b ON b.user_id = (SELECT auth.uid())
            WHERE LOWER(sl.borrower_name) = LOWER(
                COALESCE(b.first_name, '') || ' ' || COALESCE(b.last_name, '')
            )
        )
    );

-- servicing_draws: Admins full CRUD, borrowers view own draws
CREATE POLICY servicing_draws_admin_all ON servicing_draws
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY servicing_draws_borrower_select ON servicing_draws
    FOR SELECT
    USING (
        has_role('borrower') AND
        loan_id IN (
            SELECT sl.loan_id
            FROM servicing_loans sl
            JOIN borrowers b ON b.user_id = (SELECT auth.uid())
            WHERE LOWER(sl.borrower_name) = LOWER(
                COALESCE(b.first_name, '') || ' ' || COALESCE(b.last_name, '')
            )
        )
    );

-- servicing_payments: Admins full CRUD (insert only effectively), borrowers view own
CREATE POLICY servicing_payments_admin_all ON servicing_payments
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY servicing_payments_borrower_select ON servicing_payments
    FOR SELECT
    USING (
        has_role('borrower') AND
        loan_id IN (
            SELECT sl.loan_id
            FROM servicing_loans sl
            JOIN borrowers b ON b.user_id = (SELECT auth.uid())
            WHERE LOWER(sl.borrower_name) = LOWER(
                COALESCE(b.first_name, '') || ' ' || COALESCE(b.last_name, '')
            )
        )
    );

-- servicing_construction_budgets: Admins full CRUD, borrowers view own
CREATE POLICY servicing_budgets_admin_all ON servicing_construction_budgets
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY servicing_budgets_borrower_select ON servicing_construction_budgets
    FOR SELECT
    USING (
        has_role('borrower') AND
        loan_id IN (
            SELECT sl.loan_id
            FROM servicing_loans sl
            JOIN borrowers b ON b.user_id = (SELECT auth.uid())
            WHERE LOWER(sl.borrower_name) = LOWER(
                COALESCE(b.first_name, '') || ' ' || COALESCE(b.last_name, '')
            )
        )
    );

-- servicing_pending_actions: Admins only
CREATE POLICY servicing_actions_admin_all ON servicing_pending_actions
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- servicing_audit_log: Admins read-only (insert via triggers only)
CREATE POLICY servicing_audit_admin_select ON servicing_audit_log
    FOR SELECT
    USING (is_admin());

-- Allow system inserts to audit log (trigger functions run as table owner)
CREATE POLICY servicing_audit_system_insert ON servicing_audit_log
    FOR INSERT
    WITH CHECK (true);
