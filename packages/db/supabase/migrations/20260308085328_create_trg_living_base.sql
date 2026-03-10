CREATE TABLE IF NOT EXISTS public.pm_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    name TEXT NOT NULL UNIQUE, -- e.g., 'North Carolina'
    slug TEXT NOT NULL UNIQUE, -- e.g., 'north-carolina'
    
    -- Enterprise metadata for custom sorting in the menu
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.pm_communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Relationship to State/Region
    region_id UUID REFERENCES public.pm_regions(id) ON DELETE SET NULL,    
    -- Link to the Lending property (optional)
    core_property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    
    -- Identity
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- e.g. 'royal-valley'
    
    -- Marketing Content
    headline TEXT,
    description_html TEXT,
    featured_image_url TEXT,
    
    -- iFrame Integration (Appfolio)
    appfolio_listing_url TEXT, 
    appfolio_portal_url TEXT,  
    
    -- Physical Attributes
    address_display TEXT,
    city TEXT NOT NULL,
    state_code CHAR(2), -- e.g. 'NC' (redundant but helpful for search)
    zip_code TEXT,

    -- Future Proofing
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

-- Enable RLS
ALTER TABLE public.pm_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_posts ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Allow public read regions" ON public.pm_regions FOR SELECT USING (true);
CREATE POLICY "Allow public read communities" ON public.pm_communities FOR SELECT USING (true);
CREATE POLICY "Allow public read posts" ON public.pm_posts FOR SELECT USING (true);

-- Automated Timestamps
CREATE TRIGGER on_pm_communities_updated BEFORE UPDATE ON public.pm_communities
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_pm_posts_updated BEFORE UPDATE ON public.pm_posts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();