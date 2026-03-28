-- ===========================================================================
-- TRG LIVING MARKETING CMS ARCHITECTURE (V12)
-- MASTER FOUNDATION - FULL ARCHIVE (IDEMPOTENT)
-- ===========================================================================

-- 1. TABLES
-- ---------------------------------------------------------------------------

-- 1.1 Media Library
CREATE TABLE IF NOT EXISTS public.pm_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    alt_text TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 1.2 Regional Taxonomy
CREATE TABLE IF NOT EXISTS public.pm_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    description_html TEXT,
    featured_media_id UUID REFERENCES public.pm_media(id) ON DELETE SET NULL
);

-- 1.3 Properties (MHC and Campgrounds)
CREATE TABLE IF NOT EXISTS public.pm_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    region_id UUID REFERENCES public.pm_regions(id) ON DELETE SET NULL,    
    core_property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    featured_media_id UUID REFERENCES public.pm_media(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    property_type TEXT DEFAULT 'mhc' CHECK (property_type IN ('mhc', 'campground')),
    headline TEXT,
    description_html TEXT,
    address_display TEXT,
    city TEXT NOT NULL,
    state_code CHAR(2),
    zip_code TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    beds_range TEXT DEFAULT 'Studio - 3 Beds',
    baths_range TEXT DEFAULT '1 - 2 Baths',
    starting_price TEXT DEFAULT 'Starting at $1,200',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 1.4 Blog Posts
CREATE TABLE IF NOT EXISTS public.pm_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    property_id UUID REFERENCES public.pm_properties(id) ON DELETE CASCADE,
    featured_media_id UUID REFERENCES public.pm_media(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    body_html TEXT NOT NULL,
    excerpt TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ
);

-- 1.5 Static Content Pages
CREATE TABLE IF NOT EXISTS public.pm_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content_html TEXT NOT NULL,
    hero_image_id UUID REFERENCES public.pm_media(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 1.6 Site Settings
CREATE TABLE IF NOT EXISTS public.pm_site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    key TEXT UNIQUE NOT NULL, 
    value TEXT, 
    description TEXT
);

-- 1.7 Amenity Library
CREATE TABLE IF NOT EXISTS public.pm_amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL UNIQUE,
    icon_slug TEXT
);

-- 1.8 Junction: Property-Amenity
CREATE TABLE IF NOT EXISTS public.pm_property_amenities (
    property_id UUID REFERENCES public.pm_properties(id) ON DELETE CASCADE,
    amenity_id UUID REFERENCES public.pm_amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (property_id, amenity_id)
);

-- 1.9 Property Gallery
CREATE TABLE IF NOT EXISTS public.pm_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    property_id UUID NOT NULL REFERENCES public.pm_properties(id) ON DELETE CASCADE,
    media_id UUID REFERENCES public.pm_media(id) ON DELETE CASCADE,
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0
);

-- 1.10 Leads
CREATE TABLE IF NOT EXISTS public.pm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    property_id UUID REFERENCES public.pm_properties(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT,
    source_url TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed'))
);

-- 1.11 Media Orphan View (For Admin Cleanup)
CREATE OR REPLACE VIEW public.view_orphaned_media 
WITH (security_invoker = true)
AS
SELECT m.*
FROM public.pm_media m
WHERE NOT EXISTS (SELECT 1 FROM public.pm_properties p WHERE p.featured_media_id = m.id)
  AND NOT EXISTS (SELECT 1 FROM public.pm_regions r WHERE r.featured_media_id = m.id)
  AND NOT EXISTS (SELECT 1 FROM public.pm_gallery g WHERE g.media_id = m.id)
  AND NOT EXISTS (SELECT 1 FROM public.pm_posts bp WHERE bp.featured_media_id = m.id)
  AND NOT EXISTS (SELECT 1 FROM public.pm_pages pg WHERE pg.hero_image_id = m.id);


-- 2. SECURITY (RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE public.pm_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_property_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_leads ENABLE ROW LEVEL SECURITY;

-- 2.1 CLEANUP (Surgical Drop for All Table Permutations)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow public read regions" ON public.pm_regions;
    DROP POLICY IF EXISTS "Allow public read communities" ON public.pm_properties;
    DROP POLICY IF EXISTS "Allow public read properties" ON public.pm_properties;
    DROP POLICY IF EXISTS "Allow public read posts" ON public.pm_posts;
    DROP POLICY IF EXISTS "Allow public read pages" ON public.pm_pages;
    DROP POLICY IF EXISTS "Allow public read settings" ON public.pm_site_settings;
    DROP POLICY IF EXISTS "Allow public read media" ON public.pm_media;
    DROP POLICY IF EXISTS "Allow public read gallery" ON public.pm_gallery;
    DROP POLICY IF EXISTS "Allow public read amenities" ON public.pm_amenities;
    DROP POLICY IF EXISTS "Allow public read comm_amenities" ON public.pm_property_amenities;
    DROP POLICY IF EXISTS "Allow public read property_amenities" ON public.pm_property_amenities;
    DROP POLICY IF EXISTS "Allow public insert leads" ON public.pm_leads;
    
    DROP POLICY IF EXISTS "Admins manage regions" ON public.pm_regions;
    DROP POLICY IF EXISTS "Admins manage communities" ON public.pm_properties;
    DROP POLICY IF EXISTS "Admins manage properties" ON public.pm_properties;
    DROP POLICY IF EXISTS "Admins manage posts" ON public.pm_posts;
    DROP POLICY IF EXISTS "Admins manage pages" ON public.pm_pages;
    DROP POLICY IF EXISTS "Admins manage settings" ON public.pm_site_settings;
    DROP POLICY IF EXISTS "Admins manage media" ON public.pm_media;
    DROP POLICY IF EXISTS "Admins manage gallery" ON public.pm_gallery;
    DROP POLICY IF EXISTS "Admins manage amenities" ON public.pm_amenities;
    DROP POLICY IF EXISTS "Admins manage community_amenities" ON public.pm_property_amenities;
    DROP POLICY IF EXISTS "Admins manage property_amenities" ON public.pm_property_amenities;
    DROP POLICY IF EXISTS "Admins manage leads" ON public.pm_leads;
END $$;

-- 2.2 PUBLIC POLICIES
CREATE POLICY "Allow public read regions" ON public.pm_regions FOR SELECT TO public USING (status = 'published');
CREATE POLICY "Allow public read properties" ON public.pm_properties FOR SELECT TO public USING (status = 'published');
CREATE POLICY "Allow public read posts" ON public.pm_posts FOR SELECT TO public USING (status = 'published');
CREATE POLICY "Allow public read pages" ON public.pm_pages FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read settings" ON public.pm_site_settings FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read media" ON public.pm_media FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read gallery" ON public.pm_gallery FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read amenities" ON public.pm_amenities FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read property_amenities" ON public.pm_property_amenities FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert leads" ON public.pm_leads FOR INSERT TO public WITH CHECK (true);

-- 2.3 ADMIN POLICIES (Role-Locked)
CREATE POLICY "Admins manage regions" ON public.pm_regions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins manage properties" ON public.pm_properties FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins manage posts" ON public.pm_posts FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins manage pages" ON public.pm_pages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins manage settings" ON public.pm_site_settings FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins manage media" ON public.pm_media FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins manage gallery" ON public.pm_gallery FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins manage amenities" ON public.pm_amenities FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins manage property_amenities" ON public.pm_property_amenities FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins manage leads" ON public.pm_leads FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));


-- 3. PERFORMANCE INDICES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_pm_properties_region_id ON public.pm_properties(region_id);
CREATE INDEX IF NOT EXISTS idx_pm_properties_slug ON public.pm_properties(slug);
CREATE INDEX IF NOT EXISTS idx_pm_properties_status ON public.pm_properties(status);
CREATE INDEX IF NOT EXISTS idx_pm_properties_type ON public.pm_properties(property_type);
CREATE INDEX IF NOT EXISTS idx_pm_gallery_property_id ON public.pm_gallery(property_id);
CREATE INDEX IF NOT EXISTS idx_pm_posts_property_id ON public.pm_posts(property_id);
CREATE INDEX IF NOT EXISTS idx_pm_leads_property_id ON public.pm_leads(property_id);
-- Junction Index (For Amenity reverse lookups)
CREATE INDEX IF NOT EXISTS idx_pm_prop_amenities_amenity ON public.pm_property_amenities(amenity_id);


-- 4. AUTOMATION (Triggers)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_pm_regions_updated ON public.pm_regions;
CREATE TRIGGER on_pm_regions_updated BEFORE UPDATE ON public.pm_regions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_pm_properties_updated ON public.pm_properties;
CREATE TRIGGER on_pm_properties_updated BEFORE UPDATE ON public.pm_properties FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_pm_posts_updated ON public.pm_posts;
CREATE TRIGGER on_pm_posts_updated BEFORE UPDATE ON public.pm_posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_pm_leads_updated ON public.pm_leads;
CREATE TRIGGER on_pm_leads_updated BEFORE UPDATE ON public.pm_leads FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();