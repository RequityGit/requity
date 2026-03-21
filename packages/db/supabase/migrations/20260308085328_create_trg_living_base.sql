-- ===========================================================================
-- TRG LIVING MARKETING CMS ARCHITECTURE (V8)
-- ===========================================================================

-- 1. TABLES & BUCKETS
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
    beds_range TEXT DEFAULT 'Studio - 3 Beds',
    baths_range TEXT DEFAULT '1 - 2 Baths',
    starting_price TEXT DEFAULT 'Starting at $1,200',
    appfolio_listing_url TEXT, 
    appfolio_portal_url TEXT,  
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

CREATE TABLE IF NOT EXISTS public.pm_amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL UNIQUE,
    icon_slug TEXT
);

CREATE TABLE IF NOT EXISTS public.pm_community_amenities (
    community_id UUID REFERENCES public.pm_communities(id) ON DELETE CASCADE,
    amenity_id UUID REFERENCES public.pm_amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (community_id, amenity_id)
);


-- 2. SECURITY (RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE public.pm_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_community_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_gallery ENABLE ROW LEVEL SECURITY;

-- 2.1 SHARED ROLE HANDSHAKE (Required for all monolith admin tasks)
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- 2.2 PUBLIC READ ACCESS (For Website Visitors)
DROP POLICY IF EXISTS "Allow public read regions" ON public.pm_regions;
CREATE POLICY "Allow public read regions" ON public.pm_regions FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read communities" ON public.pm_communities;
CREATE POLICY "Allow public read communities" ON public.pm_communities FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read posts" ON public.pm_posts;
CREATE POLICY "Allow public read posts" ON public.pm_posts FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read settings" ON public.pm_site_settings;
CREATE POLICY "Allow public read settings" ON public.pm_site_settings FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read media" ON public.pm_media;
CREATE POLICY "Allow public read media" ON public.pm_media FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read gallery" ON public.pm_gallery;
CREATE POLICY "Allow public read gallery" ON public.pm_gallery FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read amenities" ON public.pm_amenities;
CREATE POLICY "Allow public read amenities" ON public.pm_amenities FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read comm_amenities" ON public.pm_community_amenities;
CREATE POLICY "Allow public read comm_amenities" ON public.pm_community_amenities FOR SELECT TO public USING (true);

-- 2.3 ADMIN WRITE ACCESS
CREATE POLICY "Admins manage communities" ON public.pm_communities FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins manage regions" ON public.pm_regions FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins manage posts" ON public.pm_posts FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins manage media" ON public.pm_media FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins manage gallery" ON public.pm_gallery FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')));


-- 3. PERFORMANCE INDICES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_pm_communities_region_id ON public.pm_communities(region_id);
CREATE INDEX IF NOT EXISTS idx_pm_communities_featured_media ON public.pm_communities(featured_media_id);
CREATE INDEX IF NOT EXISTS idx_pm_communities_slug ON public.pm_communities(slug);
CREATE INDEX IF NOT EXISTS idx_pm_gallery_community_id ON public.pm_gallery(community_id);
CREATE INDEX IF NOT EXISTS idx_pm_gallery_media_id ON public.pm_gallery(media_id);
CREATE INDEX IF NOT EXISTS idx_pm_posts_community_id ON public.pm_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_pm_posts_slug ON public.pm_posts(slug);


-- 4. AUTOMATION (Triggers)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_pm_communities_updated ON public.pm_communities;
CREATE TRIGGER on_pm_communities_updated BEFORE UPDATE ON public.pm_communities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_pm_posts_updated ON public.pm_posts;
CREATE TRIGGER on_pm_posts_updated BEFORE UPDATE ON public.pm_posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_pm_site_settings_updated ON public.pm_site_settings;
CREATE TRIGGER on_pm_site_settings_updated BEFORE UPDATE ON public.pm_site_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_pm_gallery_updated ON public.pm_gallery;
CREATE TRIGGER on_pm_gallery_updated BEFORE UPDATE ON public.pm_gallery FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- 5. INITIAL DATA
-- ---------------------------------------------------------------------------
INSERT INTO public.pm_site_settings (key, value, description) VALUES 
('site_name', 'TRG Living', 'The main title in the header'),
('brand_color', '#2563eb', 'The primary blue color used for buttons')
ON CONFLICT (key) DO NOTHING;