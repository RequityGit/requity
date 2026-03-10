CREATE TABLE IF NOT EXISTS public.pm_site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL, -- e.g. 'primary_color'
    value TEXT, -- e.g. '#0055ff'
    description TEXT
);

ALTER TABLE public.pm_site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read settings" ON public.pm_site_settings FOR SELECT USING (true);

-- Add some default settings
INSERT INTO public.pm_site_settings (key, value, description) VALUES 
('site_name', 'TRG Living', 'The main title in the header'),
('brand_color', '#2563eb', 'The primary blue color used for buttons');