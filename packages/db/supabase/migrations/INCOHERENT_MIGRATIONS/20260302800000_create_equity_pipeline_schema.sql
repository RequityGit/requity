-- ============================================
-- Equity Pipeline Schema
-- ============================================

-- 1. Custom Enums
CREATE TYPE equity_deal_stage AS ENUM (
  'sourcing',
  'screening',
  'due_diligence',
  'loi_negotiation',
  'under_contract',
  'closing',
  'closed',
  'asset_management',
  'disposition',
  'dead'
);

CREATE TYPE equity_deal_source AS ENUM (
  'broker',
  'off_market',
  'auction',
  'direct_to_seller',
  'referral',
  'internal_portfolio',
  'mls',
  'other'
);

CREATE TYPE equity_task_status AS ENUM (
  'not_started',
  'in_progress',
  'completed',
  'blocked',
  'waived'
);

-- 2. equity_deals table
CREATE TABLE equity_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_name text NOT NULL,
  deal_number text UNIQUE,
  stage equity_deal_stage NOT NULL DEFAULT 'sourcing',
  stage_changed_at timestamptz NOT NULL DEFAULT now(),
  stage_changed_by uuid REFERENCES auth.users(id),
  source equity_deal_source,
  property_id uuid REFERENCES properties(id),
  asking_price numeric,
  offer_price numeric,
  purchase_price numeric,
  expected_close_date date,
  actual_close_date date,
  assigned_to uuid REFERENCES profiles(id),
  value_add_strategy text,
  target_irr numeric,
  investment_thesis text,
  loss_reason text,
  notes text,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- 3. equity_deal_stage_history table
CREATE TABLE equity_deal_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES equity_deals(id) ON DELETE CASCADE,
  from_stage equity_deal_stage NOT NULL,
  to_stage equity_deal_stage NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  duration_in_previous_stage interval,
  notes text
);

-- 4. equity_underwriting table
CREATE TABLE equity_underwriting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES equity_deals(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft',
  going_in_cap_rate numeric,
  stabilized_cap_rate numeric,
  exit_cap_rate numeric,
  levered_irr numeric,
  unlevered_irr numeric,
  equity_multiple numeric,
  cash_on_cash numeric,
  noi_year1 numeric,
  noi_stabilized numeric,
  total_project_cost numeric,
  equity_required numeric,
  debt_amount numeric,
  debt_ltv numeric,
  debt_rate numeric,
  hold_period_years integer,
  rent_growth_pct numeric,
  expense_growth_pct numeric,
  vacancy_rate_pct numeric,
  capex_budget numeric,
  management_fee_pct numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX equity_underwriting_deal_id_unique ON equity_underwriting(deal_id);

-- 5. equity_task_templates & items
CREATE TABLE equity_task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  property_type text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE equity_task_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES equity_task_templates(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  description text,
  category text,
  required_stage equity_deal_stage,
  responsible_party text,
  due_date_offset_days integer,
  is_critical_path boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. equity_deal_tasks
CREATE TABLE equity_deal_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES equity_deals(id) ON DELETE CASCADE,
  template_item_id uuid REFERENCES equity_task_template_items(id),
  task_name text NOT NULL,
  description text,
  category text,
  required_stage equity_deal_stage,
  status equity_task_status NOT NULL DEFAULT 'not_started',
  responsible_party text,
  assigned_to uuid REFERENCES profiles(id),
  due_date date,
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id),
  is_critical_path boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. loan_stage_history
CREATE TABLE IF NOT EXISTS loan_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  from_stage text NOT NULL,
  to_stage text NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  duration_in_previous_stage interval,
  notes text
);

-- 8. opportunity_stage_history
CREATE TABLE IF NOT EXISTS opportunity_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  from_stage text NOT NULL,
  to_stage text NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  duration_in_previous_stage interval,
  notes text
);

-- 9. pipeline_stage_config
CREATE TABLE IF NOT EXISTS pipeline_stage_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_type text NOT NULL,
  stage_key text NOT NULL,
  label text NOT NULL,
  color text,
  sort_order integer NOT NULL DEFAULT 0,
  is_terminal boolean NOT NULL DEFAULT false,
  sla_days integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(pipeline_type, stage_key)
);

-- Seed default equity pipeline stage config
INSERT INTO pipeline_stage_config (pipeline_type, stage_key, label, color, sort_order, is_terminal, sla_days) VALUES
  ('equity', 'sourcing', 'Sourcing', 'bg-slate-100 text-slate-800', 0, false, null),
  ('equity', 'screening', 'Screening', 'bg-blue-100 text-blue-800', 1, false, 7),
  ('equity', 'due_diligence', 'Due Diligence', 'bg-purple-100 text-purple-800', 2, false, 21),
  ('equity', 'loi_negotiation', 'LOI Negotiation', 'bg-indigo-100 text-indigo-800', 3, false, 14),
  ('equity', 'under_contract', 'Under Contract', 'bg-amber-100 text-amber-800', 4, false, 30),
  ('equity', 'closing', 'Closing', 'bg-teal-100 text-teal-800', 5, false, 14),
  ('equity', 'closed', 'Closed', 'bg-green-100 text-green-800', 6, false, null),
  ('equity', 'asset_management', 'Asset Management', 'bg-cyan-100 text-cyan-800', 7, false, null),
  ('equity', 'disposition', 'Disposition', 'bg-orange-100 text-orange-800', 8, false, null),
  ('equity', 'dead', 'Dead', 'bg-red-100 text-red-800', 9, true, null);

-- Indexes
CREATE INDEX idx_equity_deals_stage ON equity_deals(stage);
CREATE INDEX idx_equity_deals_assigned_to ON equity_deals(assigned_to);
CREATE INDEX idx_equity_deals_property_id ON equity_deals(property_id);
CREATE INDEX idx_equity_deals_deleted_at ON equity_deals(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_equity_deal_tasks_deal_id ON equity_deal_tasks(deal_id);
CREATE INDEX idx_equity_deal_tasks_status ON equity_deal_tasks(status);
CREATE INDEX idx_equity_deal_stage_history_deal_id ON equity_deal_stage_history(deal_id);
CREATE INDEX idx_equity_underwriting_deal_id ON equity_underwriting(deal_id);
CREATE INDEX idx_loan_stage_history_loan_id ON loan_stage_history(loan_id);
CREATE INDEX idx_opportunity_stage_history_opp_id ON opportunity_stage_history(opportunity_id);

-- ============================================
-- equity_pipeline view
-- ============================================

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

-- ============================================
-- Functions and Triggers
-- ============================================

-- Auto-generate equity deal numbers
CREATE OR REPLACE FUNCTION generate_equity_deal_number()
RETURNS trigger AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(deal_number FROM 'EQ-\d{4}-(\d+)') AS integer)), 0) + 1
  INTO next_num
  FROM equity_deals
  WHERE deal_number LIKE 'EQ-' || EXTRACT(YEAR FROM now()) || '-%';
  NEW.deal_number := 'EQ-' || EXTRACT(YEAR FROM now()) || '-' || LPAD(next_num::text, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_equity_deal_number
  BEFORE INSERT ON equity_deals
  FOR EACH ROW
  WHEN (NEW.deal_number IS NULL)
  EXECUTE FUNCTION generate_equity_deal_number();

-- Equity stage transition logger
CREATE OR REPLACE FUNCTION log_equity_stage_change()
RETURNS trigger AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO equity_deal_stage_history (deal_id, from_stage, to_stage, changed_by, changed_at, duration_in_previous_stage)
    VALUES (NEW.id, OLD.stage, NEW.stage, NEW.stage_changed_by, now(), now() - OLD.stage_changed_at);
    NEW.stage_changed_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER equity_deal_stage_change
  BEFORE UPDATE ON equity_deals
  FOR EACH ROW
  EXECUTE FUNCTION log_equity_stage_change();

-- Auto-generate equity tasks from template on stage entry
CREATE OR REPLACE FUNCTION auto_generate_equity_tasks()
RETURNS trigger AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO equity_deal_tasks (deal_id, template_item_id, task_name, description, category, required_stage, responsible_party, due_date, is_critical_path, sort_order)
    SELECT
      NEW.id,
      eti.id,
      eti.task_name,
      eti.description,
      eti.category,
      eti.required_stage,
      eti.responsible_party,
      CASE WHEN eti.due_date_offset_days IS NOT NULL THEN CURRENT_DATE + eti.due_date_offset_days ELSE NULL END,
      eti.is_critical_path,
      eti.sort_order
    FROM equity_task_template_items eti
    JOIN equity_task_templates et ON et.id = eti.template_id
    WHERE eti.required_stage = NEW.stage
      AND (et.property_type IS NULL OR et.property_type = (SELECT p.asset_type FROM properties p WHERE p.id = NEW.property_id))
      AND et.is_default = true
      AND NOT EXISTS (SELECT 1 FROM equity_deal_tasks edt WHERE edt.deal_id = NEW.id AND edt.template_item_id = eti.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER equity_auto_tasks
  AFTER UPDATE ON equity_deals
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_equity_tasks();

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE equity_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE equity_deal_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE equity_deal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE equity_underwriting ENABLE ROW LEVEL SECURITY;
ALTER TABLE equity_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE equity_task_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stage_config ENABLE ROW LEVEL SECURITY;

-- RLS policies: internal team access
CREATE POLICY "Internal team access" ON equity_deals
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid())));

CREATE POLICY "Internal team access" ON equity_deal_stage_history
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid())));

CREATE POLICY "Internal team access" ON equity_deal_tasks
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid())));

CREATE POLICY "Internal team access" ON equity_underwriting
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid())));

CREATE POLICY "Internal team access" ON equity_task_templates
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid())));

CREATE POLICY "Internal team access" ON equity_task_template_items
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid())));

CREATE POLICY "Internal team access" ON loan_stage_history
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid())));

CREATE POLICY "Internal team access" ON opportunity_stage_history
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid())));

CREATE POLICY "Internal team access" ON pipeline_stage_config
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid())));
