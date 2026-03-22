import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EditCommunityClient from './EditCommunityClient';

export default async function ManageCommunityPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params; // Await the promise
    const supabase = createClient();
    
    const { data: regions } = await supabase.from('pm_regions').select('id, name').order('name');
    const { data: allAmenities } = await supabase.from('pm_amenities').select('id, name, icon_slug').order('name');
    const { data: community } = await supabase
        .from('pm_communities')
        .select(`
            id, name, slug, region_id, headline, description_html, 
            address_display, city, state_code, zip_code,
            beds_range, baths_range, starting_price, featured_media_id,
            pm_community_amenities (amenity_id),
            pm_gallery (
                id,
                media_id,
                sort_order,
                media:pm_media (file_path)
            ),
            featured_media:pm_media!pm_communities_featured_media_id_fkey (id, file_path)
        `)
        .eq('id', id)
        .single();

    if (!community) notFound();

    const formattedCommunity = {
        ...community,
        amenity_ids: community.pm_community_amenities?.map((a: any) => a.amenity_id) || []
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            <EditCommunityClient
                community={formattedCommunity}
                regions={regions ?? []}
                allAmenities={allAmenities ?? []}
                id={id}
                />
        </div>
    );
}