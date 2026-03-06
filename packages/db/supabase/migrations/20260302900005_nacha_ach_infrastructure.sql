-- =============================================================================
-- LOAN SERVICING INFRASTRUCTURE — Phase 6: NACHA ACH File Generation
-- =============================================================================
-- Generates standard NACHA ACH files for automated billing.
-- All records are exactly 94 characters per NACHA specification.
--
-- Record types:
--   1 = File Header
--   5 = Batch Header (PPD)
--   6 = Entry Detail (one per loan)
--   8 = Batch Control
--   9 = File Control + padding to multiple of 10 records
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enum: ach_account_type
-- ---------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE ach_account_type AS ENUM ('checking', 'savings');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 2. Table: borrower_ach_info
-- ---------------------------------------------------------------------------
-- Note: servicing_loans already has ach_status, routing_number,
-- account_number, account_type, account_holder columns. This table
-- provides a normalized, versioned store that supports multiple accounts
-- per borrower and verification tracking.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS borrower_ach_info (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id             text NOT NULL REFERENCES servicing_loans(loan_id),
    bank_name           text NOT NULL,
    routing_number      text NOT NULL,
    account_number      text NOT NULL,
    account_type        ach_account_type NOT NULL DEFAULT 'checking',
    account_holder_name text NOT NULL,
    is_active           boolean NOT NULL DEFAULT true,
    verified_at         timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_borrower_ach_loan
    ON borrower_ach_info(loan_id);

CREATE INDEX IF NOT EXISTS idx_borrower_ach_active
    ON borrower_ach_info(loan_id)
    WHERE is_active = true;

ALTER TABLE borrower_ach_info ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. Seed borrower_ach_info from existing servicing_loans ACH columns
-- ---------------------------------------------------------------------------
INSERT INTO borrower_ach_info (
    loan_id, bank_name, routing_number, account_number,
    account_type, account_holder_name, is_active
)
SELECT
    sl.loan_id,
    'On File' AS bank_name,
    sl.routing_number,
    sl.account_number,
    CASE
        WHEN LOWER(sl.account_type) = 'savings' THEN 'savings'::ach_account_type
        ELSE 'checking'::ach_account_type
    END,
    COALESCE(sl.account_holder, sl.borrower_name, 'Unknown'),
    CASE WHEN sl.ach_status = 'Active' THEN true ELSE false END
FROM servicing_loans sl
WHERE sl.routing_number IS NOT NULL
  AND sl.account_number IS NOT NULL
  AND sl.routing_number != ''
  AND sl.account_number != ''
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Function: generate_nacha_file(billing_cycle_id) → text
-- ---------------------------------------------------------------------------
-- Generates a standard NACHA ACH file as text. All records 94 characters.
--
-- Uses the billing_line_items for the given cycle to determine amounts.
-- Pulls ACH info from borrower_ach_info (active records only).
--
-- Company info and routing are placeholders that should be configured
-- for the actual Requity bank account before production use.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_nacha_file(
    p_billing_cycle_id uuid
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    -- Configuration (replace with actual values before production)
    c_immediate_dest      text := '021000021';   -- Receiving bank routing
    c_immediate_origin    text := '123456789';   -- Originating company ID
    c_dest_name           text := 'JPMORGAN CHASE';
    c_origin_name         text := 'REQUITY GROUP';
    c_company_name        text := 'REQUITY GROUP';
    c_company_id          text := '1234567890';   -- 10-char company ID (EIN)
    c_odfi_routing        text := '12345678';     -- 8-digit ODFI routing

    v_cycle               record;
    v_file_text           text := '';
    v_now                 timestamptz := now();
    v_file_date           text;
    v_file_time           text;
    v_effective_date      text;

    -- Counters
    v_entry_count         integer := 0;
    v_entry_hash          bigint := 0;
    v_total_debit         bigint := 0;  -- in cents
    v_total_credit        bigint := 0;
    v_record_count        integer := 0;
    v_line_count          integer := 0;

    v_item                record;
    v_ach                 record;
    v_entry_line          text;
    v_trace_num           text;
    v_amount_cents        bigint;
    v_routing_8           text;

    v_batch_header        text;
    v_batch_control       text;
    v_file_header         text;
    v_file_control        text;
    v_entries_text        text := '';
    v_block_count         integer;
    v_padding_lines       integer;
BEGIN
    -- Get billing cycle
    SELECT bc.id, bc.billing_month, bc.total_billed, bc.loan_count, bc.status
    INTO v_cycle
    FROM billing_cycles bc
    WHERE bc.id = p_billing_cycle_id;

    IF v_cycle IS NULL THEN
        RAISE EXCEPTION 'Billing cycle not found: %', p_billing_cycle_id;
    END IF;

    -- Format dates
    v_file_date := TO_CHAR(v_now, 'YYMMDD');
    v_file_time := TO_CHAR(v_now, 'HH24MI');
    v_effective_date := TO_CHAR(v_cycle.billing_month, 'YYMMDD');

    -- ===================================================================
    -- FILE HEADER (1-record) — exactly 94 characters
    -- ===================================================================
    v_file_header :=
        '1'                                                    -- Record Type
        || '01'                                                -- Priority Code
        || ' ' || RPAD(c_immediate_dest, 10)                  -- Immediate Destination (b + 9 digits)
        || ' ' || RPAD(c_immediate_origin, 10)                -- Immediate Origin
        || v_file_date                                         -- File Creation Date (YYMMDD)
        || v_file_time                                         -- File Creation Time (HHMM)
        || 'A'                                                 -- File ID Modifier
        || '094'                                               -- Record Size
        || '10'                                                -- Blocking Factor
        || '1'                                                 -- Format Code
        || RPAD(c_dest_name, 23)                              -- Destination Name
        || RPAD(c_origin_name, 23)                            -- Origin Name
        || RPAD('', 8);                                        -- Reference Code

    v_file_text := v_file_header;
    v_line_count := 1;

    -- ===================================================================
    -- BATCH HEADER (5-record) — exactly 94 characters
    -- ===================================================================
    v_batch_header :=
        '5'                                                    -- Record Type
        || '200'                                               -- Service Class Code (debits & credits)
        || RPAD(c_company_name, 16)                           -- Company Name
        || RPAD('', 20)                                        -- Company Discretionary Data
        || RPAD(c_company_id, 10)                             -- Company Identification
        || 'PPD'                                               -- Standard Entry Class
        || RPAD('LOAN PMT', 10)                               -- Company Entry Description
        || v_file_date                                         -- Company Descriptive Date
        || v_effective_date                                    -- Effective Entry Date
        || '   '                                               -- Settlement Date (blank)
        || '1'                                                 -- Originator Status Code
        || RPAD(c_odfi_routing, 8)                            -- Originating DFI Identification
        || LPAD('1', 7, '0');                                  -- Batch Number

    v_file_text := v_file_text || chr(10) || v_batch_header;
    v_line_count := v_line_count + 1;

    -- ===================================================================
    -- ENTRY DETAIL (6-records) — one per loan with ACH info
    -- ===================================================================
    FOR v_item IN
        SELECT
            bli.loan_id,
            bli.total_amount_due,
            sl.borrower_name
        FROM billing_line_items bli
        JOIN servicing_loans sl ON sl.loan_id = bli.loan_id
        WHERE bli.billing_cycle_id = p_billing_cycle_id
          AND bli.status IN ('pending', 'partial', 'delinquent')
          AND bli.total_amount_due > 0
        ORDER BY bli.loan_id
    LOOP
        -- Get active ACH info for this loan
        SELECT bai.routing_number, bai.account_number,
               bai.account_type, bai.account_holder_name
        INTO v_ach
        FROM borrower_ach_info bai
        WHERE bai.loan_id = v_item.loan_id
          AND bai.is_active = true
        ORDER BY bai.created_at DESC
        LIMIT 1;

        -- Skip if no ACH info
        IF v_ach IS NULL THEN
            CONTINUE;
        END IF;

        v_entry_count := v_entry_count + 1;
        v_amount_cents := ROUND(v_item.total_amount_due * 100)::bigint;
        v_total_debit := v_total_debit + v_amount_cents;

        -- Routing number processing (first 8 digits for hash, full 9 for entry)
        v_routing_8 := LEFT(v_ach.routing_number, 8);
        v_entry_hash := v_entry_hash + v_routing_8::bigint;

        -- Trace number (ODFI routing + sequential)
        v_trace_num := c_odfi_routing || LPAD(v_entry_count::text, 7, '0');

        -- Transaction code: 27 = checking debit, 37 = savings debit
        v_entry_line :=
            '6'                                                    -- Record Type
            || CASE WHEN v_ach.account_type = 'checking' THEN '27' ELSE '37' END
            || RPAD(v_ach.routing_number, 9)                      -- Receiving DFI Routing (with check digit)
            || RPAD(v_ach.account_number, 17)                     -- DFI Account Number
            || LPAD(v_amount_cents::text, 10, '0')                -- Amount (in cents)
            || RPAD(v_item.loan_id, 15)                           -- Individual ID
            || RPAD(COALESCE(v_ach.account_holder_name, v_item.borrower_name), 22)  -- Individual Name
            || '  '                                                -- Discretionary Data
            || '0'                                                 -- Addenda Record Indicator
            || v_trace_num;                                        -- Trace Number

        v_entries_text := v_entries_text || chr(10) || v_entry_line;
        v_line_count := v_line_count + 1;
    END LOOP;

    -- Add entries to file
    v_file_text := v_file_text || v_entries_text;

    -- Entry hash mod 10^10
    v_entry_hash := v_entry_hash % 10000000000;

    -- ===================================================================
    -- BATCH CONTROL (8-record) — exactly 94 characters
    -- ===================================================================
    v_batch_control :=
        '8'                                                        -- Record Type
        || '200'                                                   -- Service Class Code
        || LPAD(v_entry_count::text, 6, '0')                     -- Entry/Addenda Count
        || LPAD(v_entry_hash::text, 10, '0')                     -- Entry Hash
        || LPAD(v_total_debit::text, 12, '0')                    -- Total Debit
        || LPAD(v_total_credit::text, 12, '0')                   -- Total Credit
        || RPAD(c_company_id, 10)                                 -- Company Identification
        || RPAD('', 19)                                            -- Message Auth Code (blank)
        || RPAD('', 6)                                             -- Reserved
        || RPAD(c_odfi_routing, 8)                                -- Originating DFI
        || LPAD('1', 7, '0');                                      -- Batch Number

    v_file_text := v_file_text || chr(10) || v_batch_control;
    v_line_count := v_line_count + 1;

    -- ===================================================================
    -- FILE CONTROL (9-record) — exactly 94 characters
    -- ===================================================================
    v_block_count := CEIL(v_line_count::numeric / 10.0)::integer;
    -- Need to account for the file control record itself + padding
    v_block_count := CEIL((v_line_count + 1)::numeric / 10.0)::integer;

    v_file_control :=
        '9'                                                        -- Record Type
        || LPAD('1', 6, '0')                                      -- Batch Count
        || LPAD(v_block_count::text, 6, '0')                     -- Block Count
        || LPAD(v_entry_count::text, 8, '0')                     -- Entry/Addenda Count
        || LPAD(v_entry_hash::text, 10, '0')                     -- Entry Hash
        || LPAD(v_total_debit::text, 12, '0')                    -- Total Debit
        || LPAD(v_total_credit::text, 12, '0')                   -- Total Credit
        || RPAD('', 39);                                           -- Reserved

    v_file_text := v_file_text || chr(10) || v_file_control;
    v_line_count := v_line_count + 1;

    -- ===================================================================
    -- PADDING: fill to multiple of 10 records with '9' × 94
    -- ===================================================================
    v_padding_lines := (10 - (v_line_count % 10)) % 10;
    FOR i IN 1..v_padding_lines LOOP
        v_file_text := v_file_text || chr(10) || RPAD('9', 94, '9');
    END LOOP;

    -- Update billing cycle with NACHA generation info
    UPDATE billing_cycles
    SET nacha_file_path = 'nacha_' || TO_CHAR(v_cycle.billing_month, 'YYYYMMDD') || '.ach'
    WHERE id = p_billing_cycle_id;

    RETURN v_file_text;
END;
$$;

COMMENT ON FUNCTION generate_nacha_file(uuid) IS
    'Generates a standard NACHA ACH file (text) for a billing cycle. '
    'All records are exactly 94 characters. Uses borrower_ach_info for '
    'bank details. Company routing/ID must be configured before production use.';

COMMENT ON TABLE borrower_ach_info IS
    'Normalized ACH bank account info per loan. Supports multiple accounts '
    'with is_active flag and verification tracking. Seeded from servicing_loans.';
