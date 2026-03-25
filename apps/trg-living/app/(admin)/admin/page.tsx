import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboard() {
    // force RLS checks immediately
    const supabase = createClient();
    // fetch counts efficiently using "head: true" to avoid downloading actual data    
    const { count: communityCount } = await supabase.from('pm_communities').select('*', { count: 'exact', head: true });
    const { count: regionCount } = await supabase.from('pm_regions').select('*', { count: 'exact', head: true });
    const { count: leadCount } = await supabase.from('pm_leads').select('*', { count: 'exact', head: true });
    const { count: postCount } = await supabase.from('pm_posts').select('*', { count: 'exact', head: true });

    const stats = [
        { label: 'New Leads', value: leadCount || 0, highlight: true },   
        { label: 'Communities', value: communityCount || 0 },     
        { label: 'Regions', value: regionCount || 0 },
        { label: 'Blog Posts', value: postCount || 0 },
    ];

    return (
        <div className="space-y-10">
            <header>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Overview</h1>
                <p className="text-slate-500 font-medium">TRG Living Performance Dashboard</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className={`p-8 rounded-3xl border shadow-sm ${
                        stat.highlight ? 'bg-blue-600 border-blue-700' : 'bg-white border-slate-200'
                    }`}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                            stat.highlight ? 'text-blue-100' : 'text-blue-600'
                        }`}>{stat.label}</p>
                        <p className={`text-5xl font-black leading-none ${
                            stat.highlight ? 'text-white' : 'text-slate-900'
                        }`}>{stat.value}</p>
                    </div>    
                ))}
            </div>
            
            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 rounded-3xl border border-slate-200 bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 mb-2">Recent Activity</h3>
                    <p className="text-slate-500 text-sm">Welcome back. Your system is fully synchronized across {communityCount} communities.</p>
                </div>
                
                {/* LEAD NOTIFICATIONS */}
                <div className="p-8 rounded-3xl border border-blue-100 bg-blue-50/30 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-blue-900">Lead Inquiries</h3>
                        <p className="text-blue-700 text-sm">{leadCount || 0} Unread</p>
                    </div>
                    <a href="/admin/leads" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase">Review</a>
                </div>
            </div>
        </div>
    );
}