-- Update equity_deal_stage enum to simplified stages:
-- new_deals, underwritten_needs_review, offer_placed, under_contract, closed_won, closed_lost

-- 1. Create the new enum type
CREATE TYPE equity_deal_stage_v2 AS ENUM (
  'new_deals',
  'underwritten_needs_review',
  'offer_placed',
  'under_contract',
  'closed_won',
  'closed_lost'
);

-- 2. Drop the equity_pipeline view (depends on the old enum column)
DROP VIEW IF EXISTS equity_pipeline;

-- 3. Migrate equity_deals.stage column
ALTER TABLE equity_deals
  ALTER COLUMN stage DROP DEFAULT;

ALTER TABLE equity_deals
  ALTER COLUMN stage TYPE equity_deal_stage_v2
  USING CASE stage::text
    WHEN 'sourcing' THEN 'new_deals'::equity_deal_stage_v2
    WHEN 'screening' THEN 'underwritten_needs_review'::equity_deal_stage_v2
    WHEN 'due_diligence' THEN 'underwritten_needs_review'::equity_deal_stage_v2
    WHEN 'loi_negotiation' THEN 'offer_placed'::equity_deal_stage_v2
    WHEN 'under_contract' THEN 'under_contract'::equity_deal_stage_v2
    WHEN 'closing' THEN 'under_contract'::equity_deal_stage_v2
    WHEN 'closed' THEN 'closed_won'::equity_deal_stage_v2
    WHEN 'asset_management' THEN 'closed_won'::equity_deal_stage_v2
    WHEN 'disposition' THEN 'closed_won'::equity_deal_stage_v2
    WHEN 'dead' THEN 'closed_lost'::equity_deal_stage_v2
  END;

ALTER TABLE equity_deals
  ALTER COLUMN stage SET DEFAULT 'new_deals'::equity_deal_stage_v2;

-- 4. Migrate equity_deal_stage_history columns
ALTER TABLE equity_deal_stage_history
  ALTER COLUMN from_stage TYPE equity_deal_stage_v2
  USING CASE from_stage::text
    WHEN 'sourcing' THEN 'new_deals'::equity_deal_stage_v2
    WHEN 'screening' THEN 'underwritten_needs_review'::equity_deal_stage_v2
    WHEN 'due_diligence' THEN 'underwritten_needs_review'::equity_deal_stage_v2
    WHEN 'loi_negotiation' THEN 'offer_placed'::equity_deal_stage_v2
    WHEN 'under_contract' THEN 'under_contract'::equity_deal_stage_v2
    WHEN 'closing' THEN 'under_contract'::equity_deal_stage_v2
    WHEN 'closed' THEN 'closed_won'::equity_deal_stage_v2
    WHEN 'asset_management' THEN 'closed_won'::equity_deal_stage_v2
    WHEN 'disposition' THEN 'closed_won'::equity_deal_stage_v2
    WHEN 'dead' THEN 'closed_lost'::equity_deal_stage_v2
  END;

ALTER TABLE equity_deal_stage_history
  ALTER COLUMN to_stage TYPE equity_deal_stage_v2
  USING CASE to_stage::text
    WHEN 'sourcing' THEN 'new_deals'::equity_deal_stage_v2
    WHEN 'screening' THEN 'underwritten_needs_review'::equity_deal_stage_v2
    WHEN 'due_diligence' THEN 'underwritten_needs_review'::equity_deal_stage_v2
    WHEN 'loi_negotiation' THEN 'offer_placed'::equity_deal_stage_v2
    WHEN 'under_contract' THEN 'under_contract'::equity_deal_stage_v2
    WHEN 'closing' THEN 'under_contract'::equity_deal_stage_v2
    WHEN 'closed' THEN 'closed_won'::equity_deal_stage_v2
    WHEN 'asset_management' THEN 'closed_won'::equity_deal_stage_v2
    WHEN 'disposition' THEN 'closed_won'::equity_deal_stage_v2
    WHEN 'dead' THEN 'closed_lost'::equity_deal_stage_v2
  END;

-- 5. Migrate equity_task_template_items.required_stage
ALTER TABLE equity_task_template_items
  ALTER COLUMN required_stage TYPE equity_deal_stage_v2
  USING CASE required_stage::text
    WHEN 'sourcing' THEN 'new_deals'::equity_deal_stage_v2
    WHEN 'screening' THEN 'underwritten_needs_review'::equity_deal_stage_v2
    WHEN 'due_diligence' THEN 'underwritten_needs_review'::equity_deal_stage_v2
    WHEN 'loi_negotiation' THEN 'offer_placed'::equity_deal_stage_v2
    WHEN 'under_contract' THEN 'under_contract'::equity_deal_stage_v2
    WHEN 'closing' THEN 'under_contract'::equity_deal_stage_v2
    WHEN 'closed' THEN 'closed_won'::equity_deal_stage_v2
    WHEN 'asset_management' THEN 'closed_won'::equity_deal_stage_v2
    WHEN 'disposition' THEN 'closed_won'::equity_deal_stage_v2
    WHEN 'dead' THEN 'closed_lost'::equity_deal_stage_v2
  END;

-- 6. Migrate equity_deal_tasks.required_stage
ALTER TABLE equity_deal_tasks
  ALTER COLUMN required_stage TYPE equity_deal_stage_v2
  USING CASE required_stage::text
    WHEN 'sourcing' THEN 'new_deals'::equity_deal_stage_v2
    WHEN 'screening' THEN 'underwritten_needs_review'::equity_deal_stage_v2
    WHEN 'due_diligence' THEN 'underwritten_needs_review'::equity_deal_stage_v2
    WHEN 'loi_negotiation' THEN 'offer_placed'::equity_deal_stage_v2
    WHEN 'under_contract' THEN 'under_contract'::equity_deal_stage_v2
    WHEN 'closing' THEN 'under_contract'::equity_deal_stage_v2
    WHEN 'closed' THEN 'closed_won'::equity_deal_stage_v2
    WHEN 'asset_management' THEN 'closed_won'::equity_deal_stage_v2
    WHEN 'disposition' THEN 'closed_won'::equity_deal_stage_v2
    WHEN 'dead' THEN 'closed_lost'::equity_deal_stage_v2
  END;

-- 7. Drop old enum, rename new one
DROP TYPE equity_deal_stage;
ALTER TYPE equity_deal_stage_v2 RENAME TO equity_deal_stage;

-- 8. Update pipeline_stage_config
DELETE FROM pipeline_stage_config WHERE pipeline_type = 'equity';
INSERT INTO pipeline_stage_config (pipeline_type, stage_key, label, color, sort_order, is_terminal, sla_days) VALUES
  ('equity', 'new_deals', 'New Deals', 'bg-slate-100 text-slate-800', 0, false, null),
  ('equity', 'underwritten_needs_review', 'Underwritten Needs Review', 'bg-blue-100 text-blue-800', 1, false, 7),
  ('equity', 'offer_placed', 'Offer Placed', 'bg-purple-100 text-purple-800', 2, false, 14),
  ('equity', 'under_contract', 'Under Contract', 'bg-amber-100 text-amber-800', 3, false, 30),
  ('equity', 'closed_won', 'Closed Won', 'bg-green-100 text-green-800', 4, true, null),
  ('equity', 'closed_lost', 'Closed Lost', 'bg-red-100 text-red-800', 5, true, null);

-- 9. Recreate the equity_pipeline view
CREATE VIEW equity_pipeline AS
SELECT
  ed.id,
  ed.deal_name,
  ed.deal_number,
  ed.stage,
  ed.stage_changed_at,
  ed.source,
  ed.asking_price,
  ed.offer_price,
  ed.purchase_price,
  ed.expected_close_date,
  ed.actual_close_date,
  ed.assigned_to,
  ed.value_add_strategy,
  ed.target_irr,
  ed.investment_thesis,
  ed.loss_reason,
  ed.created_at,
  ed.updated_at,
  p.address_line1 AS property_address,
  p.city AS property_city,
  p.state AS property_state,
  p.zip AS property_zip,
  p.asset_type,
  p.property_type,
  p.number_of_units,
  p.lot_size_acres,
  pr.id AS assigned_to_profile_id,
  (SELECT count(*) FROM equity_deal_tasks t WHERE t.deal_id = ed.id AND t.status = 'completed') AS completed_tasks,
  (SELECT count(*) FROM equity_deal_tasks t WHERE t.deal_id = ed.id) AS total_tasks,
  EXTRACT(EPOCH FROM (now() - ed.stage_changed_at)) / 86400 AS days_in_stage,
  eu.status AS underwriting_status,
  eu.going_in_cap_rate,
  eu.stabilized_cap_rate,
  eu.levered_irr,
  eu.equity_multiple
FROM equity_deals ed
LEFT JOIN properties p ON p.id = ed.property_id
LEFT JOIN profiles pr ON pr.id = ed.assigned_to
LEFT JOIN equity_underwriting eu ON eu.deal_id = ed.id
WHERE ed.deleted_at IS NULL
ORDER BY ed.created_at DESC;
