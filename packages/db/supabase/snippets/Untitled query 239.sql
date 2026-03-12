-- ===========================================================================
-- TRG LIVING MARKETING CMS ARCHITECTURE
-- ===========================================================================

-- 1. TABLES (Using IF NOT EXISTS for safety)
-- ---------------------------------------------------------------------------

-- Region Taxonomy (States)
CREATE TABLE IF NOT EXISTS public.pm_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Main Community Entity
CREATE TABLE IF NOT EXISTS public.pm_communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    region_id UUID REFERENCES public.pm_regions(id) ON DELETE SET NULL,    
    core_property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    headline TEXT,
    description_html TEXT,
    featured_image_url TEXT,
    appfolio_listing_url TEXT, 
    appfolio_portal_url TEXT,  
    address_display TEXT,
    city TEXT NOT NULL,
    state_code CHAR(2),
    zip_code TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Blog Posts / Community Updates
CREATE TABLE IF NOT EXISTS public.pm_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    community_id UUID REFERENCES public.pm_communities(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    body_html TEXT NOT NULL,
    excerpt TEXT,
    featured_image_url TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ
);

-- Site Settings (MCP Layout Control)
CREATE TABLE IF NOT EXISTS public.pm_site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    key TEXT UNIQUE NOT NULL, 
    value TEXT, 
    description TEXT
);

-- Amenity Library (Global Icons)
CREATE TABLE IF NOT EXISTS public.pm_amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL UNIQUE,
    icon_slug TEXT
);

-- Community <-> Amenity Relationship (Join Table)
CREATE TABLE IF NOT EXISTS public.pm_community_amenities (
    community_id UUID REFERENCES public.pm_communities(id) ON DELETE CASCADE,
    amenity_id UUID REFERENCES public.pm_amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (community_id, amenity_id)
);

-- Photo Gallery
CREATE TABLE IF NOT EXISTS public.pm_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    community_id UUID NOT NULL REFERENCES public.pm_communities(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL, 
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0
);


-- 2. ENABLE SECURITY (RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE public.pm_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_community_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_gallery ENABLE ROW LEVEL SECURITY;


-- 3. DEFENSIVE POLICIES (Drop then Create)
-- ---------------------------------------------------------------------------

-- Regions
DROP POLICY IF EXISTS "Allow public read regions" ON public.pm_regions;
CREATE POLICY "Allow public read regions" ON public.pm_regions FOR SELECT USING (true);

-- Communities
DROP POLICY IF EXISTS "Allow public read communities" ON public.pm_communities;
CREATE POLICY "Allow public read communities" ON public.pm_communities FOR SELECT USING (true);

-- Posts
DROP POLICY IF EXISTS "Allow public read posts" ON public.pm_posts;
CREATE POLICY "Allow public read posts" ON public.pm_posts FOR SELECT USING (true);

-- Site Settings
DROP POLICY IF EXISTS "Allow public read settings" ON public.pm_site_settings;
CREATE POLICY "Allow public read settings" ON public.pm_site_settings FOR SELECT USING (true);

-- Amenities
DROP POLICY IF EXISTS "Allow public read amenities" ON public.pm_amenities;
CREATE POLICY "Allow public read amenities" ON public.pm_amenities FOR SELECT USING (true);

-- Community-Amenity Links
DROP POLICY IF EXISTS "Allow public read comm_amenities" ON public.pm_community_amenities;
CREATE POLICY "Allow public read comm_amenities" ON public.pm_community_amenities FOR SELECT USING (true);

-- Gallery
DROP POLICY IF EXISTS "Allow public read gallery" ON public.pm_gallery;
CREATE POLICY "Allow public read gallery" ON public.pm_gallery FOR SELECT USING (true);


-- 4. DEFENSIVE TRIGGERS (Automated Timestamps)
-- ---------------------------------------------------------------------------

-- Community Updated_at
DROP TRIGGER IF EXISTS on_pm_communities_updated ON public.pm_communities;
CREATE TRIGGER on_pm_communities_updated BEFORE UPDATE ON public.pm_communities
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Post Updated_at
DROP TRIGGER IF EXISTS on_pm_posts_updated ON public.pm_posts;
CREATE TRIGGER on_pm_posts_updated BEFORE UPDATE ON public.pm_posts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Settings Updated_at
DROP TRIGGER IF EXISTS on_pm_site_settings_updated ON public.pm_site_settings;
CREATE TRIGGER on_pm_site_settings_updated BEFORE UPDATE ON public.pm_site_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Gallery Updated_at
DROP TRIGGER IF EXISTS on_pm_gallery_updated ON public.pm_gallery;
CREATE TRIGGER on_pm_gallery_updated BEFORE UPDATE ON public.pm_gallery
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- 5. INITIAL DATA SEEDING
-- ---------------------------------------------------------------------------
INSERT INTO public.pm_site_settings (key, value, description) VALUES 
('site_name', 'TRG Living', 'The main title in the header'),
('brand_color', '#2563eb', 'The primary blue color used for buttons')
ON CONFLICT (key) DO NOTHING;