-- ============================================================
-- Trigger: Auto-sync deal_borrower_members -> deal_contacts
-- When a borrower member is added to a deal, ensure a deal_contacts
-- row exists so the contact's "Related" section shows the deal.
-- ============================================================

CREATE OR REPLACE FUNCTION sync_borrower_member_to_deal_contacts()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT: upsert into deal_contacts
  IF TG_OP = 'INSERT' THEN
    INSERT INTO deal_contacts (deal_id, contact_id, role, is_guarantor, sort_order)
    VALUES (
      NEW.deal_id,
      NEW.contact_id,
      CASE WHEN NEW.role = 'Member' THEN 'co_borrower' ELSE 'primary' END,
      NEW.is_guarantor,
      NEW.sort_order
    )
    ON CONFLICT (deal_id, contact_id) DO UPDATE SET
      is_guarantor = EXCLUDED.is_guarantor;
    RETURN NEW;
  END IF;

  -- On DELETE: remove from deal_contacts if no other borrower member link exists
  IF TG_OP = 'DELETE' THEN
    IF NOT EXISTS (
      SELECT 1 FROM deal_borrower_members
      WHERE deal_id = OLD.deal_id AND contact_id = OLD.contact_id AND id != OLD.id
    ) THEN
      DELETE FROM deal_contacts
      WHERE deal_id = OLD.deal_id AND contact_id = OLD.contact_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_borrower_member_to_deal_contacts
  AFTER INSERT OR DELETE ON deal_borrower_members
  FOR EACH ROW EXECUTE FUNCTION sync_borrower_member_to_deal_contacts();

-- Backfill: insert deal_contacts for existing borrower members that are missing
INSERT INTO deal_contacts (deal_id, contact_id, role, is_guarantor, sort_order)
SELECT
  dbm.deal_id,
  dbm.contact_id,
  CASE WHEN dbm.role = 'Member' THEN 'co_borrower' ELSE 'primary' END,
  dbm.is_guarantor,
  dbm.sort_order
FROM deal_borrower_members dbm
WHERE NOT EXISTS (
  SELECT 1 FROM deal_contacts dc
  WHERE dc.deal_id = dbm.deal_id AND dc.contact_id = dbm.contact_id
);
