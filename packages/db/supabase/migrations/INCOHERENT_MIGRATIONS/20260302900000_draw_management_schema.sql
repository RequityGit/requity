-- ============================================================
-- Draw Management Infrastructure — Schema Migration
-- Applied via Supabase MCP as multiple migrations:
--   draw_management_enums
--   draw_management_inspectors_and_budgets
--   draw_management_change_requests
--   draw_management_loan_events_and_extend_draw_requests
--   draw_management_inspections_documents_loans
--   draw_management_rls_enable_and_triggers
-- ============================================================

-- =========================
-- Phase 0: Enum Types
-- =========================

DO $$ BEGIN CREATE TYPE budget_status AS ENUM ('draft', 'active', 'completed', 'closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE budget_line_item_change_type AS ENUM ('created', 'amount_revised', 'description_updated', 'deactivated', 'reactivated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE budget_change_request_status AS ENUM ('pending', 'approved', 'rejected', 'withdrawn'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE budget_change_action AS ENUM ('add', 'increase', 'decrease', 'remove'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE draw_request_status AS ENUM ('draft', 'submitted', 'inspection_ordered', 'inspection_complete', 'under_review', 'approved', 'funded', 'rejected', 'denied', 'withdrawn'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE inspection_method AS ENUM ('physical_inspector', 'sitewire', 'internal_review', 'waived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE inspector_type_enum AS ENUM ('independent', 'sitewire', 'internal'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE inspection_report_type AS ENUM ('physical', 'sitewire', 'desk_review'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE draw_document_type AS ENUM ('photo', 'invoice', 'inspector_report', 'lien_waiver', 'sitewire_report', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================
-- Phase 1/4: Tables
-- =========================

CREATE TABLE IF NOT EXISTS inspectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, company text, email text, phone text,
  inspector_type inspector_type_enum NOT NULL DEFAULT 'independent',
  has_portal_access boolean NOT NULL DEFAULT false,
  user_id uuid REFERENCES auth.users(id),
  active boolean NOT NULL DEFAULT true, notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS construction_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  total_budget numeric(15,2) NOT NULL,
  total_drawn numeric(15,2) NOT NULL DEFAULT 0,
  total_remaining numeric(15,2) GENERATED ALWAYS AS (total_budget - total_drawn) STORED,
  budget_version int NOT NULL DEFAULT 1,
  status budget_status NOT NULL DEFAULT 'draft',
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT construction_budgets_loan_unique UNIQUE (loan_id),
  CONSTRAINT construction_budgets_total_budget_positive CHECK (total_budget > 0),
  CONSTRAINT construction_budgets_total_drawn_valid CHECK (total_drawn >= 0 AND total_drawn <= total_budget)
);

CREATE TABLE IF NOT EXISTS budget_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  construction_budget_id uuid NOT NULL REFERENCES construction_budgets(id) ON DELETE CASCADE,
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  category text NOT NULL, description text,
  budgeted_amount numeric(15,2) NOT NULL,
  revised_amount numeric(15,2) NOT NULL,
  drawn_amount numeric(15,2) NOT NULL DEFAULT 0,
  remaining_amount numeric(15,2) GENERATED ALWAYS AS (revised_amount - drawn_amount) STORED,
  percent_complete numeric(5,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT budget_line_items_drawn_valid CHECK (drawn_amount >= 0 AND drawn_amount <= revised_amount),
  CONSTRAINT budget_line_items_percent_valid CHECK (percent_complete >= 0 AND percent_complete <= 100),
  CONSTRAINT budget_line_items_budgeted_positive CHECK (budgeted_amount >= 0),
  CONSTRAINT budget_line_items_revised_positive CHECK (revised_amount >= 0)
);

CREATE TABLE IF NOT EXISTS budget_line_item_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_line_item_id uuid NOT NULL REFERENCES budget_line_items(id) ON DELETE CASCADE,
  construction_budget_id uuid NOT NULL REFERENCES construction_budgets(id) ON DELETE CASCADE,
  change_type budget_line_item_change_type NOT NULL,
  previous_amount numeric(15,2), new_amount numeric(15,2),
  change_reason text,
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  budget_change_request_id uuid
);

-- Immutability trigger for history
CREATE OR REPLACE FUNCTION prevent_history_modification() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'budget_line_item_history is append-only.'; RETURN NULL; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS budget_line_item_history_immutable ON budget_line_item_history;
CREATE TRIGGER budget_line_item_history_immutable BEFORE UPDATE OR DELETE ON budget_line_item_history
  FOR EACH ROW EXECUTE FUNCTION prevent_history_modification();

-- =========================
-- Phase 2: Change Requests
-- =========================

CREATE TABLE IF NOT EXISTS budget_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  construction_budget_id uuid NOT NULL REFERENCES construction_budgets(id) ON DELETE CASCADE,
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  request_number text,
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  request_date date NOT NULL DEFAULT CURRENT_DATE,
  status budget_change_request_status NOT NULL DEFAULT 'pending',
  reason text NOT NULL,
  net_budget_change numeric(15,2) NOT NULL DEFAULT 0,
  reviewed_by uuid REFERENCES auth.users(id), reviewed_at timestamptz, review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT budget_change_requests_net_zero CHECK (net_budget_change = 0)
);

CREATE TABLE IF NOT EXISTS budget_change_request_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_change_request_id uuid NOT NULL REFERENCES budget_change_requests(id) ON DELETE CASCADE,
  budget_line_item_id uuid REFERENCES budget_line_items(id),
  change_action budget_change_action NOT NULL,
  current_amount numeric(15,2), proposed_amount numeric(15,2),
  delta_amount numeric(15,2) NOT NULL,
  category text, description text,
  CONSTRAINT bcr_line_items_add_requires_category CHECK (change_action != 'add' OR category IS NOT NULL)
);

-- =========================
-- Phase 3: loan_events + extend draw_requests
-- =========================

CREATE TABLE IF NOT EXISTS loan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric(15,2), description text,
  metadata jsonb DEFAULT '{}',
  performed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Convert draw_requests.status from text to enum (dropped CHECK constraints first)
DROP TRIGGER IF EXISTS trg_draw_request_notification ON draw_requests;
ALTER TABLE draw_requests DROP CONSTRAINT IF EXISTS draw_requests_status_check;
ALTER TABLE draw_requests DROP CONSTRAINT IF EXISTS loan_draws_status_check;
ALTER TABLE draw_requests ALTER COLUMN status DROP DEFAULT;
ALTER TABLE draw_requests ALTER COLUMN status TYPE draw_request_status USING
  CASE status WHEN 'requested' THEN 'submitted'::draw_request_status
              WHEN 'denied' THEN 'denied'::draw_request_status
              ELSE status::draw_request_status END;
ALTER TABLE draw_requests ALTER COLUMN status SET DEFAULT 'draft'::draw_request_status;
ALTER TABLE draw_requests ALTER COLUMN amount_requested TYPE numeric(15,2);
ALTER TABLE draw_requests ALTER COLUMN amount_approved TYPE numeric(15,2);

-- Recreate notification trigger with enum casts
CREATE OR REPLACE FUNCTION public.trigger_draw_request_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $function$
DECLARE v_loan_number text; v_title text; v_body text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;
  SELECT loan_number INTO v_loan_number FROM public.loans WHERE id = NEW.loan_id;
  IF NEW.status = 'submitted'::draw_request_status AND OLD.status IS DISTINCT FROM 'submitted'::draw_request_status THEN
    v_title := 'Draw request submitted for Loan ' || COALESCE(v_loan_number, 'Unknown');
    v_body := 'Draw #' || NEW.draw_number || ' - $' || NEW.amount_requested::text;
    PERFORM public.notify_admins('draw_request_submitted', v_title, v_body, 'draw_request', NEW.id, 'Draw #' || NEW.draw_number, '/lending/loans/' || NEW.loan_id, 'high');
  ELSE
    v_title := 'Draw #' || NEW.draw_number || ' updated to ' || REPLACE(NEW.status::text, '_', ' ');
    v_body := 'Loan ' || COALESCE(v_loan_number, 'Unknown') || ' - Draw #' || NEW.draw_number;
    PERFORM public.notify_admins('draw_request_status_changed', v_title, v_body, 'draw_request', NEW.id, 'Draw #' || NEW.draw_number, '/lending/loans/' || NEW.loan_id, 'normal');
  END IF;
  RETURN NEW;
END; $function$;
CREATE TRIGGER trg_draw_request_notification AFTER UPDATE OF status ON draw_requests FOR EACH ROW EXECUTE FUNCTION trigger_draw_request_notification();

-- New columns on draw_requests
ALTER TABLE draw_requests ADD COLUMN IF NOT EXISTS construction_budget_id uuid REFERENCES construction_budgets(id);
ALTER TABLE draw_requests ADD COLUMN IF NOT EXISTS request_number text;
ALTER TABLE draw_requests ADD COLUMN IF NOT EXISTS requested_by uuid REFERENCES auth.users(id);
ALTER TABLE draw_requests ADD COLUMN IF NOT EXISTS request_date date DEFAULT CURRENT_DATE;
ALTER TABLE draw_requests ADD COLUMN IF NOT EXISTS inspection_type inspection_method;
ALTER TABLE draw_requests ADD COLUMN IF NOT EXISTS inspection_ordered_date date;
ALTER TABLE draw_requests ADD COLUMN IF NOT EXISTS inspection_completed_date date;
ALTER TABLE draw_requests ADD COLUMN IF NOT EXISTS inspector_id uuid REFERENCES inspectors(id);
ALTER TABLE draw_requests ADD COLUMN IF NOT EXISTS reviewer_id uuid REFERENCES auth.users(id);
ALTER TABLE draw_requests ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE draw_requests ADD COLUMN IF NOT EXISTS wire_date date;
ALTER TABLE draw_requests ADD COLUMN IF NOT EXISTS wire_amount numeric(15,2);
ALTER TABLE draw_requests ADD COLUMN IF NOT EXISTS wire_confirmation_number text;
ALTER TABLE draw_requests ADD COLUMN IF NOT EXISTS wire_initiated_by uuid REFERENCES auth.users(id);
ALTER TABLE draw_requests ADD COLUMN IF NOT EXISTS funded_at timestamptz;
ALTER TABLE draw_requests ADD COLUMN IF NOT EXISTS loan_event_id uuid REFERENCES loan_events(id);
ALTER TABLE draw_requests ADD COLUMN IF NOT EXISTS borrower_notes text;
ALTER TABLE draw_requests ADD COLUMN IF NOT EXISTS internal_notes text;

CREATE TABLE IF NOT EXISTS draw_request_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_request_id uuid NOT NULL REFERENCES draw_requests(id) ON DELETE CASCADE,
  budget_line_item_id uuid NOT NULL REFERENCES budget_line_items(id),
  requested_amount numeric(15,2) NOT NULL,
  approved_amount numeric(15,2),
  inspector_approved_percent numeric(5,2), notes text
);

-- =========================
-- Phase 4: Inspections
-- =========================

CREATE TABLE IF NOT EXISTS inspection_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_request_id uuid NOT NULL REFERENCES draw_requests(id) ON DELETE CASCADE,
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  inspector_id uuid REFERENCES inspectors(id),
  inspection_type inspection_report_type NOT NULL,
  inspection_date date NOT NULL,
  overall_percent_complete numeric(5,2) NOT NULL,
  report_pdf_path text, notes text,
  submitted_by uuid NOT NULL REFERENCES auth.users(id),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inspection_line_item_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_report_id uuid NOT NULL REFERENCES inspection_reports(id) ON DELETE CASCADE,
  budget_line_item_id uuid NOT NULL REFERENCES budget_line_items(id),
  percent_complete numeric(5,2) NOT NULL CHECK (percent_complete >= 0 AND percent_complete <= 100),
  notes text
);

-- =========================
-- Phase 5: Documents + Storage
-- =========================

CREATE TABLE IF NOT EXISTS draw_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_request_id uuid NOT NULL REFERENCES draw_requests(id) ON DELETE CASCADE,
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  document_type draw_document_type NOT NULL,
  file_name text NOT NULL, file_path text NOT NULL,
  file_size_bytes int, mime_type text,
  budget_line_item_id uuid REFERENCES budget_line_items(id),
  is_geotagged boolean NOT NULL DEFAULT false,
  geolocation_lat numeric(10,7), geolocation_lng numeric(10,7),
  photo_taken_at timestamptz,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  uploaded_at timestamptz NOT NULL DEFAULT now(), notes text
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('draw-documents', 'draw-documents', false, 52428800,
  ARRAY['application/pdf','image/png','image/jpeg','image/jpg','image/webp',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv','text/plain'])
ON CONFLICT (id) DO NOTHING;

-- =========================
-- Phase 7: Alter loans
-- =========================

ALTER TABLE loans ADD COLUMN IF NOT EXISTS construction_budget_id uuid REFERENCES construction_budgets(id);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS total_draws_funded numeric(15,2) NOT NULL DEFAULT 0;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS draw_count int NOT NULL DEFAULT 0;

-- =========================
-- Enable RLS + triggers
-- =========================

ALTER TABLE inspectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_line_item_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_change_request_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_request_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_line_item_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_documents ENABLE ROW LEVEL SECURITY;
