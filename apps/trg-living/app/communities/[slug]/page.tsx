import { createClient } from '@/lib/supabase/server'; 
import { notFound } from 'next/navigation';
import Link from 'next/link';
import CommunityGallery from '@/components/CommunityGallery';
import AppfolioWidget from '@/components/AppfolioWidget';

export const dynamic = 'force-dynamic';

export default async function CommunityPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: community } = await supabase
    .from('pm_communities')
    .select(`
      id, name, slug, headline, description_html, 
      appfolio_listing_url, address_display, city, state_code, zip_code,
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
      
      {/* 1. SUB-HEADER / BREADCRUMBS
          Standardized to 1440px alignment. Redundant nav and login button removed.
      */}
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto px-8 py-4">
          <Link 
            href="/" 
            className="text-[10px] font-black tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-colors uppercase"
          >
            ← Back to All Communities
          </Link>
        </div>
      </div>

      {/* 2. HERO SECTION
          Constrained inner content to 1440px for vertical symmetry.
      */}
      <section 
        className="bg-slate-900 text-white py-32 px-8 text-center bg-cover bg-center"
        style={{ 
            backgroundImage: heroUrl ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${heroUrl}')` : 'none' 
        }}
      >
        <div className="max-w-[1440px] mx-auto">
          <h1 className="text-6xl font-black tracking-tighter mb-4 leading-none uppercase">
            {community.name}
          </h1>
          <p className="text-xl text-slate-300 font-medium max-w-2xl mx-auto opacity-90">
            {community.headline || 'Welcome to our community'}
          </p>
        </div>
      </section>

      {/* 3. MAIN CONTENT
          Aligned to 1440px grid.
      */}
      <main className="max-w-[1440px] mx-auto px-8 py-20 grid grid-cols-1 lg:grid-cols-3 gap-16">
        
        {/* LEFT COLUMN: Content & Media */}
        <div className="lg:col-span-2 space-y-20">
          
          {/* About Section */}
          <article className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-lg">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-8">About Our Community</h2>
            <div dangerouslySetInnerHTML={{ __html: community.description_html || 'No description available yet.' }} />
          </article>     

          {/* Photo Gallery Grid */}
          <div className="pt-10 border-t border-slate-100">
            <CommunityGallery images={galleryImages} />
          </div>

          {/* AppFolio Listing Widget */}
          <div className="pt-10 border-t border-slate-100">
             <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-8 text-center">Available Listings</h2>
             <AppfolioWidget listingUrl={community.appfolio_listing_url} />
          </div>
          
        </div>

        {/* RIGHT COLUMN: Sidebar */}
        <div className="space-y-12">
          
          {/* Newsroom Sidebar */}
          <section className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 border-b border-slate-200 pb-4">Community News</h3>
            <div className="space-y-8">
              {publishedPosts.map((post: any) => (
                <Link href={`/communities/${community.slug}/posts/${post.slug}`} key={post.id} className="block group">
                  <h4 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors mb-1 leading-tight">
                    {post.title}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {new Date(post.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </Link>
              ))}
              {publishedPosts.length === 0 && (
                <p className="text-xs italic text-slate-400">No recent updates for this community.</p>
              )}
            </div>
          </section>

          {/* Location Sidebar */}
          <section className="p-10 border-l-2 border-slate-100">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Location & Details</h3>
             <div className="space-y-4">
                <div>
                  <p className="text-slate-900 font-bold text-lg leading-tight">{community.address_display || 'Address TBD'}</p>
                  <p className="text-slate-500 font-medium">
                    {community.city}, {community.state_code} {community.zip_code}
                  </p>
                </div>
                <div className="pt-4">
                  <button className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">
                    View on Google Maps →
                  </button>
                </div>
             </div>
          </section>

        </div>
      </main>
    </div>
  );
}