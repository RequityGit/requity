'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CommunityForm, { CommunityFormData } from '@/components/CommunityForm';

export default function EditCommunityClient({ community, regions, id }: { community: any, regions: any[], id: string }) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (formData: CommunityFormData) => {
        setLoading(true);
        try {
            // remove 'featured_media' and 'pm_gallery' join objects before update
            const { featured_media, pm_gallery, ...updatePayload } = formData as any;

            const { error } = await supabase
                .from('pm_communities')
                .update({
                    ...updatePayload,
                    featured_media_id: updatePayload.featured_media_id || null
                })
                .eq('id', id);
            
            if (error) throw error;
            router.refresh();
            alert("Synced.");
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };
    return <CommunityForm
            initialData={community}
            regions={regions}
            onSubmit={handleUpdate}
            loading={loading}
            isEdit={true}
    />;
}