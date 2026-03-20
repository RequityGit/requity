-- Fix check constraint to include unified_condition_id and deal_id columns
-- These were added to the notes table but not included in the entity FK check
ALTER TABLE public.notes DROP CONSTRAINT chk_notes_entity_fk;
ALTER TABLE public.notes ADD CONSTRAINT chk_notes_entity_fk CHECK (
  (contact_id IS NOT NULL) OR
  (company_id IS NOT NULL) OR
  (loan_id IS NOT NULL) OR
  (opportunity_id IS NOT NULL) OR
  (task_id IS NOT NULL) OR
  (project_id IS NOT NULL) OR
  (approval_id IS NOT NULL) OR
  (condition_id IS NOT NULL) OR
  (unified_condition_id IS NOT NULL) OR
  (deal_id IS NOT NULL)
);
