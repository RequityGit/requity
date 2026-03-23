import { createClient } from '@/lib/supabase/server';
import NewPostClient from './NewPostClient';
import { redirect } from 'next/navigation';

export default async function NewPostPage() {
    const supabase = createClient();
    const { data: communities } = await supabase.from('pm_communities').select('id, name').order('name');

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

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Create Update</h1>
            <NewPostClient communities={communities ?? []} />
        </div>
    );
}