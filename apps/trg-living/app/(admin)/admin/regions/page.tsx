import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminRegionsList() {
    const supabase = createClient();

    // Fetch regions sorted by custom sort order
    const { data: regions } = await supabase
    .from('pm_regions')
    .select('id, name, slug, sort_order, is_active')
    .order('sort_order', { ascending: true });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-tight uppercase tracking-tighter">Regions</h1>
                    <p className="text-sm text-slate-500 font-medium">Manage the regional taxonomy for all communities.</p>
                </div>
                <Link
                href="/admin/regions/new"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
                >
                    + Add Region
                </Link>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200">
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Region Name</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">URL Slug</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Order</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {regions?.map((region) => (
                            <tr key={region.id} className="hover:bg-slate-50/30 transition-colors group">
                                <td className="px-6 py-5">
                                    <span className="font-bold text-slate-900">{region.name}</span>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-xs font-mono text-slate-400">/{region.slug}</span>
                                </td>
                                <td className="px-6 py-5 text-sm text-slate-500">
                                    {region.sort_order}
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    region.is_active
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        {region.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {(!regions || regions.length === 0) && (
                    <div className="p-20 text-center">
                        <p className="text-slate-400 italic text-sm">No regions defined. Create one to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}