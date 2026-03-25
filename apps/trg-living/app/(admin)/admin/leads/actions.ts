'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateLeadStatus(id: string, newStatus: string) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

    if (roleData?.role !== 'admin' && roleData?.role !== 'super_admin') {
        throw new Error('Forbidden');
    }
    const validStatuses = ['new', 'contacted', 'closed'];
    if (!validStatuses.includes(newStatus)) throw new Error('Invalid Status');

    const { error } = await supabase
        .from('pm_leads')
        .update({ status: newStatus })
        .eq('id', id);
    
    if (error) throw error;
    revalidatePath('/admin/leads');
    revalidatePath('/admin');

    return { success: true };
}