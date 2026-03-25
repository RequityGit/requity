-- Fix Security Advisor Errors
-- 1. Set security_invoker on views so they respect RLS of the calling user
-- 2. Drop orphaned chat_followup_processed table (chatter system was removed)

-- Part 1: Fix Security Definer Views
ALTER VIEW public.entity_document_portfolio SET (security_invoker = on);
ALTER VIEW public.crm_upcoming_items SET (security_invoker = on);
ALTER VIEW public.crm_contact_timeline SET (security_invoker = on);
ALTER VIEW public.borrower_document_portfolio SET (security_invoker = on);

-- Part 2: Drop orphaned table from deleted chatter system
DROP TABLE IF EXISTS public.chat_followup_processed;
