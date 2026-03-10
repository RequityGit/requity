-- Grant execute permissions on search functions to authenticated users
-- Without these grants, PostgREST blocks RPC calls from the authenticated role
-- (Supabase revokes default EXECUTE from PUBLIC on new functions)

GRANT EXECUTE ON FUNCTION search_portal(TEXT, TEXT, UUID, TEXT[], INT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_portal(TEXT, TEXT, UUID, TEXT[], INT) TO anon;
GRANT EXECUTE ON FUNCTION refresh_search_index() TO authenticated;
