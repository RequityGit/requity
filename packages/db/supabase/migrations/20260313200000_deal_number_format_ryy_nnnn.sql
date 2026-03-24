-- Migration: Change deal_number format from RQ-D-YYYY-NNNN / RQ-E-YYYY-NNNN
-- to unified R{YY}-{NNNN} format (e.g. R26-0001)
-- Single counter across debt and equity, resets per year.

-- Step 1: Replace the trigger function with new format logic
CREATE OR REPLACE FUNCTION unified_generate_deal_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  year_str TEXT;
  seq INTEGER;
BEGIN
  year_str := RIGHT(EXTRACT(YEAR FROM NOW())::TEXT, 2);

  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(deal_number, '-', 2) AS INTEGER)
  ), 0) + 1
  INTO seq
  FROM unified_deals
  WHERE deal_number LIKE 'R' || year_str || '-%';

  NEW.deal_number := 'R' || year_str || '-' || LPAD(seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- Step 2: Re-number all existing deals in creation order, partitioned by year
WITH numbered AS (
  SELECT id,
    'R' || RIGHT(EXTRACT(YEAR FROM created_at)::TEXT, 2)
      || '-' || LPAD(
        ROW_NUMBER() OVER (
          PARTITION BY EXTRACT(YEAR FROM created_at)
          ORDER BY created_at
        )::TEXT, 4, '0'
      ) AS new_number
  FROM unified_deals
)
UPDATE unified_deals u
SET deal_number = n.new_number
FROM numbered n
WHERE u.id = n.id;
