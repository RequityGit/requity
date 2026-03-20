-- Add FK from portal_documents.uploaded_by to profiles(id) so PostgREST
-- can resolve the join. The existing FK to auth.users is kept for referential
-- integrity; this second FK enables the `profiles:uploaded_by` join syntax.
ALTER TABLE public.portal_documents
  ADD CONSTRAINT portal_documents_uploaded_by_profiles_fkey
  FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id);
