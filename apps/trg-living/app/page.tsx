import { createClient } from '@/lib/supabase/server';
import CommunityCard from '@/components/CommunityCard';
export const revalidate = 3600;

export default async function Home() {
    const supabase = createClient();    
    // only fetch active regions, and we filter the JOINED communities
    const { data: regions, error } = await supabase
        .from('pm_regions')
        .select(`
            id,
            name,
            slug,
            pm_communities (
                id, name, slug, city, state_code, status,
                featured_media:pm_media!pm_communities_featured_media_id_fkey (file_path)
            )
        `)
        .eq('is_active', true)
        .eq('pm_communities.status', 'published')
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Homepage Error:', error);
        return <div className="p-20 text-center font-bold">Maintenance in progress. Please check back soon.</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* HERO SECTION */}
            <section className="relative bg-white border-b border-slate-100">                
                <div className="max-w-[1440px] mx-auto px-8 py-20 lg:py-32">
                    <div className="max-w-2xl space-y-8">
                        <h1 className="text-6xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9]">
                            Find a new place <br />
                            <span className="text-blue-600">to call home.</span>
                        </h1>
                        <p className="text-xl text-slate-500 font-medium max-w-md leading-relaxed">
                            Discover premium manufactured housing communities designed for modern living and lasting value.
                        </p>
                    </div>
                </div>
            </section>

            <main className="max-w-[1440px] mx-auto px-8 pt-24 pb-32 space-y-24">
                {regions?.map((region) => (
                    region.pm_communities && region.pm_communities.length > 0 && (
                        <section key={region.id} className="space-y-8">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-bold tracking-tight">{region.name}</h2>
                                <div className="h-px bg-slate-200 w-full"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {region.pm_communities.map((community: any) => (
                                    <CommunityCard key={community.id} community={community} />
                                ))}
                            </div>
                        </section>
                    )
                ))}
            </main>
        </div>
    );
}