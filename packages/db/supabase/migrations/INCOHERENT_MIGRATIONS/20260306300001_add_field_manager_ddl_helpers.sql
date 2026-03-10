-- Helper: check if a column exists on a table
CREATE OR REPLACE FUNCTION column_exists(p_table text, p_column text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table
      AND column_name = p_column
  ) INTO v_exists;
  RETURN v_exists;
END;
$$;

-- Helper: execute arbitrary DDL (restricted to service_role only)
-- This allows the create-field edge function to run ALTER TABLE safely
CREATE OR REPLACE FUNCTION exec_ddl(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Lock down exec_ddl: revoke from all regular roles, grant only to service_role
REVOKE ALL ON FUNCTION exec_ddl(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION exec_ddl(text) FROM anon;
REVOKE EXECUTE ON FUNCTION exec_ddl(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION exec_ddl(text) TO service_role;

-- column_exists is safe to call from authenticated users (read-only info_schema check)
GRANT EXECUTE ON FUNCTION column_exists(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION column_exists(text, text) TO service_role;
