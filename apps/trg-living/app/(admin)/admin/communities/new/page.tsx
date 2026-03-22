import { createClient } from '@/lib/supabase/server';
import NewCommunityClient from './NewCommunityClient';
import { redirect } from 'next/navigation';

export default async function NewCommunityPage() {
    const supabase = createClient();
    
    // check auth before fetching data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // fetch data for the form
    const { data: regions } = await supabase
        .from('pm_regions')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

    const { data: allAmenities } = await supabase
        .from('pm_amenities')
        .select('id, name, icon_slug')
        .order('name');

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">New Community</h1>
            
            {/* pass data to client logic */}
            <NewCommunityClient 
                regions={regions ?? []} 
                allAmenities={allAmenities ?? []} 
            />
        </div>
    );
}