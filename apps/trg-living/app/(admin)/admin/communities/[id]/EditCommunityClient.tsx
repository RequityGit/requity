'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CommunityForm, { CommunityFormData } from '@/components/CommunityForm';

interface EditProps {
    community: any;
    regions: any[];
    allAmenities: any[];
    id: string;
}

export default function EditCommunityClient({ community, regions, allAmenities, id }: EditProps) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    // Gallery Sync
    const handleGallerySync = async (selectedIds: string[]) => {
        setLoading(true);
        try {
            await supabase.from('pm_gallery').delete().eq('community_id', id);
            const rows = selectedIds.map((mediaId, index) => ({
                community_id: id,
                media_id: mediaId,
                sort_order: index
            }));
            if (rows.length > 0) {
                const { error } = await supabase.from('pm_gallery').insert(rows);
                if (error) throw error;
            }
            router.refresh();
        } catch (err: any) {
            alert("Gallery Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Amenity Sync
    const handleAmenitySync = async (selectedIds: string[]) => {
        setLoading(true);
            try {
                await supabase.from('pm_community_amenities').delete().eq('community_id', id);
                const rows = selectedIds.map(aId => ({ community_id: id, amenity_id: aId }));
                if (rows.length > 0) {
                    const { error } = await supabase.from('pm_community_amenities').insert(rows);
                    if (error) throw error;
                }
                router.refresh();
            } catch (err: any) {
                alert("Amenity Error: " + err.message);
            } finally {
                setLoading(false);
            }
    };

    // Core Info Update
    const handleUpdate = async (formData: CommunityFormData) => {
        setLoading(true);
        try {
            const updatePayload = {
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
                featured_media_id: formData.featured_media_id || null
            };

            const { error } = await supabase
                .from('pm_communities')
                .update(updatePayload)
                .eq('id', id);
            
            if (error) throw error;
            
            router.refresh();
            alert("Update successful.");
        } catch (error: any) {
            alert("Update Failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <CommunityForm
            initialData={community}
            regions={regions}
            allAmenities={allAmenities}
            onSubmit={handleUpdate}
            onGalleryChange={handleGallerySync}
            onAmenitiesChange={handleAmenitySync}
            loading={loading}
            isEdit={true}
        />
    );
}