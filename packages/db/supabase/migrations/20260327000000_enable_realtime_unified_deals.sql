-- Enable Supabase Realtime on the unified_deals table.
-- This allows the pipeline board to receive live INSERT/UPDATE/DELETE events
-- for cross-browser sync and instant stage transitions.

ALTER PUBLICATION supabase_realtime ADD TABLE unified_deals;
