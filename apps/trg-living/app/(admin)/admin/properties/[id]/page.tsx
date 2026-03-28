import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import EditPropertyClient from './EditPropertyClient';

export default async function ManagePropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = createClient();

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

    const { data: regions } = await supabase.from('pm_regions').select('id, name').order('name');
    const { data: allAmenities } = await supabase.from('pm_amenities').select('id, name, icon_slug').order('name');
    const { data: property } = await supabase
        .from('pm_properties')
        .select(`
            id, name, slug, region_id, headline, description_html,
            address_display, city, state_code, zip_code,
            beds_range, baths_range, starting_price, status,
            featured_media_id, property_type,
            pm_property_amenities (amenity_id),            
            contact_email, contact_phone,
            pm_gallery (
                id,
                media_id,
                sort_order,
                media:pm_media (file_path)
            ),
            featured_media:pm_media!pm_properties_featured_media_id_fkey (id, file_path)
        `)
        .eq('id', id)
        .single();

    if (!property) notFound();

    const formattedProperty = {
        ...property,
        amenity_ids: property.pm_property_amenities?.map((a: any) => a.amenity_id) || []
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            <EditPropertyClient
                property={formattedProperty}
                regions={regions ?? []}
                allAmenities={allAmenities ?? []}
                id={id}
            />
        </div>
    );
}