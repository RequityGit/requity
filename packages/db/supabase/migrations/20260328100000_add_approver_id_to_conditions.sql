-- Add approver_id to unified_deal_conditions
-- Tracks who is responsible for approving a condition (separate from assigned_to which tracks the collector)
ALTER TABLE unified_deal_conditions
  ADD COLUMN approver_id UUID REFERENCES auth.users(id);
