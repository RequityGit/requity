-- 1. Update Properties policy to allow Guests (anon)
DROP POLICY "Allow authenticated users to view properties" ON public.pm_properties;
CREATE POLICY "Allow anon and authenticated view properties" 
ON public.pm_properties FOR SELECT 
TO anon, authenticated 
USING (true);

-- 2. Update Units policy to allow Guests (anon)
DROP POLICY "Allow authenticated users to view units" ON public.pm_units;
CREATE POLICY "Allow anon and authenticated view units" 
ON public.pm_units FOR SELECT 
TO anon, authenticated 
USING (true);