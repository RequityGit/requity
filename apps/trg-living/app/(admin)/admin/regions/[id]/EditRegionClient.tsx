'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import RegionForm from '@/components/RegionForm';

export default function EditRegionClient({ region, id }: { region: any, id: string }) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (cleanData: any) => {
        setLoading(true);
        try {
            const { error: updateError } = await supabase
            .from('pm_regions')
            .update(cleanData)
            .eq('id', id);

        if (updateError) throw updateError;

        router.refresh();
        alert("Region updated successfully")
        } catch (err: any) {
            alert("Update Failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        const check = confirm(
            "IMPORTANT: Delete this region? \n" + 
            "Any communities assigned to this region will be set to 'Unassigned'. \n" +
            "This cannot be undone."
        );
        if (!check) return;

        setLoading(true);
        try {
            const { error: deleteError } = await supabase
            .from('pm_regions')
            .delete()
            .eq('id', id);
        
            if (deleteError) throw deleteError;

            router.push('/admin/regions');
            router.refresh();
        } catch (err: any) {
            alert("Delete Failed: " + err.message);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-12">
            <RegionForm
                initialData={region}
                onSubmit={handleUpdate}
                loading={loading}
                isEdit={true}
            />

            <div className="pt-12 border-t border-red-100 flex justify-between items-center">
                <div className="text-slate-400 text-[10px] font-medium uppercase tracking-widest max-w-xs leading-relaxed">
                    Deletion will remove this state from the public menu and set all its properties to unassigned.
                </div>
                <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="bg-white border border-red-200 text-red-500 hover:bg-red-50 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"                    
                >
                    Delete Region
                </button>
            </div>
        </div>
    );
}