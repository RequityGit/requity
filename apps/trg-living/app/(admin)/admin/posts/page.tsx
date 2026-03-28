import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminPostsList() {
  const supabase = createClient();
  
  const { data: posts } = await supabase
    .from('pm_posts')
    .select(`
        id,
        title,
        status,
        created_at,
        slug,
        pm_properties ( name )
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tighter">Community Newsroom</h1>
          <p className="text-sm text-slate-500 font-medium">Manage updates, announcements, and blog content.</p>
        </div>
        <Link 
          href="/admin/posts/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
        >
          + Create Post
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Article Title</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Community</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {posts?.map((post: any) => (
              <tr key={post.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-6 py-5">
                  <span className="font-bold text-slate-900 block">{post.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">/{post.slug}</span>
                </td>
                <td className="px-6 py-5">
                  <span className="text-sm text-slate-600 font-medium">
                    {post.pm_properties?.name || 'Global'}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm text-slate-500">
                  {new Date(post.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-5 text-right flex items-center justify-end gap-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    post.status === 'published' 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'bg-amber-50 text-amber-600'
                  }`}>
                    {post.status}
                  </span>
                  
                  {/* NEW MANAGE BUTTON */}
                  <Link 
                    href={`/admin/posts/${post.id}`} 
                    className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-widest ml-4"
                  >
                    Manage
                  </Link>
              </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!posts || posts.length === 0) && (
          <div className="p-20 text-center text-slate-400 italic text-sm">
            No posts found. Use the &quot;Create Post&quot; button to start.
          </div>
        )}
      </div>
    </div>
  );
}