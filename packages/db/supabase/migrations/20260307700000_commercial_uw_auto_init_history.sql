-- ============================================================
-- Migration: Commercial UW Auto-Init + Auto-Save History
-- Applied via Supabase MCP. This file is kept for reference.
-- ============================================================

-- 1. Create history table
-- 2. Consolidate to one UW record per opportunity (remove old versions)
-- 3. Remove version/status columns, add unique(opportunity_id)
-- 4. Auto-init trigger on opportunities.model_type = 'commercial'
-- 5. Auto-snapshot trigger before deal_commercial_uw updates
-- 6. Backfill existing commercial deals

-- See the MCP apply_migration call for full SQL.
