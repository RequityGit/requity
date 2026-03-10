import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function PostPage({ 
  params 
}: { 
  params: { slug: string; postSlug: string } 
}) {
  // 1. Fetch the post, but verify it belongs to the community in the URL
  const { data: post } = await supabase
    .from('pm_posts')
    .select('*, pm_communities!inner(name, slug)')
    .eq('slug', params.postSlug)
    .eq('pm_communities.slug', params.slug)
    .single();

  if (!post) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="p-6 bg-white border-b flex justify-between items-center">
        <Link 
          href={`/communities/${params.slug}`} 
          className="text-xs font-bold text-blue-600 uppercase tracking-widest hover:underline"
        >
          ← Back to {post.pm_communities.name}
        </Link>
      </nav>

      <article className="max-w-3xl mx-auto py-20 px-8">
        <header className="mb-12 text-center">
          <div className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-4">
            {post.pm_communities.name} Update • {new Date(post.created_at).toLocaleDateString()}
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-6 leading-tight">
            {post.title}
          </h1>
        </header>

        {post.featured_image_url && (
          <img 
            src={post.featured_image_url} 
            alt={post.title} 
            className="w-full aspect-video object-cover rounded-3xl shadow-2xl mb-12"
          />
        )}

        <div 
          className="prose prose-lg prose-slate max-w-none text-slate-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.body_html }} 
        />
      </article>
    </div>
  );
}