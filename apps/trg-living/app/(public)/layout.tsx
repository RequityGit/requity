import Navigation from '@/components/Navigation';
import { createClient } from '@/lib/supabase/server';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  
  const { data: regions } = await supabase
    .from('pm_regions')
    .select(`
        name, 
        slug,
        pm_properties!inner(status, property_type)
    `)
    .eq('status', 'published')
    .eq('pm_properties.status', 'published')
    .order('sort_order');

  const mhcRegions = regions?.filter(r => 
    r.pm_properties.some((p: any) => p.property_type === 'mhc')
  ) || [];

  const cgRegions = regions?.filter(r => 
    r.pm_properties.some((p: any) => p.property_type === 'campground')
  ) || [];

  return (
    <>
      <Navigation mhcRegions={mhcRegions} cgRegions={cgRegions} />
      {children}
      <footer className="bg-slate-900 text-slate-400 p-8 text-center text-xs font-medium">
        © {new Date().getFullYear()} TRG Living. All rights reserved.
      </footer>
    </>
  );
}