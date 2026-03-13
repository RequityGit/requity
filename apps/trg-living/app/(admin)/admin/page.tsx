import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function AdminDashboard() {
    // Fetch coutns from pm_ tables
    const { count: regionCount } = await supabase.from('pm_regions').select('*', { count: 'exact', head: true });
    const { count: communityCount } = await supabase.from('pm_communities').select('*', { count: 'exact', head: true });
    const { count: postCount } = await supabase.from('pm_posts').select('*', { count: 'exact', head: true });

    const stats = [
        { label: 'Regions', value: regionCount || 0 },
        { label: 'Communities', value: communityCount || 0 },
        { label: 'Blog Posts', value: postCount || 0 },
    ];

    return (
        <div className="space-y-10">
            <header>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Overview</h1>
                <p className="text-slate-500 font-medium">Content performance across the TRG Living </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-5xl font-black text-slate-900 leading-none">{stat.value}</p>
                    </div>    
                ))}
            </div>

            <div className="p-8 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center py-20">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 font-bold text-xl">
                +
            </div>
            <h3 className="font-bold text-slate-900">No recent activity logged</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">
                Start by adding a new region or community to populate the dashboard.
            </p>
            </div>
        </div>
    );
}