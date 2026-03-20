-- Loan stage transition logger (writes to loan_stage_history table)
CREATE OR REPLACE FUNCTION log_loan_stage_change()
RETURNS trigger AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO loan_stage_history (loan_id, from_stage, to_stage, changed_by, changed_at, duration_in_previous_stage)
    VALUES (
      NEW.id,
      OLD.stage::text,
      NEW.stage::text,
      NULLIF(current_setting('app.current_user_id', true), '')::uuid,
      now(),
      now() - OLD.stage_updated_at
    );
    NEW.stage_updated_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER loan_stage_change
  BEFORE UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION log_loan_stage_change();
