-- Remove unused field_configurations modules
-- These 18 modules existed in the Field Manager sidebar but had zero active consumers
-- (no page, component, or hook ever loaded their field configs to render UI).

-- Tier 1: Pure dead weight (duplicates, never-wired scaffolding)
-- loans_extended (duplicate of loan_details), servicing_loan, fund_details,
-- standalone_property, borrower_entity_detail (duplicate of borrower_entity),
-- investor_commitment, capital_call, distribution, payoff_statement,
-- crm_activity, equity_property, equity_notes

-- Tier 2: Table is active but field_configurations never consumed
-- opportunity, equity_deal, equity_underwriting, investing_entity,
-- draw_request, wire_instructions

DELETE FROM field_configurations
WHERE module IN (
  'loans_extended',
  'servicing_loan',
  'fund_details',
  'standalone_property',
  'borrower_entity_detail',
  'investor_commitment',
  'capital_call',
  'distribution',
  'payoff_statement',
  'crm_activity',
  'equity_property',
  'equity_notes',
  'opportunity',
  'equity_deal',
  'equity_underwriting',
  'investing_entity',
  'draw_request',
  'wire_instructions'
);
