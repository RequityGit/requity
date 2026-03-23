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
                name: formData.name,
                slug: formData.slug,
                region_id: formData.region_id,
                headline: formData.headline,
                description_html: formData.description_html,
                address_display: formData.address_display,
                city: formData.city,
                state_code: formData.state_code,
                zip_code: formData.zip_code,
                beds_range: formData.beds_range,
                baths_range: formData.baths_range,
                starting_price: formData.starting_price,
                appfolio_listing_url: formData.appfolio_listing_url,
                appfolio_portal_url: formData.appfolio_portal_url,
                featured_media_id: formData.featured_media_id || null // Sanitize UUID
            };
                        const { error } = await supabase
                .from('pm_communities')
                .insert([submissionData]);
            
            if (error) throw error;
            
            router.push('/admin/communities');
            router.refresh();
        } catch (error: any) {
            alert("Database Error: " + error.message);
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