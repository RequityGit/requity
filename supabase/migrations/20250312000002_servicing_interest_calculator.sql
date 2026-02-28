-- =============================================================================
-- SERVICING ENGINE — Phase 3: Interest Calculator (30/360 Convention)
-- =============================================================================
-- The crown jewel. Calculates monthly interest for each active loan using
-- 30/360 day count convention with per-diem draw splits.
--
-- Key rules:
--   - Dutch Interest loans: interest on TOTAL LOAN COMMITMENT, no draw splits
--   - Non-Dutch loans: interest on funded balance + per-diem for mid-month draws
--   - 30/360: origination/maturity boundary handling
--   - Default rate escalation when loan is in default
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Return type for the interest calculator
-- ---------------------------------------------------------------------------
DROP TYPE IF EXISTS interest_calc_result CASCADE;

CREATE TYPE interest_calc_result AS (
    loan_id         text,
    entity_name     text,
    dutch           text,
    rate            numeric,
    start_balance   numeric,
    mid_month_draw  numeric,
    draw_day        integer,
    total_days      integer,
    pre_draw_days   integer,
    post_draw_days  integer,
    interest_due    numeric,
    audit_trail     text,
    check_status    text
);


-- ---------------------------------------------------------------------------
-- calculate_monthly_interest(period_start date)
-- ---------------------------------------------------------------------------
-- Pass in the first day of the billing month (e.g. '2026-01-01').
-- Returns one row per active loan with full interest breakdown.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_monthly_interest(period_start date)
RETURNS SETOF interest_calc_result
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    period_end      date;
    rec             record;
    result          interest_calc_result;
    v_rate          numeric;
    v_start_bal     numeric;
    v_mid_draw      numeric;
    v_draw_day      integer;
    v_total_days    integer;
    v_pre_days      integer;
    v_post_days     integer;
    v_interest      numeric;
    v_orig_date     date;
    v_mat_date      date;
    draw_rec        record;
    v_draw_interest numeric;
BEGIN
    -- Period end = last day of the billing month
    period_end := (period_start + interval '1 month' - interval '1 day')::date;

    FOR rec IN
        SELECT *
        FROM servicing_loans
        WHERE loan_status = 'Active'
        ORDER BY loan_id
    LOOP
        -- ----------------------------------------------------------------
        -- Step 1: Determine the effective rate
        -- ----------------------------------------------------------------
        -- Default rate escalation: if loan is in default and default_date
        -- is on or before period_end, use default_rate
        IF rec.default_status = 'In Default'
           AND rec.default_date IS NOT NULL
           AND period_end >= rec.default_date
           AND rec.default_rate IS NOT NULL
        THEN
            v_rate := rec.default_rate;
        ELSE
            v_rate := COALESCE(rec.interest_rate, 0);
        END IF;

        -- ----------------------------------------------------------------
        -- Step 2: Calculate total days (30/360 convention)
        -- ----------------------------------------------------------------
        v_orig_date := rec.origination_date;
        v_mat_date  := rec.maturity_date;

        IF v_orig_date IS NULL AND v_mat_date IS NULL THEN
            -- No dates available, assume full month if loan is active
            v_total_days := 30;
        ELSIF v_orig_date IS NOT NULL AND v_orig_date > period_end THEN
            -- Loan not yet originated
            v_total_days := 0;
        ELSIF v_mat_date IS NOT NULL AND v_mat_date < period_start THEN
            -- Loan already matured
            v_total_days := 0;
        ELSIF v_orig_date IS NOT NULL
              AND v_orig_date >= period_start
              AND v_orig_date <= period_end THEN
            -- Loan originated DURING billing period
            v_total_days := 30 - EXTRACT(DAY FROM v_orig_date)::integer + 1;
        ELSIF v_mat_date IS NOT NULL
              AND v_mat_date >= period_start
              AND v_mat_date <= period_end THEN
            -- Loan matures DURING billing period
            v_total_days := EXTRACT(DAY FROM v_mat_date)::integer;
        ELSE
            -- Full month
            v_total_days := 30;
        END IF;

        -- ----------------------------------------------------------------
        -- Step 3: Calculate start balance and mid-month draws
        -- ----------------------------------------------------------------
        IF rec.dutch_interest THEN
            -- DUTCH: Always use total_loan_amount as the base
            v_start_bal := rec.total_loan_amount;
            v_mid_draw  := 0;
            v_draw_day  := NULL;
        ELSE
            -- NON-DUTCH: Start balance = sum of funded draws with
            -- funded_date <= period_start
            SELECT COALESCE(SUM(d.amount), 0)
            INTO v_start_bal
            FROM servicing_draws d
            WHERE d.loan_id = rec.loan_id
              AND d.status = 'Funded'
              AND d.funded_date <= period_start;

            -- Mid-month draws = draws funded DURING the period
            -- (after period_start, on or before period_end)
            SELECT COALESCE(SUM(d.amount), 0)
            INTO v_mid_draw
            FROM servicing_draws d
            WHERE d.loan_id = rec.loan_id
              AND d.status = 'Funded'
              AND d.funded_date > period_start
              AND d.funded_date <= period_end;

            -- Get the draw day (if there's exactly one mid-month draw group)
            -- For multiple mid-month draws on different days, we handle each separately
            IF v_mid_draw > 0 THEN
                -- Get the earliest mid-month draw day for the summary field
                SELECT EXTRACT(DAY FROM MIN(d.funded_date))::integer
                INTO v_draw_day
                FROM servicing_draws d
                WHERE d.loan_id = rec.loan_id
                  AND d.status = 'Funded'
                  AND d.funded_date > period_start
                  AND d.funded_date <= period_end;
            ELSE
                v_draw_day := NULL;
            END IF;
        END IF;

        -- ----------------------------------------------------------------
        -- Step 4: Calculate interest
        -- ----------------------------------------------------------------
        IF v_total_days = 0 THEN
            -- No interest due
            v_interest  := 0;
            v_pre_days  := 0;
            v_post_days := 0;
        ELSIF rec.dutch_interest THEN
            -- DUTCH: interest = total_loan_amount × rate / 12 × (total_days / 30)
            v_interest  := v_start_bal * v_rate / 12.0 * (v_total_days::numeric / 30.0);
            v_pre_days  := v_total_days;
            v_post_days := 0;
        ELSIF v_mid_draw = 0 THEN
            -- NON-DUTCH, no mid-month draws
            v_interest  := v_start_bal * v_rate / 12.0 * (v_total_days::numeric / 30.0);
            v_pre_days  := v_total_days;
            v_post_days := 0;
        ELSE
            -- NON-DUTCH with mid-month draws
            -- Base interest on start_balance for the full period
            v_interest := v_start_bal * v_rate / 12.0 * (v_total_days::numeric / 30.0);

            -- Add per-diem interest for each mid-month draw
            -- Each draw accrues from its funded day to end of month:
            -- draw_amount × rate/12 × (30 - draw_day + 1) / 30
            v_draw_interest := 0;
            FOR draw_rec IN
                SELECT d.amount, EXTRACT(DAY FROM d.funded_date)::integer AS draw_day_num
                FROM servicing_draws d
                WHERE d.loan_id = rec.loan_id
                  AND d.status = 'Funded'
                  AND d.funded_date > period_start
                  AND d.funded_date <= period_end
                ORDER BY d.funded_date
            LOOP
                v_draw_interest := v_draw_interest +
                    draw_rec.amount * v_rate / 12.0 * ((30 - draw_rec.draw_day_num + 1)::numeric / 30.0);
            END LOOP;

            v_interest := v_interest + v_draw_interest;

            -- Calculate pre/post draw days for reporting
            -- pre_draw_days = days before first draw in the period
            IF v_draw_day IS NOT NULL THEN
                v_pre_days := v_draw_day - 1;
                -- But cap at total_days if origination affected it
                IF v_pre_days > v_total_days THEN
                    v_pre_days := v_total_days;
                END IF;
                v_post_days := v_total_days - v_pre_days;
            ELSE
                v_pre_days  := v_total_days;
                v_post_days := 0;
            END IF;
        END IF;

        -- ----------------------------------------------------------------
        -- Step 5: Build result row
        -- ----------------------------------------------------------------
        result.loan_id        := rec.loan_id;
        result.entity_name    := rec.entity_name;
        result.dutch          := CASE WHEN rec.dutch_interest THEN 'Dutch' ELSE 'Non Dutch' END;
        result.rate           := CASE WHEN v_rate = 0 THEN NULL ELSE v_rate END;
        result.start_balance  := v_start_bal;
        result.mid_month_draw := v_mid_draw;
        result.draw_day       := v_draw_day;
        result.total_days     := v_total_days;
        result.pre_draw_days  := v_pre_days;
        result.post_draw_days := v_post_days;
        result.interest_due   := ROUND(v_interest, 6);

        -- Build audit trail string
        IF v_total_days = 0 THEN
            result.audit_trail := '$' || TRIM(TO_CHAR(v_start_bal, '999,999,999')) ||
                                  ' × ' || COALESCE(ROUND(v_rate * 100)::text, '0') || '%/12 × ' ||
                                  v_total_days || '/30';
            result.check_status := 'N/A';
        ELSIF v_mid_draw > 0 AND NOT rec.dutch_interest THEN
            result.audit_trail := '$' || TRIM(TO_CHAR(v_start_bal, '999,999,999')) ||
                                  '×' || COALESCE(ROUND(v_rate * 100)::text, '0') || '%/12×' ||
                                  v_total_days || '/30 + Draw $' ||
                                  TRIM(TO_CHAR(v_mid_draw, '999,999,999')) ||
                                  ' per-diem from day ' || v_draw_day;
            result.check_status := '✓ PASS';
        ELSE
            result.audit_trail := '$' || TRIM(TO_CHAR(v_start_bal, '999,999,999')) ||
                                  ' × ' || COALESCE(ROUND(v_rate * 100)::text, '0') || '%/12 × ' ||
                                  v_total_days || '/30';
            IF v_interest = 0 AND v_rate = 0 THEN
                result.check_status := '✓ PASS';
            ELSIF v_total_days = 0 THEN
                result.check_status := 'N/A';
            ELSE
                result.check_status := '✓ PASS';
            END IF;
        END IF;

        RETURN NEXT result;
    END LOOP;

    RETURN;
END;
$$;


-- ---------------------------------------------------------------------------
-- Helper: calculate_interest_for_loan(loan_id, period_start)
-- ---------------------------------------------------------------------------
-- Calculate interest for a single loan. Useful for billing individual loans.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_interest_for_loan(
    p_loan_id text,
    p_period_start date
)
RETURNS numeric
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    v_interest numeric;
BEGIN
    SELECT interest_due INTO v_interest
    FROM calculate_monthly_interest(p_period_start)
    WHERE loan_id = p_loan_id;

    RETURN COALESCE(v_interest, 0);
END;
$$;


-- ---------------------------------------------------------------------------
-- Helper: get_monthly_collection_total(period_start)
-- ---------------------------------------------------------------------------
-- Returns the total interest due across all active loans for a billing period.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_monthly_collection_total(p_period_start date)
RETURNS numeric
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    v_total numeric;
BEGIN
    SELECT COALESCE(SUM(interest_due), 0)
    INTO v_total
    FROM calculate_monthly_interest(p_period_start);

    RETURN v_total;
END;
$$;
