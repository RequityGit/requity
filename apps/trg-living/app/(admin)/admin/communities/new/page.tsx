import { createClient } from '@/lib/supabase/server';
import CommunityForm from '@/components/CommunityForm';

export default async function NewPage() {
    const supabase = createClient();
    const { data: regions } = await supabase.from('pm_regions').select('id, name').order('name');

    const handleCreate = async (formData: any) => {
        'use server';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <h1 className="text-4xl font-black">New Community</h1>
            <CommunityForm regions={regions ?? []} onSubmit={handleCreate} loading={false} />
        </div>
    );
}