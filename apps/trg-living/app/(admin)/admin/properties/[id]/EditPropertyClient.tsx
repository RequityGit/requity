'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminPropertyForm from '@/components/AdminPropertyForm';

export default function EditPropertyClient({ property, regions, allAmenities, id }: any) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    const handleGallerySync = async (selectedIds: string[]) => {
        setLoading(true);
        try {
            await supabase.from('pm_gallery').delete().eq('property_id', id);
            const rows = selectedIds.map((mediaId, index) => ({ property_id: id, media_id: mediaId, sort_order: index }));
            if (rows.length > 0) await supabase.from('pm_gallery').insert(rows);
            router.refresh();
        } catch (err: any) { alert("Gallery Sync Failed"); } finally { setLoading(false); }
    };

    const handleAmenitySync = async (selectedIds: string[]) => {
        setLoading(true);
        try {
            await supabase.from('pm_property_amenities').delete().eq('property_id', id);
            const rows = selectedIds.map(aId => ({ property_id: id, amenity_id: aId }));
            if (rows.length > 0) await supabase.from('pm_property_amenities').insert(rows);
            router.refresh();
        } catch (err: any) { alert("Amenity Sync Failed"); } finally { setLoading(false); }
    };

    const handleUpdate = async (cleanData: any) => {
        setLoading(true);
        try {
            const { error } = await supabase.from('pm_properties').update(cleanData).eq('id', id);
            if (error) throw error;
            router.refresh();
            alert("Property updated.");
        } catch (err: any) { alert(err.message); } finally { setLoading(false); }
    }

    const handleDelete = async () => {
        if (!confirm(`Permanently delete ${property.name}?`)) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('pm_properties').delete().eq('id', id);
            if (error) throw error;
            router.push('/admin/properties');
            router.refresh();
        } catch (err: any) { alert(err.message); setLoading(false); }
    };

    return (
        <div className="space-y-12">
            <AdminPropertyForm initialData={property} regions={regions} allAmenities={allAmenities} onSubmit={handleUpdate} onGalleryChange={handleGallerySync} onAmenitiesChange={handleAmenitySync} loading={loading} isEdit={true} />
            <div className="pt-12 border-t border-red-100 flex justify-end">
                <button onClick={handleDelete} className="text-red-400 hover:text-red-600 text-[10px] font-black uppercase tracking-widest p-4">🗑️ Delete Property</button>
            </div>
        </div>
    );
}