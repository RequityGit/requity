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
      id, 
      name, 
      slug, 
      headline, 
      description_html, 
      appfolio_listing_url, 
      address_display, 
      city, 
      state_code, 
      zip_code, 
      beds_range, 
      baths_range, 
      starting_price,
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

  if (!community) notFound();

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
    <div className="min-h-screen bg-white text-[#0f172a] font-sans leading-relaxed">
      
      {/* 1. SUB-HEADER (Anchor Nav) */}
      <div className="sticky top-20 z-[90] bg-[#f8fafc] border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-8 py-4 flex items-center gap-10 overflow-x-auto no-scrollbar">
          {['ABOUT THE COMMUNITY', 'AMENITIES', 'AVAILABLE LISTINGS', 'GALLERY'].map((item) => (
            <a 
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              className="text-xs font-black tracking-[1px] text-slate-400 hover:text-[#2563eb] transition-colors whitespace-nowrap"
            >
              {item}
            </a>
          ))}
        </div>
      </div>

      {/* 2. HERO SECTION (490px CONTENT BLOCK) */}
      <section 
        className="relative bg-slate-900 text-white py-32 lg:py-14 px-8 bg-cover bg-center"
        style={{ backgroundImage: heroUrl ? `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)), url('${heroUrl}')` : 'none' }}
      >
         <div className="max-w-[1380px] mx-auto">
          <div className="max-w-[490px] space-y-8">
            <div className="space-y-4">
               <h1 className="text-[3.75rem] font-black tracking-wide leading-[1] uppercase">
                 {community.name}
               </h1>
               <p className="text-xl text-blue-400 font-bold uppercase tracking-widest leading-none">
                 {community.headline || 'Welcome to our community'}
               </p>
            </div>
            
            <div className="flex flex-col gap-3 pt-8 font-bold uppercase tracking-widest text-sm">
               <div className="flex items-center gap-4">
                  <span className="text-slate-400 text-xs">Icon</span>
                  <span>{community.beds_range || '2 - 4 Beds'}</span>
               </div>
               <div className="flex items-center gap-4">
                  <span className="text-slate-400 text-xs">Icon</span>
                  <span>{community.baths_range || '1 - 2 Baths'}</span>
               </div>
               <div className="flex items-center gap-4">
                  <span className="text-slate-400 text-xs">Icon</span>
                  <span>{community.starting_price || 'Starting at $550'}
                  </span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN SECTION (1440px Grid) */}
      <main className="max-w-[1440px] mx-auto px-8 py-24 space-y-32">
        
        {/* 3.1 SPLIT LAYOUT: CONTENT vs SIDEBAR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-24">
          
          <div className="lg:col-span-2 space-y-32">
            <section id="about-the-community" className="scroll-mt-48">
              <h2 className="text-[2.18rem] font-bold text-[#333333] uppercase tracking-tight">About Our Community</h2>
              <div 
                className="prose prose-slate max-w-none text-[#0f172a] text-lg leading-[1.8]
                           prose-p:mb-6 prose-strong:text-[#333333]"
                dangerouslySetInnerHTML={{ __html: community.description_html || 'Information coming soon.' }} 
              />
            </section>

            <section id="amenities" className="scroll-mt-48 border-t pt-24 border-slate-100">
              <h2 className="text-[2.18rem] font-bold text-[#333333] mb-12 uppercase tracking-tight">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
                 {/* Structural Markup only - No placeholder icons */}
                 {['Playground', 'Bark Park', '24h Maintenance', 'Private Patios', 'Landscaping', 'Rental Office'].map(a => (
                    <div key={a} className="flex flex-col gap-2">
                       <div>Icon</div>
                       <p className="text-sm font-black uppercase tracking-widest text-[#333333]">{a}</p>
                    </div>
                 ))}
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-12">
            <section className="bg-[#f8fafc] p-12 rounded-[1rem] border border-slate-100 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10 border-b border-slate-200 pb-4">Community News</h3>
              <div className="space-y-10">
                {publishedPosts.map((post: any) => (
                  <Link href={`/communities/${community.slug}/posts/${post.slug}`} key={post.id} className="block group">
                    <h4 className="font-bold text-[25px] text-[#333333] group-hover:text-[#2563eb] transition-colors leading-tight mb-2">
                      {post.title}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(post.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="p-12 border-l-8 border-[#f8fafc]">
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Location & Details</h3>
               <div className="space-y-2">
                  <p className="text-[#333333] font-bold text-2xl tracking-tighter leading-tight">{community.address_display}</p>
                  <p className="text-slate-500 font-medium text-lg italic">
                    {community.city}, {community.state_code} {community.zip_code}
                  </p>
               </div>
            </section>
          </div>

        </div>

        {/* 3.2 AVAILABLE LISTINGS (Full Width) */}
        <section id="available-listings" className="scroll-mt-48 border-t pt-24 border-slate-100">
           <h2 className="text-[2.18rem] font-bold text-[#333333] mb-12 uppercase text-center">Available Listings</h2>
           <AppfolioWidget listingUrl={community.appfolio_listing_url} />
        </section>

        {/* 3.3 GALLERY (Full Width) */}
        <section id="gallery" className="scroll-mt-48 border-t pt-24 border-slate-100 pb-20">
           <h2 className="text-[2.18rem] font-bold text-[#333333] mb-12 uppercase text-center">Photo Gallery</h2>
           <CommunityGallery images={galleryImages} />
        </section>

      </main>
    </div>
  );
}