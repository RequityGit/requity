-- Migration 013: Create audit trigger on crm_contacts
-- Automatically logs changes to compliance-sensitive fields
-- (lifecycle_stage, marketing_consent, consent_granted_at, dnc, dnc_reason)
-- into the contact_audit_log table.

CREATE OR REPLACE FUNCTION fn_audit_contact_changes()
RETURNS TRIGGER AS $$
DECLARE
  fields text[] := ARRAY['lifecycle_stage', 'marketing_consent', 'consent_granted_at', 'dnc', 'dnc_reason'];
  field_name text;
  old_val text;
  new_val text;
BEGIN
  FOREACH field_name IN ARRAY fields LOOP
    EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', field_name, field_name)
      INTO old_val, new_val
      USING OLD, NEW;

    IF old_val IS DISTINCT FROM new_val THEN
      INSERT INTO contact_audit_log (contact_id, action, field_name, old_value, new_value, changed_by, context)
      VALUES (
        NEW.id,
        'update',
        field_name,
        old_val,
        new_val,
        auth.uid(),
        'trigger'
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_contact_changes
  AFTER UPDATE ON crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_contact_changes();
