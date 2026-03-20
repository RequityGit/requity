-- Version history for DSCR pricing engine changes
-- Tracks changes to products, rates, and LLPAs (mirrors pricing_program_versions for RTL)
CREATE TABLE IF NOT EXISTS dscr_pricing_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id UUID REFERENCES dscr_lenders(id),
  product_id UUID REFERENCES dscr_lender_products(id),
  lender_name TEXT,
  product_name TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  change_type TEXT NOT NULL DEFAULT 'product_update',
  change_description TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  snapshot JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_dscr_pricing_versions_product ON dscr_pricing_versions(product_id);
CREATE INDEX idx_dscr_pricing_versions_lender ON dscr_pricing_versions(lender_id);
CREATE INDEX idx_dscr_pricing_versions_changed ON dscr_pricing_versions(changed_at DESC);

-- RLS
ALTER TABLE dscr_pricing_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dscr_versions_read" ON dscr_pricing_versions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "dscr_versions_write" ON dscr_pricing_versions
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
