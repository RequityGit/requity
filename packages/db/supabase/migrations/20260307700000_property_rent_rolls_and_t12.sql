-- ============================================================
-- Property Rent Rolls & T12 P&L as versioned subobjects
-- ============================================================

-- 1. property_rent_rolls (upload metadata)
CREATE TABLE property_rent_rolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  as_of_date DATE NOT NULL,
  source_label TEXT,
  file_name TEXT,
  column_mapping JSONB,
  is_current BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. property_rent_roll_units (unit-level rows)
CREATE TABLE property_rent_roll_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rent_roll_id UUID NOT NULL REFERENCES property_rent_rolls(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  unit_number TEXT NOT NULL,
  tenant_name TEXT,
  sf NUMERIC,
  beds_type TEXT,
  baths NUMERIC,
  lease_type TEXT,
  lease_start DATE,
  lease_end DATE,
  current_monthly_rent NUMERIC DEFAULT 0,
  cam_nnn NUMERIC DEFAULT 0,
  other_income NUMERIC DEFAULT 0,
  is_vacant BOOLEAN DEFAULT false,
  market_rent NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. property_t12s (upload metadata)
CREATE TABLE property_t12s (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  source_label TEXT,
  file_name TEXT,
  month_labels JSONB,
  is_current BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. property_t12_line_items (income/expense rows)
CREATE TABLE property_t12_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  t12_id UUID NOT NULL REFERENCES property_t12s(id) ON DELETE CASCADE,
  original_row_label TEXT NOT NULL,
  mapped_category TEXT,
  is_income BOOLEAN DEFAULT false,
  is_excluded BOOLEAN DEFAULT false,
  exclusion_reason TEXT,
  amount_month_1 NUMERIC,
  amount_month_2 NUMERIC,
  amount_month_3 NUMERIC,
  amount_month_4 NUMERIC,
  amount_month_5 NUMERIC,
  amount_month_6 NUMERIC,
  amount_month_7 NUMERIC,
  amount_month_8 NUMERIC,
  amount_month_9 NUMERIC,
  amount_month_10 NUMERIC,
  amount_month_11 NUMERIC,
  amount_month_12 NUMERIC,
  annual_total NUMERIC,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ──
CREATE INDEX idx_property_rent_rolls_property ON property_rent_rolls(property_id);
CREATE INDEX idx_property_rent_roll_units_rr ON property_rent_roll_units(rent_roll_id);
CREATE INDEX idx_property_t12s_property ON property_t12s(property_id);
CREATE INDEX idx_property_t12_line_items_t12 ON property_t12_line_items(t12_id);

-- ── is_current exclusivity trigger ──
CREATE OR REPLACE FUNCTION set_exclusive_is_current()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = true THEN
    EXECUTE format(
      'UPDATE %I SET is_current = false WHERE property_id = $1 AND id != $2',
      TG_TABLE_NAME
    ) USING NEW.property_id, NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_property_rent_rolls_is_current
  BEFORE INSERT OR UPDATE OF is_current ON property_rent_rolls
  FOR EACH ROW EXECUTE FUNCTION set_exclusive_is_current();

CREATE TRIGGER trg_property_t12s_is_current
  BEFORE INSERT OR UPDATE OF is_current ON property_t12s
  FOR EACH ROW EXECUTE FUNCTION set_exclusive_is_current();

-- ── RLS ──
ALTER TABLE property_rent_rolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_rent_roll_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_t12s ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_t12_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_property_rent_rolls"
  ON property_rent_rolls FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "admin_full_access_property_rent_roll_units"
  ON property_rent_roll_units FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "admin_full_access_property_t12s"
  ON property_t12s FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "admin_full_access_property_t12_line_items"
  ON property_t12_line_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role IN ('super_admin', 'admin')
    )
  );
