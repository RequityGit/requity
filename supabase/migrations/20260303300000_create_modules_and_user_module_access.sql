-- ============================================================
-- Module-Based Access Control System
-- ============================================================

-- 1. Modules table — defines all navigable modules in the app
CREATE TABLE public.modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  route_prefix TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read modules
CREATE POLICY "Authenticated users can read modules"
  ON public.modules FOR SELECT
  USING ((select auth.role()) = 'authenticated');

-- Admins can manage modules
CREATE POLICY "Admins can manage modules"
  ON public.modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid())
        AND role IN ('super_admin', 'admin')
        AND is_active = true
    )
  );

-- 2. User module access table — allow-list of which modules each user can see
CREATE TABLE public.user_module_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, module_id)
);

ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own module access
CREATE POLICY "Users can view own module access"
  ON public.user_module_access FOR SELECT
  USING ((select auth.uid()) = user_id);

-- Admins can manage all module access
CREATE POLICY "Admins can manage all module access"
  ON public.user_module_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid())
        AND role IN ('super_admin', 'admin')
        AND is_active = true
    )
  );

-- 3. Helper function to grant all active modules to a user
CREATE OR REPLACE FUNCTION public.grant_all_modules(target_user_id UUID, granter_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO public.user_module_access (user_id, module_id, granted_by)
  SELECT target_user_id, id, granter_id
  FROM public.modules
  WHERE is_active = true
  ON CONFLICT (user_id, module_id) DO NOTHING;
$$;

-- 4. Seed the modules table with current sidebar navigation items
INSERT INTO public.modules (name, label, icon, description, route_prefix, sort_order) VALUES
  ('dashboard',      'Dashboard',      'LayoutDashboard', 'Main dashboard overview',                     '/admin/dashboard',      0),
  ('crm',            'CRM',            'Contact',         'Contacts, investors, and borrower management', '/admin/crm',           10),
  ('pipeline',       'Pipeline',       'Columns3',        'Loan origination pipeline',                    '/admin/pipeline',      20),
  ('dscr-pricing',   'DSCR Pricing',   'Calculator',      'DSCR loan pricing calculator',                 '/admin/dscr',          30),
  ('servicing',      'Servicing',      'Banknote',        'Loan servicing and payments',                  '/admin/servicing',     40),
  ('investments',    'Investments',    'Landmark',        'Fund management and investor capital',          '/admin/funds',         50),
  ('documents',      'Documents',      'FolderOpen',      'Document center and file management',           '/admin/document-center', 60),
  ('operations',     'Operations',     'Settings2',       'Internal projects and task management',         '/admin/operations',    70),
  ('chatter',        'Chatter',        'MessageSquare',   'Team messaging and deal chat',                  '/chat',                80),
  ('knowledge-base', 'Knowledge Base', 'BookOpen',        'SOPs and internal documentation',               '/sops',                90),
  ('control-center', 'Control Center', 'Cog',             'System administration and settings',            '/control-center',      999);
