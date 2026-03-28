'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminPropertyForm from '@/components/AdminPropertyForm';

export default function NewPropertyClient({
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
                .from('pm_properties')
                .insert([cleanData]);

            if (error) throw error;
            router.push('/admin/properties');
            router.refresh();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminPropertyForm
            regions={regions}
            allAmenities={allAmenities}
            onSubmit={handleCreate}
            loading={loading}
        />
    );
}