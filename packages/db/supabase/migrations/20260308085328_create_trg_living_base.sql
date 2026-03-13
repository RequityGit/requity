-- ===========================================================================
-- TRG LIVING MARKETING CMS - PRODUCTION HARDENING (DEFENSIVE VERSION)
-- ===========================================================================

-- 1. TABLES & BUCKETS (Additive)
-- ---------------------------------------------------------------------------
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

CREATE TABLE IF NOT EXISTS public.pm_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    community_id UUID NOT NULL REFERENCES public.pm_communities(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL, 
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0
);

-- STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('trg-living-media', 'trg-living-media', true, 5242880, '{image/jpeg,image/png,image/webp,image/svg+xml}')
ON CONFLICT (id) DO NOTHING;

-- 2. HARDENED SECURITY (DROP THEN CREATE)
-- ---------------------------------------------------------------------------

-- 2.1 USER ROLES HANDSHAKE
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- 2.2 PUBLIC READ ACCESS
DROP POLICY IF EXISTS "Allow public read regions" ON public.pm_regions;
CREATE POLICY "Allow public read regions" ON public.pm_regions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read communities" ON public.pm_communities;
CREATE POLICY "Allow public read communities" ON public.pm_communities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read posts" ON public.pm_posts;
CREATE POLICY "Allow public read posts" ON public.pm_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read settings" ON public.pm_site_settings;
CREATE POLICY "Allow public read settings" ON public.pm_site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read amenities" ON public.pm_amenities;
CREATE POLICY "Allow public read amenities" ON public.pm_amenities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read comm_amenities" ON public.pm_community_amenities;
CREATE POLICY "Allow public read comm_amenities" ON public.pm_community_amenities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read gallery" ON public.pm_gallery;
CREATE POLICY "Allow public read gallery" ON public.pm_gallery FOR SELECT USING (true);

DROP POLICY IF EXISTS "trg_media_public_view" ON storage.objects;
CREATE POLICY "trg_media_public_view" ON storage.objects FOR SELECT TO public USING (bucket_id = 'trg-living-media');

-- 2.3 ADMIN WRITE ACCESS
DROP POLICY IF EXISTS "Admins can manage communities" ON public.pm_communities;
CREATE POLICY "Admins can manage communities" ON public.pm_communities FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "Admins can manage regions" ON public.pm_regions;
CREATE POLICY "Admins can manage regions" ON public.pm_regions FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "Admins can manage posts" ON public.pm_posts;
CREATE POLICY "Admins can manage posts" ON public.pm_posts FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "Admins can manage settings" ON public.pm_site_settings;
CREATE POLICY "Admins can manage settings" ON public.pm_site_settings FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "trg_media_admin_manage" ON storage.objects;
CREATE POLICY "trg_media_admin_manage" ON storage.objects FOR ALL TO authenticated 
USING (bucket_id = 'trg-living-media' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')));


-- 3. AUTOMATION (Triggers - DROP THEN CREATE)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_pm_communities_updated ON public.pm_communities;
CREATE TRIGGER on_pm_communities_updated BEFORE UPDATE ON public.pm_communities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_pm_posts_updated ON public.pm_posts;
CREATE TRIGGER on_pm_posts_updated BEFORE UPDATE ON public.pm_posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_pm_site_settings_updated ON public.pm_site_settings;
CREATE TRIGGER on_pm_site_settings_updated BEFORE UPDATE ON public.pm_site_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_pm_gallery_updated ON public.pm_gallery;
CREATE TRIGGER on_pm_gallery_updated BEFORE UPDATE ON public.pm_gallery FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- 4. INITIAL DATA
-- ---------------------------------------------------------------------------
INSERT INTO public.pm_site_settings (key, value, description) VALUES 
('site_name', 'TRG Living', 'Main title'),
('brand_color', '#2563eb', 'Primary blue')
ON CONFLICT (key) DO NOTHING;