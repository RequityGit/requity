-- ============================================================
-- Data Migration: Backfill deal_borrowing_entities from legacy data
-- Run ONLY after the new Borrower Contacts UI is stable.
-- ============================================================
-- Opportunities do not store entity_name/entity_type directly;
-- they link to borrower_entities via borrower_entity_id.
-- This migration creates one deal_borrowing_entity per unified_deal
-- that has a matching opportunity with a borrower_entity, using
-- borrower_entities for entity_name and entity_type.
--
-- Assumption: unified_deals.id matches opportunities.id for legacy
-- pipeline deals. If your schema uses a different link (e.g.
-- unified_deals.opportunity_id), adjust the SELECT accordingly.
-- ============================================================

INSERT INTO deal_borrowing_entities (deal_id, entity_name, entity_type, ein, state_of_formation, address_line_1, address_line_2, city, state, zip, notes)
SELECT
  o.id AS deal_id,
  COALESCE(be.entity_name, '') AS entity_name,
  COALESCE(be.entity_type, '') AS entity_type,
  be.ein,
  be.state_of_formation,
  be.address_line1,
  be.address_line2,
  be.city,
  be.state,
  be.zip,
  be.notes
FROM opportunities o
JOIN borrower_entities be ON be.id = o.borrower_entity_id
WHERE o.borrower_entity_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM unified_deals u WHERE u.id = o.id)
ON CONFLICT (deal_id) DO NOTHING;
