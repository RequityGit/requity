'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CommunityForm, { CommunityFormData } from '@/components/CommunityForm';

export default function NewCommunityClient({
    regions,
    allAmenities
}: {
    regions: any[],
    allAmenities: any[]
}) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    const handleCreate = async (cleanData: any) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('pm_communities')
                .insert([cleanData]);

            if (error) throw error;
            router.push('/admin/communities');
            router.refresh();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <CommunityForm
            regions={regions}
            allAmenities={allAmenities}
            onSubmit={handleCreate}
            loading={loading}
        />
    );
}