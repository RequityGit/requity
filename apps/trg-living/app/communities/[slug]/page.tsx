import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// This is the "Default Export" Next.js is looking for
export default async function CommunityPage({ params }: { params: { slug: string } }) {
  const { data: community } = await supabase
    .from('pm_communities')
    .select(`
      *,
      pm_posts (*)
    `)
    .eq('slug', params.slug)
    .single();

  if (!community) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="p-6 border-b flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <Link href="/" className="text-xs font-black tracking-tighter text-slate-900 uppercase">
          ← TRG Living
        </Link>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors">
          Resident Login
        </button>
      </nav>

      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-24 px-8 text-center">
        <h1 className="text-6xl font-black tracking-tighter mb-4">{community.name}</h1>
        <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">{community.headline || 'Welcome to our community'}</p>
      </section>

      <main className="max-w-7xl mx-auto px-8 py-20 grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Left Column: Appfolio iFrame */}
        
        <div className="lg:col-span-2 space-y-12">
          {/* Description Content */}
          <article className="prose prose-slate max-w-none text-slate-700">
            <h2 className="text-3xl font-bold text-slate-900">About Our Community</h2>
            <div dangerouslySetInnerHTML={{ __html: community.description_html || 'No description available yet.' }} />
          </article>
          <div className="aspect-[9/12] lg:aspect-video bg-slate-100 rounded-2xl overflow-hidden shadow-2xl border-8 border-slate-50">
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

        {/* Right Column: Sidebar */}
        <div className="space-y-12">
          <section className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Recent Updates</h3>
              <div className="space-y-6">
                {community.pm_posts?.map((post: any) => (
                  <Link 
                    href={`/communities/${community.slug}/posts/${post.slug}`} 
                    key={post.id} 
                    className="block group"
                  >
                    <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                      {post.title}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
                
                {(!community.pm_posts || community.pm_posts.length === 0) && (
                  <p className="text-xs italic text-slate-400">No recent updates.</p>
                )}
              </div>
          </section>

          <section className="p-8 border-l border-slate-100">
             <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Location</h3>
             <p className="text-slate-900 font-bold">{community.address_display || 'Address:'}</p>
             <p className="text-slate-500 text-sm">{community.city}, {community.state_code}</p>
          </section>
        </div>
      </main>
    </div>
  );
}