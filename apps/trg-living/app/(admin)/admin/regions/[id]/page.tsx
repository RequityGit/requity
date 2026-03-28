import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import EditRegionClient from './EditRegionClient';

export default async function ManageRegionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = createClient();

    // auth and role gate
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

    // fetch region data + join hero image
    const { data: region } = await supabase
        .from('pm_regions')
        .select(`
            id, name, slug, status, description_html, sort_order,
            featured_media_id,
            featured_media:pm_media (id, file_path)
        `)
        .eq('id', id)
        .single();

    if (!region) notFound();

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <header className="mb-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2">Regional taxonomy</p>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
                    Edit {region.name}
                </h1>
            </header>
            <EditRegionClient region={region} id={id} />
        </div>
    );
}