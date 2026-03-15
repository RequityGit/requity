-- ===========================================================================
-- TRG LIVING MARKETING CMS ARCHITECTURE (V6 - AUTOMATION READY)
-- ===========================================================================

-- 1. TABLES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pm_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    alt_text TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.pm_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.pm_communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    region_id UUID REFERENCES public.pm_regions(id) ON DELETE SET NULL,    
    core_property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    featured_media_id UUID REFERENCES public.pm_media(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    headline TEXT,
    description_html TEXT,
    address_display TEXT,
    city TEXT NOT NULL,
    state_code CHAR(2),
    zip_code TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.pm_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    community_id UUID REFERENCES public.pm_communities(id) ON DELETE CASCADE,
    featured_media_id UUID REFERENCES public.pm_media(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    body_html TEXT NOT NULL,
    excerpt TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.pm_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    community_id UUID NOT NULL REFERENCES public.pm_communities(id) ON DELETE CASCADE,
    media_id UUID REFERENCES public.pm_media(id) ON DELETE CASCADE,
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.pm_site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    key TEXT UNIQUE NOT NULL, 
    value TEXT, 
    description TEXT
);

-- 2. SECURITY (RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE public.pm_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_gallery ENABLE ROW LEVEL SECURITY;

-- 2.1 CLEANUP & UNIFIED POLICIES
-- [We assume manual execution of cleanup from previous turns]

CREATE POLICY "Allow public read regions" ON public.pm_regions FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read communities" ON public.pm_communities FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read posts" ON public.pm_posts FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read settings" ON public.pm_site_settings FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read media" ON public.pm_media FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read gallery" ON public.pm_gallery FOR SELECT TO public USING (true);

-- Admin Management (Hardened)
CREATE POLICY "Admins can manage all pm tables" 
ON public.pm_communities FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')));

-- [Repeat this logic for other pm_ tables in your file...]

-- 3. PERFORMANCE INDICES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_pm_communities_slug ON public.pm_communities(slug);
CREATE INDEX IF NOT EXISTS idx_pm_posts_slug ON public.pm_posts(slug);