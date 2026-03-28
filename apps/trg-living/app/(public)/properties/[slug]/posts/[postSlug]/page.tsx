import { createClient } from '@/lib/supabase/server'; 
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function PostPage({ 
  params 
}: { 
  params: { slug: string; postSlug: string } 
}) {
  const supabase = createClient();

  const { data: post } = await supabase
    .from('pm_posts')
    .select(`
      id,
      title,
      slug,
      body_html,
      excerpt,
      created_at,
      status,
      pm_properties!inner(
        name, 
        slug
      ),
      featured_media:pm_media!pm_posts_featured_media_id_fkey (
        file_path,
        alt_text
      )
    `)
    .eq('slug', params.postSlug)
    .eq('pm_properties.slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!post) notFound();

  const property = post.pm_properties as unknown as { name: string; slug: string };
  const media = post.featured_media as unknown as { file_path: string; alt_text: string } | null;

  const imageUrl = media 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trg-living-media/${media.file_path}` 
    : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="p-6 bg-white border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
        <Link 
          href={`/properties/${params.slug}`} 
          className="text-xs font-bold text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors flex items-center gap-2"
        >
          <span className="text-lg">←</span> Back to {property.name}
        </Link>
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">
          Property Newsroom
        </div>
      </nav>

      <article className="max-w-3xl mx-auto py-16 px-8">
        <header className="mb-12 text-center">
          <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 border border-blue-100">
            {property.name} Update • {new Date(post.created_at).toLocaleDateString()}
          </div>
          
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-6 leading-[1.1]">
            {post.title}
          </h1>
          
          {post.excerpt && (
            <p className="text-xl text-slate-500 font-medium italic leading-relaxed">
              &quot;{post.excerpt}&quot;
            </p>
          )}
        </header>

        {imageUrl && (
          <div className="relative aspect-video mb-16 shadow-2xl rounded-[2rem] overflow-hidden border-8 border-white">
            <Image 
              src={imageUrl} 
              alt={post.title} 
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1200px) 100vw, 800px"
          />
          </div>
        )}

        <div 
          className="prose prose-lg prose-slate max-w-none 
                     prose-headings:text-slate-900 prose-headings:font-black prose-headings:tracking-tight
                     prose-p:text-slate-600 prose-p:leading-relaxed
                     prose-strong:text-slate-900"
          dangerouslySetInnerHTML={{ __html: post.body_html }} 
        />
        
        <footer className="mt-20 pt-10 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                End of Update
            </p>
        </footer>
      </article>
    </div>
  );
}