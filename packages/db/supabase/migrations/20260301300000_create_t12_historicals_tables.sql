-- T12 upload records (mirrors rent_roll_uploads pattern)
CREATE TABLE t12_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID REFERENCES loans(id) NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL DEFAULT '',
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  source_label TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending_mapping',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual line items parsed from the uploaded T12
CREATE TABLE t12_line_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  t12_upload_id UUID REFERENCES t12_uploads(id) ON DELETE CASCADE NOT NULL,
  original_row_label TEXT NOT NULL,
  original_category TEXT,
  amount_month_1 NUMERIC(12,2),
  amount_month_2 NUMERIC(12,2),
  amount_month_3 NUMERIC(12,2),
  amount_month_4 NUMERIC(12,2),
  amount_month_5 NUMERIC(12,2),
  amount_month_6 NUMERIC(12,2),
  amount_month_7 NUMERIC(12,2),
  amount_month_8 NUMERIC(12,2),
  amount_month_9 NUMERIC(12,2),
  amount_month_10 NUMERIC(12,2),
  amount_month_11 NUMERIC(12,2),
  amount_month_12 NUMERIC(12,2),
  annual_total NUMERIC(12,2),
  is_income BOOLEAN DEFAULT FALSE,
  sort_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Field mappings: maps each source row to our standardized categories
CREATE TABLE t12_field_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  t12_upload_id UUID REFERENCES t12_uploads(id) ON DELETE CASCADE NOT NULL,
  t12_line_item_id UUID REFERENCES t12_line_items(id) ON DELETE CASCADE NOT NULL,
  mapped_category TEXT NOT NULL,
  mapped_subcategory TEXT,
  is_excluded BOOLEAN DEFAULT FALSE,
  exclusion_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Version history
CREATE TABLE t12_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID REFERENCES loans(id) NOT NULL,
  t12_upload_id UUID REFERENCES t12_uploads(id) ON DELETE CASCADE NOT NULL,
  version_number INT NOT NULL,
  version_label TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mapping suggestions (global learning table)
CREATE TABLE t12_mapping_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_label TEXT NOT NULL,
  mapped_category TEXT NOT NULL,
  usage_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(original_label, mapped_category)
);

-- Historicals overrides (per category per upload)
CREATE TABLE t12_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  t12_upload_id UUID REFERENCES t12_uploads(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  override_annual_total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(t12_upload_id, category)
);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t12_uploads_updated_at BEFORE UPDATE ON t12_uploads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER t12_field_mappings_updated_at BEFORE UPDATE ON t12_field_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER t12_overrides_updated_at BEFORE UPDATE ON t12_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER t12_mapping_suggestions_updated_at BEFORE UPDATE ON t12_mapping_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE t12_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE t12_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE t12_field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE t12_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE t12_mapping_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE t12_overrides ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins have full access to t12_uploads" ON t12_uploads
  FOR ALL USING (is_admin());

CREATE POLICY "Admins have full access to t12_line_items" ON t12_line_items
  FOR ALL USING (is_admin());

CREATE POLICY "Admins have full access to t12_field_mappings" ON t12_field_mappings
  FOR ALL USING (is_admin());

CREATE POLICY "Admins have full access to t12_versions" ON t12_versions
  FOR ALL USING (is_admin());

CREATE POLICY "Admins have full access to t12_mapping_suggestions" ON t12_mapping_suggestions
  FOR ALL USING (is_admin());

CREATE POLICY "Admins have full access to t12_overrides" ON t12_overrides
  FOR ALL USING (is_admin());

-- Borrowers can view T12 data for their own loans
CREATE POLICY "Borrowers can view own t12_uploads" ON t12_uploads
  FOR SELECT USING (
    loan_id IN (
      SELECT l.id FROM loans l
      WHERE l.borrower_id IN (SELECT my_borrower_ids())
    )
  );

CREATE POLICY "Borrowers can view own t12_line_items" ON t12_line_items
  FOR SELECT USING (
    t12_upload_id IN (
      SELECT tu.id FROM t12_uploads tu
      JOIN loans l ON l.id = tu.loan_id
      WHERE l.borrower_id IN (SELECT my_borrower_ids())
    )
  );

CREATE POLICY "Borrowers can view own t12_field_mappings" ON t12_field_mappings
  FOR SELECT USING (
    t12_upload_id IN (
      SELECT tu.id FROM t12_uploads tu
      JOIN loans l ON l.id = tu.loan_id
      WHERE l.borrower_id IN (SELECT my_borrower_ids())
    )
  );

CREATE POLICY "Borrowers can view own t12_versions" ON t12_versions
  FOR SELECT USING (
    loan_id IN (
      SELECT l.id FROM loans l
      WHERE l.borrower_id IN (SELECT my_borrower_ids())
    )
  );

-- Borrowers can upload T12s for their own loans
CREATE POLICY "Borrowers can insert own t12_uploads" ON t12_uploads
  FOR INSERT WITH CHECK (
    loan_id IN (
      SELECT l.id FROM loans l
      WHERE l.borrower_id IN (SELECT my_borrower_ids())
    )
  );

-- Indexes for performance
CREATE INDEX idx_t12_uploads_loan_id ON t12_uploads(loan_id);
CREATE INDEX idx_t12_line_items_upload_id ON t12_line_items(t12_upload_id);
CREATE INDEX idx_t12_field_mappings_upload_id ON t12_field_mappings(t12_upload_id);
CREATE INDEX idx_t12_field_mappings_line_item_id ON t12_field_mappings(t12_line_item_id);
CREATE INDEX idx_t12_versions_loan_id ON t12_versions(loan_id);
CREATE INDEX idx_t12_versions_upload_id ON t12_versions(t12_upload_id);
CREATE INDEX idx_t12_mapping_suggestions_label ON t12_mapping_suggestions(original_label);
CREATE INDEX idx_t12_overrides_upload_id ON t12_overrides(t12_upload_id);
