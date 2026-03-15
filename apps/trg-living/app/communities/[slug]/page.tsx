import { createClient } from '@/lib/supabase/server'; 
import { notFound } from 'next/navigation';
import Link from 'next/link';
import CommunityGallery from '@/components/CommunityGallery';

export const dynamic = 'force-dynamic';

export default async function CommunityPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: community } = await supabase
    .from('pm_communities')
    .select(`
      id, name, slug, headline, description_html, 
      appfolio_listing_url, address_display, city, state_code,
      hero:pm_media!pm_communities_featured_media_id_fkey (id, file_path),
      pm_posts (id, title, slug, created_at, status),
      pm_gallery (
        id, 
        sort_order,
        media:pm_media (file_path, alt_text)
      )
    `)
    .eq('slug', params.slug)
    .single();

  if (!community) {
    notFound();
  }

  // Filter only published posts for the public sidebar
  const publishedPosts = community.pm_posts?.filter((p: any) => p.status === 'published') || [];

  const heroUrl = community.hero 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trg-living-media/${(community.hero as any).file_path}` 
    : null;

  const galleryImages = community.pm_gallery?.map((item: any) => ({
    id: item.id,
    image_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trg-living-media/${item.media?.file_path}`,
    alt_text: item.media?.alt_text
  })) || [];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <nav className="p-6 border-b flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <Link href="/" className="text-xs font-black tracking-tighter uppercase">
          ← TRG Living
        </Link>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors">
          Resident Login
        </button>
      </nav>

      <section 
        className="bg-slate-900 text-white py-32 px-8 text-center bg-cover bg-center"
        style={{ 
            backgroundImage: heroUrl ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${heroUrl}')` : 'none' 
        }}
      >
        <h1 className="text-6xl font-black tracking-tighter mb-4">{community.name}</h1>
        <p className="text-xl text-slate-300 font-medium max-w-2xl mx-auto">{community.headline || 'Welcome to our community'}</p>
      </section>

      <main className="max-w-7xl mx-auto px-8 py-20 grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-12">
          <article className="prose prose-slate max-w-none text-slate-700">
            <h2 className="text-3xl font-bold text-slate-900">About Our Community</h2>
            <div dangerouslySetInnerHTML={{ __html: community.description_html || 'No description available yet.' }} />
          </article>     

          <CommunityGallery images={galleryImages} />

          <div className="aspect-[9/12] lg:aspect-video bg-slate-100 rounded-3xl overflow-hidden shadow-2xl border-8 border-slate-50">
            {community.appfolio_listing_url ? (
              <iframe 
                src={community.appfolio_listing_url} 
                className="w-full h-full border-0"
                title="Availability"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                Listing URL not yet configured.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-12">
          <section className="bg-slate-50 p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Recent Updates</h3>
            <div className="space-y-6">
              {/* Using the filtered publishedPosts array */}
              {publishedPosts.map((post: any) => (
                <Link href={`/communities/${community.slug}/posts/${post.slug}`} key={post.id} className="block group">
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">{post.title}</h4>
                  <p className="text-xs text-slate-500">{new Date(post.created_at).toLocaleDateString()}</p>
                </Link>
              ))}
              {publishedPosts.length === 0 && <p className="text-xs italic text-slate-400">No updates found.</p>}
            </div>
          </section>

          <section className="p-8 border-l-2 border-slate-100">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Community Location</h3>
             <p className="text-slate-900 font-bold">{community.address_display || 'Address TBD'}</p>
             <p className="text-slate-500 text-sm">{community.city}, {community.state_code}</p>
          </section>
        </div>
      </main>
    </div>
  );
}