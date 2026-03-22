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

    const handleCreate = async (formData: CommunityFormData) => {
        setLoading(true);
        try {
            // payload sanitization
            const submissionData = {
                ...formData,
                featured_media_id: formData.featured_media_id || null
            };
            const { error } = await supabase
                .from('pm_communities')
                .insert([submissionData]);
            
            if (error) throw error;

            alert("Community published.");
            router.push('/admin/communities');
            router.refresh();
        } catch (error: any) {
            alert(error.message);
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