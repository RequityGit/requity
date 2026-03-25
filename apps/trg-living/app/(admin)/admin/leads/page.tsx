import { createClient } from '@/lib/supabase/server';
import StatusToggle from './StatusToggle';
import { redirect } from 'next/navigation';
import sanitizeHtml from 'sanitize-html';

// Strip all HTML tags from user-submitted content before rendering in admin
function sanitizeLeadMessage(text: string) {
    return sanitizeHtml(text, {
        allowedTags: [],
        allowedAttributes: {},
    });
}

interface LeadWithCommunity {
    id: string;
    created_at: string;
    full_name: string;
    email: string;
    phone: string | null;
    message: string;
    status: string;
    pm_communities: { name: string } | { name: string }[] | null;
}

export default async function LeadsPage() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

    if (userRole?.role !== 'admin' && userRole?.role !== 'super_admin') {
        redirect('/');
    }

    const { data, error } = await supabase
        .from('pm_leads')
        .select(`
            id,
            created_at,
            full_name,
            email,
            phone,
            message,
            status,
            pm_communities ( name )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching leads:', error);
        return <div className="p-10 text-red-500 font-bold">Failed to load leads.</div>;
    }

    const leads = (data as LeadWithCommunity[]) ?? [];

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Leads</h1>
                    <p className="text-slate-500 font-medium">Prospective residents from the public website</p>
                </div>
                <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-100">
                    {leads.length} Total
                </div>
            </header>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Info</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Property</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Message Preview</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {leads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-slate-50/30 transition-colors group">
                                <td className="p-6 whitespace-nowrap">
                                    <p className="text-sm font-bold text-slate-900">
                                        {new Date(lead.created_at).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-[10px] font-medium text-slate-400">
                                        {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </td>
                                <td className="p-6">
                                    <p className="text-sm font-black text-slate-900">{lead.full_name}</p>
                                    <p className="text-xs font-medium text-blue-600">{lead.email}</p>
                                    {lead.phone && (
                                        <p className="text-[10px] font-mono text-slate-400 mt-1">{lead.phone}</p>
                                    )}
                                </td>
                                <td className="p-6">
                                    <span className="inline-block px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-tight">
                                        {(Array.isArray(lead.pm_communities)
                                            ? lead.pm_communities[0]?.name
                                            : lead.pm_communities?.name) || 'General Inquiry'}
                                    </span>
                                </td>
                                <td className="p-6 max-w-xs">
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                        {sanitizeLeadMessage(lead.message)}
                                    </p>
                                </td>
                                <td className="p-6 text-right">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                        lead.status === 'new'
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                            : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        {lead.status}
                                    </span>
                                </td>
                                <td className="p-6 text-right">
                                    <StatusToggle 
                                        leadId={lead.id} 
                                        currentStatus={lead.status} 
                                    />
                                </td>
                            </tr>
                        ))}

                        {leads.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-20 text-center">
                                    <p className="text-slate-400 font-bold italic">No inquiries received yet.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}