import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminCommunitiesList() {
  const supabase = createClient();
  
  const { data: communities } = await supabase
    .from('pm_communities')
    .select(`
      id,
      name,
      slug,
      city,
      state_code,
      pm_regions (name)
    `)
    .order('name');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight uppercase tracking-tighter">Communities</h1>
          <p className="text-sm text-slate-500 font-medium">Manage property listings and marketing configurations.</p>
        </div>
        <Link 
          href="/admin/communities/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
        >
          + Add Community
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Identity</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Taxonomy</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Location</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {communities?.map((community: any) => (
              <tr key={community.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-6 py-5">
                  <span className="font-bold text-slate-900 block">{community.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {community.id.slice(0,8)}...</span>
                </td>
                <td className="px-6 py-5">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-tight">
                    {community.pm_regions?.name || 'Unassigned'}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                  {community.city}, {community.state_code}
                </td>
                <td className="px-6 py-5 text-right">
                  <Link 
                    href={`/admin/communities/${community.id}`} 
                    className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-widest"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}