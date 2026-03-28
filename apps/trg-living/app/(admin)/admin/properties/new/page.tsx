import { createClient } from '@/lib/supabase/server';
import NewPropertyClient from './NewPropertyClient';
import { redirect } from 'next/navigation';

export default async function NewPropertyPage() {
    const supabase = createClient();
    
    // check auth before fetching data
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

    // fetch data for the form
    const { data: regions } = await supabase
        .from('pm_regions')
        .select('id, name')
        .eq('status', 'published')
        .order('name');

    const { data: allAmenities } = await supabase
        .from('pm_amenities')
        .select('id, name, icon_slug')
        .order('name');

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
           <header>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">New Property Listing</h1>
            </header>
            {/* pass data to client logic */}
            <NewPropertyClient 
                regions={regions ?? []} 
                allAmenities={allAmenities ?? []} 
            />
        </div>
    );
}