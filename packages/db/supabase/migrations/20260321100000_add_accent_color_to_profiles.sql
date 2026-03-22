-- Add accent_color to profiles for team color system
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accent_color text;

-- Seed known team members
UPDATE public.profiles SET accent_color = '#6366f1' WHERE full_name ILIKE '%dylan%marma%';
UPDATE public.profiles SET accent_color = '#10b981' WHERE full_name ILIKE '%grethel%';
UPDATE public.profiles SET accent_color = '#f59e0b' WHERE full_name ILIKE '%estefania%';
UPDATE public.profiles SET accent_color = '#3b82f6' WHERE full_name ILIKE '%luis%';
UPDATE public.profiles SET accent_color = '#8b5cf6' WHERE full_name ILIKE '%jet%';
UPDATE public.profiles SET accent_color = '#ef4444' WHERE full_name ILIKE '%mike%';