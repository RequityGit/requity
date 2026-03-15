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
      <header className="bg-white border-b border-slate-200 px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2 uppercase">
            TRG Living <span className="text-blue-600">Communities</span>
          </h1>
          <p className="text-slate-500 font-medium">Browse our manufactured housing communities by region.</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-16 space-y-20">
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
                        {community.city}, {community.state_code}
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