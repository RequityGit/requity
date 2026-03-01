-- Backfill contact_relationship_types from old contact_type field
INSERT INTO contact_relationship_types (contact_id, relationship_type, is_active)
SELECT id,
  CASE contact_type
    WHEN 'borrower' THEN 'borrower'::relationship_type_enum
    WHEN 'investor' THEN 'investor'::relationship_type_enum
    WHEN 'vendor' THEN 'vendor'::relationship_type_enum
    WHEN 'partner' THEN 'referral_partner'::relationship_type_enum
    WHEN 'referral' THEN 'referral_partner'::relationship_type_enum
    ELSE 'borrower'::relationship_type_enum
  END,
  true
FROM crm_contacts
WHERE deleted_at IS NULL
AND id NOT IN (SELECT DISTINCT contact_id FROM contact_relationship_types);

-- Backfill lifecycle_stage from old contact_type and status
UPDATE crm_contacts SET lifecycle_stage =
  CASE
    WHEN contact_type = 'lead' THEN 'lead'::lifecycle_stage_enum
    WHEN contact_type = 'prospect' THEN 'prospect'::lifecycle_stage_enum
    WHEN status = 'converted' THEN 'active'::lifecycle_stage_enum
    WHEN status = 'active' THEN 'active'::lifecycle_stage_enum
    WHEN status = 'inactive' THEN 'past'::lifecycle_stage_enum
    WHEN status = 'lost' THEN 'past'::lifecycle_stage_enum
    ELSE 'lead'::lifecycle_stage_enum
  END,
  lifecycle_updated_at = now()
WHERE lifecycle_stage IS NULL AND deleted_at IS NULL;

-- Backfill dnc from old status
UPDATE crm_contacts SET dnc = true, dnc_reason = 'Migrated from legacy do_not_contact status'
WHERE status = 'do_not_contact' AND (dnc IS NULL OR dnc = false);
