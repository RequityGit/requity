-- Re-point deal_commercial_uw.opportunity_id FK from legacy opportunities to unified_deals
-- Fixes: comm debt deals created via unified pipeline had no matching row in opportunities,
-- causing ensureCommercialUW inserts to silently fail (FK violation).

ALTER TABLE deal_commercial_uw
  DROP CONSTRAINT deal_commercial_uw_opportunity_id_fkey;

ALTER TABLE deal_commercial_uw
  ADD CONSTRAINT deal_commercial_uw_opportunity_id_fkey
  FOREIGN KEY (opportunity_id) REFERENCES unified_deals(id) ON DELETE CASCADE;
