-- ===========================================================================
-- TRG LIVING MARKETING CMS ARCHITECTURE (V10)
-- ===========================================================================

-- 1. TABLES & BUCKETS
-- ---------------------------------------------------------------------------

-- Media Library
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

-- Region Taxonomy
CREATE TABLE IF NOT EXISTS public.pm_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Communities
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
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Blog Posts
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

-- Static Content Pages
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

-- Site Settings
CREATE TABLE IF NOT EXISTS public.pm_site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    key TEXT UNIQUE NOT NULL, 
    value TEXT, 
    description TEXT
);

-- Amenity Library
CREATE TABLE IF NOT EXISTS public.pm_amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL UNIQUE,
    icon_slug TEXT
);

-- Community-Amenity Join
CREATE TABLE IF NOT EXISTS public.pm_community_amenities (
    community_id UUID REFERENCES public.pm_communities(id) ON DELETE CASCADE,
    amenity_id UUID REFERENCES public.pm_amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (community_id, amenity_id)
);

-- Community Gallery
CREATE TABLE IF NOT EXISTS public.pm_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    community_id UUID NOT NULL REFERENCES public.pm_communities(id) ON DELETE CASCADE,
    media_id UUID REFERENCES public.pm_media(id) ON DELETE CASCADE,
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0
);

-- Contact Form Leads
CREATE TABLE IF NOT EXISTS public.pm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    community_id UUID REFERENCES public.pm_communities(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT,
    source_url TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed'))
);


-- 2. SECURITY (RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE public.pm_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_community_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_leads ENABLE ROW LEVEL SECURITY;

-- 2.1 CLEANUP (Idempotency Guard)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow public read regions" ON public.pm_regions;
    DROP POLICY IF EXISTS "Allow public read communities" ON public.pm_communities;
    DROP POLICY IF EXISTS "Allow public read posts" ON public.pm_posts;
    DROP POLICY IF EXISTS "Allow public read pages" ON public.pm_pages;
    DROP POLICY IF EXISTS "Allow public read settings" ON public.pm_site_settings;
    DROP POLICY IF EXISTS "Allow public read media" ON public.pm_media;
    DROP POLICY IF EXISTS "Allow public read gallery" ON public.pm_gallery;
    DROP POLICY IF EXISTS "Allow public read amenities" ON public.pm_amenities;
    DROP POLICY IF EXISTS "Allow public read comm_amenities" ON public.pm_community_amenities;
    DROP POLICY IF EXISTS "Allow public insert leads" ON public.pm_leads;
    DROP POLICY IF EXISTS "Admins manage regions" ON public.pm_regions;
    DROP POLICY IF EXISTS "Admins manage communities" ON public.pm_communities;
    DROP POLICY IF EXISTS "Admins manage posts" ON public.pm_posts;
    DROP POLICY IF EXISTS "Admins manage pages" ON public.pm_pages;
    DROP POLICY IF EXISTS "Admins manage settings" ON public.pm_site_settings;
    DROP POLICY IF EXISTS "Admins manage media" ON public.pm_media;
    DROP POLICY IF EXISTS "Admins manage gallery" ON public.pm_gallery;
    DROP POLICY IF EXISTS "Admins manage amenities" ON public.pm_amenities;
    DROP POLICY IF EXISTS "Admins manage community_amenities" ON public.pm_community_amenities;
    DROP POLICY IF EXISTS "Admins manage leads" ON public.pm_leads;
    DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Public Read Pages" ON public.pm_pages;
END $$;

-- 2.2 SHARED ROLE HANDSHAKE
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- 2.3 PUBLIC READ ACCESS
CREATE POLICY "Allow public read regions" ON public.pm_regions FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Allow public read communities" ON public.pm_communities FOR SELECT TO public USING (status = 'published');
CREATE POLICY "Allow public read posts" ON public.pm_posts FOR SELECT TO public USING (status = 'published');
CREATE POLICY "Allow public read pages" ON public.pm_pages FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read settings" ON public.pm_site_settings FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read media" ON public.pm_media FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read gallery" ON public.pm_gallery FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read amenities" ON public.pm_amenities FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read comm_amenities" ON public.pm_community_amenities FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert leads" ON public.pm_leads FOR INSERT TO public WITH CHECK (true);

-- 2.4 UNIFIED ADMIN WRITE ACCESS
CREATE POLICY "Admins manage regions" ON public.pm_regions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins manage communities" ON public.pm_communities FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins manage posts" ON public.pm_posts FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins manage pages" ON public.pm_pages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins manage settings" ON public.pm_site_settings FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins manage media" ON public.pm_media FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins manage gallery" ON public.pm_gallery FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins manage amenities" ON public.pm_amenities FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins manage community_amenities" ON public.pm_community_amenities FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins manage leads" ON public.pm_leads FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));


-- 3. PERFORMANCE INDICES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_pm_communities_region_id ON public.pm_communities(region_id);
CREATE INDEX IF NOT EXISTS idx_pm_communities_featured_media ON public.pm_communities(featured_media_id);
CREATE INDEX IF NOT EXISTS idx_pm_communities_slug ON public.pm_communities(slug);
CREATE INDEX IF NOT EXISTS idx_pm_communities_status ON public.pm_communities(status);
CREATE INDEX IF NOT EXISTS idx_pm_gallery_community_id ON public.pm_gallery(community_id);
CREATE INDEX IF NOT EXISTS idx_pm_gallery_media_id ON public.pm_gallery(media_id);
CREATE INDEX IF NOT EXISTS idx_pm_posts_community_id ON public.pm_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_pm_posts_slug ON public.pm_posts(slug);
CREATE INDEX IF NOT EXISTS idx_pm_pages_slug ON public.pm_pages(slug);
CREATE INDEX IF NOT EXISTS idx_pm_leads_community_id ON public.pm_leads(community_id);
CREATE INDEX IF NOT EXISTS idx_pm_leads_email ON public.pm_leads(email);
-- Junction index for amenity reverse lookups
CREATE INDEX IF NOT EXISTS idx_pm_comm_amenities_amenity ON public.pm_community_amenities(amenity_id);


-- 4. AUTOMATION (Triggers)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_pm_media_updated ON public.pm_media;
CREATE TRIGGER on_pm_media_updated BEFORE UPDATE ON public.pm_media FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_pm_regions_updated ON public.pm_regions;
CREATE TRIGGER on_pm_regions_updated BEFORE UPDATE ON public.pm_regions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_pm_communities_updated ON public.pm_communities;
CREATE TRIGGER on_pm_communities_updated BEFORE UPDATE ON public.pm_communities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_pm_posts_updated ON public.pm_posts;
CREATE TRIGGER on_pm_posts_updated BEFORE UPDATE ON public.pm_posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_pm_pages_updated ON public.pm_pages;
CREATE TRIGGER on_pm_pages_updated BEFORE UPDATE ON public.pm_pages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_pm_site_settings_updated ON public.pm_site_settings;
CREATE TRIGGER on_pm_site_settings_updated BEFORE UPDATE ON public.pm_site_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_pm_amenities_updated ON public.pm_amenities;
CREATE TRIGGER on_pm_amenities_updated BEFORE UPDATE ON public.pm_amenities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_pm_gallery_updated ON public.pm_gallery;
CREATE TRIGGER on_pm_gallery_updated BEFORE UPDATE ON public.pm_gallery FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_pm_leads_updated ON public.pm_leads;
CREATE TRIGGER on_pm_leads_updated BEFORE UPDATE ON public.pm_leads FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- 5. INITIAL DATA
-- ---------------------------------------------------------------------------
INSERT INTO public.pm_site_settings (key, value, description) VALUES 
('site_name', 'TRG Living', 'Main title in the header'),
('brand_color', '#2563eb', 'The primary blue color used for buttons')
ON CONFLICT (key) DO NOTHING;