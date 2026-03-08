-- Rollback: Remove Page Layout Manager feature
-- Drops all tables, the enum, and the RPC function created by the page layout migrations.

DROP FUNCTION IF EXISTS public.get_page_layout(page_object_type, app_role);

DROP TABLE IF EXISTS public.page_layout_history CASCADE;
DROP TABLE IF EXISTS public.page_layout_fields CASCADE;
DROP TABLE IF EXISTS public.page_layout_sections CASCADE;
DROP TABLE IF EXISTS public.page_layout_tabs CASCADE;
DROP TABLE IF EXISTS public.page_layouts CASCADE;

DROP TYPE IF EXISTS public.page_object_type;
