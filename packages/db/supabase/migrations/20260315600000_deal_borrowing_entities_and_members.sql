-- ============================================================
-- Migration: Deal Borrowing Entities & Borrower Members
-- ============================================================

-- 1. Borrowing Entity (one per deal, expandable later)
CREATE TABLE IF NOT EXISTS deal_borrowing_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES unified_deals(id) ON DELETE CASCADE,
  entity_name TEXT NOT NULL DEFAULT '',
  entity_type TEXT NOT NULL DEFAULT '',
  ein TEXT DEFAULT '',
  state_of_formation TEXT DEFAULT '',
  date_of_formation DATE,
  address_line_1 TEXT DEFAULT '',
  address_line_2 TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  zip TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX idx_deal_borrowing_entities_deal_id ON deal_borrowing_entities(deal_id);

-- 2. Borrower Members (up to 5 per entity, linked to crm_contacts)
CREATE TABLE IF NOT EXISTS deal_borrower_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrowing_entity_id UUID NOT NULL REFERENCES deal_borrowing_entities(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES unified_deals(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE RESTRICT,
  ownership_pct NUMERIC(5,2) DEFAULT 0,
  credit_score INTEGER DEFAULT 0,
  liquidity NUMERIC(15,2) DEFAULT 0,
  net_worth NUMERIC(15,2) DEFAULT 0,
  experience INTEGER DEFAULT 0,
  is_guarantor BOOLEAN NOT NULL DEFAULT false,
  role TEXT NOT NULL DEFAULT 'Member',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX idx_deal_borrower_members_deal_contact ON deal_borrower_members(deal_id, contact_id);
CREATE INDEX idx_deal_borrower_members_entity ON deal_borrower_members(borrowing_entity_id);
CREATE INDEX idx_deal_borrower_members_deal ON deal_borrower_members(deal_id);

-- 3. Borrower Profiles (global, on the Contact)
CREATE TABLE IF NOT EXISTS borrower_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  default_credit_score INTEGER DEFAULT 0,
  default_liquidity NUMERIC(15,2) DEFAULT 0,
  default_net_worth NUMERIC(15,2) DEFAULT 0,
  default_experience INTEGER DEFAULT 0,
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_borrower_profiles_contact ON borrower_profiles(contact_id);

-- 4. Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deal_borrowing_entities_updated_at
  BEFORE UPDATE ON deal_borrowing_entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_deal_borrower_members_updated_at
  BEFORE UPDATE ON deal_borrower_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_borrower_profiles_updated_at
  BEFORE UPDATE ON borrower_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. RLS Policies
ALTER TABLE deal_borrowing_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_borrower_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrower_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can CRUD deal_borrowing_entities"
  ON deal_borrowing_entities FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can CRUD deal_borrower_members"
  ON deal_borrower_members FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can CRUD borrower_profiles"
  ON borrower_profiles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Check constraint: max 5 members per entity
CREATE OR REPLACE FUNCTION check_max_borrower_members()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM deal_borrower_members WHERE borrowing_entity_id = NEW.borrowing_entity_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 borrower members per entity';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_max_borrower_members
  BEFORE INSERT ON deal_borrower_members
  FOR EACH ROW EXECUTE FUNCTION check_max_borrower_members();
