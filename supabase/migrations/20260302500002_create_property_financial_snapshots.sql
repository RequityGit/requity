-- Property financial snapshots table
CREATE TABLE IF NOT EXISTS property_financial_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  opportunity_id uuid REFERENCES opportunities(id),
  snapshot_type text NOT NULL CHECK (snapshot_type IN ('rent_roll','t12','pro_forma','appraisal','broker_opinion')),
  effective_date date NOT NULL,
  source text CHECK (source IS NULL OR source IN ('borrower_provided','appraiser','property_manager','broker','internal_uw','other')),
  gross_potential_rent numeric,
  gross_scheduled_rent numeric,
  vacancy_loss numeric,
  vacancy_rate_pct numeric,
  other_income numeric,
  effective_gross_income numeric,
  total_operating_expenses numeric,
  taxes numeric,
  insurance numeric,
  management_fee numeric,
  repairs_maintenance numeric,
  utilities numeric,
  other_expenses numeric,
  net_operating_income numeric,
  capex numeric,
  noi_after_capex numeric,
  occupancy_pct numeric,
  economic_occupancy_pct numeric,
  number_of_occupied_units integer,
  number_of_vacant_units integer,
  avg_rent_per_unit numeric,
  avg_rent_per_sqft numeric,
  dscr numeric,
  annual_debt_service numeric,
  rent_roll_document_url text,
  t12_document_url text,
  supporting_document_url text,
  notes text
);

ALTER TABLE property_financial_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_property_financial_snapshots" ON property_financial_snapshots FOR ALL USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = (SELECT auth.uid()) AND ur.role IN ('admin', 'super_admin')));
CREATE TRIGGER set_updated_at_property_financial_snapshots BEFORE UPDATE ON property_financial_snapshots FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_pfs_property ON property_financial_snapshots(property_id);
CREATE INDEX idx_pfs_opportunity ON property_financial_snapshots(opportunity_id);
CREATE INDEX idx_pfs_type ON property_financial_snapshots(snapshot_type);

-- Create opportunity_pipeline view
CREATE OR REPLACE VIEW opportunity_pipeline AS
SELECT o.id, o.deal_name, o.stage, o.loan_type, o.loan_purpose, o.funding_channel,
  o.proposed_loan_amount, o.proposed_interest_rate, o.proposed_ltv, o.proposed_ltarv,
  o.approval_status, o.stage_changed_at, o.created_at, o.updated_at,
  o.originator, o.processor, o.assigned_underwriter, o.internal_notes,
  o.capital_partner, o.combined_liquidity, o.combined_net_worth,
  p.address_line1 AS property_address, p.city AS property_city,
  p.state AS property_state, p.zip AS property_zip,
  p.property_type, p.number_of_units, p.asset_type,
  be.entity_name,
  (SELECT cc.first_name || ' ' || cc.last_name FROM opportunity_borrowers ob
   JOIN borrowers b ON b.id = ob.borrower_id
   JOIN crm_contacts cc ON cc.id = b.crm_contact_id
   WHERE ob.opportunity_id = o.id AND ob.sort_order = 1 LIMIT 1) AS borrower_name,
  (SELECT COUNT(*) FROM opportunity_borrowers ob WHERE ob.opportunity_id = o.id) AS borrower_count,
  o.loan_id
FROM opportunities o
LEFT JOIN properties p ON p.id = o.property_id
LEFT JOIN borrower_entities be ON be.id = o.borrower_entity_id;
