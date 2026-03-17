import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = createClient();

  const { data: regions, error } = await supabase
    .from('pm_regions')
    .select(`
      id, 
      name, 
      slug,
      pm_communities (
        id, name, slug, city, state_code,
        pm_media!pm_communities_featured_media_id_fkey (file_path)
      )
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) console.error('Error fetching regions:', error);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 1. THE HERO SECTION (Replacing the old Sub-header) */}
      <section className="relative bg-white overflow-hidden border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto px-8 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-12">
          
          {/* Text Side (Left) */}
          <div className="lg:w-1/2 space-y-8 z-10">
            <h1 className="text-6xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9]">
              Find a new place <br />
              <span className="text-blue-600">to call home.</span>
            </h1>
            
            <p className="text-xl text-slate-500 font-medium max-w-md leading-relaxed">
              Discover premium manufactured housing communities designed for modern living and lasting value.
            </p>

            {/* SEARCH BAR SHELL (Camden Style) */}
            <div className="relative max-w-md group">
              <div className="absolute inset-0 bg-blue-600/10 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex bg-white border-2 border-slate-200 rounded-2xl p-2 shadow-sm focus-within:border-blue-600 transition-all">
                <input 
                  type="text" 
                  placeholder="City, state, or community name..."
                  className="flex-1 bg-transparent px-4 py-3 outline-none text-slate-900 font-medium placeholder:text-slate-400"
                />
                <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-colors">
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Image Side (Right) */}
          <div className="lg:w-1/2 relative aspect-[4/3] w-full">
            <div className="absolute inset-0 bg-blue-100 rounded-[3rem] rotate-3 scale-95 translate-x-4 translate-y-4 opacity-50"></div>
            <div className="relative h-full w-full rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
              <img 
                src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80" 
                alt="Modern Community Living" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

        </div>
      </section>

      <main className="max-w-[1440px] mx-auto px-8 pt-24 pb-32 space-y-24">
        {regions?.map((region) => (
          <section key={region.id} className="space-y-8">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold tracking-tight whitespace-nowrap">{region.name}</h2>
              <div className="h-px bg-slate-200 w-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {region.pm_communities.map((community: any) => {
                // Construct the URL from the joined media object
                const mediaPath = community.pm_media?.file_path;
                const imageUrl = mediaPath 
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trg-living-media/${mediaPath}`
                  : null;

                return (
                  <Link 
                    href={`/communities/${community.slug}`} 
                    key={community.id}
                    className="group block bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all overflow-hidden"
                  >
                    <div
                      className="aspect-video bg-slate-100 relative bg-cover bg-center"
                      style={{
                        backgroundImage: imageUrl ? `url('${imageUrl}')` : 'none'
                      }}
                    >
                      {!imageUrl && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                          {community.name}
                        </div>
                      )}
                    </div>                  
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {community.name}
                      </h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">
                        {community.city}{community.state_code ? `, ${community.state_code}` : ''}
                      </p>
                      <div className="mt-6 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-blue-600">
                        View Community Details 
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      <footer className="bg-slate-900 text-slate-400 p-8 text-center text-[10px] font-mono tracking-widest uppercase">
          System Connected: PM Enterprise CMS (Region-Based Hierarchy)
      </footer>
    </div>
  );
}