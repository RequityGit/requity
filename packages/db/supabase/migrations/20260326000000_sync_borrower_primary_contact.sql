-- ============================================================
-- Trigger: Auto-sync deal_borrower_members -> unified_deals.primary_contact_id
-- When borrower members are added/removed, keep the kanban card's
-- primary contact in sync so it displays the borrower name.
-- ============================================================

CREATE OR REPLACE FUNCTION sync_primary_contact_from_borrower_members()
RETURNS TRIGGER AS $$
DECLARE
  _current_primary uuid;
  _next_contact uuid;
  _deal_id uuid;
BEGIN
  -- Determine the deal_id for this operation
  IF TG_OP = 'DELETE' THEN
    _deal_id := OLD.deal_id;
  ELSE
    _deal_id := NEW.deal_id;
  END IF;

  -- Get current primary_contact_id for this deal
  SELECT primary_contact_id INTO _current_primary
  FROM unified_deals
  WHERE id = _deal_id;

  -- On INSERT: auto-fill primary_contact_id only if currently NULL
  IF TG_OP = 'INSERT' THEN
    IF _current_primary IS NULL AND NEW.contact_id IS NOT NULL THEN
      UPDATE unified_deals
      SET primary_contact_id = NEW.contact_id
      WHERE id = _deal_id;
    END IF;
    RETURN NEW;
  END IF;

  -- On DELETE: if the removed member was the primary contact, promote next
  IF TG_OP = 'DELETE' THEN
    IF OLD.contact_id IS NOT NULL AND OLD.contact_id = _current_primary THEN
      SELECT contact_id INTO _next_contact
      FROM deal_borrower_members
      WHERE deal_id = _deal_id
        AND contact_id IS NOT NULL
        AND id != OLD.id
      ORDER BY sort_order ASC
      LIMIT 1;

      UPDATE unified_deals
      SET primary_contact_id = _next_contact  -- NULL if no members remain
      WHERE id = _deal_id;
    END IF;
    RETURN OLD;
  END IF;

  -- On UPDATE: if the old contact_id was the primary and it changed, recalculate
  IF TG_OP = 'UPDATE' THEN
    IF OLD.contact_id IS DISTINCT FROM NEW.contact_id
       AND OLD.contact_id = _current_primary THEN
      -- If new contact_id is not null, just swap
      IF NEW.contact_id IS NOT NULL THEN
        UPDATE unified_deals
        SET primary_contact_id = NEW.contact_id
        WHERE id = _deal_id;
      ELSE
        -- contact_id was cleared; pick next available member
        SELECT contact_id INTO _next_contact
        FROM deal_borrower_members
        WHERE deal_id = _deal_id
          AND contact_id IS NOT NULL
          AND id != NEW.id
        ORDER BY sort_order ASC
        LIMIT 1;

        UPDATE unified_deals
        SET primary_contact_id = _next_contact
        WHERE id = _deal_id;
      END IF;
    -- If primary was NULL and the update added a contact_id, fill it
    ELSIF _current_primary IS NULL AND NEW.contact_id IS NOT NULL THEN
      UPDATE unified_deals
      SET primary_contact_id = NEW.contact_id
      WHERE id = _deal_id;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_primary_contact_from_borrower_members
  AFTER INSERT OR UPDATE OF contact_id OR DELETE
  ON deal_borrower_members
  FOR EACH ROW EXECUTE FUNCTION sync_primary_contact_from_borrower_members();

-- Backfill: set primary_contact_id for existing deals that have borrower members
-- but no primary contact set yet
UPDATE unified_deals ud
SET primary_contact_id = sub.contact_id
FROM (
  SELECT DISTINCT ON (deal_id) deal_id, contact_id
  FROM deal_borrower_members
  WHERE contact_id IS NOT NULL
  ORDER BY deal_id, sort_order ASC
) sub
WHERE ud.id = sub.deal_id
  AND ud.primary_contact_id IS NULL;
