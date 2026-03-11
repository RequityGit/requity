-- ═══════════════════════════════════════════════════════════
-- Update UW Output Formulas for Formula Engine
--
-- Ensures all uw_outputs[].formula strings use mathjs-compatible
-- syntax so the new formula engine can evaluate them properly.
-- Previously, formulas were evaluated by hardcoded key matching
-- in computeUwOutput(). Now they must be valid mathjs expressions.
-- ═══════════════════════════════════════════════════════════

-- Helper function to update formula strings in the uw_outputs JSONB array
-- for a given card type. This replaces empty/missing formulas with proper
-- mathjs expressions based on the output key.

CREATE OR REPLACE FUNCTION _temp_update_uw_output_formulas()
RETURNS void AS $$
DECLARE
  ct RECORD;
  outputs JSONB;
  new_outputs JSONB;
  output_item JSONB;
  i INT;
  output_key TEXT;
  current_formula TEXT;
  new_formula TEXT;
BEGIN
  FOR ct IN SELECT id, uw_outputs FROM unified_card_types WHERE uw_outputs IS NOT NULL
  LOOP
    outputs := ct.uw_outputs;
    new_outputs := '[]'::JSONB;

    FOR i IN 0..jsonb_array_length(outputs) - 1
    LOOP
      output_item := outputs->i;
      output_key := output_item->>'key';
      current_formula := output_item->>'formula';

      -- Determine the correct formula based on the output key
      new_formula := current_formula;

      -- Only update if formula is empty/null or is a simple placeholder
      IF current_formula IS NULL OR current_formula = '' THEN
        CASE output_key
          WHEN 'ltv' THEN
            new_formula := 'loan_amount / property_value * 100';
          WHEN 'ltv_as_is' THEN
            new_formula := 'loan_amount / as_is_value * 100';
          WHEN 'dscr' THEN
            new_formula := 'monthly_rent / monthly_expenses';
          WHEN 'cap_rate_in' THEN
            new_formula := 'noi_current / offer_price * 100';
          WHEN 'ltc' THEN
            new_formula := 'total_loan / (purchase_price + rehab_budget) * 100';
          WHEN 'ltv_arv' THEN
            new_formula := 'total_loan / arv * 100';
          WHEN 'debt_yield' THEN
            new_formula := 'COALESCE(noi, noi_current) / loan_amount * 100';
          WHEN 'price_per_unit' THEN
            new_formula := 'COALESCE(offer_price, property_value) / units_lots_sites';
          WHEN 'cap_rate_stabilized' THEN
            new_formula := 'noi_stabilized / COALESCE(offer_price, property_value) * 100';
          WHEN 'cap_rate_going_in' THEN
            new_formula := 'COALESCE(noi_current, noi) / COALESCE(property_value, offer_price) * 100';
          WHEN 'bridge_ltv' THEN
            new_formula := 'bridge_loan_amount / property_value * 100';
          WHEN 'exit_dscr' THEN
            new_formula := 'COALESCE(noi_stabilized, noi_current, noi) / (PMT(exit_rate / 1200, exit_amortization_years * 12, -exit_loan_amount) * 12)';
          ELSE
            -- Keep as-is if we do not have a known mapping
            NULL;
        END CASE;
      END IF;

      -- Update the formula in the output item
      IF new_formula IS DISTINCT FROM current_formula THEN
        output_item := jsonb_set(output_item, '{formula}', to_jsonb(new_formula));
      END IF;

      new_outputs := new_outputs || jsonb_build_array(output_item);
    END LOOP;

    -- Update the card type if outputs changed
    IF new_outputs IS DISTINCT FROM outputs THEN
      UPDATE unified_card_types SET uw_outputs = new_outputs WHERE id = ct.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the update
SELECT _temp_update_uw_output_formulas();

-- Clean up
DROP FUNCTION _temp_update_uw_output_formulas();
