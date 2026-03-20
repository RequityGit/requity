-- ═══════════════════════════════════════════════════════════
-- ROLLBACK: Drop ALL unified pipeline objects
-- Run ONLY if we revert to the old pipeline.
-- DO NOT apply automatically.
-- ═══════════════════════════════════════════════════════════

-- Drop triggers first
DROP TRIGGER IF EXISTS trg_unified_deal_after_insert ON unified_deals;
DROP TRIGGER IF EXISTS trg_unified_deal_init ON unified_deals;
DROP TRIGGER IF EXISTS trg_unified_deals_updated ON unified_deals;
DROP TRIGGER IF EXISTS trg_unified_deal_number ON unified_deals;

-- Drop functions
DROP FUNCTION IF EXISTS unified_advance_stage(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS unified_checklist_progress(UUID);
DROP FUNCTION IF EXISTS unified_migrate_existing_deals();
DROP FUNCTION IF EXISTS unified_generate_deal_number();
DROP FUNCTION IF EXISTS unified_update_timestamp();
DROP FUNCTION IF EXISTS unified_initialize_deal();
DROP FUNCTION IF EXISTS unified_deal_after_insert();
DROP FUNCTION IF EXISTS unified_ct_id(TEXT);

-- Drop tables (order matters due to FKs)
DROP TABLE IF EXISTS unified_deal_activity CASCADE;
DROP TABLE IF EXISTS unified_deal_tasks CASCADE;
DROP TABLE IF EXISTS unified_deal_checklist CASCADE;
DROP TABLE IF EXISTS unified_checklist_templates CASCADE;
DROP TABLE IF EXISTS unified_deal_relationships CASCADE;
DROP TABLE IF EXISTS unified_deal_stage_history CASCADE;
DROP TABLE IF EXISTS unified_stage_configs CASCADE;
DROP TABLE IF EXISTS unified_deals CASCADE;
DROP TABLE IF EXISTS unified_card_types CASCADE;

-- Then delete frontend files:
--   app/(authenticated)/admin/pipeline-v2/ (entire directory)
--   components/pipeline-v2/ (entire directory)
