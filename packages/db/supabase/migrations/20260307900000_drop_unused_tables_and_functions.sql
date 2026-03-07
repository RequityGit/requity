-- Drop views first (they depend on base tables)
DROP VIEW IF EXISTS public.loan_borrowers_detail CASCADE;
DROP VIEW IF EXISTS public.underwriting_summary CASCADE;

-- Drop tables with FK dependencies first
DROP TABLE IF EXISTS public.campaign_sends CASCADE;

-- Drop unused base tables
DROP TABLE IF EXISTS public.approval_parameters CASCADE;
DROP TABLE IF EXISTS public.entity_investors CASCADE;
DROP TABLE IF EXISTS public.entity_owners CASCADE;
DROP TABLE IF EXISTS public.form_field_registry CASCADE;
DROP TABLE IF EXISTS public.loan_borrowers CASCADE;
DROP TABLE IF EXISTS public.loan_condition_documents CASCADE;
DROP TABLE IF EXISTS public.marketing_campaigns CASCADE;
DROP TABLE IF EXISTS public.term_sheet_generations CASCADE;
DROP TABLE IF EXISTS public.term_sheet_logs CASCADE;
DROP TABLE IF EXISTS public.dscr_prepay_restrictions CASCADE;

-- Drop unused RPC functions
DROP FUNCTION IF EXISTS public.link_change_order_to_draw_line_item(uuid, uuid);
DROP FUNCTION IF EXISTS public.populate_loan_from_property(uuid, uuid);
DROP FUNCTION IF EXISTS public.notify_admins(text, text, text, text, uuid, text, text, text, uuid);
